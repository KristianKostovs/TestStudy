"use client";

import { useEffect, useMemo, useState } from "react";

type Level = {
  id: number;
  chapter: string;
  title: string;
  tagline: string;
  objective: string;
  estimated: string;
  skills: string[];
  lessons: string[];
  aiLens: string;
  code: string;
  task: string;
  acceptance: string[];
  reward: string;
};

const levels: Level[] = [
  {
    id: 1,
    chapter: "第一章 · 筑基",
    title: "Python 数据与函数",
    tagline: "先看懂 YAML 进入 Python 后变成了什么",
    objective: "能读写 dict/list，理解函数参数、返回值和嵌套数据访问。",
    estimated: "45 分钟",
    skills: ["dict / list", "def / return", "*args / **kwargs"],
    lessons: [
      "YAML 加载后主要就是 dict、list、str、int 和 bool。",
      "函数是 Action 的最小执行单元：输入 action/context/runtime，返回可保存的结果。",
      "嵌套字段不能想当然地直接索引，失败路径要给出可诊断错误。",
    ],
    aiLens: "AI 很容易假设字段一定存在。你要检查它是否处理了 None、缺字段和类型不符。",
    code: `def get_by_path(data: dict, path: str):
    current = data
    for part in path.split("."):
        if not isinstance(current, dict) or part not in current:
            raise KeyError(f"找不到字段: {path}")
        current = current[part]
    return current

flow_no = get_by_path(response, "data.flowNo")`,
    task: "写一个 get_by_path() 函数，从售后接口响应中取出 data.flowNo，并处理 data 缺失的情况。",
    acceptance: ["正常响应能返回 flowNo", "缺少 data 时抛出明确错误", "不修改原始 response"],
    reward: "获得「数据感知」",
  },
  {
    id: 2,
    chapter: "第一章 · 筑基",
    title: "可变对象与异常",
    tagline: "不让一条用例污染下一条",
    objective: "理解浅拷贝、深拷贝、try/except/finally 和异常链。",
    estimated: "50 分钟",
    skills: ["copy", "try / finally", "raise from"],
    lessons: [
      "dict 和 list 是可变对象；共享引用会让测试数据被意外改写。",
      "dict(x) 只复制一层，嵌套结构必要时使用 copy.deepcopy()。",
      "finally 是数据恢复和资源关闭的底线，但清理异常不能覆盖主异常。",
    ],
    aiLens: "AI 经常直接修改 fixture 或在 except 里吞掉异常。审查时先找状态污染和裸 except。",
    code: `from copy import deepcopy

body = deepcopy(case["fixture"])
try:
    body["businessStatus"] = 710
    result = call_api(body)
finally:
    client.close()`,
    task: "构造两条共用嵌套 fixture 的用例，证明直接修改会污染数据，再用 deepcopy 修复。",
    acceptance: ["能复现污染", "修复后两条用例相互隔离", "即使调用失败也会执行清理"],
    reward: "获得「状态护盾」",
  },
  {
    id: 3,
    chapter: "第一章 · 筑基",
    title: "模块、包与导入",
    tagline: "看懂 adapter 为什么能被字符串找到",
    objective: "掌握模块、package、__init__.py、相对导入和 import path。",
    estimated: "60 分钟",
    skills: ["package", "importlib", "relative import"],
    lessons: [
      "Python 文件是模块，包是可导入的目录树。",
      "knowledge source root 加入 sys.path 后，中文目录也可以成为导入路径的一部分。",
      "package.module:function 是可追踪的 callable reference，比在 YAML 中嵌入 Python 代码安全。",
    ],
    aiLens: "AI 写导入时容易依赖当前工作目录。你要确认从 pytest 项目根目录执行时仍能导入。",
    code: `from importlib import import_module

def resolve_callable(ref: str):
    module_name, function_name = ref.split(":", 1)
    module = import_module(module_name)
    handler = getattr(module, function_name)
    if not callable(handler):
        raise TypeError(f"{ref} 不可调用")
    return handler`,
    task: "实现 resolve_callable()，成功加载一个真实 adapter，再用不存在的模块和函数各测一次失败分支。",
    acceptance: ["可导入并调用真实函数", "模块不存在时诊断清楚", "属性不可调用时主动拒绝"],
    reward: "获得「寻路符」",
  },
  {
    id: 4,
    chapter: "第二章 · 入阵",
    title: "类型、dataclass 与 Protocol",
    tagline: "把口头约定变成能被检查的边界",
    objective: "掌握 Mapping、Callable、Protocol、dataclass 和可选类型。",
    estimated: "70 分钟",
    skills: ["typing", "dataclass", "Protocol"],
    lessons: [
      "类型标注不是为了写得好看，而是为了限定框架边界。",
      "Protocol 适合定义 DatabaseProvider、RedisProvider 这类可替换能力。",
      "dataclass 适合 QueryRequest、ActionResult 这类结构稳定的数据对象。",
    ],
    aiLens: "Any 会让 AI 的错误延迟到运行时。核心边界应尽量用 Protocol 和 dataclass 表达。",
    code: `from dataclasses import dataclass
from typing import Any, Mapping, Protocol, Sequence

@dataclass(frozen=True)
class QueryRequest:
    name: str
    sql: str
    params: tuple[Any, ...] = ()

class DatabaseProvider(Protocol):
    def query(self, request: QueryRequest) -> Sequence[Mapping[str, Any]]: ...`,
    task: "定义 ActionResult dataclass，包含 success、request、response、outputs 和 side_effects，再写一个构造它的 action。",
    acceptance: ["核心字段有明确类型", "可选字段有合理默认值", "返回结果不依赖神秘 dict 结构"],
    reward: "获得「契约印」",
  },
  {
    id: 5,
    chapter: "第二章 · 入阵",
    title: "pytest 生命周期",
    tagline: "从收集、注入、执行到无论成败都清理",
    objective: "掌握 fixture、yield、parametrize、conftest、marker 和 collect-only。",
    estimated: "90 分钟",
    skills: ["fixture", "parametrize", "pytest hooks"],
    lessons: [
      "fixture 不只是测试数据，也是客户端和 Provider 的依赖注入容器。",
      "yield 前创建资源，yield 后关闭；即使断言失败也会进入清理。",
      "collect-only 能检查用例发现、导入和参数化，却不访问真实环境。",
    ],
    aiLens: "AI 容易把网络调用放在 fixture 顶层或收集阶段。你要保证 collect-only 无外部副作用。",
    code: `import pytest
from framework.clients.http_client import HttpClient

@pytest.fixture
def api_client():
    client = HttpClient(base_url="https://example.test")
    yield client
    client.close()

@pytest.mark.parametrize("status", [710, 720])
def test_status(api_client, status):
    assert status in (710, 720)`,
    task: "为 HTTP Client 写 yield fixture，再用参数化生成 710/720 两条用例，最后运行 collect-only。",
    acceptance: ["收集出两条独立用例", "Client 始终关闭", "collect-only 期间没有真实 HTTP 请求"],
    reward: "获得「生命周期钟」",
  },
  {
    id: 6,
    chapter: "第二章 · 入阵",
    title: "YAML 与 Pydantic 校验",
    tagline: "声明式不是宽松式，输入必须有门禁",
    objective: "理解 safe_load、schema、Pydantic Model 和人性化校验错误。",
    estimated: "80 分钟",
    skills: ["PyYAML", "Pydantic", "schema validation"],
    lessons: [
      "yaml.safe_load() 只负责解析，不保证 action、save_as 和 request 结构正确。",
      "Pydantic 适合在 Runner 之前把模糊 dict 转成可信对象。",
      "Schema 过严会阻断演进，过松则把错误推迟到真实环境。",
    ],
    aiLens: "AI 常会为了让 YAML 通过而给大量字段设默认值。必须区分真正可选和遗漏必填。",
    code: `from pydantic import BaseModel, model_validator

class FlowEntry(BaseModel):
    action: str | None = None
    request: dict | None = None
    save_as: str | None = None

    @model_validator(mode="after")
    def has_executor(self):
        if not self.action and not self.request:
            raise ValueError("必须声明 action 或 request")
        return self`,
    task: "用 Pydantic 定义 FlowEntry，禁止同时缺少 action 和 request，并为错误 YAML 写三个校验测试。",
    acceptance: ["正常 action 能通过", "正常 request 能通过", "空步骤在执行前就失败"],
    reward: "获得「门禁石」",
  },
  {
    id: 7,
    chapter: "第三章 · 破阵",
    title: "反射与 Runner 调度",
    tagline: "解开 action_adapters 和反射执行器的机关",
    objective: "掌握 callable、inspect.signature、动态派发和 ScenarioContext。",
    estimated: "90 分钟",
    skills: ["inspect", "reflection", "dispatch"],
    lessons: [
      "Runner 的核心是根据 action name 取出 callable，渲染参数后执行。",
      "inspect.signature() 可以为兼容不同 handler 签名提供过渡，但签名越统一越好。",
      "Context 是用例内状态，不应被跨用例共享。",
    ],
    aiLens: "反射会让错误远离源头。要求 AI 在收集阶段校验可导入性，并在错误中保留 action name 和 callable ref。",
    code: `from inspect import signature

def call_handler(handler, entry, runtime):
    params = signature(handler).parameters
    kwargs = {}
    if "action" in params:
        kwargs["action"] = entry
    if "context" in params:
        kwargs["context"] = runtime.context
    if "runtime" in params:
        kwargs["runtime"] = runtime
    return handler(**kwargs)`,
    task: "实现一个最小 Runner：执行两个 action，用 save_as 存结果，第二步消费第一步输出。",
    acceptance: ["未绑定 action 立即失败", "save_as 结果可被后续步骤读取", "两次 run 的 context 不串数据"],
    reward: "获得「调度令」",
  },
  {
    id: 8,
    chapter: "第三章 · 破阵",
    title: "HTTPX 与 MockTransport",
    tagline: "在不碰真实环境的情况下跑通全链路",
    objective: "理解 HTTP 与业务成功的差异，掌握 Client、timeout 和 MockTransport。",
    estimated: "100 分钟",
    skills: ["httpx", "MockTransport", "contract test"],
    lessons: [
      "HTTP 200 只代表传输成功，不代表 response.success=true。",
      "正向 action 可以 strict，异常用例必须 observe 原始失败响应。",
      "MockTransport 能验证 request body、返回结构、模板渲染和 teardown，不需要真实服务。",
    ],
    aiLens: "AI 容易只断言 status_code=200，或让所有 success=false 都提前抛错。你要根据用例意图选 strict/observe。",
    code: `import httpx

def handler(request: httpx.Request):
    assert request.url.path == "/app/stock/adjust/after-sale"
    return httpx.Response(200, json={
        "success": True,
        "data": {"flowNo": "FLOW-710"},
    })

transport = httpx.MockTransport(handler)
client = httpx.Client(transport=transport)`,
    task: "用 MockTransport 模拟售后调整接口，同时覆盖业务成功、HTTP 500 和 HTTP 200 但 success=false。",
    acceptance: ["三种分支都有独立断言", "能检查真实请求体", "测试不依赖网络"],
    reward: "获得「虚境镜」",
  },
  {
    id: 9,
    chapter: "第三章 · 破阵",
    title: "架构边界与副作用",
    tagline: "会写不够，还要把代码放在正确的层",
    objective: "区分 Adapter、Provider、Registry、Factory 和 Dependency Injection。",
    estimated: "110 分钟",
    skills: ["Adapter", "Provider", "DI / Factory"],
    lessons: [
      "Provider 回答怎么访问数据库；resolve() 回答这个需求应该找什么数据。",
      "Adapter 表达业务动作；Registry 只负责通过名字找到它。",
      "共享层只接收多需求稳定复用的能力，不要因为代码像就立即上提。",
    ],
    aiLens: "AI 偏爱大而全的通用类。审查时问三个问题：谁拥有这条规则？它的变化周期是什么？真的有两个稳定消费者吗？",
    code: `# 基础设施：共享
class DatabaseProvider(Protocol):
    def query(self, request: QueryRequest): ...

# 业务求解：留在需求层
def resolve_after_sale_fixture(database, constraints):
    rows = database.query(build_inventory_query(constraints))
    return select_safe_inventory(rows)`,
    task: "将一个混合了 HTTP、数据库、差值断言和清理的 100 行 adapter，拆分为 Provider、页面共享 Action 和需求特有逻辑。",
    acceptance: ["Provider 不知道售后业务规则", "resolve 仍留在场景层", "三层可分别单元测试"],
    reward: "获得「分层剑」",
  },
  {
    id: 10,
    chapter: "终章 · 出师",
    title: "Boss 战：完整声明式链路",
    tagline: "用一条可收集、可模拟、可清理的链路证明你已出师",
    objective: "综合运用 YAML、Runner、Adapter、Provider、Mock 和证据协议。",
    estimated: "3–4 小时",
    skills: ["end-to-end", "ActionResult", "evidence"],
    lessons: [
      "一条成熟链路必须有 setup、steps、assertions 和 teardown.always。",
      "每步输出应统一成 ActionResult，才能生成完整证据和执行历史。",
      "先通过静态门禁和 Mock 全链路，真实环境执行仍需要明确授权。",
    ],
    aiLens: "最终能力不是让 AI 一次写完，而是你能给出边界、验收标准和静态门禁，并对 AI 的输出做可证伪检查。",
    code: `common_flow:
  setup:
    - action: fixture.resolve
      save_as: resolved_fixture
  steps:
    - action: inventory.snapshot
      save_as: before_inventory
    - action: after_sale.notify
      business_status: 710
      save_as: processing_result
  assertions:
    - source: processing_result.response
      equals:
        success: true
  teardown:
    always:
      - action: fixture.restore`,
    task: "选择一个实际需求，实现从 requirement_cases.yaml 到 MockTransport 全链路，并输出标准化 evidence JSON。",
    acceptance: ["YAML 静态校验通过", "adapter 可导入且 collect-only 通过", "Mock 完整跑通 setup→assertions→teardown", "失败用例也留存请求、响应和主异常"],
    reward: "获得「框架判断力」，正式出师",
  },
];

