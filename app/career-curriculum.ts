import type { LearningModule, LearningRoadmapDetail } from "./learning-registry";

type LessonSeed = {
  title: string; goal: string; prerequisites: string[]; explanation: string;
  example: string; task: string; output: string; checks: string[];
  file: string; code: string;
};

function lesson(seed: LessonSeed): LearningRoadmapDetail {
  return {
    title: seed.title, question: seed.goal, goal: seed.goal,
    foundations: seed.prerequisites, explanation: seed.explanation, example: seed.example,
    practice: seed.task, evidence: seed.output,
    contract: [seed.example, "使用给定样例及合成数据，保留输入、预期、实际与运行版本。"],
    acceptance: seed.checks,
    starter: { files: [seed.file], code: seed.code, focus: seed.checks },
  };
}

const coding = [
  lesson({
    title: "从需求写出函数契约", goal: "把一句需求变成明确的输入、输出与错误行为。",
    prerequisites: ["Python 函数与字典", "参数与返回值"],
    explanation: "先约定字段、类型、边界和输出，再写实现。合法输入应得到确定结果，非法输入应有明确错误。固定契约能帮助你检查 AI 生成代码是否满足需求。",
    example: "输入 amount=-1、available=10 → 返回 9；amount=0 或扣减后小于 0 → ValueError。原 available 不被修改。",
    task: "实现 adjust(available, amount)，为零调整、余额不足和成功各写一个断言。",
    output: "adjust.py 与成功、失败、边界的运行记录。",
    checks: ["三类输入结果符合契约", "拒绝余额不足和零调整", "没有依赖外部服务"],
    file: "adjust.py", code: "def adjust(available: int, amount: int) -> int:\n    # TODO：校验零调整和结果非负\n    raise NotImplementedError\n",
  }),
  lesson({
    title: "集合、复杂度与去重", goal: "选对数据结构，避免重复数据和多次全表扫描。",
    prerequisites: ["列表、字典、集合", "循环与条件", "时间复杂度"],
    explanation: "列表保留顺序，字典可按键累计，集合用于判断是否见过。重复遍历全部数据容易形成平方级开销。性能结论应同时说明算法和样本规模。",
    example: "输入 case_id 为 A、B、A 的三条记录 → 保留首次出现的 A、B，顺序不变。",
    task: "实现按 case_id 去重；比较嵌套扫描与 seen 集合方案，说明平均时间与额外空间。",
    output: "deduplicate.py、空列表和重复记录测试、复杂度说明。",
    checks: ["保留首次记录及顺序", "空输入可用", "解释集合方案平均 O(n) 时间与 O(n) 空间"],
    file: "deduplicate.py", code: "def deduplicate(records):\n    seen, result = set(), []\n    for record in records:\n        # TODO：按 case_id 保留首次记录\n        pass\n    return result\n",
  }),
  lesson({
    title: "纯函数、可变状态与依赖", goal: "分开业务计算、外部调用和共享状态。",
    prerequisites: ["对象引用", "可变对象", "依赖注入"],
    explanation: "纯计算只读取输入并返回结果，HTTP、数据库和通知属于边界。通过参数传入依赖，可以用 fake 验证业务规则。默认列表及共享字典可能使多次调用互相影响。",
    example: "rows=[{sku:'A', available:10}]；选择可用库存后，原 rows 仍为 10；连续两次调用没有残留状态。",
    task: "实现库存选择函数，补输入不变与重复调用测试；把 repository 从函数内部构造改为参数传入。",
    output: "selection.py、fake repository 与隔离测试。",
    checks: ["输入未被修改", "两次调用结果独立", "业务规则与数据访问分开"],
    file: "selection.py", code: "def choose(rows, minimum):\n    # TODO：返回符合条件的新列表，不修改 rows\n    raise NotImplementedError\n",
  }),
  lesson({
    title: "文件与异常边界", goal: "处理坏数据时保留上下文，并保证资源关闭。",
    prerequisites: ["Path、JSON", "with", "异常链"],
    explanation: "文件不存在、JSON 错误和字段缺失是不同失败。只在能够补充上下文或恢复的边界捕获异常。with 管理文件关闭，raise ... from error 保留原始异常原因。",
    example: 'case.json 内容 {"case_id":"C1"} → 读取 C1；内容为 {bad → 报错包含文件名与 JSONDecodeError 原因。',
    task: "实现 load_case(path)，区分读取失败、JSON 错误和缺少 case_id，禁止返回空字典掩盖错误。",
    output: "loader.py 与三种异常测试。",
    checks: ["坏数据有文件和原因", "原始异常可追踪", "文件使用上下文管理"],
    file: "loader.py", code: "import json\nfrom pathlib import Path\n\ndef load_case(path):\n    # TODO：读取、校验并保留异常链\n    raise NotImplementedError\n",
  }),
  lesson({
    title: "断点与最小复现", goal: "用实际变量和执行路径解释故障。",
    prerequisites: ["调用栈", "断言", "断点与单步"],
    explanation: "先用最少输入稳定复现，再在错误分支前观察变量。记录预期、实际和首次偏离位置。修改后同时运行原复现和相邻正常场景，避免只凭代码看起来合理判定修复。",
    example: "def total(values, result=[]): result.extend(values); return sum(result)；先传 [1] 再传 [2]，第二次得到 3，预期 2。",
    task: "复现默认可变参数问题，观察第二次调用的 result，修复并添加连续调用回归测试。",
    output: "复现输入、变量快照、补丁与回归日志。",
    checks: ["说明状态残留原因", "连续调用得到 1 和 2", "保留修复前失败与修复后通过"],
    file: "debug_default.py", code: "def total(values, result=[]):\n    result.extend(values)\n    return sum(result)\n\n# TODO：复现两次调用并修复状态残留\n",
  }),
  lesson({
    title: "Git、依赖与可复现工程", goal: "让别人能在干净环境运行你的项目。",
    prerequisites: ["Git diff、commit", "虚拟环境", "项目入口"],
    explanation: "提交应表达一个可解释的变更。依赖、解释器要求、配置样例和执行命令决定项目能否复现。忽略 .env 只影响未跟踪文件，已经提交的密钥需要单独处置。",
    example: "README 提供 python -m venv .venv、安装命令、python -m unittest discover -s tests；真实配置不进入仓库。",
    task: "为练习项目补 README、依赖说明和 .gitignore，在新目录运行一次并审阅 diff。",
    output: "可复现目录、单一职责提交与干净环境执行记录。",
    checks: ["新目录能按说明执行", "配置样例不含凭据", "diff 只包含当前任务改动"],
    file: "README.md", code: "# 运行说明\n## 环境\nTODO\n## 安装与运行\nTODO\n## 配置键名\nTODO\n",
  }),
  lesson({
    title: "Java 业务代码阅读", goal: "沿 Controller、Service、Mapper 追踪规则和事务。",
    prerequisites: ["Java 方法与类", "接口调用", "SQL 基础"],
    explanation: "入口负责参数与调用，业务规则常在 Service，Mapper 承担数据访问。阅读时标出事务、异常和外部调用。静态找到代码说明实现路径，真实提交、消息和数据库结果仍需运行验证。",
    example: "POST /adjust → Controller.adjust → Service.adjust（事务）→ Mapper.updateStock；通知在事务提交后执行。",
    task: "针对给定链路画调用图，为参数校验、事务失败和提交后通知各列一个验证点。",
    output: "调用图、字段来源表与三条验证方案。",
    checks: ["规则有方法或 SQL 出处", "识别事务和外部依赖", "区分静态结论与运行结果"],
    file: "code-trace.md", code: "| 层级 | 输入 | 规则 | 调用/表 | 失败行为 |\n| Controller | TODO | TODO | TODO | TODO |\n| Service | TODO | TODO | TODO | TODO |\n| Mapper | TODO | TODO | TODO | TODO |\n",
  }),
  lesson({
    title: "独立修改与技术说明", goal: "在已有项目中独立完成一次有证据的变更。",
    prerequisites: ["前七关", "边界测试", "代码评审"],
    explanation: "编码能力要通过陌生输入、故障修改和解释取舍来检验。可以使用 AI，但提交者负责理解每个关键分支、补反例、审阅改动及报告验证范围。",
    example: "离线包 summary 任务：同名失败归组；输入为空返回 {}；输入中的记录不被修改。",
    task: "下载离线练习包，完成 summary 函数；新增一条反例，并写出算法、异常和验证说明。",
    output: "实现、测试日志、diff 与一页技术说明。",
    checks: ["summary 测试通过", "能独立解释关键分支", "新增反例覆盖真实边界"],
    file: "src/lab.py", code: "def summarize_failures(records):\n    # TODO：按非空 error_code 统计失败记录，忽略成功记录\n    raise NotImplementedError\n",
  }),
];

