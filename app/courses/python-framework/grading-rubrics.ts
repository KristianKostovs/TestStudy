import { referenceAnswers } from "./reference-answers";

export type GradingRubric = {
  levelId: number;
  title: string;
  task: string;
  acceptance: string[];
  referenceAnswer: string;
  authoritativeNotes?: string[];
};

type GradingRubricDefinition = Omit<GradingRubric, "referenceAnswer">;

const gradingRubricDefinitions: GradingRubricDefinition[] = [
  { levelId: 1, title: "Python 数据与函数", task: "写一个 get_by_path() 函数，从售后接口响应中取出 data.flowNo，并处理 data 缺失的情况。", acceptance: ["正常响应能返回 flowNo", "缺少 data 时抛出明确错误", "不修改原始 response"] },
  { levelId: 2, title: "可变对象与异常", task: "构造两条共用嵌套 fixture 的用例，证明直接修改会污染数据，再用 deepcopy 修复。", acceptance: ["能复现污染", "修复后两条用例相互隔离", "即使调用失败也会执行清理"] },
  { levelId: 3, title: "模块、包与导入", task: "实现 resolve_callable()，成功加载一个真实 adapter，再用不存在的模块和函数各测一次失败分支。", acceptance: ["可导入并调用真实函数", "模块不存在时诊断清楚", "属性不可调用时主动拒绝"] },
  { levelId: 4, title: "类型、dataclass 与 Protocol", task: "定义 ActionResult dataclass，包含 success、request、response、outputs 和 side_effects，再写一个构造它的 action。", acceptance: ["核心字段有明确类型", "可选字段有合理默认值且不会共享可变对象", "action 明确返回并构造 ActionResult"] },
  {
    levelId: 5,
    title: "pytest 生命周期",
    task: "为 HTTP Client 写 yield fixture，再用参数化生成 710/720 两条用例，最后运行 collect-only。",
    acceptance: ["收集出两条独立用例", "Client 始终关闭", "collect-only 期间没有真实 HTTP 请求"],
    authoritativeNotes: [
      "pytest --collect-only 会导入测试模块、发现测试、解析 fixture 依赖并展开参数化，但不会执行普通 fixture 的 setup/yield/teardown，也不会执行测试函数体。",
      "收集阶段可能执行模块顶层语句、pytest_generate_tests 和其他 collection hooks；真实网络调用必须避免出现在这些位置。",
      "fixture api_client(monkeypatch) 中的代码只在正式测试 setup 时执行。若在构造 HttpClient 前 monkeypatch 了实际网络边界方法，则构造期间通过该方法发起的调用也会被替换。",
      "不得仅凭猜测 HttpClient 构造函数可能联网而扣分；只根据答案中展示的代码和 pytest 的真实生命周期判断。",
    ],
  },
  { levelId: 6, title: "YAML 与 Pydantic 校验", task: "用 Pydantic 定义 FlowEntry，禁止同时缺少 action 和 request，并为错误 YAML 写三个校验测试。", acceptance: ["正常 action 能通过", "正常 request 能通过", "空步骤在执行前就失败"] },
  { levelId: 7, title: "反射与 Runner 调度", task: "实现一个最小 Runner：执行两个 action，用 save_as 存结果，第二步消费第一步输出。", acceptance: ["未绑定 action 立即失败", "save_as 结果可被后续步骤读取", "两次 run 的 context 不串数据"] },
  { levelId: 8, title: "HTTPX 与 MockTransport", task: "用 MockTransport 模拟售后调整接口，同时覆盖业务成功、HTTP 500 和 HTTP 200 但 success=false。", acceptance: ["三种分支都有独立断言", "能检查真实请求体", "测试不依赖网络"] },
  { levelId: 9, title: "架构边界与副作用", task: "将一个混合了 HTTP、数据库、差值断言和清理的 100 行 adapter，拆分为 Provider、页面共享 Action 和需求特有逻辑。", acceptance: ["Provider 不知道售后业务规则", "resolve 仍留在场景层", "三层可分别单元测试"] },
  { levelId: 10, title: "Boss 战：完整声明式链路", task: "选择一个实际需求，实现从 requirement_cases.yaml 到 MockTransport 全链路，并输出标准化 evidence JSON。", acceptance: ["YAML 静态校验通过", "adapter 可导入且 collect-only 通过", "Mock 完整跑通 setup→assertions→teardown", "失败用例也留存请求、响应和主异常"] },
];

export const gradingRubrics: GradingRubric[] = gradingRubricDefinitions.map((rubric) => ({
  ...rubric,
  referenceAnswer: referenceAnswers[rubric.levelId],
}));

export function getGradingRubric(levelId: number) {
  return gradingRubrics.find((rubric) => rubric.levelId === levelId);
}
