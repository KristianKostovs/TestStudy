export type BlueprintRoadmapLevel = {
  title: string;
  question: string;
  foundations: string[];
  practice: string;
  evidence: string;
  contract: string[];
  acceptance: string[];
};

type LevelSeed = [
  title: string,
  question: string,
  foundations: string[],
  practice: string,
  evidence: string,
  contract: string[],
  acceptance: string[],
];

function roadmap(seeds: LevelSeed[]): BlueprintRoadmapLevel[] {
  return seeds.map(([title, question, foundations, practice, evidence, contract, acceptance]) => ({
    title, question, foundations, practice, evidence, contract, acceptance,
  }));
}

export const uiAutomationRoadmap = roadmap([
  ["浏览器、页面与 DOM", "自动化代码究竟在控制什么，页面截图为什么不能代替 DOM？", ["Browser / Context / Page", "DOM 节点与可访问性树", "HTML 属性和事件"], "读取给定登录页 HTML，标出页面、表单、输入框和提交按钮之间的关系。", "一张元素结构表，能区分视觉文本、DOM 节点、属性和交互事件。", ["输入是一段固定 HTML 和页面结构图", "输出元素结构表，不要求访问真实网站", "每个结论必须指向具体节点或属性"], ["正确区分 Browser、Context、Page", "至少识别 4 个可交互节点", "没有把截图像素当作 DOM 定位依据"]],
  ["Locator 基础", "怎样写出面向用户语义、重构后仍稳定的定位？", ["role / label / text", "strictness", "可访问名称"], "为给定登录页分别编写 role、label 和 test id Locator，并解释选择顺序。", "三个可运行 Locator 和一份稳定性说明。", ["页面固定包含用户名、密码、登录按钮", "优先使用 get_by_role/get_by_label", "禁止用未经解释的长 CSS/XPath"], ["Locator 唯一命中", "使用可访问名称", "能说明何时才使用 test id"]],
  ["组件作用域", "页面上有多个同名按钮时，怎样把查找限制在正确组件？", ["locator chaining", "filter / has", "组件容器"], "在两张商品卡片中只点击 SKU-001 卡片内的“调整库存”。", "一个从卡片容器到按钮的作用域 Locator，并证明不会命中另一张卡。", ["输入 DOM 含两张结构相同的卡片", "目标卡片由 SKU-001 文本识别", "动作只能发生在目标卡片内部"], ["先定位组件再定位子元素", "strict 模式下唯一命中", "交换卡片顺序后仍通过"]],
  ["页面状态", "元素存在、可见、可用和可操作为什么不是一回事？", ["attached / visible / enabled", "editable / checked", "web-first assertions"], "为保存按钮设计从禁用到可用的状态测试。", "状态转换断言和触发转换的明确动作。", ["按钮初始 disabled", "填写必填字段后变为 enabled", "不得使用固定 sleep 等待"], ["断言初始禁用", "断言最终可用", "使用 web-first 断言等待状态"]],
  ["Portal 与弹窗", "弹窗渲染在 body 末尾时，为什么不能从触发按钮的父节点继续找？", ["Portal", "dialog role", "overlay 生命周期"], "打开库存调整弹窗，填写数量并关闭，验证弹窗从可见到移除。", "基于 dialog 的 Locator、填写动作和关闭后的状态证据。", ["弹窗通过 Portal 渲染到 body", "标题为“调整库存”", "关闭后 dialog 不再可见"], ["从 page 按 dialog 语义定位", "不依赖触发按钮祖先关系", "覆盖打开和关闭生命周期"]],
  ["动态表格与业务行", "行会排序、分页和刷新时，怎样稳定找到业务记录？", ["row semantics", "业务主键", "过滤与分页"], "在动态库存表中找到 skuId=SKU-001 且仓库=WH-A 的行并读取可用库存。", "业务条件明确的行 Locator 和读取结果。", ["表格可能排序和刷新", "目标由 skuId 与仓库联合确定", "禁止依赖固定行号 nth"], ["联合条件唯一定位行", "刷新后仍能读取", "没有依赖展示顺序"]],
  ["Page Object 分层", "哪些内容属于页面对象，哪些业务断言应留在测试中？", ["Page Object", "组件对象", "业务意图与页面细节"], "把登录和库存调整页面操作封装成页面对象，并让测试保留业务结果断言。", "两个小型页面对象和一条可读的业务测试。", ["页面对象封装 Locator 和交互", "测试表达业务场景和最终断言", "不得把整个测试流程塞进一个万能方法"], ["定位细节集中管理", "测试仍能读出业务意图", "对象之间职责清楚"]],
  ["等待与 Web-First 断言", "为什么 wait_for_timeout 会让测试既慢又不稳定？", ["auto-waiting", "expect polling", "事件驱动等待"], "重写一条使用三次固定 sleep 的测试，改为状态和响应驱动等待。", "无固定 sleep 的等价测试及等待理由。", ["保留原测试业务步骤", "等待目标必须是可观察状态或明确响应", "不得扩大全局 timeout 掩盖问题"], ["移除固定 sleep", "每次等待都有业务含义", "超时信息能定位失败状态"]],
  ["登录与副作用控制", "登录复用如何提速，又怎样避免账号和数据相互污染？", ["storage_state", "Context 隔离", "幂等造数与清理"], "设计登录态生成、每用例独立 Context 和失败也执行的清理 fixture。", "fixture 生命周期图和两条隔离用例。", ["允许复用已认证 storage_state", "每条用例创建独立 BrowserContext", "teardown 必须在断言失败后仍执行"], ["没有跨用例共享可变页面状态", "清理无论成败执行", "凭据不写入源码或日志"]],
  ["可复现执行证据", "UI 测试失败后，别人需要哪些证据才能复现而不是猜测？", ["Trace", "截图与视频", "console / network"], "为一条失败用例定义 evidence 包和采集时机。", "包含 case id、环境、步骤、trace、截图和错误的证据清单。", ["使用固定 case_id 串联证据", "失败时保存 trace.zip 和最终截图", "敏感头和输入必须脱敏"], ["证据能定位失败步骤", "可用 Playwright Trace Viewer 重放", "没有泄露账号和令牌"]],
]);