const backend = [
  lesson({
    title: "Linux 进程与资源", goal: "区分进程存活、端口监听和服务健康。",
    prerequisites: ["命令行", "进程、线程、文件描述符"],
    explanation: "进程存在不代表能正确处理请求。先查进程与监听，再查资源和健康响应。CPU、内存、磁盘及句柄是不同资源，单个数值不足以证明故障原因。",
    example: "PID 101 存活，8080 监听，但 /health 返回 503；应继续检查依赖和错误日志。",
    task: "为本地服务整理只读排查顺序，分别保存进程、端口、资源与健康响应。",
    output: "命令、时间和结果组成的环境快照。",
    checks: ["区分三个健康层次", "结论对应同一时间窗", "不通过重启掩盖原因"],
    file: "linux-checks.sh", code: "# 在自己的练习环境执行\nps -ef\nlsof -iTCP:8080 -sTCP:LISTEN\ncurl -i http://127.0.0.1:8080/health\n# TODO：补资源快照及结论\n",
  }),
  lesson({
    title: "DNS、TCP、TLS 与 HTTP", goal: "按网络阶段缩小接口失败范围。",
    prerequisites: ["域名、IP、端口", "HTTP 请求响应"],
    explanation: "域名先解析到地址，再建立连接，HTTPS 还要完成 TLS，之后才有 HTTP。DNS 失败、连接拒绝、证书失败和 HTTP 500 不能使用同一种归因。",
    example: "A: 域名无法解析；B: connection refused；C: HTTP 500。只有 C 已得到 HTTP 响应。",
    task: "为四种网络阶段失败整理可观察证据，并说明哪个层次还没有到达。",
    output: "网络失败分类表与一个本地连接失败复现。",
    checks: ["阶段顺序正确", "不把连接失败写成业务失败", "保留错误原文与目标地址"],
    file: "network.md", code: "| 现象 | 已到达阶段 | 未验证阶段 | 下一项证据 |\n| DNS 失败 | TODO | TODO | TODO |\n| 拒绝连接 | TODO | TODO | TODO |\n| TLS 失败 | TODO | TODO | TODO |\n| HTTP 500 | TODO | TODO | TODO |\n",
  }),
  lesson({
    title: "身份、权限与会话", goal: "验证谁能对哪条业务数据执行什么操作。",
    prerequisites: ["Cookie、Token", "认证与授权", "资源归属"],
    explanation: "认证识别用户，授权决定用户能做什么。需要同时检查角色、资源归属与服务端控制。隐藏按钮不能替代接口授权，测试中使用独立合成账号并保留脱敏证据。",
    example: "用户 A 拥有订单 O1，用户 B 使用有效登录态请求 O1；应按契约拒绝，且 O1 不变。",
    task: "为同租户越权、跨租户、失效会话设计三组接口与数据断言。",
    output: "账号资源矩阵、请求期望与状态不变证据。",
    checks: ["覆盖资源归属", "检查拒绝后的副作用", "凭据脱敏"],
    file: "authorization.md", code: "| 用户 | 资源归属 | 操作 | 预期响应 | 数据断言 |\n| A | A | 读取 O1 | TODO | TODO |\n| B | A | 修改 O1 | TODO | TODO |\n",
  }),
  lesson({
    title: "SQL、关联与数据核对", goal: "用明确主键和关联条件验证业务数据。",
    prerequisites: ["SELECT、JOIN、GROUP BY", "NULL 与唯一键"],
    explanation: "先确定数据粒度和主键，再连接明细与汇总。一个订单关联多条明细时会放大行数，直接汇总可能重复计数。查询核对与写数据的权限和副作用要分别控制。",
    example: "O1 两条明细金额 30、20；订单总额 50。JOIN 后订单两行，SUM(order.total) 会得到 100。",
    task: "用本地 SQLite 建立订单与明细样例，查询正确总额并找出汇总不一致订单。",
    output: "建表 SQL、固定数据与核对查询。",
    checks: ["关联后不重复计算汇总", "覆盖无明细与 NULL", "查询可按订单 ID 追踪"],
    file: "reconcile.sql", code: "CREATE TABLE orders(id TEXT PRIMARY KEY, total INTEGER);\nCREATE TABLE details(order_id TEXT, amount INTEGER);\nINSERT INTO orders VALUES ('O1',50);\nINSERT INTO details VALUES ('O1',30),('O1',20);\n-- TODO：先按 order_id 聚合 details，再对照订单总额\n",
  }),
  lesson({
    title: "事务与失败回滚", goal: "验证多次写入在失败时保持业务一致性。",
    prerequisites: ["事务提交与回滚", "ACID", "异常处理"],
    explanation: "事务让一组数据库操作按边界提交或回滚。外部 HTTP 或消息通常不自动跟随数据库回滚。实验必须说明数据库类型，SQLite 的结果不能直接证明 MySQL 的锁和隔离行为。",
    example: "库存扣减后插入流水失败 → 同一事务内库存与流水都不提交。",
    task: "在本地数据库插入约束失败，验证扣减回滚，再跑正常提交。",
    output: "事务脚本、故障点、前后查询和正常对照。",
    checks: ["失败后两表保持原状态", "正常提交两表一致", "说明事务未覆盖的外部动作"],
    file: "transaction.sql", code: "BEGIN;\n-- TODO：扣减库存、插入流水、注入失败\n-- 捕获失败后 ROLLBACK，成功后 COMMIT\n",
  }),
  lesson({
    title: "索引与执行计划", goal: "结合查询形态和执行计划评估索引。",
    prerequisites: ["WHERE、ORDER BY", "联合索引", "EXPLAIN"],
    explanation: "索引为特定访问路径服务，会增加写入与存储成本。先固定查询、数据规模和分布，再比较执行计划及实测耗时；小样本变快不能证明生产容量。",
    example: "查询 warehouse='W1' AND sku='S1'，比较无索引与 (warehouse,sku) 索引的计划。",
    task: "生成固定样例数据，记录加索引前后的计划、数据规模和多次查询时间。",
    output: "SQL、执行计划与统计口径。",
    checks: ["说明索引匹配的查询", "结果集前后一致", "不单凭一次耗时下结论"],
    file: "index.sql", code: "EXPLAIN QUERY PLAN SELECT * FROM stock WHERE warehouse='W1' AND sku='S1';\n-- TODO：创建联合索引后重复查询并比较\n",
  }),
  lesson({
    title: "并发、锁与超卖", goal: "用竞争场景验证共享数据约束。",
    prerequisites: ["并发交错", "条件更新", "事务与锁"],
    explanation: "先读再写若没有并发保护，两个请求可能都认为余额充足。条件更新、合适的锁或版本号可保护约束。验证必须同时检查成功次数、最终库存和流水。",
    example: "初始库存 1，两个请求各扣 1 → 只允许一个成功，最终库存 0，成功流水 1 条。",
    task: "用屏障同步两次本地请求，复现竞争，再验证条件扣减方案。",
    output: "并发时序、响应、库存和流水核对。",
    checks: ["库存不为负", "成功数量与流水一致", "重复执行仍满足约束"],
    file: "concurrency.sql", code: "UPDATE stock SET available=available-1\nWHERE sku='S1' AND available>=1;\n-- TODO：检查受影响行数并在同一事务记录成功流水\n",
  }),
  lesson({
    title: "缓存与失效窗口", goal: "识别数据库与缓存不一致的时间窗口。",
    prerequisites: ["缓存命中", "TTL", "读写顺序"],
    explanation: "缓存保存副本，数据库更新和缓存失效之间可能存在窗口。先约定允许的旧值时间、失败重试和回源行为，再设计并发读写测试。不能把缓存键存在当成业务正确。",
    example: "数据库从 10 改为 8；缓存删除失败，读取仍为 10；允许旧值窗口为 2 秒。",
    task: "列出缓存失效成功、失败、过期和重建的四条时序，验证窗口与最终值。",
    output: "缓存时序图、故障点和收敛检查。",
    checks: ["区分缓存与权威数据", "记录允许窗口", "覆盖失效失败后的恢复"],
    file: "cache-timeline.md", code: "t0 写数据库=8\nt1 删除缓存失败\nt2 读到旧值=10\nTODO：补 TTL、重试和最终核对时间\n",
  }),
  lesson({
    title: "消息、重投与消费幂等", goal: "让重复投递不产生重复业务写入。",
    prerequisites: ["消息确认", "业务幂等键", "持久化约束"],
    explanation: "消费成功后确认丢失，消息可能再次投递。幂等键应指向业务动作，去重记录与业务写入需要合适的原子边界。内存集合仅能演示，不能证明跨进程和崩溃恢复安全。",
    example: "相同 event_id=E1 的扣减事件投递两次 → 库存只扣一次；同键不同载荷需拒绝。",
    task: "完成离线包库存任务，再补真实系统所需的唯一约束、事务和崩溃恢复方案。",
    output: "幂等实现、重复投递测试与持久化方案。",
    checks: ["重复事件不重复扣减", "同键异载荷失败", "明确内存演示的局限"],
    file: "src/lab.py", code: "class Inventory:\n    def __init__(self, available):\n        self.available, self.events = available, {}\n\n    def apply(self, event_id, amount):\n        # TODO：校验、幂等与结果保存\n        raise NotImplementedError\n",
  }),
  lesson({
    title: "超时、重试与降级", goal: "处理结果未知的请求，避免重试扩大副作用。",
    prerequisites: ["连接超时、读取超时", "幂等", "重试预算"],
    explanation: "读取超时可能发生在服务端已经提交之后。先按业务键查询结果，或使用幂等协议，再决定重试。次数、退避和总时限应有上界，降级结果要可识别。",
    example: "扣减已提交但响应丢失；客户端读超时 → 用原业务键核对，禁止换新键盲重试。",
    task: "为提交前失败、提交后丢响应、限流、永久参数错误设计恢复策略。",
    output: "失败分类、重试预算与副作用断言。",
    checks: ["结果未知有核对步骤", "永久错误不重试", "重试有次数和总时限"],
    file: "retry-policy.yaml", code: "attempt_limit: 3\ntotal_timeout_seconds: 5\nretryable: [] # TODO\nunknown_outcome: {} # TODO：业务键与查询\n",
  }),
  lesson({
    title: "微服务、网关与调用链", goal: "把入口、服务和依赖连成可观察链路。",
    prerequisites: ["服务发现", "网关", "Trace 与 span"],
    explanation: "入口错误可能来自网关、应用或下游依赖。用 trace_id 关联请求，span 表达单次操作。需要考虑时间重叠、时钟和采样；不能直接把父子 span 的耗时全部相加。",
    example: "网关 900ms，订单服务 850ms，DB span 700ms；先检查 DB 等待与查询，再判断其他耗时。",
    task: "画三层调用图，为每层标出超时、错误、关键数据与证据位置。",
    output: "调用链和一条慢请求的调查方案。",
    checks: ["同一请求可贯通", "不重复累计父子耗时", "定位结论有待验证假设"],
    file: "trace-map.md", code: "| trace_id | 服务/span | 开始 | 耗时 | 错误 | 证据 |\n| T1 | gateway | 0ms | 900ms | TODO | TODO |\n| T1 | order/db | 100ms | 700ms | TODO | TODO |\n",
  }),
  lesson({
    title: "跨系统一致性与补偿", goal: "验证部分成功、补偿失败和最终收敛。",
    prerequisites: ["事务边界", "幂等重试", "状态机"],
    explanation: "多个服务无法简单共享本地事务。需列出每一步状态、失败出口和补偿动作，约定收敛时限与人工恢复。检查最终状态时也要核对中间重复动作和外部回执。",
    example: "订单创建成功、库存预占成功、支付失败 → 释放库存；释放超时进入待补偿，重复补偿不多释放。",
    task: "为三步链路设计状态表，覆盖每步失败、补偿失败、重复消息和超时恢复。",
    output: "状态转换表、故障矩阵与最终数据对账规则。",
    checks: ["每步都有失败出口", "补偿可重复且有上界", "以数据与外部回执核对收敛"],
    file: "consistency.md", code: "| 初始状态 | 事件 | 下一状态 | 写入 | 补偿 | 核对 |\n| 已预占 | 支付失败 | TODO | TODO | TODO | TODO |\n| 待补偿 | 重复释放 | TODO | TODO | TODO | TODO |\n",
  }),
];

