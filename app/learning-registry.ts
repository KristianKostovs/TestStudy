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
  roadmap: string[];
  updateRule: string;
};

export const sourceKindMeta: Record<SourceKind, { label: string; short: string }> = {
  foundation: { label: "公认基础", short: "基础" },
  technology_radar: { label: "实时技术雷达", short: "新技术" },
  local_project: { label: "本地项目实践", short: "实战" },
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
    id: "foundation.performance",
    kind: "foundation",
    title: "性能工程基础",
    provider: "Locust / OpenTelemetry",
    description: "并发、吞吐量、百分位、负载模型、可观测性与容量判断。",
    href: "https://docs.locust.io/",
    checkedAt: "2026-08-23",
  },
  {
    id: "radar.python_peps",
    kind: "technology_radar",
    title: "Python 版本与 PEP 雷达",
    provider: "Python PEP Index",
    description: "跟踪已接受、最终、弃用和仍在讨论的 Python 能力；草案只进入雷达。",
    href: "https://peps.python.org/",
    checkedAt: "2026-08-23",
  },
  {
    id: "radar.playwright_releases",
    kind: "technology_radar",
    title: "Playwright Python 发布雷达",
    provider: "Microsoft Playwright",
    description: "跟踪 Locator、Trace、浏览器行为、弃用与破坏性变化。",
    href: "https://playwright.dev/python/docs/release-notes",
    checkedAt: "2026-08-23",
  },
  {
    id: "radar.pytest_changelog",
    kind: "technology_radar",
    title: "pytest 版本雷达",
    provider: "pytest",
    description: "跟踪 fixture、参数化、插件、弃用和兼容性变化。",
    href: "https://docs.pytest.org/en/stable/changelog.html",
    checkedAt: "2026-08-23",
  },
  {
    id: "radar.openai_evals",
    kind: "technology_radar",
    title: "AI Evals 与 Agent 测试雷达",
    provider: "NIST / OpenAI 官方文档",
    description: "跟踪 grader、数据集评测、Agent 工具调用与新型 AI 风险测试方法。",
    href: "https://platform.openai.com/docs/guides/evals",
    checkedAt: "2026-08-23",
  },
  {
    id: "radar.locust_releases",
    kind: "technology_radar",
    title: "Locust 与性能工具雷达",
    provider: "Locust",
    description: "跟踪负载生成、协议用户、分布式执行和性能诊断能力。",
    href: "https://docs.locust.io/",
    checkedAt: "2026-08-23",
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
];

export const learningModules: LearningModule[] = [
  {
    id: "python-framework",
    sigil: "PY",
    title: "Python 框架基础",
    subtitle: "从数据、函数和 pytest，走到声明式 Runner 与架构边界。",
    status: "active",
    sourceIds: ["foundation.python", "foundation.pytest", "radar.python_peps", "radar.pytest_changelog", "project.python_framework"],
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
    sourceIds: ["foundation.python", "foundation.ai_tevv", "radar.openai_evals"],
    roadmap: ["AI 系统与测试对象", "评测数据集", "指标与 grader", "重复性与统计", "Grounding 与幻觉", "鲁棒性与对抗", "安全、隐私与偏差", "Agent 与工具调用评测", "线上监控", "完整 Evals 方案"],
    updateRule: "没有本地项目也可完整学习；以 NIST、官方 Evals 和权威研究为来源。",
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
];

export function sourcesForModule(module: LearningModule): SourceAdapter[] {
  return module.sourceIds.map((sourceId) => {
    const source = sourceAdapters.find((candidate) => candidate.id === sourceId);
    if (!source) throw new Error(`模块 ${module.id} 引用了不存在的知识源 ${sourceId}`);
    return source;
  });
}

const moduleIds = new Set<string>();
for (const module of learningModules) {
  if (moduleIds.has(module.id)) throw new Error(`重复的学习模块 ID: ${module.id}`);
  moduleIds.add(module.id);
  sourcesForModule(module);
}
