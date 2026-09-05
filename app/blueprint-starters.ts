import type { LearningRoadmapDetail } from "./learning-registry";

export type BlueprintStarter = {
  files: string[];
  code: string;
  focus: string[];
};

type StarterSeed = {
  files: string[];
  body: string;
  focus: string[];
};

const uiSeeds: StarterSeed[] = [
  { files: ["fixtures/login.html", "notes/dom-map.md"], body: `<form aria-label="登录">\n  <label for="username">用户名</label>\n  <input id="username" name="username" />\n  <label for="password">密码</label>\n  <input id="password" name="password" type="password" />\n  <button type="submit">登录</button>\n</form>\n\n| 节点 | role | 可访问名称 | 事件 |\n| TODO | TODO | TODO | TODO |`, focus: ["填写四个节点的结构表", "区分 DOM 属性、文字和事件"] },
  { files: ["fixtures/login.html", "tests/test_login_locators.py"], body: `def test_login_locators(page):\n    page.set_content(LOGIN_HTML)\n    username = page.get_by_label("TODO")\n    password = page.get_by_label("TODO")\n    submit = page.get_by_role("button", name="TODO")\n    # TODO：再写一个 get_by_test_id 定位示例`, focus: ["只填写三个可访问名称", "说明 test id 的使用边界"] },
  { files: ["fixtures/products.html", "tests/test_product_card.py"], body: `def test_adjust_only_sku_001(page):\n    page.set_content(PRODUCTS_HTML)\n    target_card = page.get_by_role("article").filter(has_text="TODO")\n    adjust_button = target_card.get_by_role("button", name="TODO")\n    adjust_button.click()\n    # TODO：证明另一张商品卡没有被操作`, focus: ["填写目标 SKU 和按钮名称", "补充作用域断言"] },
  { files: ["fixtures/save-form.html", "tests/test_save_state.py"], body: `def test_save_button_state(page):\n    page.set_content(SAVE_FORM_HTML)\n    save = page.get_by_role("button", name="保存")\n    expect(save).to_be_disabled()\n    page.get_by_label("名称").fill("TODO")\n    expect(save).to_be_enabled()`, focus: ["填写触发状态变化的数据", "不得添加固定 sleep"] },
  { files: ["fixtures/inventory-dialog.html", "tests/test_dialog.py"], body: `def test_inventory_dialog(page):\n    page.set_content(INVENTORY_DIALOG_HTML)\n    page.get_by_role("button", name="调整库存").click()\n    dialog = page.get_by_role("dialog", name="TODO")\n    expect(dialog).to_be_visible()\n    # TODO：填写数量、关闭弹窗、断言 dialog 不再可见`, focus: ["填写 dialog 的可访问名称", "完成关闭后的状态断言"] },
  { files: ["fixtures/inventory-table.html", "tests/test_inventory_row.py"], body: `def test_read_target_inventory(page):\n    page.set_content(INVENTORY_TABLE_HTML)\n    row = page.get_by_role("row").filter(has_text="TODO").filter(has_text="TODO")\n    available = row.get_by_role("cell", name="TODO")\n    # TODO：读取并断言可用库存`, focus: ["填写 skuId、仓库和库存值", "不要使用 nth() 固定行号"] },
  { files: ["pages/login_page.py", "pages/inventory_page.py", "tests/test_adjust.py"], body: `class LoginPage:\n    def __init__(self, page):\n        self.page = page\n        self.username = page.get_by_label("用户名")\n        self.submit = page.get_by_role("button", name="登录")\n\n    def login(self, username, password):\n        # TODO：封装登录交互，不写业务断言\n        ...\n\n+def test_adjust_inventory(login_page, inventory_page):\n    # TODO：调用页面动作，并把业务结果断言留在测试中\n    ...`, focus: ["完成两个小型页面动作", "业务断言不得塞入 Page Object"] },
  { files: ["tests/test_without_sleep.py"], body: `def test_submit_without_fixed_sleep(page):\n    page.get_by_role("button", name="提交").click()\n    # TODO：等待可观察的页面状态\n    expect(page.get_by_role("status")).to_have_text("TODO")\n    # TODO：必要时用 expect_response 等待明确响应`, focus: ["替换三处固定等待", "每个等待都指向可观察结果"] },
  { files: ["conftest.py", "tests/test_isolated_context.py"], body: `@pytest.fixture\ndef app_context(browser, storage_state_path):\n    context = browser.new_context(storage_state=storage_state_path)\n    page = context.new_page()\n    yield page\n    # TODO：失败时也执行场景数据清理\n    context.close()\n\n+def test_first_user_is_isolated(app_context): ...\ndef test_second_user_is_isolated(app_context): ...`, focus: ["完成 always 清理", "证明两条用例的 BrowserContext 隔离"] },
  { files: ["conftest.py", "evidence/ui_case_001.json"], body: `evidence = {\n    "case_id": "ui_case_001",\n    "environment": "local-mock",\n    "failed_step": None,\n    "trace": None,\n    "screenshot": None,\n    "console": [],\n    "network": [],\n    "error": None,\n}\n# TODO：只在失败时填入 trace、截图与脱敏错误`, focus: ["填写采集时机", "补充敏感信息脱敏规则"] },
];