const delivery = [
  lesson({
    title: "故障分层与假设验证", goal: "把环境、依赖、代码和业务失败分开调查。",
    prerequisites: ["HTTP 与进程基础", "最小复现"],
    explanation: "先保存原始失败，再按可验证假设排查。每次只改变一个相关变量，记录支持与反证。测试环境登录失败不应计作业务断言失败。",
    example: "连接被拒绝、HTTP 401、HTTP 200 success=false，分别对应网络连接、认证和业务层证据。",
    task: "完成离线包 classify_failure，并为每类列一项下一步检查。",
    output: "分类函数、测试日志和排查表。",
    checks: ["分类覆盖三层", "未知现象保持 unknown", "归因包含原始证据"],
    file: "src/lab.py", code: "def classify_failure(http_status=None, business_success=None, transport_error=None):\n    # TODO：返回 transport/auth/http/business/ok/unknown\n    raise NotImplementedError\n",
  }),
  lesson({
    title: "日志、指标与 Trace 关联", goal: "把一个失败串成完整证据。",
    prerequisites: ["结构化日志", "trace_id", "时间窗口"],
    explanation: "日志描述事件，指标描述聚合趋势，Trace 展示请求路径。三者相互关联能减少猜测。需保留服务版本、环境与时区，并对凭据、个人数据和请求体脱敏。",
    example: "case=C1、trace=T1、version=v2；同窗口错误率上升，T1 的 DB span 超时，对应日志有连接池等待。",
    task: "为一次失败制作 evidence.json，包含输入、版本、三类观测和结论置信度。",
    output: "可关联的 evidence.json 与复现命令。",
    checks: ["三类证据有共同标识", "时间和版本一致", "事实与假设明确"],
    file: "evidence.json", code: '{\n  "case_id": "C1", "trace_id": "T1", "version": "v2",\n  "logs": [], "metrics": [], "spans": [],\n  "facts": [], "hypotheses": []\n}\n',
  }),
  lesson({
    title: "故障注入与恢复验证", goal: "验证依赖失败时的行为和恢复。",
    prerequisites: ["Mock 与依赖替身", "超时和重试", "状态核对"],
    explanation: "在隔离练习环境把依赖变慢、抛错或返回坏数据，检查主流程、清理和告警。只验证抛异常不够，还应验证资源释放、业务状态与恢复后的下一次请求。",
    example: "首次依赖超时，第二次恢复；首次不产生重复写入，后续请求正常且连接可释放。",
    task: "用 fake dependency 注入超时和坏响应，检查失败记录、清理与恢复。",
    output: "注入配置、失败日志与恢复回归。",
    checks: ["注入只影响练习环境", "错误不丢失", "恢复后的状态与功能正确"],
    file: "fault_test.py", code: "class FlakyDependency:\n    def __init__(self): self.calls = 0\n    def call(self):\n        self.calls += 1\n        if self.calls == 1: raise TimeoutError('injected')\n        return {'success': True}\n# TODO：验证失败后的恢复及状态\n",
  }),
  lesson({
    title: "容器、配置与健康检查", goal: "区分镜像构建、容器启动和服务就绪。",
    prerequisites: ["进程与端口", "依赖管理", "环境变量"],
    explanation: "镜像提供运行文件与依赖，容器运行进程。构建成功或进程启动都不等于依赖已就绪。配置通过环境注入，健康检查需要反映服务当前能否工作。",
    example: "容器进程存活但数据库不可用，readiness 失败；测试应等待就绪而非固定 sleep。",
    task: "为练习服务写 Dockerfile、配置样例和健康检查，记录从构建到就绪的检查点。",
    output: "Dockerfile、运行说明与本地健康结果。",
    checks: ["依赖与版本明确", "真实凭据不进镜像", "区分存活与就绪"],
    file: "Dockerfile", code: "FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\n# TODO：声明固定依赖、启动入口和健康检查\n",
  }),
  lesson({
    title: "CI 执行与失败留证", goal: "在代码变更后自动执行检查并保存失败证据。",
    prerequisites: ["Git 提交", "测试退出码", "依赖安装"],
    explanation: "CI 把固定命令放到独立环境执行。关键检查应保留非零退出码，失败后也上传日志。流水线显示绿色只说明配置的检查通过，覆盖范围仍由测试决定。",
    example: "PR → 安装 → 单测 → 产物上传；单测失败时 job 失败，但测试日志仍可下载。",
    task: "为离线包配置 CI，先验证 TODO 失败，再完成实现并确认通过。",
    output: "工作流文件、失败与成功的两次执行证据。",
    checks: ["关键失败阻断 job", "失败日志仍保留", "命令可在本机复现"],
    file: ".github/workflows/quality.yml", code: "name: quality\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with: {python-version: '3.12'}\n      - run: python run_tests.py\n# TODO：保存失败日志并说明检查范围\n",
  }),
  lesson({
    title: "发布门禁与不稳定用例", goal: "让门禁决策可解释、可执行。",
    prerequisites: ["风险分级", "回归测试", "CI"],
    explanation: "门禁应对应明确风险和证据。关键测试失败要阻断，结果缺失不能当通过。flaky 用例需要隔离原因、责任人和期限，反复重跑到绿会掩盖真实问题。",
    example: "关键失败 1 → block；证据未收集 → review；关键失败 0 且证据完整 → pass。",
    task: "实现离线包 release_gate，再为 flaky 隔离写责任与到期处理。",
    output: "决策函数、边界测试和隔离记录。",
    checks: ["关键失败必阻断", "缺证据不通过", "隔离有责任和到期动作"],
    file: "src/lab.py", code: "def release_gate(critical_failures, evidence_complete):\n    # TODO：返回 block/review/pass\n    raise NotImplementedError\n",
  }),
  lesson({
    title: "灰度、回滚与数据兼容", goal: "验证发布失败后的恢复路径。",
    prerequisites: ["版本与配置", "指标基线", "数据库兼容"],
    explanation: "灰度需要明确流量范围、观察窗口与停止条件。回滚代码不一定能撤销已经产生的数据和外部动作，因此要检查旧代码是否能读取新数据，以及补偿和配置回退。",
    example: "v2 新增可选字段；灰度错误率越线 → 回 v1；v1 仍能读取 v2 产生的记录。",
    task: "写出灰度准入、停止、回滚和回滚后核对的演练表。",
    output: "灰度回滚清单与双版本数据兼容样例。",
    checks: ["停止阈值有来源", "检查数据兼容", "回滚后核对关键业务"],
    file: "rollout.yaml", code: "candidate: v2\nbaseline: v1\ntraffic: 0.05\nobservation_window: TODO\nstop_conditions: []\nrollback_checks: []\n",
  }),
  lesson({
    title: "复盘与可执行改进", goal: "把一次故障转成可验证的预防措施。",
    prerequisites: ["故障时间线", "根因与触发条件"],
    explanation: "复盘区分影响、触发、根因和发现缺口。改进项要有责任人、截止时间和验收方式；新增测试、监控或约束后，应能证明同类故障会被提前发现或阻止。",
    example: "重复消费导致重复扣减 → 唯一业务键与事务；验证重复投递只生成一次流水。",
    task: "用库存幂等案例写时间线、根因、发现缺口及两项改进，并分别写验收测试。",
    output: "一页复盘、改进责任表和回归证据。",
    checks: ["根因有证据", "改进可验收", "区分个人修复与系统预防"],
    file: "postmortem.md", code: "# 影响与时间线\nTODO\n# 根因及证据\nTODO\n# 改进、责任人、期限与验收\nTODO\n",
  }),
  lesson({
    title: "工程交付与面试讲述", goal: "清楚说明个人贡献、结果和适用范围。",
    prerequisites: ["前八关", "项目复现", "技术表达"],
    explanation: "项目展示应包含问题、约束、方案取舍、实现、验证和实际收益。提升比例需要真实基线与一致口径；尚未度量就明确标记待采集。能回答追问比展示很多页面更重要。",
    example: "一次回归从 40 分钟到 25 分钟，必须同时报告相同用例集、环境、失败复核耗时及样本次数。",
    task: "整理项目 README 和五分钟讲述，给出一个失败案例与替代方案；由他人按说明复现。",
    output: "可运行项目、一页项目说明与实际度量表。",
    checks: ["个人贡献清楚", "收益可追溯且无编造数字", "他人能复现关键结果"],
    file: "portfolio.md", code: "| 问题 | 约束 | 方案 | 个人贡献 | 验证 | 收益口径 | 局限 |\n| TODO | TODO | TODO | TODO | TODO | 待采集 | TODO |\n",
  }),
];

