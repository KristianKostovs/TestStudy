import { env } from "cloudflare:workers";

type Row = Record<string, string | number | null>;

const questions = [
  [1, "请讲一个你主导的测试自动化改造项目。", "项目表达", '["项目影响力","自动化架构","复盘能力"]', "profile", "个人项目经历"],
  [2, "当需求不完整时，你如何判断测试范围和优先级？", "架构判断", '["风险分析","范围取舍","需求澄清"]', "role", "测试开发岗位核心能力"],
  [3, "你如何证明 AI 生成的测试用例是可信的？", "AI 质量方法", '["Evals","grader","执行证据"]', "market", "AI 质量工程岗位信号"],
  [4, "如果接口自动化用例在 CI 中偶发失败，你会怎样定位并治理？", "技术深度", '["CI 稳定性","可观测性","失败分类"]', "role", "高级测试开发岗位要求"],
  [5, "请设计一套 Agent 工具调用的测试方案，你会如何覆盖正确性、安全性和可恢复性？", "AI 质量方法", '["Agent 测试","安全边界","可恢复性"]', "technology", "Agent 评估与测试技术雷达"],
  [6, "你如何把一个只有自己能维护的自动化脚本，演进为团队可复用的工程能力？", "架构判断", '["分层设计","团队协作","工程治理"]', "profile", "个人发展目标"],
  [7, "如何在一周内为一个陌生业务建立可执行的测试策略？", "测试基础", '["质量模型","风险分析","范围设计"]', "foundation", "测试与质量基础"],
  [8, "面对一条有造数、主接口和清理动作的业务链，你如何设计接口自动化？", "接口测试", '["HTTP 契约","数据依赖","清理证据"]', "foundation", "接口测试能力"],
  [9, "一条 Web 自动化用例经常因动态弹窗和表格刷新失败，你会如何治理？", "Web 自动化", '["Locator","页面状态","等待证据"]', "technology", "Playwright 技术雷达"],
  [10, "如何设计 CI 质量门禁，既阻止高风险变更，又不让团队被偶发失败拖垮？", "CI/CD", '["质量门禁","失败分类","可观测性"]', "market", "高级测试开发岗位信号"],
  [11, "pytest fixture 、参数化和插件边界应如何分工，才能保持框架可维护？", "技术深度", '["pytest","依赖注入","插件边界"]', "technology", "pytest 官方发布"],
  [12, "请设计一次从负载模型到瓶颈结论的性能测试。", "性能与可靠性", '["负载模型","P95/P99","瓶颈证据"]', "technology", "Locust 官方发布"],
  [13, "一个允许 Agent 调用内部工具的系统，你会如何设计安全测试？", "安全测试", '["权限边界","注入攻击","审计与恢复"]', "technology", "OWASP 技术雷达"],
  [14, "Agent 在多轮工具调用中偶发选错工具，你会怎样建立评估集和 grader？", "Agent 系统测试", '["tool choice","trajectory eval","可恢复性"]', "technology", "OpenAI Agents SDK 发布雷达"],
  [15, "选择一个你认为最有价值的项目，用两分钟说清它对业务和团队的影响。", "项目表达", '["业务价值","量化结果","个人贡献"]', "profile", "个人项目经历"],
  [16, "你会如何在通用框架能力与特定业务便利之间做边界取舍？", "架构判断", '["抽象成本","业务边界","演进路径"]', "profile", "高级测试开发岗位要求"],
];

