import { agentFastTrackChapters, agentFastTrackLessons } from "./course-data";
import type { InteractiveCourseConfig } from "../../ai-developer-level5/AiDeveloperCourse";
import type { GradingRubric } from "../python-framework/grading-rubrics";

const vocabulary: [string, string][][] = [
  [["列表 list", "有顺序的一组数据，用整数位置取出其中一项。"], ["字典 dict", "用字段名读取值，例如工单的 id。"], ["集合 set", "用于去重和判断成员是否存在，不承诺业务顺序。"]],
  [["不可变字符串", "修改文本的方法通常返回新字符串，需要接住返回值。"], ["切片", "用起止位置取一段文本或列表，右侧位置不包含在结果内。"]],
  [["短路判断", "and 左侧为假时，不再执行右侧表达式。"], ["推导式", "把遍历、筛选和生成结果写在一个表达式里。"]],
  [["可变对象", "列表和字典可原地修改，多个变量可能指向同一个对象。"], ["is 与 ==", "is 判断是否同一个对象，== 比较值是否相等。"], ["None", "表示没有值，常用作可选参数的默认值。"]],
  [["关键字参数", "调用时通过参数名传值，减少位置引起的歧义。"], ["类型标注", "说明参数与返回值的预期类型，不自动执行运行时校验。"]],
  [["模块", "可被 import 导入的 Python 代码组织单元。"], ["异常边界", "在能处理问题的位置捕获具体异常，并保留失败原因。"]],
  [["self", "实例方法的第一个参数，接收当前对象。"], ["dataclass", "帮助定义以保存字段为主的类。"], ["依赖注入", "从外部传入服务，使测试可以换成可控实现。"]],
  [["虚拟环境", "为项目隔离 Python 解释器与安装的依赖。"], ["环境变量", "程序运行时从环境读取的配置，不应把密钥写入代码。"]],
  [["Path", "用对象表达和操作文件路径。"], ["JSON", "常见的数据交换文本格式，需要解析后才能作为字典使用。"]],
  [["超时", "请求等待的上限，避免外部服务让程序一直等待。"], ["协议与业务状态", "HTTP 状态反映通信处理结果，响应字段还可能表示业务失败。"]],
  [["Schema", "描述允许的字段、类型及约束的规则。"], ["ValidationError", "Pydantic 校验输入不符合规则时给出的异常。"]],
  [["TypedDict", "给字典字段声明类型，主要服务于阅读和静态检查。"], ["Annotated", "为类型附加可供框架读取的元数据。"], ["reducer", "决定新旧状态值怎样合并的函数。"]],
  [["coroutine", "调用 async 函数得到的协程对象，需要被驱动才执行。"], ["await", "在异步函数中等待可等待对象完成并取得结果。"], ["yield", "逐个产出值，并保留函数执行位置。"]],
  [["工具 tool", "给 Agent 使用的调用入口，带参数规则和用途说明。"], ["invoke", "按工具接口和参数规则发起一次调用。"]],
  [["节点 node", "读取状态、执行一个步骤并返回更新的函数。"], ["条件边", "根据状态判断下一步应该进入哪个节点。"]],
  [["provider / service", "分别封装外部数据来源和可独立测试的业务逻辑。"], ["工作流", "用明确的状态与分支组织工具调用及结果处理。"]],
];