export const apiCareerExtensions = [
  lesson({
    title: "契约兼容与变更回归", goal: "识别字段变更对新旧消费者的影响。",
    prerequisites: ["HTTP 与 Schema", "版本与消费者"],
    explanation: "字段新增、删除、类型和语义变化对消费者的影响不同。兼容性要在具体解析规则下判断，保留旧请求和旧消费者回归，检查默认值及错误响应。",
    example: "v1 amount 为整数；v2 amount 改为字符串，即使内容都是 10，也可能破坏旧消费者。",
    task: "为新增可选字段、删除必填字段、类型变化各写兼容性用例。",
    output: "v1/v2 契约、旧消费者用例与差异报告。",
    checks: ["有旧消费者验证", "覆盖失败响应", "不以 HTTP 200 代替兼容结论"],
    file: "compatibility.py", code: "old_payload = {'amount': 10}\nnew_payload = {'amount': '10'}\n# TODO：用消费者契约检查类型及语义变化\n",
  }),
  lesson({
    title: "流量回放与差异比对", goal: "用脱敏样本比较变更前后的行为。",
    prerequisites: ["固定输入", "副作用隔离", "结果归一化"],
    explanation: "回放前需要去除凭据与真实数据，并隔离写操作。只忽略明确允许变化的字段；排序、金额、权限和业务状态差异都需要保留。样本应按风险分桶并记录来源。",
    example: "baseline {amount:10, timestamp:1}；candidate {amount:9, timestamp:2}；允许忽略 timestamp，金额差异仍须报告。",
    task: "编写差异比对，覆盖相等、允许变化、业务变化和缺字段四种情况。",
    output: "脱敏样本、忽略规则、比对函数与差异记录。",
    checks: ["关键业务字段不被忽略", "缺字段明确失败", "回放无真实写入"],
    file: "replay_diff.py", code: "def compare(baseline, candidate, ignored_keys=frozenset({'timestamp'})):\n    # TODO：仅忽略白名单，保留缺字段及业务值差异\n    raise NotImplementedError\n",
  }),
];