const signals = [
  ["apple-ai-qa-2026", "AI QA 岗位要求 LLM 与深度根因分析", "2026 年北京 AI QA 岗位将 LLM 理解、全栈问题定位、稳定性与质量策略同时列为核心能力。", "AI 质量方法", "https://jobs.apple.com/en-ca/details/200665346/ai-qa-engineer", "job", "2026-08-25", "2026-11-25"],
  ["wef-skills-2025", "AI、技术素养与分析思维持续上升", "WEF 的 2025–2030 技能展望将 AI 与大数据、技术素养列为增长最快的能力，同时强调分析思维与协作。", "项目表达", "https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/", "market", "2026-08-25", "2027-01-31"],
  ["pytest-9-1", "pytest 9.1 技术基线", "官方变更日志显示 pytest 9.1.1 已于 2026-06-19 发布，面试题应跟踪 fixture、插件与弃用变化。", "技术深度", "https://docs.pytest.org/en/latest/changelog.html", "technology", "2026-08-25", "2026-10-25"],
  ["playwright-agent", "Playwright Test Agents 进入技术雷达", "官方发布记录已出现面向 LLM 的 Test Agents，这使测试生成、修复和证据治理成为新的面试能力点。", "Web 自动化", "https://playwright.dev/docs/release-notes", "technology", "2026-08-25", "2026-10-25"],
  ["openai-agents-0-17-4", "Agents SDK 强化工具恢复、MCP 与 tracing", "官方 v0.17.4 发布包含缺失函数工具恢复、MCP SSE 传输加固和 tracing 能力更新，足以将 Agent 系统测试单独提升为动态板块。", "Agent 系统测试", "https://github.com/openai/openai-agents-python/releases/tag/v0.17.4", "technology", "2026-08-25", "2026-11-25"],
];

type ModuleSeed = {
  id: string; code: string; title: string; description: string; tone: string;
  kind: "core" | "adaptive" | "practice"; competency: string; priority: number;
  topics: string[]; sourceStrategy: string;
};

const moduleSeeds: ModuleSeed[] = [
  { id: "test-foundations", code: "PF", title: "测试与质量基础", description: "测试思维、风险分析与质量模型", tone: "violet", kind: "core", competency: "测试基础", priority: 82, topics: ["质量模型", "风险分层", "用例设计", "测试范围"], sourceStrategy: "长期基础 + 目标岗位 JD" },
  { id: "python-engineering", code: "PY", title: "Python 工程化", description: "语言基础、pytest 与框架设计", tone: "blue", kind: "core", competency: "技术深度", priority: 88, topics: ["Python", "pytest", "fixture", "框架边界"], sourceStrategy: "pytest 官方发布 + 项目实战" },
  { id: "api-testing", code: "API", title: "接口测试", description: "HTTP 契约、造数、Mock 与链路验证", tone: "green", kind: "core", competency: "接口测试", priority: 90, topics: ["HTTP 契约", "依赖造数", "Mock", "teardown"], sourceStrategy: "岗位 JD + 真实项目接口链" },
  { id: "web-automation", code: "WEB", title: "Web 与 UI 自动化", description: "Locator、等待、Page Object 与执行证据", tone: "cyan", kind: "core", competency: "Web 自动化", priority: 86, topics: ["Locator", "结构化等待", "Page Object", "Trace"], sourceStrategy: "Playwright 官方发布 + UI 实战" },
  { id: "cicd-quality", code: "CI", title: "CI/CD 与质量门禁", description: "流水线、稳定性与可观测性", tone: "amber", kind: "core", competency: "CI/CD", priority: 78, topics: ["质量门禁", "flaky test", "可观测性", "失败治理"], sourceStrategy: "岗位 JD + 工程故障证据" },
  { id: "architecture", code: "SYS", title: "系统设计与架构判断", description: "边界、取舍、数据与可恢复性", tone: "slate", kind: "core", competency: "架构判断", priority: 84, topics: ["分层边界", "抽象成本", "数据流", "容错恢复"], sourceStrategy: "高级岗位 JD + 个人项目追问" },
  { id: "ai-evals", code: "AI", title: "AI 测试与 Evals", description: "评估集、grader、重复性与风险治理", tone: "coral", kind: "core", competency: "AI 质量方法", priority: 96, topics: ["评估数据集", "grader", "鲁棒性", "安全边界"], sourceStrategy: "AI QA 岗位 + 官方 Evals 技术雷达" },
  { id: "project-impact", code: "PRJ", title: "项目经历与影响力", description: "业务成果、技术取舍与复盘表达", tone: "rose", kind: "core", competency: "项目表达", priority: 92, topics: ["STAR 与判断", "量化结果", "个人贡献", "复盘改进"], sourceStrategy: "个人经历 + 岗位行为面试" },
  { id: "mock-interview", code: "MOCK", title: "模拟面试", description: "按岗位画像动态组卷，沉淀回答与错题", tone: "ink", kind: "practice", competency: "综合面试", priority: 100, topics: ["随机组卷", "追问", "诊断", "错题本"], sourceStrategy: "全部板块 + 个人薄弱项" },
  { id: "agent-systems", code: "AGT", title: "Agent 系统测试", description: "工具选择、轨迹评估、MCP 与恢复性", tone: "mint", kind: "adaptive", competency: "Agent 系统测试", priority: 89, topics: ["tool choice", "trajectory eval", "MCP", "recovery"], sourceStrategy: "OpenAI Agents SDK 官方发布" },
  { id: "performance-reliability", code: "P95", title: "性能与可靠性", description: "负载模型、百分位、容量与故障证据", tone: "sky", kind: "adaptive", competency: "性能与可靠性", priority: 73, topics: ["P95/P99", "负载模型", "容量", "故障注入"], sourceStrategy: "Locust 官方发布 + 性能岗位信号" },
  { id: "security-testing", code: "SEC", title: "安全测试", description: "权限边界、输入风险、供应链与 AI 安全", tone: "indigo", kind: "adaptive", competency: "安全测试", priority: 76, topics: ["OWASP ASVS", "身份与权限", "注入攻击", "审计证据"], sourceStrategy: "OWASP 官方标准发布" },
];

