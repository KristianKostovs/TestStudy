export type SourceKind = "foundation" | "technology_radar" | "local_project";
export type ModuleStatus = "active" | "blueprint";

export type SourceAdapter = {
  id: string;
  kind: SourceKind;
  title: string;
  provider: string;
  description: string;
  href?: string;
  location?: string;
  checkedAt: string;
};

export type LearningModule = {
  id: string;
  sigil: string;
  title: string;
  subtitle: string;
  status: ModuleStatus;
  sourceIds: string[];
  roadmap: LearningRoadmapItem[];
  updateRule: string;
  gapReview?: LearningGapReview;
};

export type LearningRoadmapDetail = {
  title: string;
  question: string;
  foundations: string[];
  practice: string;
  evidence: string;
};

export type LearningRoadmapItem = string | LearningRoadmapDetail;

export type LearningGapReview = {
  sourceTitle: string;
  summary: string;
  items: Array<{
    kind: "added" | "retained" | "guardrail";
    title: string;
    description: string;
  }>;
};

export function roadmapTitle(item: LearningRoadmapItem): string {
  return typeof item === "string" ? item : item.title;
}

export const sourceKindMeta: Record<SourceKind, { label: string; short: string }> = {
  foundation: { label: "公认基础", short: "基础" },
  technology_radar: { label: "实时技术雷达", short: "新技术" },
  local_project: { label: "本地与内部实践", short: "实践" },
};

