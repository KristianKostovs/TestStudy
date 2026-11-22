"use client";

import { useCallback, useEffect, useState } from "react";
import LearningStepNav from "../../LearningStepNav";
import BlueprintPracticeEditor, { blueprintDraftKey } from "../../BlueprintPracticeEditor";
import WorkspacePractice from "../../WorkspacePractice";
import { flowData, frameworkBlocks, frameworkConnections, type FrameworkBlock } from "./block-data";
import "./building-blocks.css";

const courseId = "python-framework-blocks";
const labels = ["目标与前置", "看输入输出", "逐行理解", "练习与验证"];
const steps = labels.map((_, index) => index + 1);
const practiceStep = labels.length;

type BrowserCheck = { passed: boolean; output: string; trace: string[]; hints: string[] };

function browserCheck(blockId: number, draft: string): BrowserCheck {
  const checks: Array<[boolean, string]> = [];
  let output = "";
  let trace: string[] = [];
  if (blockId === 1) {
    checks.push([/amount\s*=\s*-3\b/.test(draft), "把 amount 改成 -3"]);
    checks.push([/result\s*=\s*available\s*\+\s*amount/.test(draft), "保留 available + amount 的计算"]);
    checks.push([/print\s*\(\s*result\s*\)/.test(draft), "显示 result"]);
    output = "7";
    trace = ["available = 10", "amount = -3", "result = 10 + (-3) = 7"];
  } else if (blockId === 2) {
    checks.push([/def\s+adjust_stock\s*\(/.test(draft), "保留 adjust_stock 函数"]);
    checks.push([/adjust_stock\s*\(\s*10\s*,\s*-2\s*\)/.test(draft), "保留第一次 10、-2 调用"]);
    checks.push([/adjust_stock\s*\(\s*10\s*,\s*5\s*\)/.test(draft), "增加 10、5 调用"]);
    output = "8\n15";
    trace = ["adjust_stock(10, -2) → 8", "adjust_stock(10, 5) → 15"];
  } else if (blockId === 3) {
    checks.push([!/NotImplementedError/.test(draft), "移除 TODO 的 NotImplementedError"]);
    checks.push([/assert\s+adjust_stock\s*\(\s*10\s*,\s*5\s*\)\s*==\s*15/.test(draft), "增加 10 + 5 == 15 的断言"]);
    checks.push([/print\s*\(\s*["']两项检查通过["']\s*\)/.test(draft), "显示“两项检查通过”"]);
    output = "两项检查通过";
    trace = ["第一项：10 + (-2) == 8", "第二项：10 + 5 == 15", "两个断言通过后显示完成提示"];
  } else {
    checks.push([/["']amount["']\s*:\s*0/.test(draft), "第三组 amount 使用 0"]);
    checks.push([/["']expected["']\s*:\s*10/.test(draft), "第三组 expected 使用 10"]);
    checks.push([/for\s+case\s+in\s+cases\s*:/.test(draft), "继续复用同一个 for 循环"]);
    output = "通过 3 组";
    trace = ["第 1 组：10 + (-2) → 8", "第 2 组：10 + 5 → 15", "第 3 组：10 + 0 → 10"];
  }
  const hints = checks.filter(([passed]) => !passed).map(([, hint]) => hint);
  return { passed: hints.length === 0, output, trace, hints };
}

function BrowserPractice({ block }: { block: FrameworkBlock }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [webCheck, setWebCheck] = useState<BrowserCheck | null>(null);
  const updateDraft = useCallback((nextDraft: string) => {
    setDraft(nextDraft);
    setWebCheck(null);
  }, []);

  return <details className="blocks-previous blocks-browser-practice" onToggle={(event) => setExpanded(event.currentTarget.open)}>
    <summary>在网页里试一试（可选）</summary>
    {expanded && <>
      <p>网页快速检查会核对代码写法并演示预期输出。草稿保存在当前浏览器，本机验证读取在 VS Code 中保存的文件。</p>
      <BlueprintPracticeEditor courseId={courseId} levelId={block.id} starter={block.starter} files={[`exercises/${block.file}`]} onDraftChange={updateDraft} />
      <div className="blocks-browser-check">
        <button type="button" onClick={() => setWebCheck(browserCheck(block.id, draft))}>检查当前草稿</button>
        {webCheck && <div className={webCheck.passed ? "passed" : "failed"} role="status">
          <strong>{webCheck.passed ? "当前草稿已匹配本关写法" : "再检查这些地方"}</strong>
          {webCheck.passed ? <><ol>{webCheck.trace.map((item) => <li key={item}>{item}</li>)}</ol><pre><code>{webCheck.output}</code></pre></> : <ul>{webCheck.hints.map((item) => <li key={item}>{item}</li>)}</ul>}
        </div>}
      </div>
    </>}
  </details>;
}

function PreviousBrowserDraft({ block }: { block: FrameworkBlock }) {
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => {
    try {
      setDraft(window.localStorage.getItem(blueprintDraftKey(courseId, block.id)));
    } catch {
      setDraft(null);
    }
  }, [block.id]);

  if (!draft || draft === block.starter) return null;
  return <details className="blocks-previous">
    <summary>查看以前保存的网页草稿</summary>
    <p>可把这份草稿中的修改复制到 <code>exercises/{block.file}</code>，保存后运行本关验证。</p>
    <pre><code>{draft}</code></pre>
  </details>;
}

export default function FrameworkBlocksClient() {
  const [selected, setSelected] = useState(0);
  const [stage, setStage] = useState(1);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const id = Number(window.location.hash.match(/^#block-(\d+)$/)?.[1]);
      const index = frameworkBlocks.findIndex((block) => block.id === id);
      if (index >= 0) setSelected(index);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const block = frameworkBlocks[selected];
  const previous = frameworkBlocks[selected - 1];

  function selectBlock(index: number) {
    setSelected(index);
    setStage(1);
    window.history.replaceState(null, "", `#block-${frameworkBlocks[index].id}`);
  }

  return <main className="course-workspace blocks-workspace ready">
    <header className="suite-topbar course-suite-topbar"><div><strong>Python 框架基础 · 课前积木</strong><span>建议先完成 8 块，再进入正式框架课程</span></div><div className="suite-live"><i />课前预备</div></header>
    <header className="hero">
      <nav><a className="brand" href="/courses/python-framework"><i>PY</i> Python 框架基础</a><a className="text-button" href="/courses/python-framework">← 返回框架课程</a></nav>
      <div className="hero-grid"><section>
        <p className="eyebrow">BUILD A FRAMEWORK FROM SMALL PIECES</p>
        <h1>先看懂积木，<br /><em>再拼出框架</em></h1>
        <p className="lead">这是正式框架课程前的预备桥梁。先用库存例子看懂值、函数、断言和 Runner 怎样一步步出现，再学习 pytest、YAML、Context 与完整框架。</p>
        <a className="hero-cta" href="#assembly">从第 1 块开始 <span>↓</span></a>
      </section><aside className="progress-card blocks-summary">
        <span>整条主线</span><h2>10 → 减 2 → 加 5 → 13</h2>
        <p>先把这条流程写对，再让它可重复、可检查、可换数据。</p>
        <a href="/downloads/python-framework-blocks.zip" download>下载完整例子与练习 ↓</a>
        <small>建议完成 8 块后再进入正式框架课程；这里的练习不会修改正式课程的通关记录。</small>
      </aside></div>
    </header>

    <section className="map-section blocks-section" id="assembly">
      <div className="section-heading"><p>ASSEMBLY ORDER</p><h2>一块一块接起来</h2><span>先说遇到了什么问题，再看这块代码为什么出现。</span></div>
      <nav className="blocks-selector" aria-label="积木拼装步骤">{frameworkBlocks.map((item, index) => <button type="button" aria-current={index === selected ? "step" : undefined} key={item.id} onClick={() => selectBlock(index)}><b>{item.id}</b><span>{item.title}</span></button>)}</nav>
      <article className="level open" id={`block-${block.id}`}>
        <div className="seal">{block.id}</div>
        <div className="level-copy">
          <header className="blocks-heading"><span className="level-no">BUILDING BLOCK {block.id}</span><h3>{block.title}</h3><p>{block.problem}</p></header>
          <div className="level-body">
            <LearningStepNav active={stage} unlocked={practiceStep} onSelect={setStage} steps={steps} labels={labels} />
            {stage === 1 && <section className="stage-panel blocks-panel">
              <div className="objective"><b>这次只增加什么</b><p>{block.addition}</p></div>
              <h4>先认清这几个小积木</h4><ul>{block.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
              <button type="button" className="stage-continue" onClick={() => setStage(2)}>看看输入怎样变成输出 →</button>
            </section>}
            {stage === 2 && <section className="stage-panel blocks-panel">
              <h4>跟着值走一遍</h4><ol className="blocks-trace">{block.trace.map((item) => <li key={item}>{item}</li>)}</ol>
              {block.id === 8 && <><h4>这次从文件读取同样的步骤</h4><pre><code>{JSON.stringify(flowData, null, 2)}</code></pre></>}
              <h4>运行原例会显示</h4><pre className="blocks-output"><code>{block.output}</code></pre>
              <button type="button" className="stage-continue" onClick={() => setStage(3)}>对照代码逐行拼起来 →</button>
            </section>}
            {stage === 3 && <section className="stage-panel blocks-panel">
              <div className="beginner-note"><b>新增行用绿色标出</b><p>{block.addition}</p></div>
              <pre className="blocks-code"><code>{block.code.trimEnd().split("\n").map((line, index) => <span className={block.added.some((part) => line.includes(part)) ? "blocks-code-new" : ""} key={index}><i aria-hidden="true">{index + 1}</i>{line || " "}</span>)}</code></pre>
              {previous && <details className="blocks-previous"><summary>回看上一块：{previous.title}</summary><pre><code>{previous.code}</code></pre></details>}
              <button type="button" className="stage-continue" onClick={() => setStage(practiceStep)}>进入练习与验证</button>
            </section>}
            {stage === practiceStep && <section key={block.id} className="stage-panel blocks-panel" aria-label="练习与验证">
              <WorkspacePractice
                config={{
                  exerciseId: `python-framework-block-${String(block.id).padStart(2, "0")}`,
                  title: block.title,
                  requirement: block.task,
                  exerciseFile: `exercises/${block.file}`,
                }}
                downloadHref="/downloads/python-framework-blocks.zip"
              />
              {block.id <= 4 ? <BrowserPractice block={block} /> : <PreviousBrowserDraft block={block} />}
              <details className="blocks-previous">
                <summary>查看预期输出与手动验证方法</summary>
                <h4>预期输出</h4><pre className="blocks-output"><code>{block.taskOutput}</code></pre>
                {block.errorExpected && <p>本关会触发 {block.errorExpected}。验证器会同时检查异常类型、非零退出码和收尾输出。</p>}
                <ul>{block.checks.map((item) => <li key={item}>{item}</li>)}</ul>
                <h4>在终端运行</h4><p>解压 ZIP 后，在含有 <code>verify.py</code> 的目录执行下面的命令。</p>
                <pre><code>python3 verify.py --block {block.id}</code></pre>
              </details>
              <details className="blocks-previous"><summary>完成后再看参考修改</summary><pre><code>{block.solution}</code></pre></details>
              {selected < frameworkBlocks.length - 1 ? <button type="button" className="stage-continue" onClick={() => selectBlock(selected + 1)}>下一块 · {frameworkBlocks[selected + 1].title}</button> : <a className="blocks-next" href="#framework-names">查看这些积木在框架里的名字</a>}
            </section>}
          </div>
        </div>
      </article>
    </section>

    {block.id === 8 && stage === practiceStep && <section className="map-section blocks-connections" id="framework-names">
      <div className="section-heading"><p>CONNECT THE NAMES</p><h2>现在再看框架里的名字</h2><span>先知道这块代码做什么，再认识它在框架里的名字。</span></div>
      <div className="blocks-table-wrap"><table><thead><tr><th>刚刚已经理解的做法</th><th>框架里的名字</th><th>它解决什么问题</th></tr></thead><tbody>{frameworkConnections.map((item) => <tr key={item.name}><td>{item.plain}</td><td><a href={item.href}>{item.name} →</a></td><td>{item.role}</td></tr>)}</tbody></table></div>
      <p className="blocks-note">这个小框架用内存数字和本地 JSON 演示编排。完成后进入正式框架课程，继续学习数据库、真实 HTTP、Schema 校验、并发和复杂清理。</p>
    </section>}
    <footer><p>PYTHON FRAMEWORK · BUILDING BLOCKS</p><h2>框架里的每一层，都应解决一个已经看见的问题。</h2><a href="/courses/python-framework">进入正式框架课程逐块对应 →</a></footer>
  </main>;
}