// Each glossary entry owns its context and example; never reuse the whole lesson.
const knowledgeDetails: Record<string, { role: string; example: string }> = {
  "列表 list": {
    role: "tickets 保存多条工单；tickets[0] 先取第一条记录，之后才能读取它的字段。",
    example: 'tickets = [{"id": "T-101"}, {"id": "T-102"}]\nprint(tickets[0])  # {"id": "T-101"}',
  },
  "字典 dict": {
    role: "一条工单用字典保存 id、status 等字段；方括号中的字段名决定读取哪个值。",
    example: 'ticket = {"id": "T-101", "status": "open"}\nprint(ticket["id"])  # T-101',
  },
  "集合 set": {
    role: "all_tags 收集每条工单的标签并去重；同一个 api 标签只保留一次。",
    example: 'tags = ["api", "urgent", "api"]\nunique_tags = set(tags)\nprint(len(unique_tags))  # 2\nprint("api" in unique_tags)  # True',
  },
  "不可变字符串": {
    role: "raw.strip() 不会修改 raw；cleaned 接住它返回的新字符串，后续拆分才使用清理后的文本。",
    example: 'raw = "  T-101  "\ncleaned = raw.strip()\nprint(repr(raw))      # \'  T-101  \'\nprint(repr(cleaned))  # \'T-101\'',
  },
  "切片": {
    role: "可以用 ticket_id[2:] 取出 T-101 中的数字部分。本节主示例使用 split 拆分文本，没有直接用切片；这里单独演示起止位置和步长。",
    example: 'ticket_id = "T-101"\nprint(ticket_id[2:])   # 101：从下标 2 取到末尾\nprint(ticket_id[0:2])  # T-：不包含下标 2\nprint(ticket_id[2::2]) # 11：从下标 2 开始，每隔 2 个位置取一次',
  },
  "短路判断": {
    role: "先判断 ticket 不是 None，再读取 status；左边为假时不执行右边，避免对 None 取下标。",
    example: 'ticket = None\nis_open = ticket is not None and ticket["status"] == "open"\nprint(is_open)  # False，不会访问 ticket["status"]',
  },
  "推导式": {
    role: "把逐条读取工单、过滤优先级、生成结果列表放在一个表达式中；if 决定保留谁，前面的表达式决定输出什么。",
    example: 'tickets = [{"id": "T-1", "priority": 3}, {"id": "T-2", "priority": 1}]\nids = [t["id"] for t in tickets if t["priority"] >= 3]\nprint(ids)  # [\'T-1\']',
  },
  "可变对象": {
    role: "两个变量引用同一个工单列表时，通过其中一个追加记录，另一个也能看到变化；赋值不是复制。",
    example: 'tickets = ["T-1"]\nalias = tickets\nalias.append("T-2")\nprint(tickets)  # [\'T-1\', \'T-2\']',
  },
  "is 与 ==": {
    role: "比较两份工单数据是否相同时用 ==；排查是否共享同一个列表对象时用 is。",
    example: 'a = ["T-1"]\nb = ["T-1"]\nprint(a == b)  # True：内容相同\nprint(a is b)  # False：不是同一个列表',
  },
  "None": {
    role: "用 None 表示调用者没有提供列表，然后在函数内部创建新列表，避免多次调用共享可变默认值。",
    example: 'def add_id(ticket_id, ids=None):\n    if ids is None:\n        ids = []\n    ids.append(ticket_id)\n    return ids\n\nprint(add_id("T-1"))  # [\'T-1\']\nprint(add_id("T-2"))  # [\'T-2\']',
  },
  "关键字参数": {
    role: "调用查询函数时直接写参数名；星号后的参数必须按名称传入，避免把筛选开关的位置记反。",
    example: 'def query(ticket_id, *, only_open=True):\n    return ticket_id, only_open\n\nprint(query("T-101", only_open=False))  # (\'T-101\', False)',
  },
  "类型标注": {
    role: "参数旁的 str 和返回值旁的 bool 告诉读代码的人预期数据类型，不会自动拦截所有错误输入。",
    example: 'def is_open(status: str) -> bool:\n    return status == "open"\n\nprint(is_open("open"))  # True\nprint(is_open(123))     # False，标注没有自动抛类型错误',
  },
  "模块": {
    role: "把查询函数放进可导入的文件；使用 __name__ 守卫，让演示代码只在直接运行文件时执行。",
    example: '# 保存为 query.py；其他文件可用 from query import query_ticket\ndef query_ticket(ticket_id):\n    return {"id": ticket_id}\n\nif __name__ == "__main__":\n    print(query_ticket("T-101"))',
  },
  "异常边界": {
    role: "在能说明失败原因的位置捕获具体异常，再抛出带业务语义的异常；不要返回 None 掩盖解析失败。",
    example: 'def parse_priority(raw):\n    try:\n        return int(raw)\n    except ValueError as exc:\n        raise ValueError("优先级必须是整数") from exc\n\nprint(parse_priority("3"))  # 3',
  },
  "self": {
    role: "实例方法通过 self 读取当前对象保存的工单数据；不同实例可以保存不同的数据。",
    example: 'class Ticket:\n    def __init__(self, ticket_id):\n        self.ticket_id = ticket_id\n\n    def describe(self):\n        return self.ticket_id\n\nprint(Ticket("T-101").describe())  # T-101',
  },
  "dataclass": {
    role: "声明查询结果有哪些字段，并自动生成初始化方法，不必手写给每个属性赋值的 __init__。",
    example: 'from dataclasses import dataclass\n\n@dataclass\nclass QueryResult:\n    ticket_id: str\n    found: bool\n\nresult = QueryResult("T-101", True)\nprint(result.found)  # True',
  },
  "依赖注入": {
    role: "查询服务从外部接收 provider；测试时传入固定返回值的实现，不需要连接真实网络。",
    example: 'def query_ticket(ticket_id, provider):\n    return provider(ticket_id)\n\ndef fake_provider(ticket_id):\n    return {"id": ticket_id, "status": "open"}\n\nprint(query_ticket("T-101", fake_provider)["status"])  # open',
  },
  "虚拟环境": {
    role: "将当前项目的解释器和依赖与其他项目隔离；先确认运行脚本用的是项目环境，再排查缺包问题。",
    example: '# 终端创建环境：python3 -m venv .venv\n# macOS/Linux 激活：source .venv/bin/activate\n# Windows PowerShell 激活：.venv\\Scripts\\Activate.ps1\n# 在激活后的 Python 中检查：\nimport sys\nprint(sys.prefix != sys.base_prefix)  # 虚拟环境中为 True',
  },
  "环境变量": {
    role: "启动时读取外部配置；没有提供必需配置时明确报错，而不是把密钥写入源码或打印出来。",
    example: 'import os\n\nbase_url = os.getenv("TICKET_API_URL")\nif not base_url:\n    raise ValueError("请先设置 TICKET_API_URL")',
  },
  "Path": {
    role: "用 / 组合数据目录和文件名，避免手工拼接不同操作系统的路径分隔符。",
    example: 'from pathlib import Path\n\npath = Path("data") / "tickets.json"\nprint(path.name)    # tickets.json\nprint(path.suffix)  # .json',
  },
  "JSON": {
    role: "接口或文件中的 JSON 文本必须先解析成 Python 对象，之后才能用字段名读取工单编号。",
    example: 'import json\n\nraw = \'{"id": "T-101"}\'\nticket = json.loads(raw)\nprint(ticket["id"])  # T-101',
  },
  "超时": {
    role: "HTTP 查询不能无限等待；向客户端传递 timeout，超时后交给调用方处理。示例只定义函数，不发送请求。",
    example: 'def fetch_ticket(client, ticket_id):\n    return client.get(f"/tickets/{ticket_id}", timeout=5.0)',
  },
  "协议与业务状态": {
    role: "raise_for_status 检查 HTTP 层；即使返回 200，也要继续检查 success，才能决定能否使用 data。",
    example: 'def read_ticket(response):\n    response.raise_for_status()\n    body = response.json()\n    if body.get("success") is not True:\n        raise ValueError(body.get("msg", "查询失败"))\n    return body["data"]',
  },
  "Schema": {
    role: "用 Pydantic 字段约束定义查询参数的合法形状，例如 ticket_id 至少包含一个字符。",
    example: '# 需要安装 pydantic\nfrom pydantic import BaseModel, Field\n\nclass Query(BaseModel):\n    ticket_id: str = Field(min_length=1)\n\nprint(Query(ticket_id="T-101").ticket_id)  # T-101',
  },
  "ValidationError": {
    role: "创建参数模型时，输入不满足约束会抛出 ValidationError；可提取字段位置，提示调用者修正输入。",
    example: '# 需要安装 pydantic\nfrom pydantic import BaseModel, Field, ValidationError\n\nclass Query(BaseModel):\n    ticket_id: str = Field(min_length=1)\n\ntry:\n    Query(ticket_id="")\nexcept ValidationError as exc:\n    print(exc.errors()[0]["loc"])  # (\'ticket_id\',)',
  },
  "TypedDict": {
    role: "描述工作流状态字典有哪些键及其类型；运行时仍然是普通 dict，不会自动验证外部输入。",
    example: 'from typing import TypedDict\n\nclass State(TypedDict):\n    ticket_id: str\n    found: bool\n\nstate: State = {"ticket_id": "T-101", "found": True}\nprint(type(state).__name__)  # dict',
  },
  "Annotated": {
    role: "给状态字段附加合并函数等元数据；普通 Python 不会自动运行它，需要 LangGraph 等框架读取并使用。",
    example: 'import operator\nfrom typing import Annotated, get_args\n\nHistory = Annotated[list[str], operator.add]\nprint(get_args(History)[1] is operator.add)  # True',
  },
  "reducer": {
    role: "节点返回新状态时，reducer 决定历史记录是追加还是覆盖。operator.add 对列表的效果是拼接。",
    example: 'import operator\n\nold = ["开始查询"]\nupdate = ["查到工单"]\nprint(operator.add(old, update))  # [\'开始查询\', \'查到工单\']',
  },
  "coroutine": {
    role: "调用 async def 函数时先得到协程对象，而不是查询结果；交给 asyncio.run 才会驱动这个例子执行。",
    example: 'import asyncio\n\nasync def query():\n    return {"id": "T-101"}\n\npending = query()\nprint(asyncio.iscoroutine(pending))  # True\nprint(asyncio.run(pending)["id"])    # T-101',
  },
  "await": {
    role: "在异步函数中等待查询完成，并把结果交给 ticket；不能省略 await 后直接把协程当字典读取。",
    example: 'import asyncio\n\nasync def query():\n    return {"id": "T-101"}\n\nasync def main():\n    ticket = await query()\n    print(ticket["id"])  # T-101\n\nasyncio.run(main())',
  },
  "yield": {
    role: "需要逐步输出事件时，每次 yield 交出一个值；下次迭代从暂停位置继续，不是一次性返回整份列表。",
    example: 'def events():\n    yield "开始查询"\n    yield "查询完成"\n\nstream = events()\nprint(next(stream))  # 开始查询\nprint(next(stream))  # 查询完成',
  },
  "工具 tool": {
    role: "把普通查询函数包装成带名称、用途和参数规则的工具，供 Agent 发现和调用。",
    example: '# 需要安装 langchain-core\nfrom langchain_core.tools import tool\n\n@tool\ndef query_ticket(ticket_id: str) -> str:\n    """按工单编号查询工单。"""\n    return f"工单 {ticket_id}"\n\nprint(query_ticket.name)  # query_ticket',
  },
  "invoke": {
    role: "工具包装后按工具接口调用：把参数放进字典交给 invoke，不依赖大模型也能验证工具的输出。",
    example: '# 需要安装 langchain-core\nfrom langchain_core.tools import tool\n\n@tool\ndef query_ticket(ticket_id: str) -> str:\n    """按工单编号查询工单。"""\n    return f"工单 {ticket_id}"\n\nprint(query_ticket.invoke({"ticket_id": "T-101"}))  # 工单 T-101',
  },
  "节点 node": {
    role: "节点接收当前状态，只返回它要更新的字段；注册名字并不等于决定执行顺序。",
    example: 'def format_answer(state):\n    return {"answer": f"工单 {state[\'ticket_id\']}"}\n\nprint(format_answer({"ticket_id": "T-101"}))  # {\'answer\': \'工单 T-101\'}',
  },
  "条件边": {
    role: "路由函数根据查询结果选择回答或转人工的分支；还需要在图中把返回标签映射到目标节点。",
    example: 'def route(state):\n    return "answer" if state["found"] else "handoff"\n\nprint(route({"found": True}))   # answer\nprint(route({"found": False}))  # handoff',
  },
  "provider / service": {
    role: "provider 负责取原始工单，service 负责判定工单是否可用；两层分开后可以独立替换数据来源和测试规则。",
    example: 'def provider(ticket_id):\n    return {"id": ticket_id, "status": "open"}\n\ndef service(ticket_id, fetch):\n    ticket = fetch(ticket_id)\n    return ticket["status"] == "open"\n\nprint(service("T-101", provider))  # True',
  },
  "工作流": {
    role: "把查询、判断、回答或转人工串成有明确分支的过程。这个普通 Python 小例子演示顺序与分支，本节再用图表达它。",
    example: 'def workflow(ticket_id, fetch):\n    ticket = fetch(ticket_id)\n    if ticket is None:\n        return "转人工"\n    return f"查询完成：{ticket[\'id\']}"\n\nprint(workflow("T-101", lambda _: None))  # 转人工',
  },
};