const apiSeeds: StarterSeed[] = [
  { files: ["contracts/stock-adjust.md"], body: `request = {\n    "method": "POST",\n    "path": "/stock/adjust",\n    "headers": {"content-type": "application/json"},\n    "body": {"skuId": "SKU-001", "adjustAmount": 10},\n}\nresponse = {"http_status": 200, "body": {"success": True}}\n# TODO：补充 HTTP 500 与 HTTP 200 业务失败两行`, focus: ["填写两种失败响应", "明确 HTTP 与业务状态的区别"] },
  { files: ["schemas/stock_adjust.py", "tests/test_schema.py"], body: `class AdjustRequest(BaseModel):\n    skuId: str\n    adjustAmount: int\n\n    # TODO：skuId 非空；adjustAmount 不能为 0\n\n+class SuccessResponse(BaseModel):\n    success: Literal[True]\n    data: dict\n    # TODO：约束 data.flowNo\n\n+class FailureResponse(BaseModel):\n    success: Literal[False]\n    code: str`, focus: ["补齐三个字段约束", "为缺字段和错类型写反例"] },
  { files: ["conftest.py", "tests/test_client.py"], body: `@pytest.fixture\ndef api_client():\n    transport = httpx.MockTransport(mock_handler)\n    with httpx.Client(\n        base_url="https://example.test",\n        transport=transport,\n        timeout=2.0,\n    ) as client:\n        yield client\n\n+# TODO：写两条测试并证明退出 with 后 client 已关闭`, focus: ["完成 mock_handler", "补充关闭证明"] },
  { files: ["framework/action_result.py", "actions/stock.py", "tests/test_stock_action.py"], body: `@dataclass\nclass ActionResult:\n    success: bool\n    request: dict | None = None\n    response: dict | None = None\n    outputs: dict = field(default_factory=dict)\n    error: str | None = None\n\n+def adjust_stock(request, context, *, strict=False):\n    # TODO：成功、业务失败、HTTP 失败都返回统一结构\n    ...`, focus: ["实现 strict 与 observe 分支", "验证实例不共享可变字段"] },
  { files: ["cases/stock_adjust.yaml"], body: `name: stock_adjust_flow\ncommon_flow:\n  setup:\n    - action: fixture.resolve\n      save_as: fixture\n  steps:\n    - action: request.build\n      save_as: request\n    - action: stock.adjust\n      save_as: result\n  assertions:\n    # TODO：声明业务结果断言\n  teardown:\n    always:\n      - action: client.close`, focus: ["填写 assertions", "解释三个 save_as 的作用"] },
  { files: ["framework/registry.py", "framework/runner.py", "tests/test_dispatch.py"], body: `REGISTRY = {\n    "fixture.resolve": resolve_fixture,\n    "request.build": build_request,\n}\n\n+def run_entry(entry, context):\n    action_name = entry["action"]\n    if action_name not in REGISTRY:\n        raise KeyError(f"未绑定 action: {action_name}")\n    # TODO：统一以 entry、context 调用并处理 save_as\n    ...`, focus: ["完成调用和 save_as", "补充未知 action 反例"] },
  { files: ["providers/inventory.py", "requirements/after_sale.py", "tests/test_selection.py"], body: `class InventoryProvider(Protocol):\n    def query(self, sql: str, params: tuple) -> list[dict]: ...\n\n+class FakeInventoryProvider:\n    def query(self, sql, params):\n        return FIXED_ROWS\n\n+def select_legal_rows(rows):\n    # TODO：available >= 100 且 locked is False\n    ...`, focus: ["填写需求层筛选", "无合法数据时抛明确错误"] },
  { files: ["framework/binding.py", "tests/test_binding.py"], body: `context = {\n    "create_result": {\n        "response": {"data": {"flowNo": "FLOW-001"}}\n    }\n}\n\n+def resolve_path(context, expression):\n    # TODO：逐段读取 create_result.response.data.flowNo\n    ...\n\n+query_request = {"flowNo": resolve_path(context, "create_result.response.data.flowNo")}`, focus: ["完成路径读取", "补充缺失路径失败测试"] },
  { files: ["framework/evidence.py", "tests/test_cleanup_evidence.py"], body: `evidence = {\n    "request": None,\n    "response": None,\n    "primary_error": None,\n    "cleanup_error": None,\n    "teardown": [],\n}\ntry:\n    # TODO：执行业务动作和结构化断言\n    ...\nexcept Exception as error:\n    evidence["primary_error"] = repr(error)\nfinally:\n    # TODO：清理失败单独记录，不能覆盖 primary_error\n    ...`, focus: ["保存主错误", "独立记录清理错误和结果"] },
  { files: ["cases/api_boss_after_sale.yaml", "adapters.py", "tests/test_boss.py", "evidence/result.json"], body: `case_id: api_boss_after_sale\nflow:\n  setup: [fixture.resolve]\n  steps: [request.build, stock.adjust]\n  assertions: [result.success]\n  teardown:\n    always: [client.close]\n\n+# adapters.py：TODO 绑定全部 action\n+# test_boss.py：TODO 用 MockTransport 跑成功和失败链路\n+# result.json：TODO 保存统一 evidence 字段`, focus: ["补齐 action 绑定", "跑通离线成功/失败链路并保存证据"] },
];

