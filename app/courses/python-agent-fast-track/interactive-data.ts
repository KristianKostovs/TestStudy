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

const walkthroughs: string[][] = [
  ["tickets 保存工单字典列表；[0] 先取第一条，再用字段名读取。", "open_ids 逐条检查 status，只保留 open 工单的 id。", "all_tags 遍历每条工单里的 tags，集合自动去掉重复标签。"],
  ["先读取原始工单编号，观察其中的空格和大小写。", "strip 等字符串方法返回新值，赋值之后变量才指向清理结果。", "读取可选字段时给出明确默认值；切片不会包含右端位置。"],
  ["按条件逐条筛选数据，先判断对象是否存在。", "and 从左向右执行；左侧不满足时右侧不会访问字段。", "推导式里的输出表达式决定结果形状，过滤条件决定保留哪些记录。"],
  ["赋值可能让两个变量共享一个列表，修改其中一个会影响另一个。", "浅复制只复制外层容器，嵌套对象仍可能共享。", "函数默认参数在定义时创建；用 None 占位，再在调用时创建新列表。"],
  ["def 后的参数接收调用者输入，冒号后的类型标注说明预期类型。", "星号后面的参数必须按名称传入，调用位置不再决定其含义。", "return 把结果交还调用者；打印结果不能替代返回结果。"],
  ["import 引入模块中公开的函数或类型，导入时也可能执行顶层语句。", "将业务函数与脚本入口分开，避免导入即触发查询。", "在 try 中调用可能失败的操作；except 只捕获能处理的具体异常。"],
  ["dataclass 定义查询结果的字段，减少重复的初始化代码。", "实例方法通过 self 访问保存于对象上的依赖。", "从构造参数传入 provider，测试时可以用固定数据代替网络。"],
  ["先创建并激活项目环境，确保安装依赖与运行代码使用同一解释器。", "从环境读取配置，启动时检查必需项是否存在。", "依赖清单记录可复现的安装信息；密钥不进入源码或日志。"],
  ["Path 表达文件位置，打开文件时明确编码。", "with 管理文件关闭；json.load 从文件对象解析，loads 从字符串解析。", "解析后先检查数据形状，再当作列表或字典参与业务处理。"],
  ["请求入口接收可替换的 client，使单元测试不依赖真实网络。", "调用时设置超时，先检查 HTTP 错误。", "继续核对业务状态和响应字段，再返回业务结果；失败原因不能吞掉。"],
  ["模型类中的字段声明定义类型与约束。", "构造模型实例时将外部值送入验证，非法数据抛出 ValidationError。", "通过校验后再把可信参数传给查询逻辑，错误应明确返回调用者。"],
  ["TypedDict 描述状态字典允许有哪些字段。", "Annotated 将合并规则附在字段类型旁，普通 Python 不会自动执行该规则。", "框架读取 reducer 后按规则合并节点更新；列表可能追加而不是覆盖。"],
  ["async def 定义协程函数，调用它只得到可等待对象。", "await 驱动并等待结果；在结果产生前不能把协程当成字典。", "asyncio.run 可驱动最外层协程；yield 则用于逐次提供输出。"],
  ["普通函数保留独立业务逻辑，工具层描述用途和参数。", "装饰器可能把原函数名绑定到工具对象。", "用 invoke 传入符合 Schema 的字典，再核对工具结果和异常分支。"],
  ["状态类型定义节点间传递的数据，节点返回需要更新的部分。", "注册节点只给图命名，不决定执行顺序。", "连接 START、普通边、条件边与 END，再编译并运行图。"],
  ["provider 负责取数据，service 负责业务规则，分别用可控样例测试。", "tool 暴露查询能力，node 读取工具结果并更新状态。", "图根据状态选择回答或转人工，测试应覆盖成功、无结果和失败路径。"],
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
      terms: vocabulary[index], input: lesson.example, example: lesson.example, walkthrough: walkthroughs[index],
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
