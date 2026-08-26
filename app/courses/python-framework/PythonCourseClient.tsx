"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import "./course-flow.css";
import { getChapterForLevel, getPythonCourseChapter, pythonCourseChapters } from "./chapter-data";
/* eslint-disable @next/next/no-html-link-for-pages -- vinext Link prefetch crashes in production; full-page navigation is intentional */

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

type LearningSupport = {
  beforeYouStart: string;
  glossary: { term: string; meaning: string }[];
  exampleTitle: string;
  example: string;
  walkthrough: string[];
  starter: string;
  verifyCommand: string;
  expected: string;
  hint: string;
  referenceAnswer: string;
  quiz: { question: string; options: string[]; correct: number; explanation: string };
};

type KnowledgePoint = {
  term: string;
  plain: string;
  role: string;
  example?: string;
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

const supportByLevel: Record<number, LearningSupport> = {
  1: {
    beforeYouStart: "这一关不默认你知道接口响应长什么样。先认识一份完整 response，再看函数。",
    glossary: [
      { term: "response", meaning: "接口返回的整个结果，这里是一个 Python dict。" },
      { term: "data", meaning: "response 里名为 data 的字段，通常用来放业务结果；它不是 Python 保留字。" },
      { term: "flowNo", meaning: "data 里的交易流水号字段，字段名由真实接口 DTO 决定。" },
      { term: "data.flowNo", meaning: "一条字段路径：先进入 data，再取 flowNo。" },
    ],
    exampleTitle: "先看接口响应的真实结构",
    example: `response = {
    "success": True,
    "code": "S0000",
    "data": {
        "success": True,
        "flowNo": "FLOW-710",
        "message": "售后库存调整成功"
    }
}`,
    walkthrough: [
      "response 是最外层 dict，有 success、code 和 data 三个字段。",
      "response[\"data\"] 得到内层 dict。",
      "response[\"data\"][\"flowNo\"] 得到字符串 FLOW-710。",
      "get_by_path(response, \"data.flowNo\") 只是把上面两次取值变成通用循环。",
    ],
    starter: `def get_by_path(data: dict, path: str):
    # 1. current 从整个 data 开始
    # 2. 把 "data.flowNo" 拆成 ["data", "flowNo"]
    # 3. 逐层取值，找不到就报错
    pass`,
    verifyCommand: "python level_01.py",
    expected: `FLOW-710
KeyError: '找不到字段: data.flowNo'
原始 response 保持不变`,
    hint: "先用 path.split(\".\") 看看能得到什么；每轮循环用 current = current[part] 向内走一层。",
    referenceAnswer: `def get_by_path(data: dict, path: str):
    current = data
    for part in path.split("."):
        if not isinstance(current, dict) or part not in current:
            raise KeyError(f"找不到字段: {path}")
        current = current[part]
    return current`,
    quiz: {
      question: "在这份 response 中，data 是什么？",
      options: ["Python 固定的特殊对象", "response 中一个名为 data 的 dict 字段", "数据库连接", "flowNo 的别名"],
      correct: 1,
      explanation: "data 只是接口响应中的一个字段名。在这份响应里，它的值是一个 dict。",
    },
  },
  2: {
    beforeYouStart: "你会先看到“同一份 fixture 为什么会被改掉”，再学 deepcopy，不需要先记住拷贝理论。",
    glossary: [
      { term: "fixture", meaning: "测试开始前准备的数据或资源。" },
      { term: "可变对象", meaning: "创建后内容仍可被修改的对象，dict 和 list 都是。" },
      { term: "deepcopy", meaning: "连同内层 dict/list 一起复制，得到彼此隔离的数据。" },
      { term: "finally", meaning: "不论 try 成功还是失败都会执行的清理区块。" },
    ],
    exampleTitle: "两个变量可能指向同一个内层 dict",
    example: `fixture = {"request": {"businessStatus": 710}}
case_a = dict(fixture)
case_b = dict(fixture)

case_a["request"]["businessStatus"] = 720
print(case_b["request"]["businessStatus"])  # 720！`,
    walkthrough: ["dict(fixture) 只复制了外层。", "case_a 和 case_b 的 request 仍是同一个对象。", "deepcopy 会把内层 request 也复制。"],
    starter: `from copy import deepcopy

case_a = deepcopy(fixture)
case_b = deepcopy(fixture)
# 修改 case_a，然后断言 case_b 未变`,
    verifyCommand: "pytest -q test_level_02.py",
    expected: "2 passed",
    hint: "先写一条故意失败的测试复现污染，再把 dict(fixture) 改为 deepcopy(fixture)。",
    referenceAnswer: `case_a = deepcopy(fixture)
case_b = deepcopy(fixture)
case_a["request"]["businessStatus"] = 720
assert case_b["request"]["businessStatus"] == 710`,
    quiz: { question: "dict(fixture) 对嵌套 dict 做了什么？", options: ["全部深度复制", "只复制外层", "把 dict 变成 tuple", "锁定数据不可修改"], correct: 1, explanation: "dict(x) 是浅拷贝，嵌套的 dict/list 仍可能共享。" },
  },
  3: {
    beforeYouStart: "先把目录想成一个地址，把函数想成地址里的具体房间。",
    glossary: [
      { term: "module", meaning: "一个可被 import 的 Python 文件。" },
      { term: "package", meaning: "由多个模块组成的可导入目录。" },
      { term: "callable", meaning: "可以用括号执行的对象，最常见是函数。" },
      { term: "callable ref", meaning: "用 package.module:function 表示一个函数的字符串地址。" },
    ],
    exampleTitle: "字符串怎样定位到函数",
    example: `ewms.stock.adapters:resolve_fixture

ewms.stock.adapters  -> 模块地址
resolve_fixture      -> 模块里的函数`,
    walkthrough: ["冒号左边交给 import_module() 导入。", "冒号右边交给 getattr() 取属性。", "最后用 callable() 确认它真的能执行。"],
    starter: `def resolve_callable(ref: str):
    module_name, function_name = ref.split(":", 1)
    # 导入 module，取出 function，检查 callable
    pass`,
    verifyCommand: "pytest -q test_level_03.py",
    expected: "3 passed（成功导入、模块不存在、函数不存在）",
    hint: "需要 import_module、getattr 和 callable 三步。",
    referenceAnswer: `module = import_module(module_name)
handler = getattr(module, function_name)
if not callable(handler):
    raise TypeError(f"{ref} 不可调用")
return handler`,
    quiz: { question: "package.module:function 中冒号右边是什么？", options: ["文件夹", "Python 版本", "模块中的函数名", "HTTP method"], correct: 2, explanation: "左边是模块路径，右边是要取出的函数名。" },
  },
  4: {
    beforeYouStart: "类型不是考试语法，而是让你和 AI 都看得懂“输入和输出应该是什么”。",
    glossary: [
      { term: "type hint", meaning: "对参数和返回值的类型说明。" },
      { term: "dataclass", meaning: "便捷定义结构化数据对象的工具。" },
      { term: "Protocol", meaning: "规定对象需要提供哪些方法，不限制具体实现。" },
      { term: "Any", meaning: "任意类型；使用过多会让错误推迟到运行时。" },
    ],
    exampleTitle: "Protocol 只约定能力，不关心连的是哪个数据库",
    example: `class DatabaseProvider(Protocol):
    def query(self, request: QueryRequest) -> list[dict]: ...`,
    walkthrough: ["任何对象只要有符合签名的 query() 就能作为 Provider。", "真实 MySQL Provider 和 FakeDatabase 都可以满足它。", "这让 Mock 测试不需要真实数据库。"],
    starter: `@dataclass
class ActionResult:
    # 定义 success、request、response、outputs、side_effects
    pass`,
    verifyCommand: "python -m mypy action_result.py && pytest -q test_action_result.py",
    expected: "Success: no issues found\n2 passed",
    hint: "request/response 可能为 None，outputs 和 side_effects 用 default_factory 避免共享默认值。",
    referenceAnswer: `@dataclass
class ActionResult:
    success: bool
    request: dict | None = None
    response: dict | None = None
    outputs: dict = field(default_factory=dict)
    side_effects: list[str] = field(default_factory=list)`,
    quiz: { question: "Protocol 在 Provider 里最主要的作用是什么？", options: ["保存密码", "规定可替换实现必须提供的方法", "自动连接 MySQL", "替代 pytest"], correct: 1, explanation: "Protocol 表达能力契约，让真实实现与 Fake 实现可替换。" },
  },
  5: {
    beforeYouStart: "pytest 可以理解为“找用例 + 准备依赖 + 执行 + 清理”的管家。",
    glossary: [
      { term: "fixture", meaning: "pytest 在用例执行前后创建和清理的依赖。" },
      { term: "yield", meaning: "把资源交给用例；yield 之后是清理逻辑。" },
      { term: "parametrize", meaning: "用多组数据生成多条独立用例。" },
      { term: "collect-only", meaning: "只收集用例，不执行测试体。" },
    ],
    exampleTitle: "yield 把 fixture 分成准备和清理两半",
    example: `client = HttpClient(...)  # 准备
yield client              # 交给用例
client.close()            # 清理`,
    walkthrough: ["用例看到的 api_client 就是 yield 后面的 client。", "用例断言失败后，pytest 仍会继续执行 close()。", "collect-only 不会进入用例中的 HTTP 调用。"],
    starter: `@pytest.fixture
def api_client():
    # 创建 client
    # yield client
    # 关闭 client`,
    verifyCommand: "pytest --collect-only -q && pytest -q test_level_05.py",
    expected: "2 tests collected\n2 passed",
    hint: "先不写参数化，确保 fixture 可用；再加 @pytest.mark.parametrize。",
    referenceAnswer: `@pytest.fixture
def api_client():
    client = HttpClient(base_url="https://example.test")
    yield client
    client.close()`,
    quiz: { question: "fixture 中 yield 之后的代码什么时候执行？", options: ["收集用例前", "用例结束后，包括用例失败时", "永远不执行", "只有 HTTP 200 时"], correct: 1, explanation: "yield 之后是 fixture teardown，pytest 会在用例结束后执行。" },
  },
  6: {
    beforeYouStart: "YAML 只是文本。它被读成 dict 后，还需要校验才能放心交给 Runner。",
    glossary: [
      { term: "parse", meaning: "把 YAML 文本解析成 Python dict/list。" },
      { term: "schema", meaning: "对字段、类型、必填性和组合规则的定义。" },
      { term: "Pydantic Model", meaning: "用 Python 类声明 schema 并执行校验。" },
      { term: "safe_load", meaning: "PyYAML 的安全解析方式，但它不校验业务结构。" },
    ],
    exampleTitle: "能解析的 YAML 不一定能执行",
    example: `steps:
  - name: 空步骤
    save_as: result
# 语法正确，但既没有 action 也没有 request`,
    walkthrough: ["safe_load 会成功返回 dict。", "Runner 真正执行时才发现不知道要做什么。", "Pydantic 应在执行前拒绝这个步骤。"],
    starter: `class FlowEntry(BaseModel):
    action: str | None = None
    request: dict | None = None
    # 增加组合校验`,
    verifyCommand: "pytest -q test_flow_entry_schema.py",
    expected: "3 passed",
    hint: "使用 model_validator(mode=\"after\")，在 action 和 request 都为空时 raise ValueError。",
    referenceAnswer: `@model_validator(mode="after")
def has_executor(self):
    if not self.action and not self.request:
        raise ValueError("必须声明 action 或 request")
    return self`,
    quiz: { question: "yaml.safe_load() 成功能证明什么？", options: ["用例一定可执行", "YAML 语法可被解析", "adapter 一定存在", "真实接口一定成功"], correct: 1, explanation: "safe_load 只证明文本可解析，不证明声明式用例结构或业务正确。" },
  },
  7: {
    beforeYouStart: "Runner 就像调度员：读动作名、找函数、传参数、收集结果。",
    glossary: [
      { term: "reflection", meaning: "程序在运行时查看并操作模块、函数和签名。" },
      { term: "signature", meaning: "函数的参数列表和调用形式。" },
      { term: "dispatch", meaning: "根据 action name 选择并执行对应 handler。" },
      { term: "context", meaning: "单条用例执行期间保存步骤输出的字典。" },
    ],
    exampleTitle: "save_as 把上一步结果放进 context",
    example: `action: after_sale.notify
save_as: processing_result

context["processing_result"] = handler_result`,
    walkthrough: ["Runner 先用 action name 找 handler。", "handler 返回的结果用 save_as 作为 key 存入 context。", "后续步骤可用 processing_result.response 访问它。"],
    starter: `def run_entry(entry, adapters, context):
    # 找 handler
    # 执行 handler
    # 根据 save_as 保存结果`,
    verifyCommand: "pytest -q test_mini_runner.py",
    expected: "4 passed",
    hint: "先不做模板渲染，只实现 action 查找和 save_as；然后再增加第二步读取 context。",
    referenceAnswer: `handler = adapters[entry["action"]]
result = handler(entry, context)
if entry.get("save_as"):
    context[entry["save_as"]] = result`,
    quiz: { question: "save_as 最主要的用途是什么？", options: ["修改 HTTP method", "给步骤输出命名并存入 context", "关闭数据库", "安装 adapter"], correct: 1, explanation: "save_as 是步骤输出在当前用例 context 中的名字。" },
  },
  8: {
    beforeYouStart: "先分清“服务器收到请求”和“业务真的办成了”，再学 Mock。",
    glossary: [
      { term: "HTTP status", meaning: "HTTP 协议层状态，如 200、500。" },
      { term: "business success", meaning: "响应 JSON 中表示业务是否成功的字段，如 success。" },
      { term: "MockTransport", meaning: "拦截 HTTPX 请求并在本地返回预设响应。" },
      { term: "timeout", meaning: "请求最多等待多久，避免无限卡住。" },
    ],
    exampleTitle: "HTTP 200 也可能是业务失败",
    example: `HTTP 200
{
  "success": false,
  "code": "A4500",
  "msg": "库存不足"
}`,
    walkthrough: ["200 说明服务器正常返回了 HTTP 响应。", "success=false 说明库存调整没有办成。", "异常用例应保留这份响应用于断言，不能提前吞掉。"],
    starter: `def handler(request: httpx.Request):
    # 根据路径和请求体返回不同响应`,
    verifyCommand: "pytest -q test_http_modes.py",
    expected: "3 passed（成功、HTTP 500、HTTP 200 + success=false）",
    hint: "在 handler 里用 json.loads(request.content) 读请求体，根据 adjustAmount 返回不同结果。",
    referenceAnswer: `if payload["adjustAmount"] > available:
    return httpx.Response(200, json={
        "success": False, "code": "A4500", "msg": "库存不足"
    })`,
    quiz: { question: "HTTP 200 且 response.success=false 代表什么？", options: ["传输层和业务都成功", "传输层成功，业务失败", "网络超时", "Python 语法错误"], correct: 1, explanation: "HTTP status 和业务 success 是两层不同的判定。" },
  },
  9: {
    beforeYouStart: "这一关不要先背设计模式，而是先问：这段代码知道的业务信息是不是太多了？",
    glossary: [
      { term: "Provider", meaning: "封装数据库、Redis、文件等基础访问方式。" },
      { term: "Adapter", meaning: "把声明式 action 转成真实业务调用。" },
      { term: "Registry", meaning: "保存名字到能力的映射，负责发现，不负责业务决策。" },
      { term: "resolve", meaning: "根据当前需求的业务约束选择可执行数据。" },
    ],
    exampleTitle: "同一个“数据库查询”其实有两层问题",
    example: `Provider: 我怎么安全执行参数化 SQL？
resolve:  这个售后用例需要哪个仓库和 SKU？`,
    walkthrough: ["Provider 可被不同页面复用。", "resolve 包含库存、占用、状态等售后规则，应留在场景层。", "如果把 resolve 放进 Provider，Provider 就被某个业务绑死。"],
    starter: `# 从一个混合 adapter 中标注：
# [Provider] 基础访问
# [Shared Action] 页面稳定动作
# [Requirement] 需求特有规则`,
    verifyCommand: "pytest -q tests/provider tests/shared_actions tests/requirements",
    expected: "三组测试独立通过",
    hint: "先不移动代码，只给每个函数标注它应属于哪层以及理由。",
    referenceAnswer: `Provider -> request/query 执行、连接和参数化
Shared Action -> 库存快照、通知状态、统一结果
Requirement -> 合法 SKU 选择、本用例差值和风险约束`,
    quiz: { question: "“这个需求应该选哪个库存 SKU”应放在哪里？", options: ["DatabaseProvider", "HTTP Client", "需求/场景层 resolve", "Registry"], correct: 2, explanation: "选什么数据是业务求解，不是基础访问能力。" },
  },
  10: {
    beforeYouStart: "Boss 战不要从空白文件开始。页面会给你目录清单、最小 YAML、Mock 检查点和完成定义。",
    glossary: [
      { term: "static gate", meaning: "不访问真实环境的结构、契约、导入和收集检查。" },
      { term: "Mock full flow", meaning: "用本地假实现跑完 setup 到 teardown 的全链路。" },
      { term: "evidence", meaning: "每步的请求、响应、业务标识和失败诊断。" },
      { term: "teardown.always", meaning: "无论前面成功还是失败都要执行的恢复/清理步骤。" },
    ],
    exampleTitle: "Boss 战完成定义",
    example: `1. requirement_cases.yaml 有完整生命周期
2. 每个 action 可导入
3. collect-only 通过
4. Mock 全链路通过
5. 成功和失败都生成 evidence`,
    walkthrough: ["先选一条只有 2–3 个动作的短链路。", "先做静态门禁，再做 Mock，最后才讨论真实环境。", "任何一步失败都要保留主异常和已经产生的证据。"],
    starter: `requirements/BOSS_01/
├── constraint_spec.yaml
├── requirement_cases.yaml
├── adapters.py
└── source_queries.py`,
    verifyCommand: "python verify_declarative_delivery.py ... && pytest -q tests/test_boss_mock.py",
    expected: "三级静态门禁通过\nMock 全链路通过\nevidence JSON 包含 request/response",
    hint: "可以直接复用第 5、6、7、8 关产物，不要重写 Client、Provider 或 Runner。",
    referenceAnswer: `建议链路：
fixture.resolve -> inventory.snapshot -> after_sale.notify -> assertion
teardown.always -> fixture.restore

成功证据：HTTP 200 + response + flowNo
失败证据：主异常 + 已完成步骤 + teardown 诊断`,
    quiz: { question: "Boss 链路第一次运行应优先选什么？", options: ["直接扣减真实 SIT 库存", "先跑静态门禁和 Mock 全链路", "先写管理面", "删除 teardown 简化流程"], correct: 1, explanation: "静态门禁和 Mock 能先验证结构、导入、模板、断言和清理，不产生真实副作用。" },
  },
};

const knowledgeByLevel: Record<number, KnowledgePoint[]> = {
  1: [
    { term: "path: str", plain: "path 是函数接收的参数，str 表示它应该是字符串。", role: "传入 data.flowNo，告诉函数要沿哪条字段路线查找。", example: `path = "data.flowNo"` },
    { term: "split(\".\")", plain: "split() 按照指定符号拆分字符串，并返回一个 list。", role: "把 data.flowNo 拆成 data 和 flowNo，函数才能逐层查找。", example: `"data.flowNo".split(".")  →  ["data", "flowNo"]` },
    { term: "for ... in ...", plain: "for 循环会把一组数据中的元素依次取出来。", role: "第一次取到 data，第二次取到 flowNo，每次向字典内部走一层。", example: `for part in ["data", "flowNo"]: print(part)` },
    { term: "isinstance()", plain: "isinstance(对象, 类型) 判断对象是不是指定类型，结果是 True 或 False。", role: "继续查字段前确认 current 是 dict，避免对 None 或字符串使用字典取值。", example: `isinstance({"a": 1}, dict)  # True` },
    { term: "not / or", plain: "not 会把真假反过来；or 表示两个条件只要有一个成立，整体就成立。", role: "current 不是字典，或者字段不存在，任一情况都应该报错。", example: `if not is_dict or field_missing: ...` },
    { term: "raise KeyError", plain: "raise 用来主动抛出错误；KeyError 表示查找的键不存在。", role: "明确告诉你是哪条路径找不到，避免程序在更后面神秘失败。", example: `raise KeyError("找不到字段: data.flowNo")` },
  ],
  2: [
    { term: "deepcopy()", plain: "deepcopy() 会把外层和内部嵌套对象一起复制。", role: "让两条用例拥有独立的 request，修改一条不会污染另一条。", example: `case_a = deepcopy(fixture)` },
    { term: "变量赋值 =", plain: "等号右边先计算，再把结果交给左边的变量名。", role: "body 保存复制后的数据，后续修改针对 body，不碰原 fixture。", example: `body = deepcopy(case["fixture"])` },
    { term: "字典取值 []", plain: "字典可以用方括号和键名读取或修改字段。", role: "找到 businessStatus 字段，再把它改为 710。", example: `body["businessStatus"] = 710` },
    { term: "try / finally", plain: "try 放主要工作，finally 放无论成功失败都必须执行的清理。", role: "即使 call_api() 报错，client.close() 仍会执行。", example: `try: call_api(body)  →  finally: client.close()` },
  ],
  3: [
    { term: "import_module()", plain: "根据字符串动态导入一个 Python 模块。", role: "YAML 保存函数地址，运行时再加载对应 adapters 模块。", example: `module = import_module("shop.adapters")` },
    { term: "split(\":\", 1)", plain: "第二个参数 1 表示最多只拆一次。", role: "把 module:function 分成模块地址和函数名两部分。", example: `"shop.adapters:run".split(":", 1)` },
    { term: "getattr()", plain: "getattr(对象, 名称) 按字符串名称读取对象的属性。", role: "从已导入模块中取出 function_name 对应的函数。", example: `handler = getattr(module, "run")` },
    { term: "callable()", plain: "判断一个对象能不能像函数一样用括号调用。", role: "避免把普通变量误当成 adapter 执行。", example: `callable(print)  # True` },
  ],
  4: [
    { term: "类型标注 :", plain: "冒号后的类型描述变量或参数预期装什么。", role: "让人、编辑器和 AI 更早发现传错结构的问题。", example: `name: str` },
    { term: "@dataclass", plain: "把一组相关字段快速变成结构清楚的数据类。", role: "适合表示 QueryRequest、ActionResult 等稳定结果。", example: `@dataclass  class Result: ...` },
    { term: "Protocol", plain: "Protocol 描述对象必须具备哪些方法，不限定具体实现类。", role: "真实数据库和 Mock 数据库只要都有 query()，就能被同一套代码使用。", example: `class Database(Protocol): ...` },
    { term: "默认值 = ()", plain: "调用者不传这个字段时，Python 使用等号右边的默认值。", role: "params 默认是空 tuple，不必每次手动传空参数。", example: `params: tuple = ()` },
  ],
  5: [
    { term: "@pytest.fixture", plain: "fixture 是 pytest 在测试前自动准备的依赖。", role: "测试函数写上 api_client 参数，pytest 就会创建并注入 Client。", example: `def test_api(api_client): ...` },
    { term: "yield", plain: "yield 暂时把资源交出去，等使用结束后再从下一行继续。", role: "yield 前创建 Client，yield 后关闭 Client，形成完整生命周期。", example: `create → yield client → close` },
    { term: "parametrize", plain: "用多组输入重复执行同一个测试函数。", role: "一个测试函数分别以 710 和 720 运行，收集成两条用例。", example: `@pytest.mark.parametrize("status", [710, 720])` },
    { term: "assert", plain: "assert 检查条件是否为 True，否则测试失败。", role: "把“状态只能是 710 或 720”变成自动判定规则。", example: `assert status in (710, 720)` },
  ],
  6: [
    { term: "class", plain: "class 用来定义一种对象的结构和行为。", role: "FlowEntry 类集中声明每个 YAML 步骤允许有哪些字段。", example: `class FlowEntry(BaseModel): ...` },
    { term: "| None", plain: "表示字段既可以是前面的类型，也可以没有值 None。", role: "action 和 request 单独看都可选，但组合规则要求至少存在一个。", example: `action: str | None = None` },
    { term: "装饰器 @", plain: "@ 开头的装饰器会给下面的函数或类附加能力。", role: "model_validator 告诉 Pydantic：这是模型级校验规则。", example: `@model_validator(mode="after")` },
    { term: "self", plain: "self 表示当前正在被创建或操作的这个对象。", role: "通过 self.action 和 self.request 读取当前步骤的字段。", example: `if not self.action and not self.request:` },
  ],
  7: [
    { term: "signature()", plain: "读取函数签名，也就是它声明了哪些参数。", role: "Runner 判断 handler 是否需要 action、context 或 runtime。", example: `params = signature(handler).parameters` },
    { term: ".parameters", plain: "点号表示访问对象属性；parameters 是签名中的参数集合。", role: "可以判断函数有没有 context 参数。", example: `if "context" in params:` },
    { term: "kwargs 字典", plain: "kwargs 是常见变量名，表示准备按名字传入函数的一组参数。", role: "Runner 根据 handler 签名逐个加入需要的值。", example: `kwargs["runtime"] = runtime` },
    { term: "**kwargs", plain: "两个星号会把字典展开成具名参数。", role: "context 字段会变成 handler(context=context)。", example: `handler(**kwargs)` },
  ],
  8: [
    { term: "回调 handler", plain: "回调是先交给另一个对象，等事件发生时再被调用的函数。", role: "MockTransport 收到请求后调用 handler，由它返回模拟响应。", example: `httpx.MockTransport(handler)` },
    { term: "request.url.path", plain: "点号逐层读取对象属性，最终得到 URL 的路径部分。", role: "确认代码请求的是正确接口，而不是只检查响应。", example: `assert request.url.path == "/app/stock/..."` },
    { term: "json={...}", plain: "这里把 Python dict 作为 JSON 响应体交给 HTTPX。", role: "模拟真实后端返回 success 和 flowNo。", example: `httpx.Response(200, json={"success": True})` },
    { term: "Client / Transport", plain: "Client 负责发请求，Transport 决定请求真正送到哪里。", role: "换成 MockTransport 后，测试不会访问外部系统。", example: `httpx.Client(transport=transport)` },
  ],
  9: [
    { term: "类与实例", plain: "class 是模板；根据模板创建出来的具体对象叫实例。", role: "DatabaseProvider 描述能力，真实数据库对象是它的一种实现。", example: `class DatabaseProvider: ...` },
    { term: "方法参数 self", plain: "类里的普通方法第一个参数通常是 self，代表当前实例。", role: "query() 可以通过 self 使用当前 Provider 的连接或配置。", example: `def query(self, request): ...` },
    { term: "函数参数", plain: "括号中的名称是函数需要的输入。", role: "resolve 明确依赖 database 和 constraints，不偷偷读取全局变量。", example: `def resolve(database, constraints): ...` },
    { term: "return", plain: "return 结束函数，并把结果交回调用它的地方。", role: "resolve 返回最终选中的安全库存数据。", example: `return select_safe_inventory(rows)` },
  ],
  10: [
    { term: "YAML 缩进", plain: "YAML 使用空格表达层级，同级内容必须对齐。", role: "setup、steps、assertions 和 teardown 是 common_flow 下的同级结构。", example: `common_flow: → 两个空格 → setup:` },
    { term: "冒号 :", plain: "YAML 中冒号左边是字段名，右边是字段值。", role: "action: fixture.resolve 表示 action 字段的值是 fixture.resolve。", example: `save_as: resolved_fixture` },
    { term: "短横线 -", plain: "YAML 中短横线表示列表里的一个元素。", role: "每个 - action 都是 setup 或 steps 列表中的一个步骤。", example: `- action: inventory.snapshot` },
    { term: "true", plain: "YAML 的 true 会被解析成 Python 的 True 布尔值。", role: "要求响应中的 success 字段必须为真。", example: `success: true` },
    { term: "点路径", plain: "用点号连接多个层级的字段名。", role: "先取 processing_result，再进入它的 response。", example: `source: processing_result.response` },
  ],
};

const inlineTokensByTerm: Record<string, string[]> = {
  "path: str": ["path: str"],
  "split(\".\")": ["split(\".\")"],
  "for ... in ...": ["for"],
  "isinstance()": ["isinstance"],
  "not / or": ["not", "or"],
  "raise KeyError": ["raise KeyError"],
  "deepcopy()": ["deepcopy"],
  "变量赋值 =": ["body ="],
  "字典取值 []": ["[\"businessStatus\"]"],
  "try / finally": ["try", "finally"],
  "import_module()": ["import_module"],
  "split(\":\", 1)": ["split(\":\", 1)"],
  "getattr()": ["getattr"],
  "callable()": ["callable"],
  "类型标注 :": ["name: str"],
  "@dataclass": ["@dataclass"],
  Protocol: ["Protocol"],
  "默认值 = ()": ["= ()"],
  "@pytest.fixture": ["@pytest.fixture"],
  yield: ["yield"],
  parametrize: ["parametrize"],
  assert: ["assert"],
  class: ["class FlowEntry"],
  "| None": ["| None"],
  "装饰器 @": ["@model_validator"],
  self: ["self"],
  "signature()": ["signature"],
  ".parameters": [".parameters"],
  "kwargs 字典": ["kwargs"],
  "**kwargs": ["**kwargs"],
  "回调 handler": ["handler"],
  "request.url.path": ["request.url.path"],
  "json={...}": ["json="],
  "Client / Transport": ["Client", "Transport"],
  "类与实例": ["class DatabaseProvider"],
  "方法参数 self": ["self"],
  "函数参数": ["def resolve"],
  return: ["return"],
  "冒号 :": ["action:"],
  "短横线 -": ["- action"],
  true: ["true"],
  "点路径": ["processing_result.response"],
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenPattern(value: string) {
  const escaped = escapeRegExp(value);
  const startsWithWord = /^[A-Za-z0-9_]/.test(value);
  const endsWithWord = /[A-Za-z0-9_]$/.test(value);
  return `${startsWithWord ? "\\b" : ""}${escaped}${endsWithWord ? "\\b" : ""}`;
}

function inlineTokensFor(code: string, knowledge: KnowledgePoint[]) {
  return knowledge.flatMap((item) =>
    (inlineTokensByTerm[item.term] ?? [])
      .filter((token) => code.includes(token))
      .map((token) => ({ token, item })),
  );
}

function InteractiveCode({
  code,
  knowledge,
  onOpen,
}: {
  code: string;
  knowledge: KnowledgePoint[];
  onOpen: (item: KnowledgePoint) => void;
}) {
  const tokenEntries = inlineTokensFor(code, knowledge)
    .sort((left, right) => right.token.length - left.token.length);
  if (!tokenEntries.length) return code;

  const ownerByToken = new Map(tokenEntries.map((entry) => [entry.token, entry.item]));
  const pattern = new RegExp(`(${tokenEntries.map((entry) => tokenPattern(entry.token)).join("|")})`, "g");

  return code.split(pattern).map((part, index) => {
    const item = ownerByToken.get(part);
    if (!item) return part;
    return (
      <button
        className="interactive-code-term"
        type="button"
        key={`${part}-${index}`}
        title={`点击解释：${item.term}`}
        aria-label={`解释代码中的 ${item.term}`}
        onClick={() => onOpen(item)}
      >
        {part}
      </button>
    );
  });
}

const storageKey = "python-framework-quest-v2";
const legacyStorageKey = "python-framework-quest-v1";
const codexChatStorageKey = "python-framework-quest-codex-chats-v1";
const localCodexBridge = "http://127.0.0.1:4317";

type ProgressState = {
  completed: number[];
  quizPassed: number[];
  stageUnlocked?: Record<number, number>;
  taskDrafts?: Record<number, string>;
  taskGrades?: Record<number, TaskGrade>;
};

type TaskGrade = {
  passed: boolean;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  criteria: Array<{ criterion: string; met: boolean; evidence: string }>;
};

type GradeSubmission = {
  id: number;
  levelId: number;
  answer: string;
  status: "pending" | "judging" | "completed";
  grade: TaskGrade | null;
  createdAt: string;
  updatedAt: string;
};

type CodexChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type LocalCodexStatus = "checking" | "ready" | "offline";

const learningStages = ["先认词", "看数据", "逐行理解", "动手练", "自动小测"];

export default function Home({ chapterId }: { chapterId?: number }) {
  const currentChapter = chapterId ? getPythonCourseChapter(chapterId) : undefined;
  const visibleLevels = currentChapter
    ? levels.filter((level) => currentChapter.levelIds.includes(level.id))
    : [];
  const [completed, setCompleted] = useState<number[]>([]);
  const [quizPassed, setQuizPassed] = useState<number[]>([]);
  const [quizSelections, setQuizSelections] = useState<Record<number, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<number, string>>({});
  const [stageUnlocked, setStageUnlocked] = useState<Record<number, number>>({});
  const [activeStages, setActiveStages] = useState<Record<number, number>>({});
  const [taskDrafts, setTaskDrafts] = useState<Record<number, string>>({});
  const [taskGrades, setTaskGrades] = useState<Record<number, TaskGrade>>({});
  const [gradeSubmissions, setGradeSubmissions] = useState<Record<number, GradeSubmission>>({});
  const [gradingLevel, setGradingLevel] = useState<number | null>(null);
  const [gradingErrors, setGradingErrors] = useState<Record<number, string>>({});
  const [queueLoading, setQueueLoading] = useState(Boolean(chapterId));
  const [queueError, setQueueError] = useState("");
  const [localCodexStatus, setLocalCodexStatus] = useState<LocalCodexStatus>(chapterId ? "checking" : "offline");
  const [codexChats, setCodexChats] = useState<Record<number, CodexChatMessage[]>>({});
  const [codexChatDrafts, setCodexChatDrafts] = useState<Record<number, string>>({});
  const [codexBusyLevel, setCodexBusyLevel] = useState<number | null>(null);
  const [codexErrors, setCodexErrors] = useState<Record<number, string>>({});
  const [activeKnowledge, setActiveKnowledge] = useState<KnowledgePoint | null>(null);
  const [openId, setOpenId] = useState(currentChapter?.levelIds[0] ?? 1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const progressState = JSON.parse(stored) as ProgressState;
        setCompleted(progressState.completed ?? []);
        setQuizPassed(progressState.quizPassed ?? []);
        setStageUnlocked(progressState.stageUnlocked ?? {});
        setTaskDrafts(progressState.taskDrafts ?? {});
        setTaskGrades(progressState.taskGrades ?? {});
        setActiveStages(progressState.stageUnlocked ?? {});
      } else {
        const legacy = window.localStorage.getItem(legacyStorageKey);
        if (legacy) {
          const previousCompleted = JSON.parse(legacy) as number[];
          setCompleted(previousCompleted);
          setQuizPassed(previousCompleted);
          window.localStorage.setItem(storageKey, JSON.stringify({
            completed: previousCompleted,
            quizPassed: previousCompleted,
          } satisfies ProgressState));
        }
      }
    } catch {
      setCompleted([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    try {
      const storedChats = window.localStorage.getItem(codexChatStorageKey);
      if (storedChats) setCodexChats(JSON.parse(storedChats) as Record<number, CodexChatMessage[]>);
    } catch {
      setCodexChats({});
    }
  }, []);

  useEffect(() => {
    if (!chapterId) return;
    let active = true;
    const checkLocalCodex = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 1500);
      try {
        const response = await fetch(`${localCodexBridge}/health`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json() as { ok?: boolean };
        if (active) setLocalCodexStatus(response.ok && result.ok ? "ready" : "offline");
      } catch {
        if (active) setLocalCodexStatus("offline");
      } finally {
        window.clearTimeout(timeout);
      }
    };
    void checkLocalCodex();
    const timer = window.setInterval(() => void checkLocalCodex(), 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [chapterId]);

  useEffect(() => {
    if (!chapterId) return;
    let active = true;
    const loadQueue = async () => {
      try {
        const response = await fetch("/api/course-grade", { headers: { Accept: "application/json" } });
        const result = await response.json() as { submissions?: GradeSubmission[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "批改队列暂时不可用");
        if (!active) return;
        const latest = (result.submissions ?? []).reduce<Record<number, GradeSubmission>>((current, item) => {
          if (!current[item.levelId]) current[item.levelId] = item;
          return current;
        }, {});
        setGradeSubmissions(latest);
        setQueueError("");
      } catch (error) {
        if (active) setQueueError(error instanceof Error ? error.message : "批改队列暂时不可用");
      } finally {
        if (active) setQueueLoading(false);
      }
    };
    void loadQueue();
    const timer = window.setInterval(() => void loadQueue(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [chapterId]);
  useEffect(() => {
    if (!activeKnowledge) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveKnowledge(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [activeKnowledge]);

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

  function saveProgress(
    nextCompleted = completed,
    nextQuizPassed = quizPassed,
    nextStageUnlocked = stageUnlocked,
    nextTaskDrafts = taskDrafts,
    nextTaskGrades = taskGrades,
  ) {
    window.localStorage.setItem(storageKey, JSON.stringify({
      completed: nextCompleted,
      quizPassed: nextQuizPassed,
      stageUnlocked: nextStageUnlocked,
      taskDrafts: nextTaskDrafts,
      taskGrades: nextTaskGrades,
    } satisfies ProgressState));
  }

  function updateTaskDraft(
    id: number,
    value: string,
    textarea?: HTMLTextAreaElement,
    selectionStart?: number,
    selectionEnd?: number,
  ) {
    const nextDrafts = { ...taskDrafts, [id]: value };
    setTaskDrafts(nextDrafts);
    saveProgress(completed, quizPassed, stageUnlocked, nextDrafts, taskGrades);
    if (textarea && selectionStart !== undefined && selectionEnd !== undefined) {
      window.requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(selectionStart, selectionEnd);
      });
    }
  }

  function handleTaskEditorKeyDown(id: number, event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    const textarea = event.currentTarget;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const indent = "    ";

    if (event.key === "Escape") {
      textarea.dataset.allowNextTab = "true";
      return;
    }

    if (event.key === "Tab") {
      if (textarea.dataset.allowNextTab === "true") {
        delete textarea.dataset.allowNextTab;
        return;
      }
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;

      if (event.shiftKey) {
        const effectiveEnd = end > start && value[end - 1] === "\n" ? end - 1 : end;
        const nextLineBreak = value.indexOf("\n", effectiveEnd);
        const blockEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
        const block = value.slice(lineStart, blockEnd);
        let removedTotal = 0;
        let removedFirst = 0;
        const unindented = block.split("\n").map((line, index) => {
          const removable = line.startsWith("\t") ? 1 : Math.min(indent.length, line.match(/^ */)?.[0].length ?? 0);
          removedTotal += removable;
          if (index === 0) removedFirst = removable;
          return line.slice(removable);
        }).join("\n");
        const nextValue = value.slice(0, lineStart) + unindented + value.slice(blockEnd);
        const nextSelectionStart = Math.max(lineStart, start - removedFirst);
        const nextSelectionEnd = Math.max(nextSelectionStart, end - removedTotal);
        updateTaskDraft(id, nextValue, textarea, nextSelectionStart, nextSelectionEnd);
        return;
      }

      if (start === end) {
        const nextValue = value.slice(0, start) + indent + value.slice(end);
        updateTaskDraft(id, nextValue, textarea, start + indent.length, start + indent.length);
        return;
      }

      const effectiveEnd = value[end - 1] === "\n" ? end - 1 : end;
      const nextLineBreak = value.indexOf("\n", effectiveEnd);
      const blockEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
      const block = value.slice(lineStart, blockEnd);
      const indented = block.split("\n").map((line) => indent + line).join("\n");
      const lineCount = block.split("\n").length;
      const nextValue = value.slice(0, lineStart) + indented + value.slice(blockEnd);
      updateTaskDraft(id, nextValue, textarea, start + indent.length, end + indent.length * lineCount);
      return;
    }

    delete textarea.dataset.allowNextTab;

    if (event.key === "Enter") {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const lineBeforeCursor = value.slice(lineStart, start);
      const leadingWhitespace = lineBeforeCursor.match(/^[\t ]*/)?.[0] ?? "";
      const shouldIndent = lineBeforeCursor.trimEnd().endsWith(":");
      const nextIndent = leadingWhitespace + (shouldIndent ? indent : "");
      const insertion = `\n${nextIndent}`;
      const nextValue = value.slice(0, start) + insertion + value.slice(end);
      const nextCursor = start + insertion.length;
      updateTaskDraft(id, nextValue, textarea, nextCursor, nextCursor);
      return;
    }

    if (event.key === "Backspace" && start === end) {
      const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const beforeCursor = value.slice(lineStart, start);
      if (beforeCursor.length > 0 && /^ +$/.test(beforeCursor)) {
        event.preventDefault();
        const removeCount = beforeCursor.length % indent.length || indent.length;
        const nextStart = Math.max(lineStart, start - removeCount);
        updateTaskDraft(id, value.slice(0, nextStart) + value.slice(start), textarea, nextStart, nextStart);
      }
    }
  }

  function unlockedStage(id: number) {
    if (completed.includes(id) || quizPassed.includes(id)) return 5;
    return Math.max(1, Math.min(5, stageUnlocked[id] ?? 1));
  }

  function activeStage(id: number) {
    return Math.max(1, Math.min(unlockedStage(id), activeStages[id] ?? unlockedStage(id)));
  }

  function advanceStage(id: number, stage: number) {
    const nextStage = Math.min(5, stage + 1);
    const nextUnlocked = { ...stageUnlocked, [id]: Math.max(unlockedStage(id), nextStage) };
    setStageUnlocked(nextUnlocked);
    setActiveStages((current) => ({ ...current, [id]: nextStage }));
    saveProgress(completed, quizPassed, nextUnlocked);
  }

  function selectStage(id: number, stage: number) {
    if (stage > unlockedStage(id)) return;
    setActiveStages((current) => ({ ...current, [id]: stage }));
  }

  async function submitTask(id: number) {
    const answer = (taskDrafts[id] ?? "").trim();
    if (answer.length < 30) {
      setGradingErrors((current) => ({ ...current, [id]: "请至少写 30 个字符，包含你的代码或实现思路。" }));
      return;
    }

    setGradingLevel(id);
    setGradingErrors((current) => ({ ...current, [id]: "" }));
    try {
      const response = await fetch("/api/course-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enqueue", levelId: id, answer }),
      });
      const result = await response.json() as { submission?: GradeSubmission; error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "加入批改队列失败，请稍后重试。");
      }
      if (result.submission) setGradeSubmissions((current) => ({ ...current, [id]: result.submission as GradeSubmission }));
    } catch (error) {
      setGradingErrors((current) => ({
        ...current,
        [id]: error instanceof Error ? error.message : "加入批改队列失败，请稍后重试。",
      }));
    } finally {
      setGradingLevel(null);
    }
  }

  function saveCodexChats(nextChats: Record<number, CodexChatMessage[]>) {
    setCodexChats(nextChats);
    window.localStorage.setItem(codexChatStorageKey, JSON.stringify(nextChats));
  }

  async function sendToLocalCodex(level: Level, suggestedMessage?: string) {
    const answer = (taskDrafts[level.id] ?? "").trim();
    const message = (suggestedMessage ?? codexChatDrafts[level.id] ?? "").trim();
    if (answer.length < 30) {
      setCodexErrors((current) => ({ ...current, [level.id]: "请先在上面的答案框中写至少 30 个字符。" }));
      return;
    }
    if (!message) {
      setCodexErrors((current) => ({ ...current, [level.id]: "请输入想对 Codex 说的话。" }));
      return;
    }

    const previous = codexChats[level.id] ?? [];
    const userMessage: CodexChatMessage = { role: "user", content: message, createdAt: new Date().toISOString() };
    const withUser = { ...codexChats, [level.id]: [...previous, userMessage] };
    saveCodexChats(withUser);
    setCodexChatDrafts((current) => ({ ...current, [level.id]: "" }));
    setCodexBusyLevel(level.id);
    setCodexErrors((current) => ({ ...current, [level.id]: "" }));

    try {
      const response = await fetch(`${localCodexBridge}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: { id: level.id, title: level.title, task: level.task, acceptance: level.acceptance },
          answer,
          message,
          history: previous,
        }),
      });
      const result = await response.json() as { reply?: string; grade?: TaskGrade | null; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error ?? "本机 Codex 没有返回有效回复");

      const assistantMessage: CodexChatMessage = { role: "assistant", content: result.reply, createdAt: new Date().toISOString() };
      saveCodexChats({ ...withUser, [level.id]: [...withUser[level.id], assistantMessage] });
      if (result.grade) {
        const nextGrades = { ...taskGrades, [level.id]: result.grade };
        setTaskGrades(nextGrades);
        if (result.grade.passed) {
          const nextUnlocked = { ...stageUnlocked, [level.id]: 5 };
          setStageUnlocked(nextUnlocked);
          saveProgress(completed, quizPassed, nextUnlocked, taskDrafts, nextGrades);
        } else {
          saveProgress(completed, quizPassed, stageUnlocked, taskDrafts, nextGrades);
        }
      }
    } catch (error) {
      setCodexErrors((current) => ({ ...current, [level.id]: error instanceof Error ? error.message : "本机 Codex 调用失败" }));
    } finally {
      setCodexBusyLevel(null);
    }
  }

  function checkQuiz(id: number) {
    const selected = quizSelections[id];
    const quiz = supportByLevel[id].quiz;
    if (selected === undefined) {
      setQuizFeedback((current) => ({ ...current, [id]: "请先选择一个答案，再点击检查。" }));
      return;
    }

    if (selected === quiz.correct) {
      const nextQuizPassed = quizPassed.includes(id) ? quizPassed : [...quizPassed, id].sort((a, b) => a - b);
      setQuizPassed(nextQuizPassed);
      setQuizFeedback((current) => ({ ...current, [id]: `答对了。${quiz.explanation}` }));
      saveProgress(completed, nextQuizPassed);
      return;
    }

    setQuizFeedback((current) => ({ ...current, [id]: `还没答对。${quiz.explanation}` }));
  }

  function completeLevel(id: number) {
    if (!completed.includes(id) && !quizPassed.includes(id)) return;
    const next = completed.includes(id)
      ? completed.filter((item) => item !== id)
      : [...completed, id].sort((a, b) => a - b);
    setCompleted(next);
    saveProgress(next, quizPassed);
    if (!completed.includes(id) && id < levels.length) {
      const nextLevel = levels.find((level) => level.id === id + 1);
      const nextChapter = getChapterForLevel(id + 1);
      if (nextLevel && nextChapter?.id === currentChapter?.id) {
        setOpenId(id + 1);
        window.setTimeout(() => document.getElementById(`level-${id + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      } else if (nextChapter) {
        window.location.href = `/courses/python-framework/chapters/${nextChapter.id}#level-${id + 1}`;
      }
    }
  }

  function resetProgress() {
    if (!window.confirm("确定清空当前浏览器的学习进度和草稿吗？服务器里的批改记录不会删除。")) return;
    setCompleted([]);
    setQuizPassed([]);
    setQuizSelections({});
    setQuizFeedback({});
    setStageUnlocked({});
    setActiveStages({});
    setTaskDrafts({});
    setTaskGrades({});
    setGradingErrors({});
    setCodexChats({});
    setCodexChatDrafts({});
    setCodexErrors({});
    setOpenId(currentChapter?.levelIds[0] ?? 1);
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(legacyStorageKey);
    window.localStorage.removeItem(codexChatStorageKey);
  }

  const nextLevelHref = nextLevel
    ? `/courses/python-framework/chapters/${getChapterForLevel(nextLevel.id)?.id}#level-${nextLevel.id}`
    : "/courses/python-framework/chapters/1";

  return (
    <main className={ready ? "ready" : ""}>
      <header className="hero">
        <nav>
          <a className="brand" href="/"><i>PY</i> Python 框架修炼</a>
          <div className="nav-actions">
            <a className="text-button course-back" href={currentChapter ? "/courses/python-framework" : "/"}>{currentChapter ? "← 返回章节选择" : "← 选择其他方向"}</a>
            <a className="text-button" href="/grading-queue">备用批改队列</a>
            <span className="rank">Python 段位 <b>{rank}</b></span>
            <button className="text-button" onClick={resetProgress}>重置进度</button>
          </div>
        </nav>
        <div className="hero-grid">
          <section>
            <p className="eyebrow">{currentChapter ? `PYTHON QUEST · CHAPTER ${currentChapter.id}` : "PYTHON FRAMEWORK QUEST"}</p>
            <h1>{currentChapter ? currentChapter.title : <>过关斩将，<br /><em>练成框架判断力</em></>}</h1>
            <p className="lead">{currentChapter?.subtitle ?? "从 Python 数据、函数与 pytest 出发，逐步理解 YAML、Runner、Adapter、HTTP 与架构边界；本地模式可直接与 Codex 对话、即时批改。"}</p>
            <a className="hero-cta" href={currentChapter ? `#level-${currentChapter.levelIds.find((id) => !completed.includes(id)) ?? currentChapter.levelIds[0]}` : nextLevelHref}>{currentChapter ? "进入本章关卡" : nextLevel ? `继续第 ${nextLevel.id} 关` : "回看四章"} <span>→</span></a>
          </section>
          <aside className="progress-card">
            <div className="progress-top"><span>Python 当前进度</span><strong>{progress}%</strong></div>
            <div className="bar"><i style={{ width: `${progress}%` }} /></div>
            <p>{completed.length} / {levels.length} 关已通过 · 进度保存在当前浏览器</p>
            <ol>{levels.map((level) => <li className={completed.includes(level.id) ? "lit" : ""} key={level.id} title={level.title}>{level.id}</li>)}</ol>
          </aside>
        </div>
      </header>

      {!currentChapter && <section className="principles" aria-label="学习方法">
        <article><b>01</b><div><h2>先认识概念</h2><p>每关先解释术语和数据长什么样，再进入代码。</p></div></article>
        <article><b>02</b><div><h2>再逐行理解</h2><p>用真实接口自动化片段说明每一行为什么存在。</p></div></article>
        <article><b>03</b><div><h2>最后完成任务</h2><p>小测自动判定，练习有验收标准、提示和参考答案。</p></div></article>
      </section>}

      <section className="map-section" id="roadmap">
        <div className="section-heading">
          <p>{currentChapter ? "CHAPTER LEVELS" : "THE ROADMAP"}</p>
          <h2>{currentChapter ? `${currentChapter.shortTitle} · 本章关卡` : "四章修炼地图"}</h2>
          <span>{currentChapter ? "每关一次只展开一个学习步骤，完成后自动进入下一步。" : "章节各自拥有独立页面；学完一章再进入下一章，不再在一个长页面里下拉。"}</span>
        </div>

        {!currentChapter ? (
          <div className="chapter-grid">
            {pythonCourseChapters.map((chapter) => {
              const chapterCompleted = chapter.levelIds.filter((id) => completed.includes(id)).length;
              const chapterUnlocked = chapter.id === 1 || completed.includes(chapter.levelIds[0] - 1);
              return (
                <article className={`chapter-card ${chapterCompleted === chapter.levelIds.length ? "complete" : ""} ${!chapterUnlocked ? "locked" : ""}`} key={chapter.id}>
                  <span>CHAPTER {String(chapter.id).padStart(2, "0")}</span>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.subtitle}</p>
                  <div><b>{chapterCompleted} / {chapter.levelIds.length} 关完成</b><i>{chapter.levelIds.map((id) => `L${id}`).join(" · ")}</i></div>
                  {chapterUnlocked
                    ? <a href={`/courses/python-framework/chapters/${chapter.id}`}>进入本章 <b>→</b></a>
                    : <span className="chapter-locked-label">完成上一章后解锁</span>}
                </article>
              );
            })}
          </div>
        ) : <div className="quest-map">
          {visibleLevels.map((level) => {
            const done = completed.includes(level.id);
            const support = supportByLevel[level.id];
            const knowledge = knowledgeByLevel[level.id];
            const inlineKnowledgeTerms = new Set(inlineTokensFor(level.code, knowledge).map((entry) => entry.item.term));
            const supplementalKnowledge = knowledge.filter((item) => !inlineKnowledgeTerms.has(item.term));
            const passedQuiz = quizPassed.includes(level.id);
            const unlocked = isUnlocked(level.id);
            const open = openId === level.id;
            const stage = activeStage(level.id);
            const maxStage = unlockedStage(level.id);
            const gradeSubmission = gradeSubmissions[level.id];
            const grade = taskGrades[level.id] ?? gradeSubmission?.grade ?? null;
            const gradeStatusIndex = gradeSubmission?.status === "completed" ? 3 : gradeSubmission?.status === "judging" ? 2 : gradeSubmission ? 1 : 0;
            return (
              <div key={level.id}>
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
                        <ol className="stage-tabs" aria-label="本关学习步骤">
                          {learningStages.map((label, index) => {
                            const stageNumber = index + 1;
                            return <li key={label}>
                              <button
                                type="button"
                                disabled={stageNumber > maxStage}
                                className={`${stage === stageNumber ? "active" : ""} ${stageNumber < maxStage ? "finished" : ""}`}
                                onClick={() => selectStage(level.id, stageNumber)}
                              ><b>{stageNumber}</b><span>{label}</span>{stageNumber > maxStage && <i>锁</i>}</button>
                            </li>;
                          })}
                        </ol>
                        {stage === 1 && <section className="stage-panel">
                          <div className="beginner-note"><b>小白先看这里</b><p>{support.beforeYouStart}</p></div>
                          <div className="glossary-grid">
                            {support.glossary.map((item) => (
                              <button
                                className="glossary-card"
                                type="button"
                                key={item.term}
                                onClick={() => setActiveKnowledge({
                                  term: item.term,
                                  plain: item.meaning,
                                  role: `这是第 ${level.id} 关会反复遇到的术语。先理解它的含义，再回到例子中找它出现的位置。`,
                                })}
                              >
                                <span><b>{item.term}</b><i>点开解释</i></span>
                                <p>{item.meaning}</p>
                              </button>
                            ))}
                          </div>
                          <button className="stage-continue" type="button" onClick={() => advanceStage(level.id, 1)}>概念看懂了，进入“看数据” →</button>
                        </section>}
                        {stage === 2 && <section className="stage-panel">
                          <section className="example-panel">
                            <div className="stage-intro"><span>先看它长什么样</span><h4>{support.exampleTitle}</h4></div>
                            <pre><code>{support.example}</code></pre>
                            <ol className="walkthrough">{support.walkthrough.map((step) => <li key={step}>{step}</li>)}</ol>
                          </section>
                          <button className="stage-continue" type="button" onClick={() => advanceStage(level.id, 2)}>数据结构看懂了，进入“逐行理解” →</button>
                        </section>}
                        {stage === 3 && <section className="stage-panel">
                          <div className="chips">{level.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                          <div className="objective"><b>本关目标</b><p>{level.objective}</p></div>
                          <div className="lesson-grid">
                          <section>
                            <h4>理解例子以后，再掌握这些</h4>
                            <ul>{level.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}</ul>
                          </section>
                          <aside className="ai-lens"><span>AI 审查镜</span><p>{level.aiLens}</p></aside>
                          </div>
                          <div className="code-wrap interactive-code-wrap">
                          <div><span>PYTHON / YAML</span><i>带虚线的代码可以点击解释</i></div>
                          <pre><code><InteractiveCode code={level.code} knowledge={knowledge} onOpen={setActiveKnowledge} /></code></pre>
                          </div>
                          {supplementalKnowledge.length > 0 && (
                          <details className="compact-disclosure supplement-disclosure">
                            <summary>
                              <span><b>补充基础知识</b><small>这些概念不对应某一个代码词，先收起避免打断主线</small></span>
                              <i>展开 {supplementalKnowledge.length} 项</i>
                            </summary>
                            <div className="knowledge-buttons">
                              {supplementalKnowledge.map((item) => (
                                <button type="button" key={item.term} onClick={() => setActiveKnowledge(item)}>
                                  <code>{item.term}</code><span>?</span>
                                </button>
                              ))}
                            </div>
                          </details>
                          )}
                          <button className="stage-continue" type="button" onClick={() => advanceStage(level.id, 3)}>代码理解完成，进入“动手练” →</button>
                        </section>}
                        {stage === 4 && <section className="stage-panel"><div className="task task-with-input">
                          <div className="task-title"><span>通关任务</span><b>{level.reward}</b></div>
                          <p>{level.task}</p>
                          {localCodexStatus === "ready" ? <aside className="model-setup-notice local-codex-notice" role="status">
                            <b><i /> 本机 Codex 已连接</b>
                            <p>下面的聊天框会使用当前已登录的 Codex。可以即时批改，也可以继续追问“为什么错”或“给我一点提示”。</p>
                          </aside> : <aside className="model-setup-notice queue-mode-notice" role="status">
                            <b>{localCodexStatus === "checking" ? "正在连接本机 Codex…" : "本机 Codex 后台服务暂未连接"}</b>
                            <p>{localCodexStatus === "checking" ? "连接成功后，批改和连续追问都会直接出现在本页。" : "请确认 Codex 桌面端已登录。后台服务会自动重连；连接后不需要离开网页，也不需要 API Key。"}</p>
                            <a href="/grading-queue">暂时使用网页备用批改队列</a>
                          </aside>}
                          <details className="help-panel compact-task-help">
                            <summary>查看起步代码、验证方法与验收标准</summary>
                            <div className="starter-wrap"><h4>从这里开始写</h4><pre><code>{support.starter}</code></pre></div>
                            <div className="verification-grid">
                              <article className="verify-card"><span>怎么验证</span><code>{support.verifyCommand}</code></article>
                              <article className="verify-card"><span>你应该看到</span><pre><code>{support.expected}</code></pre></article>
                            </div>
                            <div><b>验收标准</b><ul>{level.acceptance.map((item) => <li key={item}>{item}</li>)}</ul></div>
                          </details>
                          <label className="task-answer-editor">
                            <span>在这里写你的答案 <i>Tab 缩进 · Shift+Tab 反缩进 · Enter 自动缩进</i></span>
                            <textarea
                              value={taskDrafts[level.id] ?? ""}
                              onChange={(event) => updateTaskDraft(level.id, event.target.value)}
                              onKeyDown={(event) => handleTaskEditorKeyDown(level.id, event)}
                              placeholder={support.starter}
                              spellCheck={false}
                              wrap="soft"
                              aria-describedby={`editor-help-${level.id}`}
                            />
                            <small id={`editor-help-${level.id}`}>长代码会自动换行；按 Esc 后再按 Tab，可以离开输入框。</small>
                          </label>
                          {localCodexStatus === "ready" ? <section className="local-codex-chat" aria-label="与本机 Codex 对话">
                            <header><div><i>CODEX</i><span><b>即时学习助教</b><small>使用当前 Codex 登录额度</small></span></div><em>本机在线</em></header>
                            <div className="codex-chat-messages" aria-live="polite">
                              {(codexChats[level.id] ?? []).length === 0 && <div className="codex-chat-empty">
                                <b>答案写好以后，可以直接这样问我：</b>
                                <p>“请逐条检查验收标准，并告诉我第一处需要修改的地方。”</p>
                              </div>}
                              {(codexChats[level.id] ?? []).map((message, messageIndex) => <article className={message.role} key={`${message.createdAt}-${messageIndex}`}>
                                <b>{message.role === "assistant" ? "Codex" : "你"}</b><p>{message.content}</p>
                              </article>)}
                              {codexBusyLevel === level.id && <article className="assistant thinking"><b>Codex</b><p>正在阅读你的答案并对照验收标准…</p></article>}
                            </div>
                            <div className="codex-quick-actions">
                              <button type="button" disabled={codexBusyLevel === level.id} onClick={() => void sendToLocalCodex(level, "请批改我当前的答案，逐条检查验收标准，并先告诉我最需要修改的一处。")}>立即批改当前答案</button>
                              <button type="button" disabled={codexBusyLevel === level.id} onClick={() => void sendToLocalCodex(level, "先不要给完整答案，请根据我当前的实现给一个下一步提示。")}>只给我一点提示</button>
                            </div>
                            <label className="codex-chat-composer">
                              <span>继续和 Codex 对话</span>
                              <textarea
                                value={codexChatDrafts[level.id] ?? ""}
                                onChange={(event) => setCodexChatDrafts((current) => ({ ...current, [level.id]: event.target.value }))}
                                onKeyDown={(event) => {
                                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                                    event.preventDefault();
                                    void sendToLocalCodex(level);
                                  }
                                }}
                                placeholder="例如：为什么缺少 data 时要抛出 KeyError？"
                              />
                              <small>Ctrl/⌘ + Enter 发送，也可以点击右侧按钮</small>
                              <button type="button" disabled={codexBusyLevel === level.id || !(codexChatDrafts[level.id] ?? "").trim()} onClick={() => void sendToLocalCodex(level)}>{codexBusyLevel === level.id ? "思考中…" : "发送"}</button>
                            </label>
                            {codexErrors[level.id] && <p className="grading-error" role="alert">{codexErrors[level.id]}</p>}
                          </section> : <>
                            {gradeSubmission && <ol className="grading-steps" aria-label="异步批改状态">
                              {[
                                [1, "待评判", "答案已排队"],
                                [2, "评判中", "Codex 已领取"],
                                [3, "已完成", "结果已回填"],
                              ].map(([index, label, hint]) => <li className={`${gradeStatusIndex === index ? "active" : ""} ${gradeStatusIndex > index ? "done" : ""}`} key={label}>
                                <b>{gradeStatusIndex > index ? "✓" : index}</b><span><strong>{label}</strong><small>{hint}</small></span>
                              </li>)}
                            </ol>}
                            <button className="model-grade-button" type="button" disabled={gradingLevel === level.id || queueLoading || gradeSubmission?.status === "judging"} onClick={() => submitTask(level.id)}>
                              {queueLoading ? "正在连接批改队列…" : gradingLevel === level.id ? "正在加入队列…" : gradeSubmission?.status === "judging" ? "Codex 评判中，请稍后回来查看" : gradeSubmission?.status === "pending" ? "更新队列中的答案" : gradeSubmission?.status === "completed" ? "修改答案后再次排队" : "提交到备用批改队列"}
                            </button>
                            {queueError && <p className="grading-error" role="alert">{queueError}</p>}
                            {gradingErrors[level.id] && <p className="grading-error" role="alert">{gradingErrors[level.id]}</p>}
                          </>}
                          {grade && <section className={`grade-card ${grade.passed ? "passed" : "needs-work"}`}>
                            <div><strong>{grade.score}</strong><span>分<br />{grade.passed ? "通过" : "继续完善"}</span></div>
                            <p>{grade.summary}</p>
                            <ul>{grade.criteria.map((item) => <li key={item.criterion}><b>{item.met ? "✓" : "×"} {item.criterion}</b><span>{item.evidence}</span></li>)}</ul>
                            {grade.improvements.length > 0 && <aside><b>下一步怎么改</b>{grade.improvements.map((item) => <p key={item}>{item}</p>)}</aside>}
                          </section>}
                          {grade?.passed && <button className="stage-continue" type="button" onClick={() => advanceStage(level.id, 4)}>批改已通过，进入“自动小测” →</button>}
                          <details className="help-panel">
                            <summary>仍然卡住？查看提示和参考答案</summary>
                            <div><b>提示</b><p>{support.hint}</p></div>
                            <div><b>参考答案</b><pre><code>{support.referenceAnswer}</code></pre></div>
                          </details>
                        </div></section>}
                        {stage === 5 && <section className="stage-panel"><div className="task final-check">
                          <section className={`quiz ${passedQuiz ? "passed" : ""}`}>
                            <span className="quiz-kicker">本关小测 · 自动判定</span>
                            <h4>{support.quiz.question}</h4>
                            <div className="quiz-options">
                              {support.quiz.options.map((option, optionIndex) => (
                                <label className={quizSelections[level.id] === optionIndex ? "selected" : ""} key={option}>
                                  <input
                                    type="radio"
                                    name={`quiz-${level.id}`}
                                    checked={quizSelections[level.id] === optionIndex}
                                    onChange={() => {
                                      setQuizSelections((current) => ({ ...current, [level.id]: optionIndex }));
                                      setQuizFeedback((current) => ({ ...current, [level.id]: "" }));
                                    }}
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                            <button className="check-button" type="button" onClick={() => checkQuiz(level.id)}>{passedQuiz ? "✓ 已答对，可以继续通关" : "检查答案"}</button>
                            {quizFeedback[level.id] && <p className={`quiz-feedback ${passedQuiz ? "correct" : "incorrect"}`} role="status">{quizFeedback[level.id]}</p>}
                          </section>
                          <button className="complete-button" disabled={!done && !passedQuiz} onClick={() => completeLevel(level.id)}>
                            {done ? "✓ 已通关，点击撤销" : passedQuiz ? (level.id === 10 ? "记录 Boss 战通关，正式出师" : "小测已通过，记录本关通关") : "先通过本关小测"}
                          </button>
                        </div></section>}
                      </div>
                    )}
                  </div>
                </article>
              </div>
            );
          })}
        </div>}
        {currentChapter && <nav className="chapter-pager" aria-label="章节导航">
          {currentChapter.id > 1 ? <a href={`/courses/python-framework/chapters/${currentChapter.id - 1}`}>← 上一章</a> : <span />}
          <a href="/courses/python-framework">四章总览</a>
          {currentChapter.id < pythonCourseChapters.length ? <a href={`/courses/python-framework/chapters/${currentChapter.id + 1}`}>下一章 →</a> : <span />}
        </nav>}
      </section>

      {activeKnowledge && (
        <div
          className="knowledge-overlay"
          role="button"
          tabIndex={0}
          aria-label="关闭基础知识弹窗"
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveKnowledge(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setActiveKnowledge(null);
          }}
        >
          <section
            className="knowledge-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="knowledge-title"
          >
            <button className="knowledge-close" type="button" aria-label="关闭基础知识弹窗" onClick={() => setActiveKnowledge(null)}>×</button>
            <span className="knowledge-kicker">基础知识 · 随点随查</span>
            <h2 id="knowledge-title">{activeKnowledge.term}</h2>
            <div className="knowledge-answer">
              <b>先用一句话理解</b>
              <p>{activeKnowledge.plain}</p>
            </div>
            <div className="knowledge-answer role-answer">
              <b>它在当前代码里做什么</b>
              <p>{activeKnowledge.role}</p>
            </div>
            {activeKnowledge.example && (
              <div className="knowledge-example">
                <b>最小例子</b>
                <pre><code>{activeKnowledge.example}</code></pre>
              </div>
            )}
            <button className="knowledge-return" type="button" onClick={() => setActiveKnowledge(null)}>我明白了，返回本关</button>
            <small>也可以点击弹窗外部或按 Esc 关闭</small>
          </section>
        </div>
      )}

      <footer>
        <p>PYTHON FRAMEWORK QUEST</p>
        <h2>{completed.length === levels.length ? "Python 已出师。回到首页，选择下一条修炼路线。" : "看懂只是第一步，能独立完成任务才算真正掌握。"}</h2>
        <span>学习进度和草稿保存在本浏览器；异步批改任务与结果保存在站点数据库。</span>
      </footer>
    </main>
  );
}