const walkthroughs: string[][] = [
  ["tickets 保存工单字典列表；[0] 先取第一条，再用字段名读取。", "open_ids 逐条检查 status，只保留 open 工单的 id。", "all_tags 遍历每条工单里的 tags，集合自动去掉重复标签。"],
  ["先读取原始工单编号，观察其中的空格和大小写。", "strip 等字符串方法返回新值，赋值之后变量才指向清理结果。", "split 用第一个冒号拆出编号和摘要；maxsplit=1 保留摘要内后续冒号。延伸：可选字段应给默认值，切片不包含右端位置；本示例未演示这两项。"],
  ["tickets 提供两条工单，优先级分别为 3 和 1。延伸：若记录可能为 None，需要先判空；本示例的记录均为字典。", "for 遍历记录，if 只保留 priority >= 3 的工单。延伸：and 左侧为假时不执行右侧；本推导式未使用 and。", "推导式里的输出表达式决定结果形状，过滤条件决定保留哪些记录。"],
  ["original 保存嵌套字典，最内层 tags 是可变列表。若仅用 isolated = original，两者会共享对象。", "deepcopy 连同内层 tags 一起复制，避免浅复制只复制外层、内层仍共享的问题。", "只给副本的 tags 追加 urgent，不会改变原对象。", "原对象仍输出 ['api']。", "副本输出 ['api', 'urgent']。", "is 比较对象身份，两个独立对象输出 False。延伸：函数默认参数在定义时创建；用 None 占位、调用时再创建列表，可避免共享默认列表；此例未定义函数。"],
  ["def 后的参数接收调用者输入，冒号后的类型标注说明预期类型。", "星号后面的参数必须按名称传入，调用位置不再决定其含义。", "return 把结果交还调用者；打印结果不能替代返回结果。"],
  ["定义专门表示工单不存在的异常类型，继承 LookupError。延伸：import 也可能执行模块顶层语句。", "遍历后仍未找到就抛出专用异常。延伸：正式模块应把脚本入口与函数分开，避免导入即查询。", "在 try 中调用可能失败的操作；except 只捕获能处理的具体异常。"],
  ["dataclass 定义查询结果的字段，减少重复的初始化代码。", "实例方法通过 self 访问保存于对象上的依赖。", "从构造参数传入 provider，测试时可以用固定数据代替网络。"],
  ["os 用于读取环境变量。运行前应创建并激活项目环境，确保安装依赖与运行使用同一解释器。", "从环境读取配置，启动时检查必需项是否存在。", "依赖清单记录可复现的安装信息；密钥不进入源码或日志。"],
  ["Path 表达文件位置，打开文件时明确编码。", "with 管理文件关闭；json.load 从文件对象解析，loads 从字符串解析。", "解析后先检查数据形状，再当作列表或字典参与业务处理。"],
  ["请求入口接收可替换的 client，使单元测试不依赖真实网络。", "raise_for_status 先检查 HTTP 错误。超时应在传入的 client 上配置；此片段没有创建 client。", "继续核对业务状态和响应字段，再返回业务结果；失败原因不能吞掉。"],
  ["模型类中的字段声明定义类型与约束。", "构造模型实例时将外部值送入验证，非法数据抛出 ValidationError。", "model_dump 将通过校验的模型转成字典。本片段尚未调用查询逻辑；实际查询应使用校验后的参数。"],
  ["TypedDict 描述状态字典允许有哪些字段。", "Annotated 将合并规则附在字段类型旁，普通 Python 不会自动执行该规则。", "节点只返回新增的日志。框架读取 reducer 后可追加合并；本片段没有构建或运行图，普通函数调用不会自动合并。"],
  ["async def 定义协程函数，调用它只得到可等待对象。", "await 驱动并等待结果；在结果产生前不能把协程当成字典。", "asyncio.run 驱动 main，输出按传入顺序排列的编号列表。延伸：yield 用于逐次提供输出，本例未使用。"],
  ["TICKETS 是本地模拟数据；正式项目可把查询业务提取为普通函数，由工具层委托调用。", "装饰器可能把原函数名绑定到工具对象。", "用 invoke 传入符合 Schema 的字典，再核对工具结果和异常分支。"],
  ["状态类型定义节点间传递的数据，节点返回需要更新的部分。", "load_ticket 返回 ticket 字段更新，REPOSITORY 需要调用方提供；此处尚未注册节点。注册节点只命名，不决定顺序。", "route 根据查询结果选择 answer 或 escalate。完整图还需连接 START、边与 END 并编译运行，本片段只定义节点与路由。"],
  ["TICKETS 模拟数据源。完整项目应拆分 provider 取数据和 service 业务规则，并分别测试。", "state 保存输入、查询结果和回答。这里用普通函数演示；完整项目再由 tool 暴露能力、node 更新状态。", "无结果时转人工，有结果时拼出状态回答。此处尚未使用图；完整流程测试还需覆盖成功、无结果和失败路径。"],
];