export const apiAutomationRoadmap = roadmap([
  ["HTTP 与 JSON", "一次接口调用中，方法、URL、Header、Body 和状态码分别表达什么？", ["HTTP request / response", "JSON 编解码", "传输成功与业务成功"], "分析给定库存调整请求与三种响应。", "一张请求响应字段表，并区分 HTTP 500 与 HTTP 200 业务失败。", ["固定 POST /stock/adjust", "请求体含 skuId 和 adjustAmount", "响应均含 success，失败含 code"], ["正确识别请求组成", "区分 HTTP 与业务状态", "字段结论与给定契约一致"]],
  ["Endpoint 与 DTO 契约", "怎样把接口文档变成可校验而非口头约定的 DTO？", ["OpenAPI", "request / response schema", "必填、可选与 nullable"], "为库存调整接口定义请求和成功/失败响应 Schema。", "可验证的 Schema 与三个正反例。", ["skuId 为非空字符串", "adjustAmount 为整数且不能为 0", "成功响应必须含 data.flowNo"], ["合法样例通过", "缺字段和错类型失败", "成功与失败响应规则分开"]],
  ["Client 与 fixture", "HTTP Client 应怎样创建、注入和关闭？", ["Client 生命周期", "timeout", "pytest fixture"], "实现带 timeout 的 Client fixture，并以 MockTransport 隔离网络。", "yield fixture、两条用例和关闭证明。", ["base_url=https://example.test", "timeout=2.0", "测试期间禁止真实网络"], ["fixture 后关闭 client", "超时配置明确", "collect-only 无外部副作用"]],
  ["请求封装与结果对象", "为什么 action 不应只返回裸 dict 或直接抛掉所有失败响应？", ["ActionResult", "strict / observe", "请求响应证据"], "实现 adjust_stock action，统一返回 success、request、response、outputs 和 error。", "成功、业务失败、HTTP 失败三个 ActionResult。", ["strict=true 时失败可抛错", "observe 模式保留原始失败响应", "可变字段用独立默认值"], ["三类结果字段一致", "失败证据未丢失", "实例之间不共享可变对象"]],
  ["声明式 YAML", "YAML 中哪些是数据，哪些名字最终会映射到 Python action？", ["safe_load", "flow schema", "action / save_as"], "编写一条 setup→steps→assertions→teardown.always 的库存流程 YAML。", "可解析 YAML 和对应结构说明。", ["每步声明 action", "跨步结果通过 save_as 引用", "清理只能放在 teardown.always"], ["safe_load 后结构正确", "必需段落齐全", "YAML 不嵌入可执行 Python"]],
  ["Adapter 与反射执行", "Runner 如何从 action 名找到函数并安全调用？", ["registry", "callable reference", "signature / dispatch"], "实现 action registry、resolve_callable 和最小 run_entry。", "两个可执行 action、一个未知 action 失败用例。", ["引用格式 module:function", "未知 action 抛含名称的 KeyError", "handler 采用统一签名 entry, context"], ["已绑定 action 可执行", "未绑定时执行前失败", "错误保留 action 和引用信息"]],
  ["Provider 与测试数据", "访问数据库和选择业务数据为什么必须分层？", ["Provider", "查询参数化", "数据选择规则"], "用 fake provider 返回库存行，并在需求层选择合法数据。", "Provider 协议、fake 实现和选择规则测试。", ["Provider 只接收 query 与 params", "业务层筛选 available>=100 且 locked=false", "测试不连接真实数据库"], ["SQL 参数不拼接输入", "业务规则不进入 Provider", "无合法数据时错误明确"]],
  ["接口链字段绑定", "上一步响应怎样安全成为下一步请求，而不是靠复制粘贴？", ["context", "path resolver", "template binding"], "把 create 响应的 data.flowNo 绑定到 query 请求的 flowNo。", "两步流程和缺失路径失败测试。", ["第一步 save_as=create_result", "绑定表达式读取 create_result.response.data.flowNo", "缺失路径立即失败"], ["正常链路传递正确值", "不修改原始响应", "错误指出完整字段路径"]],
  ["断言、证据与 teardown", "主断言失败和清理失败同时发生时，怎样保留真正原因？", ["结构化断言", "异常链", "teardown evidence"], "实现业务字段断言和 always 清理，模拟主失败与清理失败。", "同时保留 primary_error、cleanup_error 和请求响应的 evidence。", ["断言 success 与业务 code", "teardown 无论成败执行", "清理异常不得覆盖主异常"], ["主错误保持首要", "清理结果可见", "evidence 字段完整且脱敏"]],
  ["完整需求链路", "怎样证明一条声明式接口链可以收集、模拟、执行、清理和审计？", ["静态门禁", "Mock 全链路", "标准 evidence"], "完成 after-sale 场景的 YAML、adapters、Mock 测试与 evidence JSON。", "一份可 collect-only、可离线执行的最小项目。", ["场景 id=api_boss_after_sale", "禁止真实 HTTP/DB", "成功和失败各有证据"], ["Schema 与导入门禁通过", "Mock 流程完整执行", "失败后仍清理并保存证据"]],
]);