const storageKey = "python-framework-quest-v1";

export default function Home() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [openId, setOpenId] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setCompleted(JSON.parse(stored));
    } catch {
      setCompleted([]);
    } finally {
      setReady(true);
    }
  }, []);

  const progress = Math.round((completed.length / levels.length) * 100);
  const nextLevel = levels.find((level) => !completed.includes(level.id));
  const rank = useMemo(() => {
    if (completed.length === 10) return "框架宗师";
    if (completed.length >= 7) return "破阵高手";
    if (completed.length >= 4) return "入阵行者";
    return "初入江湖";
  }, [completed]);

  function isUnlocked(id: number) {
    return id === 1 || completed.includes(id - 1) || completed.includes(id);
  }

  function completeLevel(id: number) {
    const next = completed.includes(id)
      ? completed.filter((item) => item !== id)
      : [...completed, id].sort((a, b) => a - b);
    setCompleted(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    if (!completed.includes(id) && id < levels.length) {
      setOpenId(id + 1);
      window.setTimeout(() => document.getElementById(`level-${id + 1}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    }
  }

  function resetProgress() {
    if (!window.confirm("确定清空所有通关进度吗？")) return;
    setCompleted([]);
    setOpenId(1);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <main className={ready ? "ready" : ""}>
      <header className="hero">
        <nav>
          <a className="brand" href="#roadmap"><i>PY</i> 框架修炼场</a>
          <div className="nav-actions">
            <span className="rank">当前段位 <b>{rank}</b></span>
            <button className="text-button" onClick={resetProgress}>重置进度</button>
          </div>
        </nav>
        <div className="hero-grid">
          <section>
            <p className="eyebrow">PYTHON FRAMEWORK QUEST</p>
            <h1>过关斩将，<br /><em>练成框架判断力</em></h1>
            <p className="lead">不背语法大全。沿着 YAML → Runner → Adapter → HTTP 的真实链路，每关学一组知识，完成一个可验证任务。</p>
            <a className="hero-cta" href={nextLevel ? `#level-${nextLevel.id}` : "#roadmap"}>{nextLevel ? `继续第 ${nextLevel.id} 关` : "回看修炼地图"} <span>↓</span></a>
          </section>
          <aside className="progress-card">
            <div className="progress-top"><span>修炼进度</span><strong>{progress}%</strong></div>
            <div className="bar"><i style={{ width: `${progress}%` }} /></div>
            <p>{completed.length} / {levels.length} 关已通过</p>
            <ol>{levels.map((level) => <li className={completed.includes(level.id) ? "lit" : ""} key={level.id} title={level.title}>{level.id}</li>)}</ol>
          </aside>
        </div>
      </header>

      <section className="principles" aria-label="学习方法">
        <article><b>01</b><div><h2>先懂边界</h2><p>代码由 AI 加速，契约、副作用和失败语义由你把关。</p></div></article>
        <article><b>02</b><div><h2>每关一个产物</h2><p>不以“看完”为通关，只以可运行、可验证的任务为通关。</p></div></article>
        <article><b>03</b><div><h2>强制逐关解锁</h2><p>前一关通过后才开放下一关，避免架构概念没有基础支撑。</p></div></article>
      </section>

      <section className="map-section" id="roadmap">
        <div className="section-heading">
          <p>THE ROADMAP</p>
          <h2>十关修炼地图</h2>
          <span>建议每周 2 关，5 周完成一轮；任务优先改造你手头的真实框架。</span>
        </div>

        <div className="quest-map">
          {levels.map((level, index) => {
            const done = completed.includes(level.id);
            const unlocked = isUnlocked(level.id);
            const open = openId === level.id;
            const chapterBreak = index === 0 || levels[index - 1].chapter !== level.chapter;
            return (
              <div key={level.id}>
                {chapterBreak && <div className="chapter-divider"><span>{level.chapter}</span></div>}
                <article id={`level-${level.id}`} className={`level ${done ? "done" : ""} ${!unlocked ? "locked" : ""} ${open ? "open" : ""}`}>
                  <div className="seal">{done ? "✓" : unlocked ? level.id : "×"}</div>
                  <div className="level-copy">
                    <button className="level-header" disabled={!unlocked} onClick={() => setOpenId(open ? 0 : level.id)} aria-expanded={open}>
                      <div>
                        <span className="level-no">LEVEL {String(level.id).padStart(2, "0")} <i>· {level.estimated}</i></span>
                        <h3>{level.title}</h3>
                        <p>{unlocked ? level.tagline : `通过第 ${level.id - 1} 关后解锁`}</p>
                      </div>
                      <span className="expand">{unlocked ? (open ? "−" : "+") : "锁"}</span>
                    </button>
                    {open && unlocked && (
                      <div className="level-body">
                        <div className="chips">{level.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                        <div className="objective"><b>本关目标</b><p>{level.objective}</p></div>
                        <div className="lesson-grid">
                          <section>
                            <h4>你要掌握</h4>
                            <ul>{level.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}</ul>
                          </section>
                          <aside className="ai-lens"><span>AI 审查镜</span><p>{level.aiLens}</p></aside>
                        </div>
                        <div className="code-wrap"><div><span>PYTHON / YAML</span><i>参考片段</i></div><pre><code>{level.code}</code></pre></div>
                        <div className="task">
                          <div className="task-title"><span>通关任务</span><b>{level.reward}</b></div>
                          <p>{level.task}</p>
                          <h4>验收标准</h4>
                          <ul>{level.acceptance.map((item) => <li key={item}>{item}</li>)}</ul>
                          <button className="complete-button" onClick={() => completeLevel(level.id)}>{done ? "✓ 已通关，点击撤销" : level.id === 10 ? "完成 Boss 战，正式出师" : "我已完成并按标准自检"}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </section>

      <footer>
        <p>PYTHON FRAMEWORK QUEST</p>
        <h2>{completed.length === levels.length ? "你已出师。现在，让 AI 写代码，你来守住框架。" : "学习不靠收藏，通关只看可验证的产物。"}</h2>
        <span>进度仅保存在当前浏览器。</span>
      </footer>
    </main>
  );
}