// The correct answer comes from the existing diagnostic; distractors target that lesson's misconception.
const distractors = [
  ["打印 T-101，列表可以直接用字段名取值。", "打印 None，访问不到时会自动返回空值。"],
  ["打印 [T-101]，strip 会原地修改字符串。", "字符串不能调用 strip，因此必然报错。"],
  ["一定抛出 TypeError，因为 and 两边总是同时执行。", "会打印 open，None 会自动转换成字典。"],
  ["两次分别输出 ['T-1'] 和 ['T-2']。", "第二次调用会报错，因为默认参数只能使用一次。"],
  ["两次都合法，星号不会影响调用方式。", "两次都不合法，布尔值不能作为函数参数。"],
  ["这样能清晰区分网络错误和查无数据。", "返回 None 会保留完整的异常调用链。"],
  ["Python 会自动补充缺失的 self 参数声明。", "实例方法只能接收字符串，不允许接收对象。"],
  ["get 会在环境变量缺失时自动抛 KeyError。", "系统会为缺失的 TOKEN 自动生成有效密钥。"],
  ["返回字典，因为 load 和 loads 可随意互换。", "自动把字符串当作文件路径打开。"],
  ["HTTP 200 已经能证明全部业务字段正确。", "设置超时之后就不需要校验响应数据。"],
  ["只在定义类时验证，构造实例时不验证。", "类型标注会自动忽略所有不满足约束的字段。"],
  ["每次更新都覆盖旧列表，Annotated 没有合并用途。", "在任何普通 Python 代码中都会自动调用 operator.add。"],
  ["直接得到工单字典，因为调用 async 函数会自动等待。", "打印 None，因为协程函数永远没有返回值。"],
  ["装饰器不会改变对象，可以完全忽略工具接口。", "工具对象只能由大模型调用，不能直接验证。"],
  ["会，注册节点的先后顺序就是执行顺序。", "会，节点按名称字母顺序自动执行。"],
  ["全部放进一个节点会让每层职责更容易独立测试。", "放进节点后网络错误会被框架自动修复。"],
];