export const performanceTestingRoadmap = roadmap([
  ["响应时间、并发与吞吐", "用户数、并发请求和每秒吞吐为什么不是同一个指标？", ["latency", "concurrency", "throughput"], "根据一组请求时间线计算并发峰值、RPS 和平均响应时间。", "计算表和每个指标的单位、统计窗口。", ["输入为固定 10 秒请求时间线", "统一使用秒与毫秒", "不得把用户数直接当并发数"], ["三个指标计算正确", "统计窗口明确", "能解释三者关系"]],
  ["P50/P95/P99", "平均值正常时，尾部用户为什么仍可能很慢？", ["percentile", "分布", "outlier"], "计算给定 100 个样本的 P50/P95/P99，并比较平均值。", "可复算的排序方法和四个结果。", ["使用 nearest-rank 口径", "样本单位为 ms", "保留原始样本数量"], ["分位数计算口径明确", "结果可复算", "能解释尾延迟"]],
  ["负载模型", "测试应该模拟什么样的到达率、并发和业务占比？", ["closed / open model", "用户行为", "业务权重"], "把给定生产峰值转换为登录、查询、提交三类负载模型。", "阶段、用户/到达率、权重和持续时间表。", ["目标峰值 120 RPS", "业务占比 10%/70%/20%", "包含预热、稳态和降载"], ["总负载与占比一致", "阶段目标清楚", "假设有来源"]],
  ["Locust 用户与任务", "Locust User、task 和 wait_time 怎样共同形成流量？", ["HttpUser", "@task weight", "wait_time"], "编写三类任务的 Locust 用户并用本地 mock endpoint 验证。", "可启动 locustfile 和任务分布检查。", ["host 指向本地测试服务", "任务权重 1/7/2", "每个请求有业务名称"], ["脚本可收集导入", "不访问生产环境", "任务权重符合模型"]],
  ["参数化和数据隔离", "并发用户共享账号或库存时会产生什么假象？", ["唯一数据", "队列分配", "回收与幂等"], "为 50 个并发用户分配互不冲突的账号和 sku。", "数据池、领取/归还逻辑和耗尽行为测试。", ["每份数据同一时刻只能被一个用户占用", "池耗尽时明确失败", "停止测试后归还可复用数据"], ["无重复领取", "失败后也归还", "没有用全局可变索引制造竞态"]],
  ["阶梯加压与稳定性", "如何区分容量拐点、短时抖动和长期泄漏？", ["step load", "soak test", "steady state"], "设计 20→50→100→150 RPS 阶梯和 2 小时稳态测试。", "负载阶段表、停止条件和观察指标。", ["每阶至少 10 分钟", "稳态目标 100 RPS", "错误率超过 2% 自动停止"], ["能定位容量拐点", "包含资源趋势", "停止条件可执行"]],
  ["分布式负载", "单机发压能力不足时，怎样确认 worker 真的均衡且结果可合并？", ["master / worker", "时钟与网络", "数据聚合"], "设计 1 master + 3 worker 的本地演练和健康检查。", "拓扑、启动参数和 worker 丢失测试。", ["所有节点使用同一脚本版本", "worker 数不足时不开始正式阶段", "结果只由 master 汇总"], ["worker 注册数可验证", "异常 worker 有明确告警", "聚合结果不重复"]],
  ["监控与链路关联", "只有压测端耗时，为什么无法判断慢在网关、应用还是数据库？", ["metrics", "trace_id", "时间对齐"], "给请求注入 trace id，并关联服务端 CPU、DB latency 和错误日志。", "一条慢请求的端到端证据链。", ["客户端与服务端时间统一", "每个请求携带非敏感 trace id", "至少关联应用和数据库指标"], ["能从压测样本跳到 trace", "指标时间窗一致", "证据足以定位组件"]],
  ["瓶颈与容量", "怎样从相关性证据得出容量结论，而不是看到 CPU 高就猜？", ["utilization", "queueing", "saturation"], "分析给定阶梯结果，判断首个违反 SLO 的负载与瓶颈候选。", "容量点、证据、反证和下一步验证实验。", ["SLO=P95<800ms 且错误率<1%", "结论使用稳态窗口", "至少列一个替代解释"], ["容量点按 SLO 得出", "瓶颈有多项关联证据", "区分事实和推断"]],
  ["完整性能报告", "一份报告怎样让别人复现负载并判断是否可上线？", ["test metadata", "baseline / delta", "risk conclusion"], "汇总前九关产物，形成可审计性能报告。", "目标、环境、数据、负载、结果、瓶颈、容量和风险结论齐全的报告。", ["报告标注代码/配置版本", "所有图表含单位和时间窗", "结论映射到预先声明的 SLO"], ["结果可复现", "异常和无效样本有说明", "上线建议与证据一致"]],
]);