export const sourceAdapters: SourceAdapter[] = [
  {
    id: "foundation.python",
    kind: "foundation",
    title: "Python 官方语言基础",
    provider: "Python Software Foundation",
    description: "语法、数据结构、函数、模块、异常、类和标准库等长期基础。",
    href: "https://docs.python.org/3/",
    checkedAt: "2026-08-23",
  },
  {
    id: "foundation.pytest",
    kind: "foundation",
    title: "pytest 官方测试基础",
    provider: "pytest",
    description: "fixture、参数化、断言、收集、插件与测试生命周期。",
    href: "https://docs.pytest.org/en/stable/",
    checkedAt: "2026-08-23",
  },
  {
    id: "foundation.playwright",
    kind: "foundation",
    title: "Playwright 官方 UI 自动化",
    provider: "Microsoft Playwright",
    description: "Locator、自动等待、断言、浏览器上下文、Trace 与页面模型。",
    href: "https://playwright.dev/python/docs/intro",
    checkedAt: "2026-08-23",
  },
  {
    id: "foundation.http",
    kind: "foundation",
    title: "HTTP、OpenAPI 与 JSON Schema",
    provider: "IETF / OpenAPI Initiative / JSON Schema",
    description: "接口协议、状态码、契约、请求响应结构和 Schema 校验。",
    href: "https://spec.openapis.org/oas/latest.html",
    checkedAt: "2026-08-23",
  },
  {
    id: "foundation.ai_tevv",
    kind: "foundation",
    title: "AI 测试、评估、验证与确认",
    provider: "NIST AIRC",
    description: "以 TEVV 和 AI RMF 建立可信、可测量、可追踪的 AI 测试基础。",
    href: "https://airc.nist.gov/",
    checkedAt: "2026-08-23",
  },
  {
    id: "foundation.opentelemetry",
    kind: "foundation",
    title: "OpenTelemetry Trace 与上下文传播",
    provider: "CNCF / OpenTelemetry",
    description: "以 trace、span 和上下文传播保存智能体端到端执行证据，支撑工具调用、多智能体协作和失败归因。",
    href: "https://opentelemetry.io/docs/concepts/signals/traces/",
    checkedAt: "2026-08-31",
  },
  {
    id: "foundation.performance",
    kind: "foundation",
    title: "性能工程基础",
    provider: "Locust / OpenTelemetry",
    description: "并发、吞吐量、百分位、负载模型、可观测性与容量判断。",
    href: "https://docs.locust.io/",
    checkedAt: "2026-08-23",
  },
  {
    id: "foundation.quality_engineering",
    kind: "foundation",
    title: "测试与质量工程基础",
    provider: "ISTQB CTFL 4.0",
    description: "测试基本原则、生命周期、静态测试、白盒技术、风险驱动测试和测试管理。",
    href: "https://istqb.org/help/ctfl-v40/",
    checkedAt: "2026-08-26",
  },
  {
    id: "radar.python_releases",
    kind: "technology_radar",
    title: "Python 正式版本雷达",
    provider: "Python Software Foundation",
    description: "跟踪正式版本的新特性、弃用、移除和迁移影响。",
    href: "https://docs.python.org/3/whatsnew/index.html",
    checkedAt: "2026-08-27",
  },
  {
    id: "radar.python_peps",
    kind: "technology_radar",
    title: "Python 版本与 PEP 雷达",
    provider: "Python PEP Index",
    description: "跟踪已接受、最终、弃用和仍在讨论的 Python 能力；草案只进入雷达。",
    href: "https://peps.python.org/",
    checkedAt: "2026-08-27",
  },
  {
    id: "radar.playwright_releases",
    kind: "technology_radar",
    title: "Playwright Python 发布雷达",
    provider: "Microsoft Playwright",
    description: "跟踪 Locator、Trace、浏览器行为、弃用与破坏性变化。",
    href: "https://playwright.dev/python/docs/release-notes",
    checkedAt: "2026-08-27",
  },
  {
    id: "radar.pytest_changelog",
    kind: "technology_radar",
    title: "pytest 版本雷达",
    provider: "pytest",
    description: "跟踪 fixture、参数化、插件、弃用和兼容性变化。",
    href: "https://docs.pytest.org/en/stable/changelog.html",
    checkedAt: "2026-08-27",
  },
  {
    id: "radar.openai_evals",
    kind: "technology_radar",
    title: "AI Evals 与 Agent 测试雷达",
    provider: "NIST / OpenAI 官方文档",
    description: "跟踪 grader、数据集评测、Agent 工具调用与新型 AI 风险测试方法。",
    href: "https://developers.openai.com/api/docs/guides/evals",
    checkedAt: "2026-08-27",
  },
  {
    id: "radar.openai_agents",
    kind: "technology_radar",
    title: "OpenAI Agents SDK 发布雷达",
    provider: "OpenAI",
    description: "跟踪工具调用、MCP、tracing、guardrail、恢复与 Agent 评估能力。",
    href: "https://github.com/openai/openai-agents-python/releases",
    checkedAt: "2026-08-27",
  },
  {
    id: "radar.locust_releases",
    kind: "technology_radar",
    title: "Locust 与性能工具雷达",
    provider: "Locust",
    description: "跟踪负载生成、协议用户、分布式执行和性能诊断能力。",
    href: "https://docs.locust.io/",
    checkedAt: "2026-08-27",
  },
  {
    id: "radar.quality_devops",
    kind: "technology_radar",
    title: "Quality in DevOps 雷达",
    provider: "ISTQB CT-QDO",
    description: "跟踪质量工程如何进入价值流、DevOps 循环、自动化门禁、度量与持续改进。",
    href: "https://istqb.org/certifications/certified-tester-quality-in-devops-ct-qdo/",
    checkedAt: "2026-08-27",
  },
  {
    id: "radar.coverage_py",
    kind: "technology_radar",
    title: "Python 覆盖率工具雷达",
    provider: "coverage.py",
    description: "跟踪语句与分支覆盖、上下文、并行数据合并、报告格式和兼容性变化。",
    href: "https://coverage.readthedocs.io/en/latest/changes.html",
    checkedAt: "2026-08-27",
  },
  {
    id: "radar.owasp_asvs",
    kind: "technology_radar",
    title: "OWASP ASVS 发布雷达",
    provider: "OWASP",
    description: "跟踪稳定的应用安全验证标准；bleeding-edge 内容只进入观察区。",
    href: "https://github.com/OWASP/ASVS/releases",
    checkedAt: "2026-08-27",
  },
  {
    id: "project.python_framework",
    kind: "local_project",
    title: "AI 测试赋能 Python 工具链",
    provider: "本地项目",
    description: "从 Skill、校验器、Provider、Runner、生成器和工具脚本中提炼框架能力。",
    location: "AI测试赋能 / AI-pytest_api_automation 与 knowledge Skills",
    checkedAt: "2026-08-23",
  },
  {
    id: "project.ui_automation",
    kind: "local_project",
    title: "EWMS 与 MOM UI 自动化资产",
    provider: "本地项目",
    description: "UI 知识库、Locator Schema、Page Object、Playwright 脚本和执行证据。",
    location: "AI测试赋能 / EWMS微仓管理系统、MOM物资管理平台",
    checkedAt: "2026-08-23",
  },
  {
    id: "project.api_automation",
    kind: "local_project",
    title: "EWMS 与 MOM API 自动化资产",
    provider: "本地项目",
    description: "声明式 YAML、Adapter、Provider、静态门禁、Mock、teardown 与执行报告。",
    location: "AI测试赋能 / EWMS、MOM / Data/接口自动化",
    checkedAt: "2026-08-23",
  },
  {
    id: "project.agent_testing_practice",
    kind: "local_project",
    title: "智能体测试与质量保障实践",
    provider: "SF 内部实践资料",
    description: "补充智能体分类、E-Level、G/T 双层指标、评测集分桶、质量门禁、可观测归因和跨团队协作方法。",
    location: "内部授权资料（只沉淀脱敏后的可迁移知识，不公开原文入口）",
    checkedAt: "2026-08-31",
  },
];