export const agentCourseConfig: InteractiveCourseConfig = {
  chapters: agentFastTrackChapters, baseHref: "/courses/python-agent-fast-track",
  id: "python-agent-fast-track", title: "Python → Agent", brand: "Python → Agent", sigil: "λ",
  eyebrow: "PYTHON TO AGENT QUEST", mapTitle: "十六节学习地图",
  nextHref: "/courses/ai-testing", nextTitle: "进入 AI 测试课程",
  resources: [
    { title: "Python 文档", href: "https://docs.python.org/3/" },
    { title: "Pydantic 文档", href: "https://docs.pydantic.dev/latest/" },
    { title: "LangChain Tools", href: "https://docs.langchain.com/oss/python/langchain/tools" },
    { title: "LangGraph 文档", href: "https://docs.langchain.com/oss/python/langgraph/overview" },
  ],
  stages: agentFastTrackLessons.map((lesson) => ({
    id: `lesson-${lesson.id}`, chapter: lesson.chapter, title: lesson.title, goal: lesson.objective,
    prerequisite: lesson.id === 1 ? "从列表、字典和集合开始；已有经验可以选择需要复习的关卡。" : `建议先完成：${agentFastTrackLessons[lesson.id - 2].title}。`,
    explanation: lesson.explanation.join("\n\n"), mapping: `${agentFastTrackChapters[lesson.chapter - 1].title} · ${lesson.duration} · ${lesson.priority}`,
    topics: [
      ...lesson.pitfalls.map((value): [string, string] => ["易错提醒", value]),
      ...(lesson.javaBridge ? [["Java 经验可以这样借", lesson.javaBridge.useful], ["不要这样类比", lesson.javaBridge.trap]] as [string, string][] : []),
      ...(lesson.lookupOnly ?? []).map((value): [string, string] => ["遇到时查阅即可", value]),
    ],
    task: lesson.objective, checks: lesson.pass, evidence: `${lesson.files.join("、")} 中的实现，以及本节验收标准对应的运行记录。`,
  })),
  exercises: agentFastTrackLessons.map((lesson, index) => {
    const correct = index % 3;
    const options = [...distractors[index]];
    options.splice(correct, 0, lesson.diagnostic.answer);
    return {
      terms: vocabulary[index],
      knowledge: vocabulary[index].map(([term, plain]) => ({ term, plain, ...knowledgeDetails[term] })),
      input: lesson.example, example: lesson.example, walkthrough: walkthroughs[index],
      task: `工单查询助手 · ${lesson.objective} 完成本节项目骨架中的 TODO，并逐条验证以下标准。`,
      starter: lesson.starter, files: lesson.files, acceptance: lesson.pass,
      reference: `${lesson.referenceAnswer}\n\n# 参考解释\n${lesson.referenceExplanation.split("\n").map((line) => `# ${line}`).join("\n")}`,
      quizCode: lesson.diagnostic.code,
      quiz: { question: lesson.diagnostic.prompt, options, correct, explanation: lesson.diagnostic.why },
    };
  }),
};

export function getAgentGradingRubric(levelId: number): GradingRubric | null {
  const lesson = agentFastTrackLessons[levelId - 1];
  if (!Number.isInteger(levelId) || !lesson) return null;
  return { levelId, title: lesson.title, task: `${lesson.objective}\n项目骨架：\n${lesson.starter}`, taskContract: lesson.pass, acceptance: lesson.pass, referenceAnswer: lesson.referenceAnswer,
    authoritativeNotes: [lesson.referenceExplanation, "仅按 Python → Agent 本节任务批改，不套用其他课程的同编号题目。", "参考答案可能只包含需要补充的函数，应结合项目骨架判断完整行为。代码审阅不代表真实运行已经通过。"] };
}