const releaseFeeds = [
  { repo: "pytest-dev/pytest", moduleId: "python-engineering", competency: "技术深度", label: "pytest" },
  { repo: "microsoft/playwright", moduleId: "web-automation", competency: "Web 自动化", label: "Playwright" },
  { repo: "openai/openai-agents-python", moduleId: "agent-systems", competency: "Agent 系统测试", label: "OpenAI Agents SDK" },
  { repo: "locustio/locust", moduleId: "performance-reliability", competency: "性能与可靠性", label: "Locust" },
  { repo: "OWASP/ASVS", moduleId: "security-testing", competency: "安全测试", label: "OWASP ASVS" },
] as const;

async function ensureSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS interview_profiles (id TEXT PRIMARY KEY, current_role TEXT NOT NULL, target_role TEXT NOT NULL, horizon TEXT NOT NULL, focus TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_questions (id INTEGER PRIMARY KEY AUTOINCREMENT, prompt TEXT NOT NULL, competency TEXT NOT NULL, tags_json TEXT NOT NULL, source_type TEXT NOT NULL, source_ref TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, question_id INTEGER NOT NULL, answer_text TEXT NOT NULL, score INTEGER NOT NULL, diagnosis_json TEXT NOT NULL, weak_tags_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_competency_scores (competency TEXT PRIMARY KEY, score INTEGER NOT NULL, evidence_count INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_market_signals (id TEXT PRIMARY KEY, title TEXT NOT NULL, summary TEXT NOT NULL, competency TEXT NOT NULL, source_url TEXT NOT NULL, source_type TEXT NOT NULL, observed_at TEXT NOT NULL, expires_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_plan_items (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, competency TEXT NOT NULL, reason TEXT NOT NULL, duration_minutes INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'open', source_attempt_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_capability_modules (id TEXT PRIMARY KEY, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, tone TEXT NOT NULL, kind TEXT NOT NULL, competency TEXT NOT NULL, base_priority INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'active', content_json TEXT NOT NULL, source_strategy TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_interview_attempts_question_created ON interview_attempts(question_id, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_interview_plan_status_created ON interview_plan_items(status, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_interview_modules_status_priority ON interview_capability_modules(status, base_priority)"),
  ]);

  await db.prepare("INSERT OR IGNORE INTO interview_profiles (id, current_role, target_role, horizon, focus) VALUES (?, ?, ?, ?, ?)")
    .bind("default", "物资运营与测试赋能", "AI 质量工程 / 高级测试开发", "12–18 个月", "工程化、AI 评估、影响力表达").run();

  for (const question of questions) {
    await db.prepare("INSERT OR IGNORE INTO interview_questions (id, prompt, competency, tags_json, source_type, source_ref) VALUES (?, ?, ?, ?, ?, ?)").bind(...question).run();
  }
  for (const signal of signals) {
    await db.prepare("INSERT OR REPLACE INTO interview_market_signals (id, title, summary, competency, source_url, source_type, observed_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(...signal).run();
  }
  for (const module of moduleSeeds) {
    await db.prepare("INSERT INTO interview_capability_modules (id, code, title, description, tone, kind, competency, base_priority, content_json, source_strategy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET code = excluded.code, title = excluded.title, description = excluded.description, tone = excluded.tone, kind = excluded.kind, competency = excluded.competency, base_priority = excluded.base_priority, content_json = excluded.content_json, source_strategy = excluded.source_strategy")
      .bind(module.id, module.code, module.title, module.description, module.tone, module.kind, module.competency, module.priority, JSON.stringify({ topics: module.topics }), module.sourceStrategy).run();
  }
  for (const [competency, score] of [["项目表达", 62], ["技术深度", 58], ["架构判断", 52], ["AI 质量方法", 38], ["测试基础", 60], ["接口测试", 64], ["Web 自动化", 56], ["CI/CD", 48], ["Agent 系统测试", 35], ["性能与可靠性", 42], ["安全测试", 40]] as const) {
    await db.prepare("INSERT OR IGNORE INTO interview_competency_scores (competency, score, evidence_count) VALUES (?, ?, 0)").bind(competency, score).run();
  }
}

function rows(result: D1Result): Row[] {
  return (result.results ?? []) as Row[];
}

function parseJson(value: unknown, fallback: unknown) {
  try { return JSON.parse(String(value)); } catch { return fallback; }
}

async function buildState() {
  const db = env.DB;
  const [profile, questionRows, attemptRows, scoreRows, signalRows, planRows, moduleRows] = await db.batch([
    db.prepare("SELECT * FROM interview_profiles WHERE id = 'default' LIMIT 1"),
    db.prepare("SELECT * FROM interview_questions WHERE active = 1 ORDER BY id"),
    db.prepare("SELECT a.*, q.prompt, q.competency FROM interview_attempts a JOIN interview_questions q ON q.id = a.question_id ORDER BY a.id DESC LIMIT 40"),
    db.prepare("SELECT * FROM interview_competency_scores ORDER BY score ASC"),
    db.prepare("SELECT * FROM interview_market_signals WHERE expires_at >= date('now') ORDER BY observed_at DESC"),
    db.prepare("SELECT * FROM interview_plan_items ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, id DESC LIMIT 30"),
    db.prepare("SELECT * FROM interview_capability_modules WHERE status = 'active' ORDER BY base_priority DESC"),
  ]);

  const parsedQuestions = rows(questionRows).map((row) => ({ ...row, tags: parseJson(row.tags_json, []) }));
  const parsedSignals = rows(signalRows);
  const parsedScores = rows(scoreRows);
  const modules = rows(moduleRows).map((module) => {
    const competency = String(module.competency);
    const matchedSignals = parsedSignals.filter((signal) => signal.competency === competency);
    const score = parsedScores.find((item) => item.competency === competency);
    const evidenceScore = score ? Number(score.score) : 50;
    const signalBoost = Math.min(15, matchedSignals.length * 4);
    const weaknessBoost = evidenceScore < 60 ? 10 : 0;
    return {
      ...module,
      content: parseJson(module.content_json, { topics: [] }),
      signalCount: matchedSignals.length,
      questionCount: parsedQuestions.filter((question) => question.competency === competency).length,
      evidenceScore,
      priority: Math.min(100, Number(module.base_priority) + signalBoost + weaknessBoost),
      signals: matchedSignals,
    };
  }).filter((module) => module.kind !== "adaptive" || Number(module.signalCount) > 0)
    .sort((left, right) => Number(right.priority) - Number(left.priority));

  return {
    profile: rows(profile)[0],
    questions: parsedQuestions,
    attempts: rows(attemptRows).map((row) => ({ ...row, diagnosis: parseJson(row.diagnosis_json, {}), weakTags: parseJson(row.weak_tags_json, []) })),
    scores: parsedScores,
    signals: parsedSignals,
    plan: rows(planRows),
    modules,
    lastRefreshedAt: parsedSignals[0]?.observed_at ?? null,
  };
}

function analyzeAnswer(answer: string, competency: string) {
  const lengthScore = Math.min(20, Math.floor(answer.trim().length / 9));
  const hasStructure = /(背景|当时|目标|任务|行动|结果|最后)/.test(answer);
  const hasEvidence = /(\d+|%|百分比|天|周|月|次|提升|降低|节省)/.test(answer);
  const hasDecision = /(因为|所以|权衡|取舍|选择|优先|风险)/.test(answer);
  const hasReflection = /(复盘|不足|改进|后来|下一步|如果重来)/.test(answer);
  const hasTechnical = /(Python|pytest|Playwright|API|HTTP|YAML|CI|Mock|Evals|grader|Agent|自动化|架构|断言|证据|数据)/i.test(answer);
  const score = Math.min(100, 20 + lengthScore + (hasStructure ? 15 : 0) + (hasEvidence ? 18 : 0) + (hasDecision ? 12 : 0) + (hasReflection ? 8 : 0) + (hasTechnical ? 7 : 0));
  const weakTags = [
    !hasStructure && "结构化表达",
    !hasEvidence && "量化证据",
    !hasDecision && "技术取舍",
    !hasReflection && "复盘改进",
    !hasTechnical && "技术细节",
  ].filter(Boolean) as string[];
  const strengths = [hasStructure && "结构清晰", hasEvidence && "有结果证据", hasDecision && "有判断与取舍", hasReflection && "有复盘意识", hasTechnical && "技术语义具体"].filter(Boolean);
  return {
    score,
    weakTags,
    diagnosis: {
      summary: score >= 80 ? "回答已接近成熟面试表达，继续打磨证据与取舍即可。" : score >= 65 ? "主线基本清楚，但还需补齐影响力证据和关键判断。" : "回答目前偏经过描述，需先补齐结构、结果与复盘。",
      strengths,
      improvements: weakTags,
      followUp: weakTags[0] === "量化证据" ? "请补充：这次行动带来了什么可量化的变化？" : `请补充一个能证明“${competency}”的关键细节。`,
    },
  };
}

const planByWeakness: Record<string, [string, number]> = {
  "结构化表达": ["用背景—判断—行动—结果—复盘重写本题", 25],
  "量化证据": ["为项目经历补齐 3 个可核验的结果指标", 20],
  "技术取舍": ["练习说清一次方案选择与放弃的理由", 30],
  "复盘改进": ["给本次经历增加失败点与二次改进", 20],
  "技术细节": ["补充一个可追问的代码、数据或架构细节", 35],
};

type GitHubRelease = {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  published_at?: string;
};

async function refreshTechnologySources() {
  const today = new Date();
  const observedAt = today.toISOString().slice(0, 10);
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 90);
  const expiresAt = expiry.toISOString().slice(0, 10);

  const fetched = await Promise.allSettled(releaseFeeds.map(async (feed) => {
    const response = await fetch(`https://api.github.com/repos/${feed.repo}/releases/latest`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "interview-capability-radar" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`${feed.label}: HTTP ${response.status}`);
    const release = await response.json() as GitHubRelease;
    const tag = release.tag_name || release.name || "latest";
    const published = release.published_at?.slice(0, 10) || "日期未知";
    const notes = (release.body || "官方发布页已更新。").replace(/[#*`\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
    return { feed, release, tag, published, notes };
  }));

  const db = env.DB;
  const updatedModules: string[] = [];
  const failures: string[] = [];
  for (const result of fetched) {
    if (result.status === "rejected") {
      failures.push(result.reason instanceof Error ? result.reason.message : "未知刷新错误");
      continue;
    }
    const { feed, release, tag, published, notes } = result.value;
    const signalId = `release-${feed.repo.replace("/", "-")}-${tag}`.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 150);
    await db.prepare("INSERT OR REPLACE INTO interview_market_signals (id, title, summary, competency, source_url, source_type, observed_at, expires_at) VALUES (?, ?, ?, ?, ?, 'technology', ?, ?)")
      .bind(signalId, `${feed.label} ${tag} 技术发布`, `发布于 ${published}。${notes}`, feed.competency, release.html_url || `https://github.com/${feed.repo}/releases`, observedAt, expiresAt).run();
    await db.prepare("UPDATE interview_capability_modules SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(feed.moduleId).run();
    updatedModules.push(feed.moduleId);
  }
  return { updated: updatedModules.length, failed: failures.length, updatedModules, failures, observedAt };
}

export async function GET() {
  try {
    await ensureSchema();
    return Response.json(await buildState());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "加载面试数据失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const payload = await request.json() as Record<string, unknown>;
    const db = env.DB;

    if (payload.action === "submit_answer") {
      const questionId = Number(payload.questionId);
      const answer = String(payload.answer ?? "").trim();
      if (!questionId || answer.length < 12) return Response.json({ error: "请先输入一段完整回答" }, { status: 400 });
      const questionResult = await db.prepare("SELECT competency FROM interview_questions WHERE id = ?").bind(questionId).first<Row>();
      if (!questionResult) return Response.json({ error: "题目不存在" }, { status: 404 });
      const competency = String(questionResult.competency);
      const analysis = analyzeAnswer(answer, competency);
      const inserted = await db.prepare("INSERT INTO interview_attempts (question_id, answer_text, score, diagnosis_json, weak_tags_json) VALUES (?, ?, ?, ?, ?) RETURNING id")
        .bind(questionId, answer, analysis.score, JSON.stringify(analysis.diagnosis), JSON.stringify(analysis.weakTags)).first<Row>();
      await db.prepare("INSERT INTO interview_competency_scores (competency, score, evidence_count, updated_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(competency) DO UPDATE SET score = ROUND((score * evidence_count + excluded.score) / (evidence_count + 1.0)), evidence_count = evidence_count + 1, updated_at = CURRENT_TIMESTAMP")
        .bind(competency, analysis.score).run();
      if (analysis.weakTags.length) {
        const [title, minutes] = planByWeakness[analysis.weakTags[0]] ?? ["重新组织本题回答", 20];
        const existing = await db.prepare("SELECT id FROM interview_plan_items WHERE status = 'open' AND competency = ? AND title = ? LIMIT 1").bind(competency, title).first();
        if (!existing) await db.prepare("INSERT INTO interview_plan_items (title, competency, reason, duration_minutes, source_attempt_id) VALUES (?, ?, ?, ?, ?)")
          .bind(title, competency, `本次回答薄弱项：${analysis.weakTags.join("、")}`, minutes, inserted?.id ?? null).run();
      }
      return Response.json({ ...(await buildState()), latestDiagnosis: analysis });
    }

    if (payload.action === "update_profile") {
      await db.prepare("UPDATE interview_profiles SET current_role = ?, target_role = ?, horizon = ?, focus = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 'default'")
        .bind(String(payload.currentRole ?? ""), String(payload.targetRole ?? ""), String(payload.horizon ?? ""), String(payload.focus ?? "")).run();
      return Response.json(await buildState());
    }

    if (payload.action === "complete_plan") {
      await db.prepare("UPDATE interview_plan_items SET status = 'done' WHERE id = ?").bind(Number(payload.id)).run();
      return Response.json(await buildState());
    }

    if (payload.action === "refresh_sources") {
      const refresh = await refreshTechnologySources();
      return Response.json({ ...(await buildState()), refresh });
    }

    return Response.json({ error: "不支持的操作" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 500 });
  }
}
