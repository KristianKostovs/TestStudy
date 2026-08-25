import { env } from "cloudflare:workers";

type Row = Record<string, string | number | null>;

const questions = [
  [1, "请讲一个你主导的测试自动化改造项目。", "项目表达", '["项目影响力","自动化架构","复盘能力"]', "profile", "个人项目经历"],
  [2, "当需求不完整时，你如何判断测试范围和优先级？", "架构判断", '["风险分析","范围取舍","需求澄清"]', "role", "测试开发岗位核心能力"],
  [3, "你如何证明 AI 生成的测试用例是可信的？", "AI 质量方法", '["Evals","grader","执行证据"]', "market", "AI 质量工程岗位信号"],
  [4, "如果接口自动化用例在 CI 中偶发失败，你会怎样定位并治理？", "技术深度", '["CI 稳定性","可观测性","失败分类"]', "role", "高级测试开发岗位要求"],
  [5, "请设计一套 Agent 工具调用的测试方案，你会如何覆盖正确性、安全性和可恢复性？", "AI 质量方法", '["Agent 测试","安全边界","可恢复性"]', "technology", "Agent 评估与测试技术雷达"],
  [6, "你如何把一个只有自己能维护的自动化脚本，演进为团队可复用的工程能力？", "架构判断", '["分层设计","团队协作","工程治理"]', "profile", "个人发展目标"],
];

const signals = [
  ["apple-ai-qa-2026", "AI QA 岗位要求 LLM 与深度根因分析", "2026 年北京 AI QA 岗位将 LLM 理解、全栈问题定位、稳定性与质量策略同时列为核心能力。", "AI 质量方法", "https://jobs.apple.com/en-ca/details/200665346/ai-qa-engineer", "job", "2026-08-25", "2026-11-25"],
  ["wef-skills-2025", "AI、技术素养与分析思维持续上升", "WEF 的 2025–2030 技能展望将 AI 与大数据、技术素养列为增长最快的能力，同时强调分析思维与协作。", "项目表达", "https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/", "market", "2026-08-25", "2027-01-31"],
  ["pytest-9-1", "pytest 9.1 技术基线", "官方变更日志显示 pytest 9.1.1 已于 2026-06-19 发布，面试题应跟踪 fixture、插件与弃用变化。", "技术深度", "https://docs.pytest.org/en/latest/changelog.html", "technology", "2026-08-25", "2026-10-25"],
  ["playwright-agent", "Playwright Test Agents 进入技术雷达", "官方发布记录已出现面向 LLM 的 Test Agents，这使测试生成、修复和证据治理成为新的面试能力点。", "AI 质量方法", "https://playwright.dev/docs/release-notes", "technology", "2026-08-25", "2026-10-25"],
];

async function ensureSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS interview_profiles (id TEXT PRIMARY KEY, current_role TEXT NOT NULL, target_role TEXT NOT NULL, horizon TEXT NOT NULL, focus TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_questions (id INTEGER PRIMARY KEY AUTOINCREMENT, prompt TEXT NOT NULL, competency TEXT NOT NULL, tags_json TEXT NOT NULL, source_type TEXT NOT NULL, source_ref TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, question_id INTEGER NOT NULL, answer_text TEXT NOT NULL, score INTEGER NOT NULL, diagnosis_json TEXT NOT NULL, weak_tags_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_competency_scores (competency TEXT PRIMARY KEY, score INTEGER NOT NULL, evidence_count INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_market_signals (id TEXT PRIMARY KEY, title TEXT NOT NULL, summary TEXT NOT NULL, competency TEXT NOT NULL, source_url TEXT NOT NULL, source_type TEXT NOT NULL, observed_at TEXT NOT NULL, expires_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS interview_plan_items (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, competency TEXT NOT NULL, reason TEXT NOT NULL, duration_minutes INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'open', source_attempt_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_interview_attempts_question_created ON interview_attempts(question_id, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_interview_plan_status_created ON interview_plan_items(status, created_at)"),
  ]);

  await db.prepare("INSERT OR IGNORE INTO interview_profiles (id, current_role, target_role, horizon, focus) VALUES (?, ?, ?, ?, ?)")
    .bind("default", "物资运营与测试赋能", "AI 质量工程 / 高级测试开发", "12–18 个月", "工程化、AI 评估、影响力表达").run();

  for (const question of questions) {
    await db.prepare("INSERT OR IGNORE INTO interview_questions (id, prompt, competency, tags_json, source_type, source_ref) VALUES (?, ?, ?, ?, ?, ?)").bind(...question).run();
  }
  for (const signal of signals) {
    await db.prepare("INSERT OR REPLACE INTO interview_market_signals (id, title, summary, competency, source_url, source_type, observed_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(...signal).run();
  }
  for (const [competency, score] of [["项目表达", 62], ["技术深度", 58], ["架构判断", 52], ["AI 质量方法", 38]] as const) {
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
  const [profile, questionRows, attemptRows, scoreRows, signalRows, planRows] = await db.batch([
    db.prepare("SELECT * FROM interview_profiles WHERE id = 'default' LIMIT 1"),
    db.prepare("SELECT * FROM interview_questions WHERE active = 1 ORDER BY id"),
    db.prepare("SELECT a.*, q.prompt, q.competency FROM interview_attempts a JOIN interview_questions q ON q.id = a.question_id ORDER BY a.id DESC LIMIT 40"),
    db.prepare("SELECT * FROM interview_competency_scores ORDER BY score ASC"),
    db.prepare("SELECT * FROM interview_market_signals WHERE expires_at >= date('now') ORDER BY observed_at DESC"),
    db.prepare("SELECT * FROM interview_plan_items ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, id DESC LIMIT 30"),
  ]);

  return {
    profile: rows(profile)[0],
    questions: rows(questionRows).map((row) => ({ ...row, tags: parseJson(row.tags_json, []) })),
    attempts: rows(attemptRows).map((row) => ({ ...row, diagnosis: parseJson(row.diagnosis_json, {}), weakTags: parseJson(row.weak_tags_json, []) })),
    scores: rows(scoreRows),
    signals: rows(signalRows),
    plan: rows(planRows),
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

    return Response.json({ error: "不支持的操作" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 500 });
  }
}
