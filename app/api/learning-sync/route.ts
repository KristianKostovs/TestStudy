import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

type Row = Record<string, string | number | null>;

type TaskGrade = {
  passed: boolean;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  criteria: Array<{ criterion: string; met: boolean; evidence: string }>;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type LearningState = {
  progress: {
    completed: number[];
    quizPassed: number[];
    stageUnlocked: Record<number, number>;
    taskDrafts: Record<number, string>;
    taskGrades: Record<number, TaskGrade>;
  };
  chats: Record<number, ChatMessage[]>;
  clocks: Record<string, string>;
};

const courseId = "python-framework";
const maxStateBytes = 300_000;

async function ensureSchema() {
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS course_learning_states (owner_id TEXT NOT NULL, course_id TEXT NOT NULL, state_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (owner_id, course_id))",
  ).run();
}

async function currentUserId() {
  const user = await getChatGPTUser();
  return user?.userId ?? null;
}

function validLevel(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 10;
}

function levelList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(validLevel))].sort((left, right) => left - right);
}

function levelNumberRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key, item]) => validLevel(Number(key)) && Number.isInteger(item) && Number(item) >= 1 && Number(item) <= 5)
    .map(([key, item]) => [Number(key), Number(item)]));
}

function levelStringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key, item]) => validLevel(Number(key)) && typeof item === "string")
    .map(([key, item]) => [Number(key), String(item).slice(0, 12_000)]));
}

function parseGrade(value: unknown): TaskGrade | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const grade = value as Record<string, unknown>;
  const score = Number(grade.score);
  if (!Number.isInteger(score) || score < 0 || score > 100 || typeof grade.summary !== "string") return null;
  const criteria = Array.isArray(grade.criteria)
    ? grade.criteria.flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const criterion = item as Record<string, unknown>;
      if (typeof criterion.criterion !== "string" || typeof criterion.met !== "boolean" || typeof criterion.evidence !== "string") return [];
      return [{ criterion: criterion.criterion.slice(0, 500), met: criterion.met, evidence: criterion.evidence.slice(0, 2_000) }];
    }).slice(0, 20)
    : [];
  return {
    passed: Boolean(grade.passed),
    score,
    summary: grade.summary.slice(0, 2_000),
    strengths: Array.isArray(grade.strengths) ? grade.strengths.filter((item): item is string => typeof item === "string").slice(0, 5) : [],
    improvements: Array.isArray(grade.improvements) ? grade.improvements.filter((item): item is string => typeof item === "string").slice(0, 5) : [],
    criteria,
  };
}

function levelGradeRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
    const grade = parseGrade(item);
    return validLevel(Number(key)) && grade ? [[Number(key), grade]] : [];
  }));
}

function chatRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, messages]) => {
    if (!validLevel(Number(key)) || !Array.isArray(messages)) return [];
    const parsed = messages.flatMap((message) => {
      if (!message || typeof message !== "object" || Array.isArray(message)) return [];
      const candidate = message as Record<string, unknown>;
      if ((candidate.role !== "user" && candidate.role !== "assistant") || typeof candidate.content !== "string" || typeof candidate.createdAt !== "string") return [];
      return [{
        role: candidate.role,
        content: candidate.content.slice(0, 12_000),
        createdAt: candidate.createdAt.slice(0, 64),
      } satisfies ChatMessage];
    }).slice(-100);
    return messages.length ? [[Number(key), parsed]] : [];
  }));
}

function clockRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key, item]) => key.length <= 80 && typeof item === "string" && !Number.isNaN(Date.parse(item)))
    .slice(0, 100));
}

function parseState(value: unknown): LearningState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return null;
  }
  if (new TextEncoder().encode(serialized).byteLength > maxStateBytes) return null;

  const candidate = value as Record<string, unknown>;
  const progress = candidate.progress && typeof candidate.progress === "object" && !Array.isArray(candidate.progress)
    ? candidate.progress as Record<string, unknown>
    : {};
  return {
    progress: {
      completed: levelList(progress.completed),
      quizPassed: levelList(progress.quizPassed),
      stageUnlocked: levelNumberRecord(progress.stageUnlocked),
      taskDrafts: levelStringRecord(progress.taskDrafts),
      taskGrades: levelGradeRecord(progress.taskGrades),
    },
    chats: chatRecord(candidate.chats),
    clocks: clockRecord(candidate.clocks),
  };
}

function parseStoredState(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    return parseState(JSON.parse(value));
  } catch {
    return null;
  }
}

function responseState(row: Row | null) {
  if (!row) return { courseId, state: null, revision: 0, updatedAt: null };
  return {
    courseId,
    state: parseStoredState(row.state_json),
    revision: Number(row.revision),
    updatedAt: String(row.updated_at),
  };
}

async function findState(ownerId: string) {
  return env.DB.prepare("SELECT state_json, revision, updated_at FROM course_learning_states WHERE owner_id = ? AND course_id = ? LIMIT 1")
    .bind(ownerId, courseId).first<Row>();
}

export async function GET() {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) return Response.json({ error: "请先使用 ChatGPT 账户登录后再同步" }, { status: 401 });
    await ensureSchema();
    return Response.json(responseState(await findState(ownerId)));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取学习进度失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) return Response.json({ error: "请先使用 ChatGPT 账户登录后再同步" }, { status: 401 });
    await ensureSchema();

    const payload = await request.json() as Record<string, unknown>;
    if (payload.courseId !== courseId) return Response.json({ error: "课程标识无效" }, { status: 400 });
    const state = parseState(payload.state);
    if (!state) return Response.json({ error: "学习记录格式无效或内容过大" }, { status: 400 });
    const baseRevision = Number(payload.baseRevision);
    if (!Number.isInteger(baseRevision) || baseRevision < 0) return Response.json({ error: "同步版本无效" }, { status: 400 });

    const existing = await findState(ownerId);
    if (!existing) {
      if (baseRevision !== 0) return Response.json(responseState(null), { status: 409 });
      await env.DB.prepare("INSERT INTO course_learning_states (owner_id, course_id, state_json, revision) VALUES (?, ?, ?, 1)")
        .bind(ownerId, courseId, JSON.stringify(state)).run();
      return Response.json(responseState(await findState(ownerId)));
    }

    if (Number(existing.revision) !== baseRevision) {
      return Response.json(responseState(existing), { status: 409 });
    }

    const updated = await env.DB.prepare("UPDATE course_learning_states SET state_json = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND course_id = ? AND revision = ? RETURNING state_json, revision, updated_at")
      .bind(JSON.stringify(state), ownerId, courseId, baseRevision).first<Row>();
    if (!updated) return Response.json(responseState(await findState(ownerId)), { status: 409 });
    return Response.json(responseState(updated));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存学习进度失败" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) return Response.json({ error: "请先使用 ChatGPT 账户登录后再同步" }, { status: 401 });
    await ensureSchema();
    await env.DB.prepare("DELETE FROM course_learning_states WHERE owner_id = ? AND course_id = ?")
      .bind(ownerId, courseId).run();
    return Response.json({ courseId, state: null, revision: 0, updatedAt: null });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "清空学习进度失败" }, { status: 500 });
  }
}
