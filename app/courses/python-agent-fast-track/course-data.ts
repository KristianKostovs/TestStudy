export type AgentFastTrackLesson = {
  id: number;
  chapter: number;
  title: string;
  duration: string;
  objective: string;
  priority: "入门前必须会" | "遇到时查阅即可";
  lookupOnly?: string[];
  explanation: string[];
  javaBridge?: { useful: string; trap: string };
  example: string;
  diagnostic: { prompt: string; code: string; answer: string; why: string };
  pitfalls: string[];
  files: string[];
  starter: string;
  referenceAnswer: string;
  referenceExplanation: string;
  pass: string[];
};

export type AgentFastTrackChapter = {
  id: number;
  title: string;
  subtitle: string;
  lessonIds: number[];
};

export const agentFastTrackChapters: AgentFastTrackChapter[] = [
  { id: 1, title: "第一段 · 读懂 Python 数据流", subtitle: "不重学通用编程概念，直接掌握框架示例里高频出现的数据操作。", lessonIds: [1, 2, 3, 4] },
  { id: 2, title: "第二段 · 函数与代码组织", subtitle: "把散落语句整理成可导入、可测试、可复用的工具。", lessonIds: [5, 6, 7] },
  { id: 3, title: "第三段 · 基础工程能力", subtitle: "能在真实项目里管理依赖、配置、文件和 HTTP 边界。", lessonIds: [8, 9, 10] },
  { id: 4, title: "第四段 · Agent 高频写法", subtitle: "只学进入 LangChain / LangGraph 前真正会挡路的类型与异步写法。", lessonIds: [11, 12, 13] },
  { id: 5, title: "第五段 · 工单助手衔接实践", subtitle: "同一个查询能力依次变成普通函数、LangChain 工具和 LangGraph 工作流。", lessonIds: [14, 15, 16] },
];