const aiSeeds: StarterSeed[] = [
  { files: ["evals/test_plan.yaml"], body: `case_id: agent_001\ninput: "查询 SKU-001 库存"\nchecks:\n  result:\n    # TODO：定义语义上必须满足的结果\n  stability:\n    runs: 3\n    # TODO：定义三次运行允许的差异\n  process:\n    required_events: []  # TODO：填写路由/工具证据`, focus: ["填写三层检查", "说明为何不能只 exact match"] },
  { files: ["capability/statement.yaml"], body: `agent_id: inventory_assistant\ntype: null       # TODO：qa_rag/data_query/tool_action/...\narchitecture: null\nrisk_level: null # TODO：E0/E1/E2\nin_scope: []\nout_of_scope: []\nrequired_evidence: []`, focus: ["选择类型和风险级别", "填写能力边界与不测范围"] },
  { files: ["datasets/eval_set.jsonl"], body: `{"id":"core-001","bucket":"core","input":"...","expected":"TODO","source":"TODO","version":"v1"}\n{"id":"risk-001","bucket":"risk","input":"...","expected":"TODO","source":"TODO","version":"v1"}\n{"id":"reg-001","bucket":"regression","input":"...","expected":"TODO","source":"TODO","version":"v1"}`, focus: ["填写可追溯来源和期望判定", "解释三个分桶的比例"] },
  { files: ["evals/metrics.yaml"], body: `headline_gate:\n  name: null       # TODO：1 个 G 层头牌指标\n  formula: null\n  threshold: null\ndiagnostics:\n  - name: null     # TODO：2 个 T 层诊断指标\n    owner: null\n  - name: null\n    owner: null\njudge:\n  version: null`, focus: ["定义 1 个门禁和 2 个诊断指标", "明确裁判及版本"] },
  { files: ["evals/repeat_run.py", "reports/baseline_delta.json"], body: `RUNS = 5\nSAMPLING = {"temperature": 0, "seed": 42}\n\n+def compare_versions(samples, baseline, candidate):\n    # TODO：计算成功率、波动和相对基线 delta\n    return {"n": len(samples), "baseline": {}, "candidate": {}, "delta": {}}`, focus: ["补齐统计口径", "报告样本量和采样配置"] },
  { files: ["datasets/grounding.jsonl", "graders/grounding.py"], body: `SCENARIOS = ["normal_retrieval", "wrong_retrieval", "empty_retrieval", "unauthorized_source"]\n\n+def grade_grounding(sample, response, retrieved_docs):\n    return {\n        "retrieval_ok": None,  # TODO\n        "citation_ok": None,\n        "facts_supported": None,\n        "should_refuse": None,\n        "failure_layer": None,\n    }`, focus: ["填写四项判定", "把失败归到检索、生成或知识源"] },
  { files: ["evals/trace_checkpoints.yaml"], body: `trace_id: TRACE-001\ncheckpoints:\n  - stage: routing\n    expected: null\n  - stage: tool_selection\n    expected: null\n  - stage: tool_arguments\n    expected: null\n  - stage: context_handoff\n    expected: null\n  - stage: final_result\n    expected: null`, focus: ["填写每个 checkpoint 的可观察结果", "设计一个错误归因反例"] },
  { files: ["datasets/security.jsonl", "gates/security.yaml"], body: `red_lines:\n  - id: prompt_injection\n    decision: block\n    evidence: []\n  - id: pii_leakage\n    decision: block\n    evidence: []\n  - id: unauthorized_tool_call\n    decision: block\n    evidence: []\n# TODO：为每条红线补输入、期望拦截和证据`, focus: ["补齐三类对抗样本", "红线不得被平均分抵消"] },
  { files: ["load/agent_profile.yaml", "reports/performance.json"], body: `stages:\n  - {name: warmup, concurrency: 1, duration_s: 60}\n  - {name: steady, concurrency: 10, duration_s: 300}\nmetrics:\n  quality: null\n  ttft_p95_ms: null\n  e2el_p95_ms: null\n  success_rate: null\n  cost_per_run: null\n# TODO：填写阈值来源、超时、重试和降级行为`, focus: ["补齐四类阈值", "关联质量、时延、成功率和成本"] },
  { files: ["quality/agent_release_gate.yaml"], body: `decision: null  # pass / conditional_pass / fail\nabsolute_gates: []\nbaseline_delta_gates: []\nred_line_gates: []\ntrace_requirements: []\nregression_dataset_version: null\nowners: {}\nfeedback_loop: []\n# TODO：填写可执行门禁和失败后的回归路径`, focus: ["完成三类门禁", "为证据、责任人和回流建立闭环"] },
];