export const aiCareerExtensions = [
  lesson({
    title: "AI 用例生成的覆盖与漏判", goal: "验证 AI 生成用例能否识别真实风险。",
    prerequisites: ["独立验收标准", "评测集分桶", "缺陷检出"],
    explanation: "用例数量不能直接代表质量。用人工核对的规则清单和带已知缺陷的版本评估覆盖、无效用例及漏检；生成输入与隐藏验收分开，避免从答案生成测试再自证。",
    example: "独立规则 4 条，生成用例覆盖 3 条；注入 2 个缺陷只检出 1 个。分别报告规则覆盖与缺陷检出。",
    task: "固定五条需求与人工标准，对比人工基线和 AI 方案，统计覆盖、无效用例及复核时间。",
    output: "独立标准、生成产物、缺陷检出表和人工复核记录。",
    checks: ["有独立预期", "包含漏检与无效项", "耗时计入人工复核"],
    file: "generation-evaluation.csv", code: "requirement_id,rule_id,covered,defect_id,detected,review_minutes\nR1,B1,TODO,D1,TODO,TODO\n",
  }),
  lesson({
    title: "智能归因的准确率与人工复核", goal: "衡量失败分类的误判、漏判和覆盖。",
    prerequisites: ["故障分类", "混淆矩阵", "precision 与 recall"],
    explanation: "先用人工核验标签建立基线，再比较预测。关键类 precision 检查预测有多少正确，recall 检查实际问题找到多少；无证据样本应允许弃权，不能强行归因。",
    example: "真实标签 [business,business,env,env]，预测 [business,env,business,env]；business 的 TP=1、FP=1、FN=1。",
    task: "实现离线包 classification_metrics，补充弃权率、人工复核量和关键类漏判分析。",
    output: "固定标签、分类指标、失败样例与复核表。",
    checks: ["precision/recall 口径正确", "分母为零返回 None", "预测与真实标签长度不符时报错"],
    file: "src/lab.py", code: "def classification_metrics(actual, predicted, positive='business'):\n    # TODO：返回 tp/fp/fn/precision/recall\n    raise NotImplementedError\n",
  }),
  lesson({
    title: "Judge 校准与评测集隔离", goal: "验证自动评分与人工标准的一致程度。",
    prerequisites: ["评分规则", "样本版本", "数据泄漏"],
    explanation: "评分模型也会出错。先用人工判定样本检查一致性和典型分歧，固定 rubric 与 judge 版本。开发样本、调参样本和最终测试样本应隔离，反复看测试答案调提示词会夸大泛化效果。",
    example: "20 个校准样本与人工一致 16 个，仍须分析另外 4 个分歧；隐藏测试集不能用于修改提示词。",
    task: "为固定十组回答制定评分规则，双人核对分歧，并记录开发、校准、测试数据版本。",
    output: "评分规则、分歧分析和数据隔离清单。",
    checks: ["Judge 版本与规则固定", "分歧有人工复核", "隐藏测试样本未进入调参输入"],
    file: "judge-calibration.yaml", code: "rubric_version: v1\njudge_version: TODO\ndatasets:\n  development: []\n  calibration: []\n  held_out_test: []\ndisagreements: []\n",
  }),
];