export const agentFastTrackLessons: AgentFastTrackLesson[] = [
  {
    id: 1,
    chapter: 1,
    title: "列表、字典与集合：先看懂工单数据",
    duration: "80–100 分钟",
    objective: "能从 list[dict] 中读取、修改和去重工单字段，并能判断该用列表、字典还是集合。",
    priority: "入门前必须会",
    explanation: [
      "列表保存有顺序的一组工单；字典用键读取一个工单的字段；集合只关心成员是否存在和去重。Agent 框架的消息、工具参数与状态几乎都在这三种结构上流动。",
      "先盯住形状：tickets 是列表，tickets[0] 是字典，tickets[0][\"status\"] 才是字符串。很多 KeyError、TypeError 都来自把层级想错。",
    ],
    javaBridge: {
      useful: "可以暂时类比 List<Map<String, Object>>、Map 和 Set。",
      trap: "Python 容器不会像 Java 泛型那样在运行时替你守住元素类型；类型标注主要帮助阅读和静态检查。",
    },
    example: String.raw`tickets = [
    {"id": "T-101", "status": "open", "tags": ["api", "urgent"]},
    {"id": "T-102", "status": "closed", "tags": ["ui"]},
]

first_id = tickets[0]["id"]
open_ids = [ticket["id"] for ticket in tickets if ticket["status"] == "open"]
all_tags = {tag for ticket in tickets for tag in ticket["tags"]}

print(first_id)
print(open_ids)
print(all_tags == {"api", "urgent", "ui"})`,
    diagnostic: {
      prompt: "下面代码会输出什么，还是会报错？先说出 data 每一层的类型。",
      code: String.raw`data = {"tickets": [{"id": "T-101"}]}
print(data["tickets"]["id"])`,
      answer: "会抛 TypeError：list indices must be integers or slices, not str。",
      why: "data[\"tickets\"] 是列表，必须先用 [0] 取出字典，再用 [\"id\"]：data[\"tickets\"][0][\"id\"]。",
    },
    pitfalls: ["dict[key] 缺键会抛 KeyError；不确定时先用 get", "set 无稳定业务顺序，不能依赖它的展示顺序", "不要一边遍历列表一边删除其中元素"],
    files: ["data/tickets.json", "ticket_assistant/query.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能解释 list、dict、set 在本项目中的职责
# 是否通过以实现行为和本节验收标准为准。
TICKETS = [
    {"id": "T-101", "status": "open", "assignee": "alice", "tags": ["api", "urgent"]},
    {"id": "T-102", "status": "closed", "assignee": "bob", "tags": ["ui"]},
    {"id": "T-103", "status": "open", "assignee": "alice", "tags": ["api"]},
]

# TODO（你来完成）：返回 alice 名下所有 open 工单的 id
def open_ticket_ids_for_alice(tickets):
    ...

# TODO（你来完成）：返回所有不重复的标签集合
def unique_tags(tickets):
    ...

assert open_ticket_ids_for_alice(TICKETS) == ["T-101", "T-103"]
assert unique_tags(TICKETS) == {"api", "urgent", "ui"}`,
    referenceAnswer: String.raw`def open_ticket_ids_for_alice(tickets):
    return [
        ticket["id"]
        for ticket in tickets
        if ticket["assignee"] == "alice" and ticket["status"] == "open"
    ]

def unique_tags(tickets):
    return {tag for ticket in tickets for tag in ticket["tags"]}`,
    referenceExplanation: "第一段推导式先遍历工单再过滤；第二段是双层遍历，把每个 tags 列表中的字符串放进集合去重。",
    pass: ["正确遍历工单并读取 id","用列表收集 open 工单编号、用集合去重标签","两个 assert 均通过"],
  },
  {
    id: 2,
    chapter: 1,
    title: "字符串、切片与安全读取",
    duration: "70–90 分钟",
    objective: "能清洗用户输入、拆解工单编号，并用切片和字符串方法写出可读的数据转换。",
    priority: "入门前必须会",
    explanation: [
      "字符串是不可变对象；strip、lower、replace 等操作都会返回新字符串。切片 text[start:stop:step] 的 stop 不包含在结果里。",
      "框架代码经常用 f-string 拼提示词、日志和错误信息。只有字符串里需要替换变量时才加 f；普通固定文本不需要。",
    ],
    javaBridge: { useful: "和 Java String 一样不可变，调用方法后要接住返回值。", trap: "Python 切片越界通常不会报错；不要把这种宽容误当成输入已经合法。" },
    example: String.raw`raw = "  t-101: Login FAILED  "
cleaned = raw.strip()
ticket_id, summary = cleaned.split(":", maxsplit=1)

print(ticket_id.upper())
print(summary.strip().lower())
print(f"查询工单：{ticket_id.upper()}")`,
    diagnostic: {
      prompt: "最终打印什么？为什么 strip 没有改变原字符串？",
      code: String.raw`ticket_id = "  T-101  "
ticket_id.strip()
print(f"[{ticket_id}]")`,
      answer: "打印 [  T-101  ]，两侧空格仍然存在。",
      why: "str 不可变，strip() 返回新值。应写 ticket_id = ticket_id.strip()。",
    },
    pitfalls: ["split 可能得到比预期更多或更少的段", "切片 stop 不包含在结果里", "f-string 中表达式会立即求值，日志里不要放敏感信息"],
    files: ["ticket_assistant/normalize.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能解释 [start:stop] 为什么不含 stop
# 能判断何时需要 f-string
# 是否通过以实现行为和本节验收标准为准。
def normalize_ticket_query(raw: str) -> dict[str, str]:
    """把 '  t-101 : Login FAILED  ' 变成标准查询结构。"""
    # TODO（你来完成）：去空格，只按第一个冒号拆分
    # TODO（你来完成）：id 转大写，关键词转小写
    ...

assert normalize_ticket_query("  t-101 : Login FAILED  ") == {
    "ticket_id": "T-101",
    "keyword": "login failed",
}`,
    referenceAnswer: String.raw`def normalize_ticket_query(raw: str) -> dict[str, str]:
    ticket_id, keyword = raw.strip().split(":", maxsplit=1)
    return {
        "ticket_id": ticket_id.strip().upper(),
        "keyword": keyword.strip().lower(),
    }`,
    referenceExplanation: "maxsplit=1 保证摘要里的冒号不会继续拆分；每一步都接住字符串方法返回的新值。",
    pass: ["正确清理编号和摘要的空白与大小写","标准输入与摘要含冒号的输入都能处理"],
  },
  {
    id: 3,
    chapter: 1,
    title: "条件、循环与推导式",
    duration: "90–110 分钟",
    objective: "能把筛选、映射和短路条件写成清晰循环，并知道何时不该硬塞进推导式。",
    priority: "入门前必须会",
    explanation: [
      "if/elif/else 决定分支，for 直接遍历可迭代对象。Python 用缩进表示代码块，没有 Java 的花括号。and 与 or 会短路，所以可先检查 None 再访问字段。",
      "推导式适合一眼能读懂的映射或筛选；出现多层业务分支、日志或异常处理时，普通循环更容易维护。",
    ],
    javaBridge: { useful: "for ticket in tickets 类似增强 for；推导式可类比简单 Stream map/filter。", trap: "Python 的 and/or 返回参与运算的对象，不保证总是 bool；缩进变化会直接改变控制流。" },
    example: String.raw`tickets = [{"id": "T-1", "priority": 3}, {"id": "T-2", "priority": 1}]

labels = [
    f"{ticket['id']}:high"
    for ticket in tickets
    if ticket["priority"] >= 3
]
print(labels)`,
    diagnostic: {
      prompt: "为什么这段代码在 ticket 为 None 时不会报错？调换条件顺序后呢？",
      code: String.raw`ticket = None
if ticket is not None and ticket["status"] == "open":
    print("open")`,
      answer: "不会打印也不会报错；第一个条件为 False 后，and 右侧不会执行。",
      why: "若写成 ticket[\"status\"] == \"open\" and ticket is not None，会先对 None 取下标并抛 TypeError。",
    },
    pitfalls: ["混用 Tab 与空格会造成缩进问题", "不要把带副作用的复杂逻辑塞进推导式", "遍历 dict 默认得到键，需要 items() 才同时得到键和值"],
    files: ["ticket_assistant/filtering.py"],
    starter: String.raw`def summarize_open_tickets(tickets: list[dict]) -> list[str]:
    # 学习提示：先判断 None 再访问字段；可用短路条件，也可分步判断。
    # 只需完成代码，短路求值的文字解释或注释不是通过条件。
    summaries = []
    # TODO（你来完成）：忽略 None 和非 open 工单
    # TODO（你来完成）：输出形如 'T-101 | P3 | login failed'
    return summaries

DATA = [
    None,
    {"id": "T-101", "status": "open", "priority": 3, "summary": "Login failed"},
    {"id": "T-102", "status": "closed", "priority": 1, "summary": "Done"},
]
assert summarize_open_tickets(DATA) == ["T-101 | P3 | login failed"]`,
    referenceAnswer: String.raw`def summarize_open_tickets(tickets: list[dict]) -> list[str]:
    summaries = []
    for ticket in tickets:
        if ticket is None or ticket["status"] != "open":
            continue
        summaries.append(
            f"{ticket['id']} | P{ticket['priority']} | {ticket['summary'].lower()}"
        )
    return summaries`,
    referenceExplanation: "先用 continue 排除无效数据，主路径无需继续嵌套。这里普通循环比复杂推导式更清楚。本节按代码行为验收：不要求额外文字或注释解释短路求值，不得仅因缺少解释而扣分或判定不通过。安全的短路条件或分步判空均可；先访问 None 的字段仍属于错误。",
    pass: ["能手写 if/for/continue", "安全跳过 None 和非 open 工单", "按工单顺序返回 '编号 | P优先级 | 小写摘要' 字符串列表", "任务代码不依赖固定列表下标"],
  },
  {
    id: 4,
    chapter: 1,
    title: "可变对象、复制、is、== 与 None",
    duration: "90–110 分钟",
    objective: "能识别共享引用污染、可变默认参数和身份比较错误，这是后续 Agent 状态最常见的隐患。",
    priority: "入门前必须会",
    explanation: [
      "变量保存的是对象引用。两个变量指向同一个 list/dict 时，一处修改会从另一处看到。浅拷贝只复制最外层；嵌套对象仍可能共享。",
      "== 比较值，is 比较是否为同一对象。判断 None 使用 is None；比较字符串、数字、字典内容使用 ==。函数默认参数只在定义时求值一次，所以默认 [] 或 {} 会跨调用共享。",
    ],
    javaBridge: { useful: "可以类比 Java 引用与对象别名。", trap: "不要因小整数或短字符串偶尔满足 is，就把 is 当作 Java 的 ==；Python 的值比较是 ==。" },
    example: String.raw`from copy import deepcopy

original = {"ticket": {"tags": ["api"]}}
isolated = deepcopy(original)
isolated["ticket"]["tags"].append("urgent")

print(original["ticket"]["tags"])
print(isolated["ticket"]["tags"])
print(original is isolated)`,
    diagnostic: {
      prompt: "第二次调用为什么包含第一次的 T-1？",
      code: String.raw`def collect(ticket_id, bucket=[]):
    bucket.append(ticket_id)
    return bucket

print(collect("T-1"))
print(collect("T-2"))`,
      answer: "输出 ['T-1']，然后 ['T-1', 'T-2']。",
      why: "默认列表只创建一次。改为 bucket=None，并在函数内用 if bucket is None: bucket = []。",
    },
    pitfalls: ["可变默认参数会跨调用污染", "dict.copy() 对嵌套对象只是浅拷贝", "使用 is None，不使用 == None；其他值通常使用 =="],
    files: ["ticket_assistant/state.py", "tests/test_state.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能解释浅拷贝与深拷贝差异
# 是否通过以实现行为和本节验收标准为准。
from copy import deepcopy

def add_history(state: dict, event: str, history=None) -> dict:
    # TODO（你来完成）：每次调用都得到独立 history
    # TODO（你来完成）：不得修改传入的嵌套 state
    ...

original = {"ticket": {"id": "T-101"}}
first = add_history(original, "queried")
second = add_history(original, "escalated")

assert original == {"ticket": {"id": "T-101"}}
assert first["history"] == ["queried"]
assert second["history"] == ["escalated"]`,
    referenceAnswer: String.raw`def add_history(state: dict, event: str, history=None) -> dict:
    if history is None:
        history = []
    result = deepcopy(state)
    history.append(event)
    result["history"] = history
    return result`,
    referenceExplanation: "None 是安全的不可变哨兵；deepcopy 隔离 state 的嵌套结构。若 history 由调用者传入，函数会按约定修改该列表，可进一步改成 history.copy() 取得完全隔离。",
    pass: ["使用 None 默认值，省略 history 时每次调用创建独立列表","复制嵌套 state，修改返回结果不会污染原始 state","追加当前事件并正确返回 history，使用 is 判断 None、使用 == 比较值"],
  },
  {
    id: 5,
    chapter: 2,
    title: "函数参数、返回值与类型标注",
    duration: "100–120 分钟",
    objective: "能阅读并设计带位置参数、关键字参数、默认值和类型标注的稳定函数签名。",
    priority: "入门前必须会",
    explanation: [
      "调用 query(ticket_id, include_history=True) 时，include_history=True 是按名字传入的关键字参数。* 之后的参数只能按名字传，能避免多个 bool 或数字因位置混淆。",
      "类型标注描述输入输出契约，但 Python 默认不会在运行时自动校验。函数没有显式 return 时返回 None；不要把打印结果误当作返回结果。",
    ],
    javaBridge: { useful: "类型标注可帮助 IDE 和静态检查器，类似方法签名提供阅读契约。", trap: "它不像 Java 编译器的强制类型检查；运行时校验要靠 Pydantic 或显式代码。Python 也不靠同名重载区分参数列表。" },
    example: String.raw`def find_ticket(
    tickets: list[dict],
    ticket_id: str,
    *,
    include_history: bool = False,
) -> dict | None:
    for ticket in tickets:
        if ticket["id"] == ticket_id:
            return ticket if include_history else {k: v for k, v in ticket.items() if k != "history"}
    return None`,
    diagnostic: {
      prompt: "哪一次调用合法？为什么第三个参数前的 * 很重要？",
      code: String.raw`find_ticket(DATA, "T-101", True)
find_ticket(DATA, "T-101", include_history=True)`,
      answer: "第二次合法；第一次会抛 TypeError。",
      why: "* 把 include_history 声明为 keyword-only，调用者必须写出参数名，减少含义不明的位置实参。",
    },
    pitfalls: ["print 只是副作用，不等于 return", "默认参数应放在必填参数之后", "**kwargs 很灵活，但会隐藏真实契约，框架边界不要滥用"],
    files: ["ticket_assistant/query.py", "tests/test_query.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能解释形参与实参、位置参数与关键字参数
# 是否通过以实现行为和本节验收标准为准。
from typing import Any

def query_tickets(
    tickets: list[dict[str, Any]],
    *,
    status: str | None = None,
    assignee: str | None = None,
    limit: int = 20,
) -> list[dict[str, Any]]:
    # TODO（你来完成）：按可选条件过滤，并最多返回 limit 条
    ...

assert [item["id"] for item in query_tickets(DATA, status="open", assignee="alice", limit=1)] == ["T-101"]`,
    referenceAnswer: String.raw`def query_tickets(tickets, *, status=None, assignee=None, limit=20):
    matched = []
    for ticket in tickets:
        if status is not None and ticket["status"] != status:
            continue
        if assignee is not None and ticket["assignee"] != assignee:
            continue
        matched.append(ticket)
        if len(matched) >= limit:
            break
    return matched`,
    referenceExplanation: "None 表示不启用对应过滤条件；keyword-only 参数使调用意图清晰；达到 limit 后提前结束遍历。",
    pass: ["按声明支持位置参数与关键字参数","能写出 dict | None 返回标注","测试覆盖无条件、单条件、组合条件和 limit"],
  },
  {
    id: 6,
    chapter: 2,
    title: "模块、导入与异常边界",
    duration: "90–110 分钟",
    objective: "能把项目拆成模块，理解导入路径，并在真正能处理错误的层级捕获异常。",
    priority: "入门前必须会",
    explanation: [
      "一个 .py 文件就是模块；目录通常作为包组织相关模块。import 会执行模块顶层代码并缓存结果，所以不要在导入时发真实 HTTP 请求或读取不可用资源。",
      "try 只包住预期可能失败的最小范围；except 捕获具体异常；else 在无异常时执行；finally 无论成功失败都执行，适合关闭资源而不是吞掉主错误。",
    ],
    javaBridge: { useful: "包和模块可粗略类比 Java package 与 class 文件组织。", trap: "Python import 会运行模块顶层语句，不是只声明符号；循环导入也更容易暴露架构问题。" },
    example: String.raw`class TicketNotFoundError(LookupError):
    pass

def require_ticket(tickets, ticket_id):
    for ticket in tickets:
        if ticket["id"] == ticket_id:
            return ticket
    raise TicketNotFoundError(f"工单不存在：{ticket_id}")

try:
    ticket = require_ticket([], "T-404")
except TicketNotFoundError as error:
    print(error)`,
    diagnostic: {
      prompt: "为什么 except Exception: return None 会让 Agent 更难诊断？",
      code: String.raw`def load_ticket():
    try:
        return repository.query()
    except Exception:
        return None`,
      answer: "它把网络失败、数据格式错误、编程错误和确实无数据全部伪装成 None。",
      why: "应捕获可恢复的具体异常，并保留 cause 或重新抛出带上下文的领域异常。",
    },
    pitfalls: ["不要用裸 except 吞掉所有问题", "不要在模块顶层执行网络或数据库动作", "捕获后若无法恢复，应 raise 保留失败"],
    files: ["ticket_assistant/errors.py", "ticket_assistant/repository.py", "tests/test_repository.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能从项目根目录解释一次绝对导入
# 能说明 import 顶层副作用的风险
# 是否通过以实现行为和本节验收标准为准。
class TicketDataError(RuntimeError):
    pass

def load_ticket(repository, ticket_id: str) -> dict:
    # TODO（你来完成）：把 repository 的 TimeoutError 转成 TicketDataError
    # 错误信息必须包含 ticket_id，并用 raise ... from error 保留原始原因
    ...

class TimeoutRepository:
    def get(self, ticket_id):
        raise TimeoutError("upstream timeout")

try:
    load_ticket(TimeoutRepository(), "T-101")
except TicketDataError as error:
    assert "T-101" in str(error)
    assert isinstance(error.__cause__, TimeoutError)`,
    referenceAnswer: String.raw`def load_ticket(repository, ticket_id: str) -> dict:
    try:
        return repository.get(ticket_id)
    except TimeoutError as error:
        raise TicketDataError(f"读取工单失败：{ticket_id}") from error`,
    referenceExplanation: "领域层看到稳定的 TicketDataError，同时 __cause__ 保留底层 TimeoutError，日志和 trace 仍可追溯根因。",
    pass: ["异常测试同时验证领域信息与原始 cause"],
  },
  {
    id: 7,
    chapter: 2,
    title: "基础类、dataclass 与依赖注入",
    duration: "80–100 分钟",
    objective: "能读懂框架中的 class、self、构造函数和方法，并用组合而非复杂继承组织一个服务。",
    priority: "入门前必须会",
    explanation: [
      "class 定义对象的状态和行为；__init__ 创建实例状态；实例方法第一个参数 self 指向当前对象。dataclass 适合以数据为主的结构，会生成初始化和比较等样板代码。",
      "本节继续使用“工单查询助手”：TicketService 负责“怎样查询并返回一张工单”，但它还需要另一个对象替它读取原始数据。我们把这个专门读取数据的对象叫 repository；它只要提供 get(ticket_id) 方法即可。真实项目里的 repository 可以查 JSON、数据库或接口。",
      "测试时不想连接真实数据源，所以准备 FakeRepository：它也有 get(ticket_id) 方法，但只返回代码中写好的固定数据。执行 TicketService(FakeRepository()) 时，会先创建 FakeRepository，再把它作为 repository 参数传进 TicketService.__init__，最后保存到 self.repository。",
      "因此 TicketService.get() 只调用 self.repository.get(ticket_id)，不需要知道接入的是真实数据源还是测试替身。这种“由外部把依赖对象传进来，而不是在 TicketService 内部写死创建它”的方式，就是这里所说的最小依赖注入。",
    ],
    javaBridge: { useful: "self 类似显式写出的 this；构造注入与 Java 常见做法一致。", trap: "Python 没有 private 强制边界；下划线更多是约定。也不要为了复用两行代码就建深继承树。" },
    example: String.raw`from dataclasses import dataclass

@dataclass
class Ticket:
    id: str
    status: str

class TicketService:
    def __init__(self, repository):
        self.repository = repository

    def get(self, ticket_id: str) -> Ticket:
        data = self.repository.get(ticket_id)
        return Ticket(**data)`,
    diagnostic: {
      prompt: "下面方法为什么调用时会报错？",
      code: String.raw`class TicketService:
    def get(ticket_id):
        return ticket_id

TicketService().get("T-101")`,
      answer: "实例方法缺少 self，会收到两个位置实参而只声明了一个。",
      why: "obj.get(x) 会把 obj 自动作为第一个实参传入，应声明 def get(self, ticket_id)。",
    },
    pitfalls: ["实例方法不要漏写 self", "dataclass 的 list/dict 默认值仍要用 field(default_factory=...)", "优先组合小对象，不急着设计继承体系"],
    files: ["ticket_assistant/models.py", "ticket_assistant/service.py", "tests/test_service.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能解释 self、__init__ 和实例属性
# 是否通过以实现行为和本节验收标准为准。
from dataclasses import dataclass, field

@dataclass
class Ticket:
    id: str
    status: str
    tags: list[str] = field(default_factory=list)

class TicketService:
    def __init__(self, repository):
        self.repository = repository

    # TODO（你来完成）：读取字典并构造 Ticket；不存在时抛 LookupError
    def get(self, ticket_id: str) -> Ticket:
        ...

class FakeRepository:
    def get(self, ticket_id):
        return {"id": ticket_id, "status": "open", "tags": ["api"]} if ticket_id == "T-101" else None

assert TicketService(FakeRepository()).get("T-101").tags == ["api"]`,
    referenceAnswer: String.raw`class TicketService:
    def __init__(self, repository):
        self.repository = repository

    def get(self, ticket_id: str) -> Ticket:
        data = self.repository.get(ticket_id)
        if data is None:
            raise LookupError(f"工单不存在：{ticket_id}")
        return Ticket(**data)`,
    referenceExplanation: "Service 依赖抽象行为 get，而不是在内部固定创建真实 repository；FakeRepository 因而可以直接替换。",
    pass: ["通过构造参数保存并使用 repository 依赖","两个 Ticket 实例不会共享 tags","成功和不存在分支都有测试"],
  },
  {
    id: 8,
    chapter: 3,
    title: "虚拟环境、依赖与环境变量",
    duration: "80–100 分钟",
    objective: "能从零创建隔离环境、安装固定依赖，并让密钥和地址通过环境变量进入程序。",
    priority: "入门前必须会",
    explanation: [
      "虚拟环境隔离项目依赖；requirements.txt 或 pyproject.toml 记录可复现依赖。先激活环境，再确认 python 和 pip 指向同一环境。",
      "环境变量承载部署时变化的配置。代码读取变量但不把密钥写进源码、测试数据或日志；.env 只用于本地，并应被 .gitignore 排除。",
    ],
    javaBridge: { useful: "可类比每个项目拥有独立 classpath 与外部化配置。", trap: "激活 venv 只是修改当前 shell 的 PATH，不会永久改变系统 Python，也不等于依赖已经被记录。" },
    example: String.raw`import os

def load_settings() -> dict[str, str]:
    return {
        "api_url": os.environ.get("TICKET_API_URL", "http://127.0.0.1:8000"),
        "api_key": os.environ["TICKET_API_KEY"],
    }

# 仅用于本地最小示例；真实密钥不写入源码
os.environ["TICKET_API_KEY"] = "demo-only"
print(load_settings()["api_url"])
print(load_settings()["api_key"])`,
    diagnostic: {
      prompt: "为什么 os.environ['TICKET_API_KEY'] 有时比 get 更合适？",
      code: String.raw`api_key = os.environ.get("TICKET_API_KEY")
client = Client(headers={"Authorization": f"Bearer {api_key}"})`,
      answer: "缺少变量时 get 返回 None，程序可能带着 Bearer None 继续运行。",
      why: "密钥是必需配置时使用 os.environ[...] 可立即抛 KeyError，启动阶段就暴露问题；可选配置才适合 get(default)。",
    },
    pitfalls: ["不要把 .env 和真实密钥提交到 Git", "优先 python -m pip，避免 pip 指向另一个解释器", "只写依赖名不锁版本会降低复现性"],
    files: ["requirements.txt", ".env.example", ".gitignore", "ticket_assistant/settings.py", "verify_setup.py"],
    starter: String.raw`# 你不需要已有项目。下面每个 ===== 标题代表项目中的一个文件。
# 课程已经提供目录、依赖版本和验证脚本；站内只补最后两个 TODO。

# ===== requirements.txt（课程已在全新 Python 3.9 环境验证） =====
httpx==0.28.1
pydantic==2.11.7
python-dotenv==1.1.1

# ===== .env.example（只放键名和示例，不放真实密钥） =====
TICKET_API_URL=http://127.0.0.1:8000
TICKET_API_KEY=replace-me

# ===== .gitignore（课程已提供，不需要修改） =====
.venv/
.env
__pycache__/
*.pyc

# ===== ticket_assistant/settings.py =====
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path.cwd() / ".env")

# TODO（你来完成）：URL 可选且有本地默认值；API_KEY 必填
TICKET_API_URL = ...
TICKET_API_KEY = ...`,
    referenceAnswer: String.raw`# ===== requirements.txt =====
httpx==0.28.1
pydantic==2.11.7
python-dotenv==1.1.1

# ===== .env.example =====
TICKET_API_URL=http://127.0.0.1:8000
TICKET_API_KEY=replace-me

# ===== .gitignore =====
.venv/
.env
__pycache__/
*.pyc

# ===== ticket_assistant/settings.py =====
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path.cwd() / ".env")

TICKET_API_URL = os.environ.get("TICKET_API_URL", "http://127.0.0.1:8000")
TICKET_API_KEY = os.environ["TICKET_API_KEY"]`,
    referenceExplanation: "这三个版本已由课程在全新 Python 3.9 虚拟环境中安装验证。站内批改只检查项目文件内容；下载骨架后运行 verify_setup.py，才能取得真实环境的执行证明。URL 有安全本地默认值，密钥缺失则立即失败。",
    pass: ["requirements.txt 保留课程已验证的三个固定版本", ".gitignore 排除 .env、.venv、__pycache__ 和 *.pyc", "settings.py 让 URL 有本地默认值，并让缺少 API_KEY 时立即抛 KeyError"],
  },
  {
    id: 9,
    chapter: 3,
    title: "文件、Path 与 JSON 读写",
    duration: "90–110 分钟",
    objective: "能安全读取本地工单 JSON、验证顶层结构，并用 with 管理文件资源。",
    priority: "入门前必须会",
    explanation: [
      "pathlib.Path 比手拼路径更清楚，JSON 负责 Python dict/list 与文本之间的转换。json.load 读取文件对象，json.loads 读取字符串；dump/dumps 则写出。",
      "with 会在离开代码块时自动关闭文件，即使解析失败也一样。编码明确写 utf-8，避免在不同电脑上出现隐式差异。",
    ],
    javaBridge: { useful: "with 类似 Java try-with-resources。", trap: "JSON 的 null 进入 Python 后是 None，true/false 进入后是 True/False；不是 Java 拼写。" },
    example: String.raw`import json
from pathlib import Path

def load_tickets(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError("工单 JSON 顶层必须是列表")
    return data`,
    diagnostic: {
      prompt: "json.loads 和 json.load 的入参有什么区别？",
      code: String.raw`text = '[{"id": "T-101"}]'
data = json.load(text)`,
      answer: "会报错，因为 json.load 需要带 read() 的文件对象。",
      why: "已有 JSON 字符串应使用 json.loads(text)；打开的文件对象才传给 json.load(file)。",
    },
    pitfalls: ["明确 encoding='utf-8'", "不要假设 JSON 顶层一定是 dict", "写文件前考虑临时文件与原子替换，避免中途失败留下半份数据"],
    files: ["data/tickets.json", "ticket_assistant/storage.py", "tests/test_storage.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能区分 load/loads 和 dump/dumps
# 是否通过以实现行为和本节验收标准为准。
import json
from pathlib import Path

def load_open_tickets(path: Path) -> list[dict]:
    # TODO（你来完成）：with + utf-8 读取 JSON
    # TODO（你来完成）：顶层不是 list 时抛 ValueError
    # TODO（你来完成）：只返回 status == 'open' 的工单
    ...

# tests/test_storage.py 会提供临时 JSON 文件，不依赖你的真实磁盘数据`,
    referenceAnswer: String.raw`def load_open_tickets(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError("工单 JSON 顶层必须是列表")
    return [ticket for ticket in data if ticket.get("status") == "open"]`,
    referenceExplanation: "先完成解析和结构门禁，再执行业务过滤；get 让缺少 status 的不完整记录自然不进入 open 结果。",
    pass: ["从文件对象正确解析 JSON","能用临时文件测试成功、坏 JSON、错顶层结构","代码不依赖当前工作目录的偶然位置"],
  },
  {
    id: 10,
    chapter: 3,
    title: "HTTP 调用、超时与可测试边界",
    duration: "110–130 分钟",
    objective: "能用 httpx 调用工单接口，区分 HTTP 错误与业务错误，并通过注入 client 做离线测试。",
    priority: "入门前必须会",
    explanation: [
      "HTTP 客户端负责连接、超时和协议状态；业务代码负责解释 JSON 中的 success、data、code。response.raise_for_status() 只检查 4xx/5xx，不会替你识别 HTTP 200 的业务失败。",
      "把 client 作为参数传入，测试就能使用 MockTransport。with httpx.Client(...) 会在退出时关闭连接池；不要在模块导入时创建并访问真实网络。",
    ],
    javaBridge: { useful: "可类比注入 HttpClient 并把传输错误映射为领域异常。", trap: "HTTP 200 只说明协议层成功，不等于业务 success=true；不要只断言状态码。" },
    example: String.raw`import httpx

def fetch_ticket(client: httpx.Client, ticket_id: str) -> dict:
    response = client.get(f"/tickets/{ticket_id}")
    response.raise_for_status()
    payload = response.json()
    if not payload.get("success"):
        raise LookupError(payload.get("message", "查询失败"))
    return payload["data"]`,
    diagnostic: {
      prompt: "这段代码漏掉了哪类失败？",
      code: String.raw`response = client.get("/tickets/T-101")
assert response.status_code == 200
return response.json()["data"]`,
      answer: "漏掉 HTTP 200 但业务 success=false，以及 data 缺失或结构错误。",
      why: "协议成功和业务成功必须分层判断；后续可用 Pydantic 做结构校验。",
    },
    pitfalls: ["每个真实请求都应有明确 timeout", "不要把测试指向真实生产服务", "记录错误时对令牌、Cookie 和个人数据脱敏"],
    files: ["ticket_assistant/http_repository.py", "tests/test_http_repository.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能说明 MockTransport 如何匹配 handler
# 是否通过以实现行为和本节验收标准为准。
import httpx

def fetch_ticket(client: httpx.Client, ticket_id: str) -> dict:
    # TODO（你来完成）：GET /tickets/{ticket_id}
    # TODO（你来完成）：先检查 HTTP，再检查 success，最后返回 data
    ...

def handler(request: httpx.Request) -> httpx.Response:
    # TODO（你来完成）：T-101 返回成功；其他 id 返回 HTTP 200 业务失败
    ...

transport = httpx.MockTransport(handler)
with httpx.Client(base_url="https://example.test", transport=transport, timeout=2.0) as client:
    assert fetch_ticket(client, "T-101")["status"] == "open"`,
    referenceAnswer: String.raw`def fetch_ticket(client: httpx.Client, ticket_id: str) -> dict:
    response = client.get(f"/tickets/{ticket_id}")
    response.raise_for_status()
    payload = response.json()
    if payload.get("success") is not True:
        raise LookupError(payload.get("message", "查询失败"))
    return payload["data"]

def handler(request: httpx.Request) -> httpx.Response:
    ticket_id = request.url.path.rsplit("/", 1)[-1]
    if ticket_id == "T-101":
        return httpx.Response(200, json={"success": True, "data": {"id": ticket_id, "status": "open"}})
    return httpx.Response(200, json={"success": False, "code": "NOT_FOUND", "message": "工单不存在"})`,
    referenceExplanation: "MockTransport 会把客户端请求交给 handler，无需真实网络；handler 根据明确路径返回固定响应，测试覆盖协议和业务两层。",
    pass: ["成功、HTTP 500、HTTP 200 业务失败三条测试通过","请求有 timeout 且 client 会关闭","通过 MockTransport 将请求交给测试 handler，不访问真实网络"],
  },
  {
    id: 11,
    chapter: 4,
    title: "Pydantic：把外部数据变成可信对象",
    duration: "90–110 分钟",
    objective: "能用 BaseModel 描述工具输入和接口响应，并读懂 ValidationError。",
    priority: "入门前必须会",
    explanation: [
      "BaseModel 读取输入字段、按标注检查或转换类型，并产出结构稳定的对象。Field 定义字段级约束；model_validator 适合字段之间的关系校验。",
      "Pydantic 是 Agent 工具 Schema 的常见基础。它不替代业务测试：模型能验证结构，却不知道某个工单是否真的属于当前用户。",
    ],
    javaBridge: { useful: "可类比 DTO + Bean Validation + 解析器的组合。", trap: "Pydantic 默认可能执行类型转换，不等同于 Java 编译期类型安全；严格度要按边界显式决定。" },
    example: String.raw`from typing import Literal
from pydantic import BaseModel, Field

class TicketQuery(BaseModel):
    ticket_id: str = Field(pattern=r"^T-\d+$")
    include_history: bool = False
    limit: int = Field(default=20, ge=1, le=100)

query = TicketQuery(ticket_id="T-101", limit=10)
print(query.model_dump())`,
    diagnostic: {
      prompt: "哪一个输入会失败？错误发生在类定义时还是创建对象时？",
      code: String.raw`TicketQuery(ticket_id="101", limit=0)`,
      answer: "ticket_id 不匹配 T-数字，limit 小于 1；创建 TicketQuery 实例时抛 ValidationError。",
      why: "类定义建立 Schema，真正拿到数据构造模型时才执行验证。",
    },
    pitfalls: ["BaseModel 验证结构，不证明业务事实正确", "field(default_factory=...) 用于每个实例独立的可变默认值", "模型版本升级时留意 v1/v2 API 差异"],
    files: ["ticket_assistant/schemas.py", "tests/test_schemas.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能区分字段校验与跨字段校验
# 是否通过以实现行为和本节验收标准为准。
from typing import Literal
from pydantic import BaseModel, Field, model_validator

class TicketQuery(BaseModel):
    ticket_id: str | None = Field(default=None, pattern=r"^T-\d+$")
    assignee: str | None = None
    limit: int = Field(default=20, ge=1, le=100)

    @model_validator(mode="after")
    def has_filter(self):
        # TODO（你来完成）：ticket_id 和 assignee 至少提供一个
        ...

# TODO（你来完成）：成功对象 + 缺少过滤条件 + 非法 limit 三个测试`,
    referenceAnswer: String.raw`@model_validator(mode="after")
def has_filter(self):
    if self.ticket_id is None and self.assignee is None:
        raise ValueError("ticket_id 和 assignee 至少提供一个")
    return self`,
    referenceExplanation: "字段类型和 Field 先完成单字段检查，after validator 再读取已验证对象，补充跨字段关系。",
    pass: ["实现题目约定的字段约束和跨字段约束","会用 pytest.raises 验证 ValidationError","能把 model_dump() 结果交给普通查询函数"],
  },
  {
    id: 12,
    chapter: 4,
    title: "TypedDict、Annotated 与装饰器",
    duration: "90–110 分钟",
    objective: "能读懂 LangGraph 状态 Schema、reducer 标注和 LangChain @tool，不要求展开其底层元编程。",
    priority: "入门前必须会",
    lookupOnly: ["自己实现通用装饰器", "Annotated 的底层运行时反射", "复杂 reducer 的并发代数性质"],
    explanation: [
      "TypedDict 描述字典有哪些键，主要服务 IDE 和静态检查，运行时仍是普通 dict。Annotated[T, metadata] 在类型 T 旁附加框架可读取的元数据；LangGraph 常用它声明状态合并 reducer。",
      "装饰器接收函数并返回增强后的对象。入门阶段只需会使用 @tool、知道函数名、类型标注和 docstring 会影响工具 Schema；自己实现通用装饰器属于遇到时查阅。",
    ],
    javaBridge: { useful: "TypedDict 可粗略类比只用于静态工具的结构接口，装饰器的使用感接近注解。", trap: "Python 装饰器不是纯元数据，它会在定义阶段执行并替换绑定对象；TypedDict 也不会自动做运行时校验。" },
    example: String.raw`import operator
from typing import Annotated
from typing_extensions import TypedDict

class TicketState(TypedDict):
    ticket_id: str
    logs: Annotated[list[str], operator.add]

def load_node(state: TicketState) -> dict:
    return {"logs": [f"loaded:{state['ticket_id']}"]}`,
    diagnostic: {
      prompt: "node 返回新的 logs 时，是覆盖旧列表还是追加？由谁决定？",
      code: String.raw`logs: Annotated[list[str], operator.add]`,
      answer: "在 LangGraph 状态更新中会用 operator.add 合并，即列表追加。",
      why: "list[str] 是值类型，operator.add 是 Annotated 附带的 reducer 元数据。离开框架后它不会自动运行。",
    },
    pitfalls: ["TypedDict 不会在运行时拒绝错字段", "reducer 必须符合并发合并语义", "@tool 的 docstring 是给模型看的契约，不要写空泛描述"],
    files: ["ticket_assistant/state.py", "ticket_assistant/tools.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能说明 TypedDict 与 BaseModel 的运行时差异
# 能读懂 Annotated reducer
# 是否通过以实现行为和本节验收标准为准。
import operator
from typing import Annotated
from typing_extensions import TypedDict
from langchain.tools import tool

class TicketState(TypedDict):
    ticket_id: str
    ticket: dict | None
    logs: Annotated[list[str], operator.add]

@tool
def query_ticket(ticket_id: str) -> dict:
    """TODO（你来完成）：告诉模型何时使用、参数含义和返回内容。"""
    # TODO（你来完成）：调用已有 repository，而不是复制查询逻辑
    ...`,
    referenceAnswer: String.raw`@tool
def query_ticket(ticket_id: str) -> dict:
    """按精确工单编号查询状态、负责人和摘要。

    Args:
        ticket_id: 形如 T-101 的工单编号。
    """
    return repository.get(ticket_id)`,
    referenceExplanation: "装饰器把普通函数包装成工具对象；类型标注生成输入结构，名称和 docstring 帮模型决定何时以及如何调用。",
    pass: ["按骨架声明状态字段与日志 reducer","工具调用已有 repository 查询，不复制查询逻辑","工具描述明确到另一个人可仅凭 Schema 正确调用"],
  },
  {
    id: 13,
    chapter: 4,
    title: "async/await 与 yield：必须会到什么程度",
    duration: "110–130 分钟",
    objective: "能正确调用异步函数、并发独立 I/O，并读懂 generator/fixture 中的 yield 生命周期。",
    priority: "入门前必须会",
    lookupOnly: ["生成器 send/throw/close 协议", "手写 event loop", "async generator 与底层 coroutine 状态机"],
    explanation: [
      "async def 调用后先得到 coroutine，必须 await 才真正取得结果。独立 I/O 可用 asyncio.gather 并发等待；CPU 密集循环不会因为 async 自动变快。",
      "yield 暂停函数并产出值。普通 generator 可逐个流式产生结果；pytest fixture 中 yield 前是 setup、后是 teardown。会使用即可，生成器协议底层细节遇到时再查。",
    ],
    javaBridge: { useful: "await 可类比等待 CompletionStage，但 Python 事件循环通常在同一线程协作调度。", trap: "调用 async 函数不会立刻运行完整函数；忘记 await 得到的是 coroutine。也不要在 async 中用 time.sleep 阻塞事件循环。" },
    example: String.raw`import asyncio

async def fetch(ticket_id: str) -> str:
    await asyncio.sleep(0.01)
    return ticket_id

async def main():
    results = await asyncio.gather(fetch("T-101"), fetch("T-102"))
    print(results)

asyncio.run(main())`,
    diagnostic: {
      prompt: "ticket 的真实类型是什么？为什么 print 不会得到字典？",
      code: String.raw`async def fetch_ticket():
    return {"id": "T-101"}

ticket = fetch_ticket()
print(ticket["id"])`,
      answer: "ticket 是 coroutine，取下标会报 TypeError，并可能出现 coroutine was never awaited 警告。",
      why: "必须在 async 函数中 ticket = await fetch_ticket()，或由 asyncio.run 驱动最外层 coroutine。",
    },
    pitfalls: ["忘记 await", "在 async 代码中调用 time.sleep 或同步慢 I/O", "gather 中一个任务失败时要明确是否取消、保留或汇总其他结果"],
    files: ["ticket_assistant/async_query.py", "tests/test_async_query.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能解释并发 I/O 与并行 CPU 的区别
# 能读懂 fixture 中 yield 前后的 setup/teardown
# 是否通过以实现行为和本节验收标准为准。
import asyncio

async def fetch_ticket(client, ticket_id: str) -> dict:
    response = await client.get(f"/tickets/{ticket_id}")
    response.raise_for_status()
    return response.json()["data"]

async def fetch_many(client, ticket_ids: list[str]) -> list[dict]:
    # TODO（你来完成）：并发调用 fetch_ticket，并保持输入顺序
    ...

def ticket_ids(tickets):
    # TODO（你来完成）：使用 yield 逐个产生 id，不先创建完整列表
    ...`,
    referenceAnswer: String.raw`async def fetch_many(client, ticket_ids: list[str]) -> list[dict]:
    coroutines = [fetch_ticket(client, ticket_id) for ticket_id in ticket_ids]
    return await asyncio.gather(*coroutines)

def ticket_ids(tickets):
    for ticket in tickets:
        yield ticket["id"]`,
    referenceExplanation: "gather 接收多个 coroutine 并按传入顺序返回结果；包含 yield 的函数成为 generator，每次迭代才继续执行到下一个 yield。",
    pass: ["正确 await 异步结果","并发查询并保持输入顺序","用 yield 逐个产生工单 id，不预先创建完整结果列表"],
  },
  {
    id: 14,
    chapter: 5,
    title: "从普通函数到 LangChain 工具",
    duration: "110–130 分钟",
    objective: "能把已经测试过的工单查询函数包装成 LangChain 工具，并离线验证工具 Schema 与执行结果。",
    priority: "入门前必须会",
    explanation: [
      "工具不是另一套业务实现，而是普通 Python 能力加上一份供模型读取的名称、参数 Schema 和描述。先让普通函数可预测、可测试，再用 @tool 包装。",
      "模型绑定工具后可能提出 tool call；Agent 运行时负责执行循环。初学先直接 tool.invoke 验证工具本身，再接模型，能把工具 bug 与模型选择问题分开。",
    ],
    javaBridge: { useful: "可类比把稳定 service 方法注册为带 Schema 的可调用插件。", trap: "模型看到的是工具描述和参数，不会读取你脑中的隐含规则；糟糕 docstring 会直接影响选择与入参。" },
    example: String.raw`from langchain.tools import tool

TICKETS = {"T-101": {"id": "T-101", "status": "open"}}

@tool
def get_ticket(ticket_id: str) -> dict:
    """按形如 T-101 的编号查询单个工单。"""
    return TICKETS[ticket_id]

print(get_ticket.name)
print(get_ticket.args_schema.model_json_schema())
print(get_ticket.invoke({"ticket_id": "T-101"}))`,
    diagnostic: {
      prompt: "为什么 @tool 后测试 get_ticket('T-101') 不是推荐调用方式？",
      code: String.raw`result = get_ticket("T-101")`,
      answer: "装饰后绑定的是工具对象，应通过 invoke 并按 Schema 传参。",
      why: "使用 get_ticket.invoke({\"ticket_id\": \"T-101\"}) 更接近 Agent 实际执行路径；底层普通业务函数应另保留直接单元测试。",
    },
    pitfalls: ["不要在工具函数里复制一份业务逻辑", "工具名称、类型和 docstring 都是模型上下文的一部分", "真实写操作工具要有权限、幂等和确认边界"],
    files: ["ticket_assistant/query.py", "ticket_assistant/tools.py", "tests/test_tools.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能打印并解释输入 JSON Schema
# 是否通过以实现行为和本节验收标准为准。
from langchain.tools import tool

def find_ticket(tickets: list[dict], ticket_id: str) -> dict:
    # 已有并通过单元测试的普通 Python 函数
    for ticket in tickets:
        if ticket["id"] == ticket_id:
            return ticket
    raise LookupError(f"工单不存在：{ticket_id}")

@tool
def query_ticket(ticket_id: str) -> dict:
    """TODO（你来完成）：写给模型看的明确工具说明。"""
    # TODO（你来完成）：复用 find_ticket
    ...

# TODO（你来完成）：不用真实模型，断言 name、输入 Schema 和 invoke 结果`,
    referenceAnswer: String.raw`@tool
def query_ticket(ticket_id: str) -> dict:
    """按精确编号查询单个工单的状态、负责人、优先级和摘要。

    Args:
        ticket_id: 形如 T-101 的工单编号。
    """
    return find_ticket(TICKETS, ticket_id)

assert query_ticket.name == "query_ticket"
schema = query_ticket.args_schema.model_json_schema()
assert "ticket_id" in schema["properties"]
assert query_ticket.invoke({"ticket_id": "T-101"})["status"] == "open"`,
    referenceExplanation: "业务函数和框架适配层分开：前者不依赖 LangChain，后者只负责描述与委托，测试也能精确定位失败层。",
    pass: ["普通函数测试与工具测试都通过","工具输入 JSON Schema 与参数定义一致","在不接真实模型时完成一次 invoke"],
  },
  {
    id: 15,
    chapter: 5,
    title: "LangGraph 状态、节点与条件分支",
    duration: "140–170 分钟",
    objective: "能用 TypedDict 定义状态，把纯函数注册成节点，并用条件边控制查询成功与人工升级分支。",
    priority: "入门前必须会",
    explanation: [
      "LangGraph 的 StateGraph 先声明状态 Schema，再注册节点和边。节点读取当前 state，返回局部更新；图编译后用 invoke 执行。START 是入口，END 是终点。",
      "条件边函数只负责根据状态返回路由标签。把外部 I/O 放在节点中，把路由保持为纯判断，测试会简单很多。",
    ],
    javaBridge: { useful: "可类比一个显式状态机：状态对象流过多个处理器，边决定下一处理器。", trap: "节点通常返回状态更新而不是原地修改整个共享对象；不要假设源码书写顺序就是执行顺序。" },
    example: String.raw`from typing import Literal
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    ticket_id: str
    ticket: dict | None

def load_ticket(state: State) -> dict:
    return {"ticket": REPOSITORY.get(state["ticket_id"])}

def route(state: State) -> Literal["answer", "escalate"]:
    return "answer" if state["ticket"] is not None else "escalate"`,
    diagnostic: {
      prompt: "add_node 的先后顺序会自动决定执行先后吗？",
      code: String.raw`builder.add_node("answer", answer)
builder.add_node("load", load_ticket)`,
      answer: "不会。执行顺序由 add_edge 和 add_conditional_edges 建立的图结构决定。",
      why: "必须显式连接 START → load，并从 load 条件路由到 answer 或 escalate，再连接 END。",
    },
    pitfalls: ["注册节点不等于连接节点", "条件函数返回值必须和映射/目标节点匹配", "多个节点更新同一字段时要明确 reducer 或覆盖规则"],
    files: ["ticket_assistant/graph.py", "tests/test_graph.py"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能画出 START 到 END 的两条路径
# 能说明 state Schema、节点返回更新和条件边各自职责
# 是否通过以实现行为和本节验收标准为准。
from typing import Literal
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END

class TicketState(TypedDict):
    ticket_id: str
    ticket: dict | None
    answer: str

def load_ticket(state: TicketState) -> dict:
    return {"ticket": REPOSITORY.get(state["ticket_id"])}

def route_after_load(state: TicketState) -> Literal["answer", "escalate"]:
    # TODO（你来完成）：有 ticket 去 answer，否则 escalate
    ...

def answer(state: TicketState) -> dict:
    # TODO（你来完成）：使用 ticket 生成确定性答复
    ...

def escalate(state: TicketState) -> dict:
    return {"answer": "未找到工单，已转人工处理"}

builder = StateGraph(TicketState)
# TODO（你来完成）：注册三个节点，连接 START、条件边和 END
graph = builder.compile()`,
    referenceAnswer: String.raw`def route_after_load(state: TicketState) -> Literal["answer", "escalate"]:
    return "answer" if state["ticket"] is not None else "escalate"

def answer(state: TicketState) -> dict:
    ticket = state["ticket"]
    return {"answer": f"{ticket['id']} 当前状态：{ticket['status']}"}

builder = StateGraph(TicketState)
builder.add_node("load", load_ticket)
builder.add_node("answer", answer)
builder.add_node("escalate", escalate)
builder.add_edge(START, "load")
builder.add_conditional_edges("load", route_after_load)
builder.add_edge("answer", END)
builder.add_edge("escalate", END)
graph = builder.compile()`,
    referenceExplanation: "load 节点只做读取，route_after_load 只做判断，answer/escalate 各自产出最终答案。两条分支都显式结束。",
    pass: ["T-101 走 answer，T-404 走 escalate","两条分支均能从 START 到 END","节点返回约定的状态更新，条件边根据查询结果正确选择分支"],
  },
  {
    id: 16,
    chapter: 5,
    title: "毕业任务：可测试的工单查询 Agent",
    duration: "160–190 分钟",
    objective: "独立组合本地 JSON、查询服务、HTTP 边界、LangChain 工具和 LangGraph 分支，并用离线测试证明关键行为。",
    priority: "入门前必须会",
    explanation: [
      "最终结构保持分层：storage 只读数据，service 实现查询规则，tool 暴露 Schema，graph 编排状态与分支，tests 用 fake/mock 验证。模型只是一个可替换节点，不应吞掉确定性规则。",
      "先完成无模型的确定性图，再接模型工具调用。这样即使密钥、模型或网络不可用，你仍能证明数据处理、工具契约和分支逻辑正确。",
    ],
    javaBridge: { useful: "这与分层服务 + adapter + workflow 的工程思想一致，你已有测试开发经验可以直接迁移。", trap: "不要把所有逻辑写进一个 Agent prompt；可测试的确定性代码仍应留在普通 Python 层。" },
    example: String.raw`TICKETS = {"T-101": {"id": "T-101", "status": "open"}}

def run_ticket_flow(ticket_id: str) -> dict:
    state = {"ticket_id": ticket_id, "ticket": TICKETS.get(ticket_id), "answer": ""}
    if state["ticket"] is None:
        state["answer"] = "未找到工单，已转人工处理"
    else:
        state["answer"] = f"{ticket_id} 当前状态：{state['ticket']['status']}"
    return state

result = run_ticket_flow("T-101")
assert "open" in result["answer"]
print(result["answer"])`,
    diagnostic: {
      prompt: "为什么把 json.load、HTTP 请求、模型调用和格式化答案全部写进一个 graph 节点是坏边界？",
      code: String.raw`def everything_node(state):
    # 读文件 → 请求 API → 调模型 → 拼答案 → 捕获所有异常
    ...`,
      answer: "失败无法定位、单元测试必须同时替换多种外部依赖、工具无法复用，且异常很容易被吞掉。",
      why: "应拆成可独立验证的 provider/service/tool/node；图只负责有意义的状态转换与路由。",
    },
    pitfalls: ["不要把真实密钥或工单隐私写入样例和 trace", "异常分支必须保留原始错误并给用户安全答复", "完成标准是实现正确并通过测试，概念解释用于辅助理解"],
    files: ["data/tickets.json", "ticket_assistant/storage.py", "ticket_assistant/service.py", "ticket_assistant/tools.py", "ticket_assistant/graph.py", "tests/"],
    starter: String.raw`# 学习提示（可选理解，不要求在答案中复述）：
# 能逐层解释一次查询从输入到最终 answer 的数据形状
# 能主动说明一个失败的层级、证据和修复位置
# 是否通过以实现行为和本节验收标准为准。
ticket-agent/
├── data/tickets.json
├── ticket_assistant/
│   ├── schemas.py       # 已给：Pydantic 输入模型
│   ├── storage.py       # TODO（你来完成）：安全读取 JSON
│   ├── service.py       # TODO（你来完成）：查询与领域异常
│   ├── tools.py         # TODO（你来完成）：@tool 薄适配
│   └── graph.py         # TODO（你来完成）：状态、节点、条件边
└── tests/
    ├── test_service.py  # TODO：成功/不存在/缺字段
    ├── test_tools.py    # TODO：Schema + invoke
    └── test_graph.py    # TODO：answer/escalate 两条路径

# 固定验收命令
# python -m pytest -q
# python -m ticket_assistant.demo T-101

# 可选加分（不作为入门阻塞项）：
# 接入你选择的模型，使用 create_agent(model=..., tools=[query_ticket])
# 保存一次 tool call 的脱敏 trace`,
    referenceAnswer: String.raw`核心结构参考：

1. storage.load_tickets(path) -> list[dict]
2. TicketService(repository).get(ticket_id) -> Ticket；不存在抛 TicketNotFoundError
3. query_ticket 工具只调用 service.get 并返回 model_dump()
4. graph: START -> load -> (answer | escalate) -> END
5. 测试使用临时 JSON、FakeRepository 或 MockTransport，不访问真实网络

关键断言：
- 两次查询不会共享可变状态
- 非法工具参数触发 ValidationError
- T-101 返回 open 分支
- T-404 返回人工升级分支
- HTTP 500 与业务失败不会被伪装成“未找到”`,
    referenceExplanation: "毕业任务没有唯一文件排版，但依赖方向、外部边界、状态流和验收证据必须清楚。先让普通 Python 通过，再接 LangChain，最后接 LangGraph。",
    pass: ["完成 TODO 并让全部离线测试通过","查询从输入到最终 answer 的数据传递正确","失败路径保留错误证据并返回约定结果"],
  },
];

export function lessonById(id: number) {
  return agentFastTrackLessons.find((lesson) => lesson.id === id);
}

export const totalAgentFastTrackMinutes = 1760;
