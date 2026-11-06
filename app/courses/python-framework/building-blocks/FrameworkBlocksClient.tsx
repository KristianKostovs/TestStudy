"use client";

import { useEffect, useState } from "react";
import LearningStepNav from "../../LearningStepNav";
import BlueprintPracticeEditor from "../../BlueprintPracticeEditor";
import { flowData, frameworkBlocks, frameworkConnections } from "./block-data";
import "./building-blocks.css";

const labels = ["目标与前置", "看输入输出", "逐行理解", "动手任务", "客观验收"];

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
    <header className="suite-topbar course-suite-topbar"><div><strong>Python 框架基础 · 积木复盘</strong><span>同一个例子，每次只解决一个新问题</span></div><div className="suite-live"><i />可自由回看</div></header>
    <header className="hero">
      <nav><a className="brand" href="/courses/python-framework"><i>PY</i> Python 框架基础</a><a className="text-button" href="/courses/python-framework">← 返回原课程</a></nav>
      <div className="hero-grid"><section>
        <p className="eyebrow">BUILD A FRAMEWORK FROM SMALL PIECES</p>
        <h1>先看懂积木，<br /><em>再拼出框架</em></h1>
        <p className="lead">始终只做一件事：调整库存并检查结果。每次遇到一个具体问题，再增加一小块代码。</p>
        <a className="hero-cta" href="#assembly">从当前积木开始 <span>↓</span></a>
      </section><aside className="progress-card blocks-summary">
        <span>整条主线</span><h2>10 → 减 2 → 加 5 → 13</h2>
        <p>先把这条流程写对，再让它可重复、可检查、可换数据。</p>
        <a href="/downloads/python-framework-blocks.zip" download>下载完整例子与练习 ↓</a>
        <small>独立复盘路径；浏览步骤不会修改原课程的通关记录。</small>
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
            <LearningStepNav active={stage} unlocked={5} onSelect={setStage} labels={labels} />
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
              <button type="button" className="stage-continue" onClick={() => setStage(4)}>改一个地方，观察变化 →</button>
            </section>}
            {stage === 4 && <section className="stage-panel blocks-panel">
              <div className="task"><div className="task-title"><span>这次只改这一点</span><b>练习</b></div><p>{block.task}</p></div>
              <BlueprintPracticeEditor courseId="python-framework-blocks" levelId={block.id} starter={block.starter} files={[`exercises/${block.file}`]} />
              <p className="blocks-note">编辑草稿保存在当前浏览器。下载练习包后，把修改写入对应 exercises 文件，在本机运行验证。</p>
              <button type="button" className="stage-continue" onClick={() => setStage(5)}>查看准确的验收方式 →</button>
            </section>}
            {stage === 5 && <section className="stage-panel blocks-panel">
              <h4>本机运行</h4><pre><code>python3 verify.py --block {block.id}</code></pre>
              <h4>修改后的预期输出</h4><pre className="blocks-output"><code>{block.taskOutput}</code></pre>
              {block.errorExpected && <p className="blocks-note">这次练习故意触发 {block.errorExpected}。子程序应非零退出，但验证器在确认异常类型及收尾输出正确后会通过。</p>}
              <ul>{block.checks.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="blocks-note">运行结果不会自动回传网页。看懂示例、参考答案通过和自己修改后通过，需要分别判断。</p>
              <details className="blocks-previous"><summary>完成后再看参考修改</summary><pre><code>{block.solution}</code></pre></details>
              {selected < frameworkBlocks.length - 1 ? <button type="button" className="stage-continue" onClick={() => selectBlock(selected + 1)}>接上下一块：{frameworkBlocks[selected + 1].title} →</button> : <a className="blocks-next" href="#framework-names">把已经认识的积木接回原框架 →</a>}
            </section>}
          </div>
        </div>
      </article>
    </section>

    {block.id === 8 && stage === 5 && <section className="map-section blocks-connections" id="framework-names">
      <div className="section-heading"><p>CONNECT THE NAMES</p><h2>现在再看框架里的名字</h2><span>先知道这块代码做什么，再认识它在框架里的名字。</span></div>
      <div className="blocks-table-wrap"><table><thead><tr><th>刚刚已经理解的做法</th><th>框架里的名字</th><th>它解决什么问题</th></tr></thead><tbody>{frameworkConnections.map((item) => <tr key={item.name}><td>{item.plain}</td><td><a href={item.href}>{item.name} →</a></td><td>{item.role}</td></tr>)}</tbody></table></div>
      <p className="blocks-note">这个小框架用内存数字和本地 JSON 演示编排。数据库、真实 HTTP、Schema 校验、并发和复杂清理分别需要后续学习与验证。</p>
    </section>}
    <footer><p>PYTHON FRAMEWORK · BUILDING BLOCKS</p><h2>框架里的每一层，都应解决一个已经看见的问题。</h2><a href="/courses/python-framework">回到原课程逐块对照 →</a></footer>
  </main>;
}