export const qualityCareerExtensions = [
  lesson({
    title: "质量度量与技术举证", goal: "把工程投入转化为可解释的质量收益。",
    prerequisites: ["统计窗口", "基线与对照", "技术复盘"],
    explanation: "回归耗时、逃逸缺陷、误报、维护成本需要明确分母、时间窗和版本。测试数量或覆盖率不能单独替代质量结论。个人贡献应说明负责的设计、实现、验证和推广范围。",
    example: "回归 40→25 分钟仅在用例、环境和失败复核范围一致时可比较；新增维护成本也需记录。",
    task: "为测试工作台建立指标字典，采集一次基线与一次变更结果，形成可追溯项目说明。",
    output: "指标字典、原始样本、对比报告及个人贡献说明。",
    checks: ["指标有分母与窗口", "保留风险和维护成本", "未采集数据不编造提升比例"],
    file: "quality-metrics.md", code: "| 指标 | 分子/分母 | 时间窗 | 样本版本 | 基线 | 变更后 | 维护成本 |\n| 回归耗时 | TODO | TODO | TODO | 待采集 | 待采集 | TODO |\n",
  }),
];

export const careerModules: LearningModule[] = [
  { id: "coding-debugging", sigil: "DEV", title: "独立编码与调试", subtitle: "从函数契约、数据结构和断点，走到独立修改、代码阅读与可复现项目。", status: "blueprint", sourceIds: ["foundation.python", "foundation.pytest", "foundation.git"], roadmap: coding, updateRule: "按可独立交付的编码能力组织课程，用反例、调试与干净环境验证。" },
  { id: "backend-foundations", sigil: "SYS", title: "计算机与服务端基础", subtitle: "从进程、网络和 SQL，走到事务、并发、缓存、消息与跨系统一致性。", status: "blueprint", sourceIds: ["foundation.http", "foundation.mysql", "foundation.python", "foundation.opentelemetry"], roadmap: backend, updateRule: "以协议和数据库官方原理建立主线；模拟实验与真实系统验证分别举证。" },
  { id: "delivery-debugging", sigil: "OPS", title: "故障定位与工程交付", subtitle: "从失败分层与证据关联，走到容器、CI、灰度回滚和技术举证。", status: "blueprint", sourceIds: ["foundation.python", "foundation.opentelemetry", "foundation.docker", "foundation.ci", "foundation.git"], roadmap: delivery, updateRule: "以可复现故障、可执行门禁和实际恢复记录检验工程交付能力。" },
];

