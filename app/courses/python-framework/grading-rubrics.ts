import { referenceAnswers } from "./reference-answers";

export type GradingRubric = {
  levelId: number;
  title: string;
  task: string;
  taskContract: string[];
  acceptance: string[];
  referenceAnswer: string;
  authoritativeNotes?: string[];
};

type GradingRubricDefinition = Omit<GradingRubric, "referenceAnswer">;

const gradingRubricDefinitions: GradingRubricDefinition[] = [
  { levelId: 1, title: "Python 数据与函数", task: "实现 get_by_path(data, path)，从固定售后响应读取 data.flowNo。", taskContract: ["正常响应 data.flowNo=FLOW-710", "路径缺失抛 KeyError('找不到字段: data.flowNo')", "不得修改输入"], acceptance: ["正常响应返回 FLOW-710", "任一路径节点缺失时抛出约定的 KeyError", "不修改原始 response"] },
  { levelId: 2, title: "可变对象与异常", task: "用固定嵌套 fixture 复现浅拷贝污染，再用 deepcopy 修复并证明 finally 清理。", taskContract: ["fixture.request.businessStatus 初始为 710", "浅拷贝 A 改为 720 后 B 也为 720", "深拷贝 A 改为 720 后 B 仍为 710", "模拟失败时 finally 仍清理"], acceptance: ["能复现污染", "修复后两条用例相互隔离", "即使调用失败也会执行清理"] },
  { levelId: 3, title: "模块、包与导入", task: "实现 resolve_callable(ref)，覆盖真实函数、缺模块、缺属性和不可调用属性。", taskContract: ["ref 格式 module:function", "math:sqrt(9)=3", "missing_package:run、math:missing、math:pi 分别覆盖三类失败"], acceptance: ["math:sqrt 可导入并调用", "模块和函数不存在时诊断清楚", "math:pi 这类不可调用属性被主动拒绝"] },
  { levelId: 4, title: "类型、dataclass 与 Protocol", task: "定义固定字段的 ActionResult dataclass，并实现 adjust_stock_action。", taskContract: ["success: bool", "request/response: dict[str, Any] | None = None", "outputs 使用 field(default_factory=dict)", "side_effects 使用 field(default_factory=list)", "action 签名为 (sku_id: str, adjust_amount: int) -> ActionResult"], acceptance: ["核心字段有明确类型", "可选字段有合理默认值且不会共享可变对象", "action 明确返回并构造 ActionResult"] },
  {
    levelId: 5,
    title: "pytest 生命周期",
    task: "为 HTTP Client 写 yield fixture，再用参数化生成 710/720 两条用例，最后运行 collect-only。",
    taskContract: ["使用 FakeHttpClient 或完全 mock 的 Client，禁止真实网络", "yield 前创建、yield 后 close", "parametrize status=[710, 720]", "collect-only 不执行普通 fixture"],
    acceptance: ["collect-only 收集出两条独立用例", "正常或失败执行后 Client 始终关闭", "收集和测试均无真实 HTTP 请求"],
    authoritativeNotes: [
      "pytest --collect-only 会导入测试模块、发现测试、解析 fixture 依赖并展开参数化，但不会执行普通 fixture 的 setup/yield/teardown，也不会执行测试函数体。",
      "收集阶段可能执行模块顶层语句、pytest_generate_tests 和其他 collection hooks；真实网络调用必须避免出现在这些位置。",
      "fixture api_client(monkeypatch) 中的代码只在正式测试 setup 时执行。若在构造 HttpClient 前 monkeypatch 了实际网络边界方法，则构造期间通过该方法发起的调用也会被替换。",
      "不得仅凭猜测 HttpClient 构造函数可能联网而扣分；只根据答案中展示的代码和 pytest 的真实生命周期判断。",
    ],
  },
  { levelId: 6, title: "YAML 与 Pydantic 校验", task: "用 Pydantic v2 定义 FlowEntry，并测试仅 action、仅 request 与空步骤。", taskContract: ["action/save_as 为 str | None", "request 为 dict | None", "model_validator(mode='after') 要求 action/request 至少一个", "FlowEntry() 抛 ValidationError 且匹配约定文案"], acceptance: ["正常 action 能通过", "正常 request 能通过", "空步骤在执行前以约定信息失败"] },
  { levelId: 7, title: "反射与 Runner 调度", task: "实现固定 run_entry 入口，用两个 action 和 save_as 串起 fixture 与 request。", taskContract: ["run_entry(entry, adapters, context)", "fixture.resolve 保存 resolved_fixture", "request.build 消费 resolved_fixture 并保存 request", "未知 action 抛 KeyError", "每次 run 使用独立 context"], acceptance: ["未绑定 action 立即失败", "第二步能读取第一步的 save_as 结果", "两次 run 的 context 不串数据"] },
  {
    levelId: 8,
    title: "HTTPX 与 MockTransport",
    task: "按题目固定契约，用 MockTransport 模拟 POST /stock/adjust：请求体包含 skuId=SKU-001 与 adjustAmount，并覆盖 10=成功、500=HTTP 500、101=HTTP 200 但 success=false。",
    taskContract: ["POST https://example.test/stock/adjust", "JSON 为 skuId=SKU-001 与整数 adjustAmount", "10 -> HTTP 200 / FLOW-001", "500 -> HTTP 500 / SYSTEM_ERROR", "101 -> HTTP 200 / success=false / A4500"],
    acceptance: ["三种分支都有独立断言", "handler 检查 method、path、skuId 和 adjustAmount", "HTTP 500 断言 SYSTEM_ERROR，业务失败断言 A4500", "测试完全使用 MockTransport，不依赖网络"],
    authoritativeNotes: [
      "本关请求结构由题目明确给定，不得要求学习者猜测未声明字段。",
      "handler 的 request 是 httpx.Request；request.method、request.url、request.content 和 request.headers 由 HTTPX Client 构造。",
      "可执行答案必须 import httpx 和 json；网页编辑器的课程补全不等于 Python 已经导入或安装第三方库。",
    ],
  },
  { levelId: 9, title: "架构边界与副作用", task: "把库存查询、共享快照和售后选数规则拆成三层并分别测试。", taskContract: ["Provider=query_rows(connection, sql, params)", "Shared Action=capture_inventory_snapshot(provider, sku_id)", "Requirement=select_legal_after_sale_sku(rows, constraints)", "筛选 available>=minimum_available 且 locked is False", "依赖方向 Requirement -> Shared Action -> Provider"], acceptance: ["Provider 不知道售后业务规则", "筛选规则留在需求层且依赖方向正确", "三层可分别单元测试"] },
  { levelId: 10, title: "Boss 战：完整声明式链路", task: "完成固定 boss_01_after_sale 场景的 YAML、adapters、Mock 测试和 evidence JSON。", taskContract: ["requirement_cases.yaml 含 setup/steps/assertions/teardown.always", "所有 action 能在 adapters.py 解析", "tests/test_boss_mock.py 不访问真实网络", "evidence 含 case_id/success/request/response/outputs/side_effects/error/teardown"], acceptance: ["YAML 静态校验通过", "adapter 可导入且 collect-only 通过", "Mock 完整跑通 setup→assertions→teardown.always", "成功与失败 evidence 均包含约定字段"] },
];

export const gradingRubrics: GradingRubric[] = gradingRubricDefinitions.map((rubric) => ({
  ...rubric,
  authoritativeNotes: [
    "任务背景、固定契约、验收标准和可信参考答案是完整判定边界；不得要求学习者猜测未声明的字段、对象行为或外部项目代码。",
    ...(rubric.authoritativeNotes ?? []),
  ],
  referenceAnswer: referenceAnswers[rubric.levelId],
}));

export function getGradingRubric(levelId: number) {
  return gradingRubrics.find((rubric) => rubric.levelId === levelId);
}
