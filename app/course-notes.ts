import { env } from "cloudflare:workers";

export const noteContentLimit = 40_000;
export const noteImageLimit = 8;
export const noteImageBytesLimit = 6 * 1024 * 1024;

export type CourseNoteImage = {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
  url: string;
};

export type CourseNote = {
  courseId: string;
  chapterId: number;
  levelId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  images: CourseNoteImage[];
};

type R2ObjectBodyLike = {
  body: ReadableStream;
  httpEtag?: string;
  httpMetadata?: { contentType?: string };
};

export type NoteImageBucket = {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBodyLike | null>;
  delete(key: string): Promise<void>;
};

export function noteImageBucket() {
  const bucket = (env as unknown as { NOTE_IMAGES?: NoteImageBucket }).NOTE_IMAGES;
  if (!bucket) throw new Error("笔记图片存储暂不可用");
  return bucket;
}

export async function ensureCourseNotesSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS course_notes (owner_id TEXT NOT NULL, course_id TEXT NOT NULL, chapter_id INTEGER NOT NULL, level_id INTEGER NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (owner_id, course_id, level_id))"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_course_notes_owner_course_chapter ON course_notes (owner_id, course_id, chapter_id, level_id)"),
    db.prepare("CREATE TABLE IF NOT EXISTS course_note_images (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT NOT NULL, course_id TEXT NOT NULL, chapter_id INTEGER NOT NULL, level_id INTEGER NOT NULL, object_key TEXT NOT NULL UNIQUE, file_name TEXT NOT NULL, content_type TEXT NOT NULL, byte_size INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_course_note_images_owner_course_level ON course_note_images (owner_id, course_id, level_id, created_at)"),
  ]);
}

export function validCourseId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}

export function validDirectoryNumber(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 100;
}

export function safeNoteTitle(value: unknown, levelId: number) {
  const title = typeof value === "string" ? value.trim().slice(0, 160) : "";
  return title || `第 ${levelId} 关学习笔记`;
}

export function safeNoteContent(value: unknown) {
  if (typeof value !== "string") return null;
  return value.slice(0, noteContentLimit);
}

export function supportedImageType(value: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(value);
}

export function safeFileName(value: string) {
  const cleaned = value.replace(/[\\/\u0000-\u001f\u007f]+/g, "-").trim().slice(0, 180);
  return cleaned || "学习笔记图片";
}

export async function ownerDirectory(ownerId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ownerId));
  return Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function imageResponseUrl(id: string) {
  return `/api/course-note-image?id=${encodeURIComponent(id)}`;
}