export const careerChapterPlans = {
  "coding-debugging": [
    { title: "契约与数据结构", levelIds: [1, 2, 3] },
    { title: "边界、调试与工程", levelIds: [4, 5, 6] },
    { title: "代码阅读与独立交付", levelIds: [7, 8] },
  ],
  "backend-foundations": [
    { title: "系统、网络与权限", levelIds: [1, 2, 3] },
    { title: "数据、事务与并发", levelIds: [4, 5, 6, 7] },
    { title: "缓存、消息与恢复", levelIds: [8, 9, 10] },
    { title: "微服务与一致性", levelIds: [11, 12] },
  ],
  "delivery-debugging": [
    { title: "诊断与故障恢复", levelIds: [1, 2, 3] },
    { title: "环境与持续交付", levelIds: [4, 5, 6, 7] },
    { title: "复盘与工程举证", levelIds: [8, 9] },
  ],
};

export const careerStages = [
  { title: "先能独立写和改", priority: "P0 · 编码基础", courseIds: ["python-framework", "coding-debugging"], output: "交付一个能解释、修改和调试的 Python 项目。" },
  { title: "看懂请求到数据的链路", priority: "P0 · 系统基础", courseIds: ["backend-foundations"], output: "验证事务、重复、并发和部分成功下的数据一致性。" },
  { title: "把验证做成工程", priority: "P0 → P1 · 测试开发", courseIds: ["api-automation", "quality-engineering"], output: "交付可回归的接口测试、兼容性检查与质量策略。" },
  { title: "能定位，也能交付", priority: "P1 · 稳定性与交付", courseIds: ["delivery-debugging", "performance-testing"], output: "复现并定位故障，接入 CI，留下恢复和容量证据。" },
  { title: "形成 AI 质量特色", priority: "P1 · AI 应用与评测", courseIds: ["python-agent-fast-track", "ai-testing"], output: "用固定样本评价 Agent 质量与 AI 测试提效。" },
];

export const coursePreparation: Record<string, string[]> = {
  "coding-debugging": ["python-framework"],
  "backend-foundations": ["coding-debugging"],
  "api-automation": ["python-framework", "backend-foundations"],
  "quality-engineering": ["coding-debugging", "backend-foundations"],
  "delivery-debugging": ["backend-foundations", "api-automation"],
  "performance-testing": ["backend-foundations", "delivery-debugging"],
  "python-agent-fast-track": ["coding-debugging"],
  "ai-testing": ["api-automation", "quality-engineering", "python-agent-fast-track"],
  "ui-automation": ["python-framework", "api-automation"],
};

export const labCourses = new Set(["coding-debugging", "backend-foundations", "delivery-debugging", "ai-testing"]);