export const qualityEngineeringRoadmap = roadmap([
  ["质量、测试与质量保障", "测试活动、质量控制和质量保障的边界分别在哪里？", ["QC / QA", "Verification / Validation", "质量责任"], "把一个发布流程中的活动分类为测试、质量控制或质量保障。", "分类表和每项活动的目的、责任人、证据。", ["输入为固定发布活动清单", "一个活动可说明主责任但不能被任意重复归类", "结论使用可观察产物"], ["概念区分正确", "责任和证据明确", "没有把质量只归给测试人员"]],
  ["测试策略与风险分析", "有限时间内先测什么，依据应是什么？", ["risk = likelihood × impact", "test levels", "coverage strategy"], "为库存调整功能建立风险清单并选择测试层级。", "风险评分、优先级、测试类型和不测范围。", ["至少包含数据错误、越权、并发和回滚风险", "评分尺度固定为 1–5", "每个高风险项对应验证活动"], ["优先级有依据", "层级选择合理", "不测范围和剩余风险明确"]],
  ["黑盒、白盒与灰盒测试", "同一需求从输入输出、代码结构和内部知识出发会得到哪些不同用例？", ["equivalence / boundary", "branch awareness", "architecture knowledge"], "针对 adjustAmount 范围 -100..100 分别设计三类测试。", "三组用例及其可发现缺陷差异。", ["业务规则边界为 -100、-1、1、100", "白盒部分基于给定分支图", "灰盒可使用数据库约束但不修改生产数据"], ["三种方法没有混淆", "边界覆盖完整", "每组说明独特价值"]],
  ["代码分支与白盒用例", "怎样从控制流而不是函数行数推导测试？", ["statement / branch", "decision table", "MC/DC awareness"], "为含四个判断分支的折扣函数绘制控制流并选择最小分支用例。", "分支表、用例输入和期望路径。", ["使用给定函数源码", "每个 True/False 分支至少一次", "异常出口单独计入"], ["分支覆盖可追踪", "期望值明确", "没有把执行一行等同覆盖分支"]],
  ["单元测试与依赖隔离", "单元测试应该隔离哪些依赖，又不该 mock 掉什么行为？", ["test double", "contract", "determinism"], "为库存 service 使用 fake repository 和 mock notifier 编写成功/失败测试。", "快速、无网络数据库依赖的单元测试。", ["service 业务规则使用真实实现", "repository 用 fake 控制数据", "只断言 notifier 的可观察调用"], ["用例确定且独立", "没有 mock 被测业务逻辑", "失败分支验证无通知副作用"]],
  ["覆盖率与覆盖率误区", "覆盖率高为什么仍可能漏掉关键缺陷？", ["line / branch coverage", "context", "coverage gap"], "比较两组同为 100% 行覆盖的测试，找出分支和断言差异。", "coverage 报告、缺口说明和补充用例。", ["使用 coverage.py branch=true", "报告标注测试上下文", "新增用例必须有业务断言"], ["正确读取 missing branch", "不以百分比代替质量结论", "补充用例针对真实缺口"]],
  ["变异测试", "测试都通过时，怎样验证断言真的能杀死错误实现？", ["mutant", "killed / survived", "equivalent mutant"], "对金额边界函数运行给定 6 个 mutation 并分析存活项。", "mutation score、存活原因和新增测试。", ["固定 6 个 mutation", "timeout 与测试错误不计 killed", "等价变异需给证明"], ["分类口径正确", "新增测试能杀死非等价存活项", "没有只追求分数"]],
  ["静态分析与代码评审", "哪些缺陷无需运行代码就能提前发现？", ["lint / type check", "security scan", "review checklist"], "评审一段含类型、资源泄漏和注入风险的 Python adapter。", "带严重级别、行号、理由和修复建议的评审记录。", ["输入源码版本固定", "工具发现与人工发现分开", "每条问题必须可验证"], ["识别关键缺陷", "严重性与风险匹配", "不把风格偏好当阻断问题"]],
  ["CI/CD 质量门禁", "哪些检查应阻断发布，哪些只应告警？", ["fast feedback", "absolute / delta gates", "flaky quarantine"], "为 pull request、main 和 release 三阶段设计质量门禁。", "门禁矩阵、阈值来源和失败处置。", ["PR 门禁 15 分钟内完成", "安全红线和关键测试失败一票否决", "覆盖率使用基线退化而非单一万能值"], ["阶段成本递增", "阻断规则可执行", "flaky 用例有隔离和修复期限"]],
  ["完整质量保障方案", "怎样把风险、测试、静态检查、门禁和线上反馈连成闭环？", ["quality plan", "evidence chain", "continuous improvement"], "为库存调整服务编写从需求到线上监控的质量保障方案。", "范围、风险、活动、环境、数据、门禁、证据、角色和回流机制完整的方案。", ["使用固定版本和责任矩阵", "每个高风险项映射预防、检测和监控", "结论保留剩余风险与审批人"], ["方案可执行可审计", "证据链覆盖发布前后", "质量结论与风险一致"]],
]);