const performanceSeeds: StarterSeed[] = [
  { files: ["data/timeline.csv", "analysis/metrics.py"], body: `WINDOW_SECONDS = 10\nrequests = FIXED_TIMELINE\n\n+peak_concurrency = None  # TODO\nrps = None               # TODO\navg_latency_ms = None    # TODO\n\n+result = {"window_s": WINDOW_SECONDS, "peak_concurrency": peak_concurrency, "rps": rps, "avg_latency_ms": avg_latency_ms}`, focus: ["填写三个计算公式", "保留单位和统计窗口"] },
  { files: ["data/latencies.json", "analysis/percentiles.py"], body: `samples_ms = FIXED_100_SAMPLES\n\n+def nearest_rank(values, percentile):\n    ordered = sorted(values)\n    rank = None  # TODO：ceil(percentile * n)\n    return ordered[rank - 1]\n\n+result = {"p50": None, "p95": None, "p99": None, "mean": None}`, focus: ["完成 nearest-rank", "填写四个可复算结果"] },
  { files: ["load/profile.yaml"], body: `target_rps: 120\nbusiness_mix:\n  login: 0.10\n  query: 0.70\n  submit: 0.20\nstages:\n  - {name: warmup, target_rps: null, duration: null}\n  - {name: steady, target_rps: null, duration: null}\n  - {name: ramp_down, target_rps: null, duration: null}\n# TODO：填写各阶段目标和持续时间`, focus: ["分配三个阶段", "证明业务权重合计为 100%"] },
  { files: ["locustfile.py", "tests/test_task_weights.py"], body: `class InventoryUser(HttpUser):\n    host = "http://127.0.0.1:8000"\n    wait_time = between(1, 2)\n\n+    @task(1)\n    def login(self): ...\n\n+    @task(7)\n    def query(self): ...\n\n+    @task(2)\n    def submit(self): ...\n\n+# TODO：为每个本地请求填写业务名称`, focus: ["填写三个本地请求", "验证任务权重 1:7:2"] },
  { files: ["load/data_pool.py", "tests/test_data_pool.py"], body: `class DataPool:\n    def __init__(self, items):\n        self.available = Queue()\n        for item in items:\n            self.available.put(item)\n\n+    def acquire(self):\n        # TODO：无等待领取；耗尽时明确失败\n        ...\n\n+    def release(self, item):\n        # TODO：归还并防止重复归还\n        ...`, focus: ["完成并发安全领取/归还", "测试 50 份数据与耗尽行为"] },
  { files: ["load/step_and_soak.yaml"], body: `stop_conditions:\n  error_rate_gt: 0.02\nstages:\n  - {rps: 20, duration_min: 10}\n  - {rps: 50, duration_min: 10}\n  - {rps: 100, duration_min: 10}\n  - {rps: 150, duration_min: 10}\n  - {rps: 100, duration_min: 120, kind: soak}\n# TODO：填写每阶观察指标和容量拐点判定`, focus: ["补齐观察指标", "区分阶梯拐点与长期泄漏"] },
  { files: ["load/distributed.yaml", "checks/worker_health.py"], body: `topology:\n  master: 1\n  workers: 3\nrequirements:\n  script_version: null\n  minimum_workers: 3\naggregation_owner: master\n\n+def ready(worker_versions):\n    # TODO：数量不足或版本不一致时返回 False\n    ...`, focus: ["完成启动门禁", "补充 worker 丢失测试"] },
  { files: ["observability/trace_contract.yaml"], body: `request_headers:\n  x-trace-id: TRACE-001\ntimestamps:\n  timezone: UTC\nlinks:\n  client_sample: null\n  app_span: null\n  db_span: null\n  error_log: null\n# TODO：把同一慢请求的四类证据按 trace_id 和时间窗关联`, focus: ["填写证据链接字段", "说明敏感信息处理"] },
  { files: ["analysis/capacity.py", "reports/capacity.json"], body: `SLO = {"p95_ms_lt": 800, "error_rate_lt": 0.01}\nsteady_windows = FIXED_STEP_RESULTS\n\n+def first_slo_violation(windows):\n    # TODO：返回首个违反任一 SLO 的稳态窗口\n    ...\n\n+conclusion = {"capacity_point": None, "evidence": [], "alternative_explanation": None, "next_experiment": None}`, focus: ["计算容量点", "填写证据、反证和下一实验"] },
  { files: ["reports/performance-report.md"], body: `# 性能测试报告\n## 目标与 SLO\nTODO\n## 环境与版本\nTODO\n## 数据与负载模型\nTODO\n## 结果（单位/时间窗）\nTODO\n## 瓶颈与容量\nTODO\n## 风险与上线建议\nTODO`, focus: ["填写六个固定章节", "所有结论必须映射 SLO 和证据"] },
];

