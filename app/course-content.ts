import { env } from "cloudflare:workers";
import type { ChatGPTUser } from "./chatgpt-auth";

export type CourseContentValue = Record<string, string>;

export type CourseContentOverride = {
  contentKey: string;
  courseId: string;
  levelId: number;
  section: string;
  content: CourseContentValue;
  updatedAt: string;
};

type Row = Record<string, string | number | null>;

export async function ensureCourseContentSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS course_content_overrides (content_key TEXT PRIMARY KEY NOT NULL, course_id TEXT NOT NULL, level_id INTEGER NOT NULL, section TEXT NOT NULL, content_json TEXT NOT NULL, updated_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_course_content_course_level_section ON course_content_overrides (course_id, level_id, section)"),
  ]);
}

export function validContentKey(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._-]{0,159}$/.test(value);
}

export function validContentSection(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9-]{0,59}$/.test(value);
}

export function safeCourseContent(value: unknown): CourseContentValue | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length || entries.length > 8) return null;
  const content: CourseContentValue = {};
  for (const [key, fieldValue] of entries) {
    if (!/^[a-z][a-zA-Z0-9]{0,39}$/.test(key) || typeof fieldValue !== "string" || fieldValue.length > 8_000) return null;
    content[key] = fieldValue;
  }
  return content;
}

export function courseContentFromRow(row: Row): CourseContentOverride {
  return {
    contentKey: String(row.content_key),
    courseId: String(row.course_id),
    levelId: Number(row.level_id),
    section: String(row.section),
    content: JSON.parse(String(row.content_json)) as CourseContentValue,
    updatedAt: String(row.updated_at),
  };
}

export async function canEditCourseContent(user: ChatGPTUser | null) {
  if (!user) return false;
  const runtimeEnv = env as typeof env & { COURSE_CONTENT_ADMIN_EMAIL_HASHES?: string };
  const allowedHashes = new Set(
    (runtimeEnv.COURSE_CONTENT_ADMIN_EMAIL_HASHES ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!allowedHashes.size) return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(user.email.trim().toLowerCase()));
  const emailHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return allowedHashes.has(emailHash);
}