const coreExplanations: Record<string, Array<[string, string]>> = {
  "api-automation": [
    ["HTTP 状态描述协议层结果，响应体描述业务结果，二者都要按契约断言。", 'HTTP 200 {"success":false,"code":"INVALID"} 仍是业务失败。'],
    ["DTO 描述输入输出的数据边界；字段可省略与值为 null 是两种约束。验证必填、类型、范围及成功失败分支。", "skuId 非空、adjustAmount 整数且不为 0；成功响应必须有 data.flowNo。"],
    ["fixture 负责创建与释放 Client，业务 action 使用注入实例。设置 timeout 并使用 MockTransport，可让测试在无网络下重复执行。", "创建 client → yield 给用例 → 无论断言是否通过都关闭。"],
    ["结果对象统一保留请求、响应、输出与错误。观察失败响应时不应过早抛掉证据；严格模式的异常也需要带上下文。", "HTTP 失败、业务失败和成功都保留 request、response 与 error。"],
    ["YAML 表达流程数据，Schema 校验结构，registry 决定允许调用的 action。safe_load 不会替你校验业务结构，动作执行还需边界控制。", "steps 中 action=stock.adjust，save_as=adjust_result；清理写在 teardown.always。"],
    ["registry 将名字映射到允许的函数。解析、签名校验与执行是不同阶段，未知 action 应在产生副作用之前失败。", "stock.adjust → adapters:adjust_stock；未知 stock.remove 立即报含 action 名的错误。"],
    ["Provider 提供数据访问，业务层选择满足条件的数据。参数化查询避免拼接输入，fake provider 让测试不依赖真实数据库。", "Provider 返回两行；业务层选 available>=100 且 locked=false 的行。"],
    ["context 保存步骤结果，字段路径解析器读取输出再绑定下一请求。缺路径应明确报错，不能默认为空值继续写入。", "create_result.response.data.flowNo → query 请求 flowNo；缺 data 时停止。"],
    ["主断言与清理是两个结果。清理无论成败都执行，但清理异常不能覆盖主异常；证据应同时保存两者并脱敏。", "primary_error=库存不符，cleanup_error=清理超时；报告以主错误为首要原因。"],
    ["完整链路把数据准备、动作绑定、业务断言、清理和证据组合。先验证可收集和离线执行，再单独确认真实环境及业务结果。", "collect-only 检查导入；Mock 执行验证流程；真实 HTTP/DB 需要额外运行与读回。"],
  ],
  "quality-engineering": [
    ["测试检验产物，质量控制判断要求是否满足，质量保障改进持续产出质量的过程。说明每项活动的目的、责任和证据。", "代码评审、业务测试、发布复盘分别影响不同质量环节。"],
    ["优先级来自发生可能性和影响，测试层级则取决于缺陷最便宜且可信的发现位置。剩余风险与不测范围需明确。", "金额计算放到单元层，接口契约放到集成层，核心交易保留端到端。"],
    ["黑盒按外部规则设计，白盒按代码路径设计，灰盒结合内部结构和数据约束。三种视角可能互补，不应只改标签。", "金额边界是黑盒；条件分支是白盒；持久化与消息关联是灰盒。"],
    ["分支覆盖关注判断的不同出口，输入应能映射到真实路径与期望结果。异常出口也要单独识别。", "if amount==0 的 True/False 都执行过，不代表所有金额组合都正确。"],
    ["隔离网络和存储，使业务逻辑在确定条件下运行。fake 代替依赖、spy 记录可观察调用，避免 mock 掉正在验证的规则。", "库存不足时真实 service 拒绝，fake repository 不更新，notifier 无调用。"],
    ["覆盖率说明哪些代码执行过，断言决定错误能否被发现。结合分支缺口与业务风险补测试，百分比仅是线索。", "两组测试都是 100% 行覆盖，但其中一组没有断言负数被拒绝。"],
    ["变异测试主动修改实现，检查已有测试能否识别错误。存活项可能来自缺断言、缺输入或等价修改，需要分析而非只追分。", "把 amount<0 改为 amount<=0，边界 0 的测试应识别行为变化。"],
    ["静态工具与人工评审分别发现类型、资源、安全和设计问题。每条结论需要准确位置、触发条件和可验证影响。", "SQL 直接拼接输入是风险；变量命名偏好通常不是发布阻断。"],
    ["门禁把风险规则变成自动决策。按 PR、主干、发布阶段递增检查成本，关键失败不放行，flaky 需要有期限的治理。", "关键测试失败 → block；缺少必要证据 → review；不能重跑到绿就忽略失败。"],
    ["质量方案将高风险项映射到预防、检测、发布控制和线上监控。每项活动要有角色、环境、数据和交付证据。", "重复扣减风险 → 幂等设计评审、重投测试、门禁与异常流水监控。"],
  ],
  "ai-testing": [
    ["智能体可能用不同表达完成同一任务，结果、重复稳定性和过程约束需要分别判断。正确答案也可能伴随危险操作。", "回答库存正确但越权修改数据，应按过程红线判失败。"],
    ["先声明任务类型、边界与风险，才能选择测试规模和判据。知识问答重来源，工具执行还需验证状态变化和权限。", "工单查询工具只读；库存调整工具产生写入，需核对幂等与授权。"],
    ["评测样本需要独立来源、人工或规则确认的期望以及唯一版本。按主路径、风险和历史回归分桶，避免只采容易样本。", "core 查询成功、risk 越权查询、regression 历史参数丢失分别留样。"],
    ["业务门禁回答能否交付，诊断指标回答哪里失败。为指标写出分子分母、裁判和版本；自动评分要与人工标准校准。", "任务成功率是结果；检索命中、工具参数错误和时延可辅助诊断。"],
    ["固定样本和采样配置，重复运行观察波动。比较版本时保留样本量、分布和基线变化；固定 seed 也不能假定系统绝对确定。", "同一任务重复 5 次，报告成功次数与失败轨迹，再比较另一版本。"],
    ["RAG 评测需拆开检索、引用和事实支持。无知识时的合理拒答、知识更新和文档权限均会影响结果。", "召回文档无该金额，回答却断言精确金额，需标注事实无支持。"],
    ["以 checkpoint 保存路由、工具、参数、状态和最终结果，才能把端到端失败回溯到具体步骤。多轮任务还需检查上下文传递。", "trace T1：路由正确 → 工具正确 → 订单 ID 错误 → 最终查询失败。"],
    ["安全红线独立于平均质量分。构造提示注入、越权、隐私泄漏等样本，同时验证拦截及未发生的副作用。", "恶意文档要求导出凭据：应拒绝，工具轨迹不得出现导出动作。"],
    ["效果、时延、吞吐、成功率和成本需在同一负载下报告。超时、重试与降级可能改善体验，也可能造成重复动作和费用上升。", "并发提高后成本与 P95 上升，需结合质量成功率判断是否可接受。"],
    ["门禁需要绝对阈值、相对基线和不可接受事件；阈值由业务风险确定。失败样本版本化回流，修复后必须回归。", "质量达标但出现一次未授权写入，仍触发红线阻断并保留 trace。"],
  ],
};

export function withCareerSupport(courseId: string, roadmap: LearningRoadmapDetail[]): LearningRoadmapDetail[] {
  return roadmap.map((item, index) => {
    const support = coreExplanations[courseId]?.[index];
    return support ? { ...item, goal: item.question, explanation: support[0], example: support[1] } : item;
  });
}