export const learningModules: LearningModule[] = [
  {
    id: "python-framework",
    sigil: "PY",
    title: "Python 框架基础",
    subtitle: "从数据、函数和 pytest，走到声明式 Runner 与架构边界。",
    status: "active",
    sourceIds: ["foundation.python", "foundation.pytest", "radar.python_releases", "radar.python_peps", "radar.pytest_changelog", "project.python_framework"],
    roadmap: ["数据与函数", "可变对象与异常", "模块与导入", "类型与 Protocol", "pytest 生命周期", "YAML 与 Pydantic", "反射与 Runner", "HTTPX 与 Mock", "架构边界", "声明式 Boss 链路"],
    updateRule: "本地工具链提供实战；Python、pytest 官方变化补充基础与进阶能力。",
  },
  {
    id: "ui-automation",
    sigil: "UI",
    title: "UI 自动化",
    subtitle: "从 DOM 和 Locator，走到状态、Portal、Page Object 与稳定证据。",
    status: "blueprint",
    sourceIds: ["foundation.python", "foundation.pytest", "foundation.playwright", "radar.playwright_releases", "project.ui_automation"],
    roadmap: ["浏览器、页面与 DOM", "Locator 基础", "组件作用域", "页面状态", "Portal 与弹窗", "动态表格与业务行", "Page Object 分层", "等待与 Web-First 断言", "登录与副作用控制", "可复现执行证据"],
    updateRule: "EWMS/MOM 提供真实案例；Playwright 官方基础和发布变化决定课程补充。",
  },
  {
    id: "api-automation",
    sigil: "API",
    title: "API 自动化",
    subtitle: "从 HTTP 契约，走到声明式接口链、造数、清理与证据治理。",
    status: "blueprint",
    sourceIds: ["foundation.python", "foundation.pytest", "foundation.http", "radar.pytest_changelog", "project.api_automation"],
    roadmap: ["HTTP 与 JSON", "Endpoint 与 DTO 契约", "Client 与 fixture", "请求封装与结果对象", "声明式 YAML", "Adapter 与反射执行", "Provider 与测试数据", "接口链字段绑定", "断言、证据与 teardown", "完整需求链路"],
    updateRule: "EWMS/MOM 和生成 Skill 提供实战；HTTP、契约和 pytest 官方知识保持通用性。",
  },
  {
    id: "ai-testing",
    sigil: "AI",
    title: "AI 测试",
    subtitle: "从评测数据集和 grader，走到幻觉、鲁棒性、安全与 Agent 评估。",
    status: "blueprint",
    sourceIds: ["foundation.python", "foundation.ai_tevv", "foundation.opentelemetry", "radar.openai_evals", "radar.openai_agents", "radar.owasp_asvs", "project.agent_testing_practice"],
    roadmap: [
      {
        title: "为什么智能体不能只按传统接口测",
        question: "同一输入可能得到不同表达，怎样证明它仍持续交付可信结果？",
        foundations: ["非确定性与采样", "开放答案与语义等价", "黑盒结果与过程证据", "Verification 与 Validation"],
        practice: "把一个传统接口断言改写成智能体的结果、稳定性和过程三层测试声明。",
        evidence: "能说明为什么单次 exact match 不足，并列出需要保存的结果与 trace 证据。",
      },
      {
        title: "先认类型，再写能力声明",
        question: "知识问答、数据问数、工具执行、多轮对话和多智能体，‘答对’是否相同？",
        foundations: ["qa_rag / data_query / tool_action", "routing / multi_turn / hybrid", "单体、工作流与多智能体", "E0/E1/E2 风险分级"],
        practice: "为一个真实智能体画出类型标签、能力边界、风险等级和不测范围。",
        evidence: "一张可评审的能力声明表，能把能力、风险和测试规模对应起来。",
      },
      {
        title: "构建可信评测集",
        question: "评测集怎样既贴近真实业务，又能覆盖风险和历史失败？",
        foundations: ["主路径 core、风险 risk、回归 regression", "生产日志、调研与历史 badcase", "黄金答案和来源标注", "难度、表达和边界变体"],
        practice: "设计一个带唯一 ID、版本、来源、分桶和期望判定方式的小型评测集。",
        evidence: "样本可追溯、分布有理由，且不存在用模型凭空生成答案再自证正确的问题。",
      },
      {
        title: "从单例判断到 G/T 双层指标",
        question: "结果好不好和问题出在哪里，为什么必须分开回答？",
        foundations: ["G 层业务门禁", "T 层检索、工具、推理、编排、成本与上下文诊断", "L0-L3 判定层级", "LLM-as-Judge、规则和人审"],
        practice: "为一种智能体定义 1 个头牌门禁指标、2 个诊断指标和判定责任人。",
        evidence: "指标定义、样本、计算口径和裁判版本均可复现，G 层失败能沿 trace 回到 T 层。",
      },
      {
        title: "重复、统计与基线漂移",
        question: "一次通过不代表稳定，怎样量化模型或提示词更新后的退步？",
        foundations: ["重复 N 次与波动率", "均值、分位数与置信区间", "相对基线 Δ", "Judge 偏差抽检"],
        practice: "对同一组样本重复运行，比较两个版本的任务成功率和波动。",
        evidence: "报告同时给出样本量、采样配置、中心趋势、波动和相对基线变化。",
      },
      {
        title: "Grounding、RAG 与幻觉治理",
        question: "回答听起来合理时，如何验证召回、引用和事实真的存在？",
        foundations: ["召回命中与空召回", "引用可追溯", "事实可靠率与拒答", "知识新鲜度和权限隔离"],
        practice: "设计正常召回、错误召回、无知识和越权知识四类样本及 grader。",
        evidence: "能区分检索失败、生成失真和知识源问题，不只给一个笼统的‘幻觉’标签。",
      },
      {
        title: "工具、路由、多轮与多智能体轨迹评测",
        question: "最终结果失败时，怎样判断是选错工具、参数错、路由错还是上下文丢失？",
        foundations: ["工具选择与参数合法性", "状态变化和高危拦截", "意图路由与多轮一致性", "子任务协作、降级与端到端归因"],
        practice: "为一条多步任务设计 checkpoint，并把每步事件绑定同一个 trace_id。",
        evidence: "既有端到端结果，也能定位到具体路由、工具、参数、上下文或子智能体。",
      },
      {
        title: "安全、隐私、权限与对抗",
        question: "哪些风险必须一票否决，不能被平均分掩盖？",
        foundations: ["提示注入和越狱", "PII 与敏感信息泄露", "越权访问和越权调用", "高危误放、偏差和有害内容"],
        practice: "建立安全对抗样本库，并为不可接受事件设计一票否决规则。",
        evidence: "红线事件可复现、有明确拦截证据，并与普通质量分数分开判定。",
      },
      {
        title: "性能、成本与线上可观测",
        question: "效果合格之后，速度、成本和可恢复性怎样进入质量结论？",
        foundations: ["TTFT 与 E2EL P95", "吞吐、成功率和并发", "Token 与单次交互成本", "超时、重试、降级与线上 badcase 回流"],
        practice: "设计分阶段并发测试，关联效果、时延、成功率和成本四类数据。",
        evidence: "报告能指出瓶颈所在组件，并说明阈值来自用户体验、容量或成本目标。",
      },
      {
        title: "质量门禁与持续闭环",
        question: "怎样把评测从一次报告变成可审计、可回归、可阻断的发布机制？",
        foundations: ["准备、执行、判定、沉淀四阶段", "绝对阈值、基线退化和一票否决", "通过、条件通过、不通过", "版本化回归集、CI/CD 与跨团队契约"],
        practice: "完成一份智能体测试方案：能力声明、评测集、指标、门禁、trace、失败归因和回流策略。",
        evidence: "结论可复现、可追溯、能解释是否上线以及失败后如何修复和回归。",
      },
    ],
    updateRule: "以 NIST、OpenAI、OWASP 与 OpenTelemetry 作为稳定知识骨架；内部实践补充企业落地方法，具体阈值只作模板，必须由业务风险、体验和基线验证。",
    gapReview: {
      sourceTitle: "《智能体测试与质量保障实践》课程差异复核",
      summary: "保留原有 AI Evals 主线，并补齐从‘会做评测’到‘能做发布门禁和失败归因’之间的工程能力。",
      items: [
        { kind: "added", title: "新增工程分层", description: "补入智能体类型、E-Level、G/T 双层指标、L0-L3 判定和主路径/风险/回归分桶。" },
        { kind: "added", title: "新增门禁与归因", description: "补入绝对阈值、相对基线、一票否决、trace_id 证据链、多智能体协作和 CI/CD 闭环。" },
        { kind: "retained", title: "保留通用能力", description: "评测集、grader、重复性、Grounding、幻觉、鲁棒性、安全、隐私和偏差仍是主线能力。" },
        { kind: "guardrail", title: "避免照搬材料", description: "内部平台只作为可选练习工具；资料中的比例和阈值是参考模板，不作为所有智能体的统一标准。" },
      ],
    },
  },
  {
    id: "performance-testing",
    sigil: "P95",
    title: "性能测试",
    subtitle: "从响应时间和吞吐量，走到负载模型、观测、瓶颈与容量结论。",
    status: "blueprint",
    sourceIds: ["foundation.python", "foundation.performance", "radar.locust_releases"],
    roadmap: ["响应时间、并发与吞吐", "P50/P95/P99", "负载模型", "Locust 用户与任务", "参数化和数据隔离", "阶梯加压与稳定性", "分布式负载", "监控与链路关联", "瓶颈与容量", "完整性能报告"],
    updateRule: "以性能工程基础和官方工具变化建立课程，未来再接入真实系统案例。",
  },
  {
    id: "quality-engineering",
    sigil: "QE",
    title: "质量工程与保障",
    subtitle: "从测试策略与白盒测试，走到代码质量、CI/CD 门禁、发布准入与线上质量闭环。",
    status: "blueprint",
    sourceIds: ["foundation.python", "foundation.pytest", "foundation.quality_engineering", "radar.quality_devops", "radar.coverage_py", "radar.owasp_asvs", "project.python_framework", "project.api_automation"],
    roadmap: ["质量、测试与质量保障", "测试策略与风险分析", "黑盒、白盒与灰盒测试", "代码分支与白盒用例", "单元测试与依赖隔离", "覆盖率与覆盖率误区", "变异测试", "静态分析与代码评审", "CI/CD 质量门禁", "完整质量保障方案"],
    updateRule: "ISTQB 基础与 Quality in DevOps 提供通用体系，coverage.py 和本地质量门禁资产提供工程实践。",
  },
];

export function sourcesForModule(learningModule: LearningModule): SourceAdapter[] {
  return learningModule.sourceIds.map((sourceId) => {
    const source = sourceAdapters.find((candidate) => candidate.id === sourceId);
    if (!source) throw new Error(`模块 ${learningModule.id} 引用了不存在的知识源 ${sourceId}`);
    return source;
  });
}

const moduleIds = new Set<string>();
for (const learningModule of learningModules) {
  if (moduleIds.has(learningModule.id)) throw new Error(`重复的学习模块 ID: ${learningModule.id}`);
  moduleIds.add(learningModule.id);
  sourcesForModule(learningModule);
}