const qualitySeeds: StarterSeed[] = [
  { files: ["quality/activity-classification.md"], body: `| 活动 | 主分类 | 目的 | 责任人 | 可观察证据 |\n| 代码评审 | TODO | TODO | TODO | TODO |\n| 执行测试 | TODO | TODO | TODO | TODO |\n| 发布复盘 | TODO | TODO | TODO | TODO |`, focus: ["完成固定活动分类", "不要把质量只归给测试人员"] },
  { files: ["quality/risk-register.yaml"], body: `risks:\n  - {name: 数据错误, likelihood: null, impact: null, level: null, test_level: null}\n  - {name: 越权, likelihood: null, impact: null, level: null, test_level: null}\n  - {name: 并发, likelihood: null, impact: null, level: null, test_level: null}\n  - {name: 回滚, likelihood: null, impact: null, level: null, test_level: null}\nout_of_scope: []\nresidual_risks: []`, focus: ["按 1–5 填写评分", "为高风险项匹配验证活动"] },
  { files: ["quality/test-design.md"], body: `规则：adjustAmount 范围 -100..100，且不能为 0\n\n+| 方法 | 输入 | 期望 | 独特价值 |\n| 黑盒 | -100,-1,1,100 | TODO | TODO |\n| 白盒 | TODO | TODO | TODO |\n| 灰盒 | TODO | TODO | TODO |`, focus: ["补齐三类用例", "说明各自能发现的独特缺陷"] },
  { files: ["src/discount.py", "quality/branch-cases.md"], body: `def discount(user, order):\n    # 已给定四个判断分支的源码\n    return FIXED_IMPLEMENTATION(user, order)\n\n+| 用例 | 输入 | 期望路径 | 期望结果 |\n| C1 | TODO | T/F/... | TODO |\n| C2 | TODO | T/F/... | TODO |\n# TODO：用尽可能少的用例覆盖每个 True/False 和异常出口`, focus: ["填写最小分支用例", "不要把行覆盖当分支覆盖"] },
  { files: ["service/inventory.py", "tests/test_inventory_service.py"], body: `class FakeRepository:\n    def __init__(self, available):\n        self.available = available\n\n+class SpyNotifier:\n    def __init__(self):\n        self.calls = []\n\n+def test_adjust_success():\n    repository = FakeRepository(available=100)\n    notifier = SpyNotifier()\n    # TODO：调用真实 service 并断言结果和通知\n\n+def test_adjust_failure_has_no_notification():\n    # TODO：构造失败并断言 notifier.calls 为空`, focus: ["完成成功和失败测试", "不要 mock 被测业务规则"] },
  { files: [".coveragerc", "tests/test_boundary.py", "reports/coverage-note.md"], body: `[run]\nbranch = true\ndynamic_context = test_function\n\n+# TODO：读取给定 missing branch，补一个有业务断言的测试\n+# baseline_line_coverage = 100%\n+# candidate_line_coverage = 100%\n+# branch_difference = TODO`, focus: ["填写真实分支缺口", "说明为什么相同行覆盖率不等价"] },
  { files: ["mutations/cases.yaml", "reports/mutation.md"], body: `mutations:\n  - {id: M1, status: null, reason: null, new_test: null}\n  - {id: M2, status: null, reason: null, new_test: null}\n  - {id: M3, status: null, reason: null, new_test: null}\n  - {id: M4, status: null, reason: null, new_test: null}\n  - {id: M5, status: null, reason: null, new_test: null}\n  - {id: M6, status: null, reason: null, new_test: null}\n# TODO：只把被断言识别的错误实现标为 killed`, focus: ["分类六个 mutation", "为非等价存活项补测试"] },
  { files: ["src/risky_adapter.py", "reviews/risky_adapter.md"], body: `| 严重级别 | 行号 | 类型 | 可证伪理由 | 修复建议 | 来源 |\n| TODO | TODO | 类型问题 | TODO | TODO | 工具/人工 |\n| TODO | TODO | 资源泄漏 | TODO | TODO | 工具/人工 |\n| TODO | TODO | 注入风险 | TODO | TODO | 工具/人工 |\n# TODO：区分阻断缺陷与风格偏好`, focus: ["填写三类可验证问题", "标明工具发现或人工发现"] },
  { files: ["quality/gates.yaml"], body: `pull_request:\n  max_duration_min: 15\n  blocking: []\n  warnings: []\nmain:\n  blocking: []\n  warnings: []\nrelease:\n  blocking: []\n  warnings: []\nflaky_quarantine:\n  owner: null\n  deadline_days: null\n# TODO：填写三阶段门禁、阈值来源和失败处置`, focus: ["完成阻断/告警矩阵", "补充 flaky 隔离和修复期限"] },
  { files: ["quality/assurance-plan.yaml"], body: `scope: []\nrisks: []\nprevention: []\ndetection: []\nonline_monitoring: []\nenvironments: []\ntest_data: []\ngates: []\nevidence: []\nroles: {}\nfeedback_loop: []\nresidual_risks: []\napprover: null\n# TODO：让每个高风险项贯穿预防、检测和监控`, focus: ["填写完整质量闭环", "保留剩余风险和审批人"] },
];

const seedsByModule: Record<string, StarterSeed[]> = {
  "ui-automation": uiSeeds,
  "api-automation": apiSeeds,
  "ai-testing": aiSeeds,
  "performance-testing": performanceSeeds,
  "quality-engineering": qualitySeeds,
};

export function blueprintStarterFor(
  moduleId: string,
  levelIndex: number,
  detail: LearningRoadmapDetail,
): BlueprintStarter | null {
  const seed = seedsByModule[moduleId]?.[levelIndex];
  if (!seed) return null;
  const fixedContract = detail.contract.map((item) => `# - ${item}`).join("\n");
  return {
    files: seed.files,
    code: `# 固定契约（无需猜字段）\n${fixedContract}\n\n${seed.body}`,
    focus: seed.focus,
  };
}
