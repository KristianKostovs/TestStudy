import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import {
  ensureCourseNotesSchema,
  imageResponseUrl,
  safeNoteContent,
  safeNoteTitle,
  validCourseId,
  validDirectoryNumber,
  type CourseNote,
} from "../../course-notes";

type Row = Record<string, string | number | null>;

function noteFromRow(row: Row, imageRows: Row[]): CourseNote {
  const courseId = String(row.course_id);
  const levelId = Number(row.level_id);
  return {
    courseId,
    chapterId: Number(row.chapter_id),
    levelId,
    title: String(row.title),
    content: String(row.content),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    images: imageRows.filter((image) => String(image.course_id) === courseId && Number(image.level_id) === levelId).map((image) => ({
      id: String(image.id),
      fileName: String(image.file_name),
      contentType: String(image.content_type),
      byteSize: Number(image.byte_size),
      createdAt: String(image.created_at),
      url: imageResponseUrl(String(image.id)),
    })),
  };
}

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "请先使用 ChatGPT 账户登录后再查看笔记" }, { status: 401 });
    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId") ?? "python-framework";
    const levelParam = url.searchParams.get("levelId");
    if (!validCourseId(courseId)) return Response.json({ error: "课程标识无效" }, { status: 400 });
    const levelId = levelParam === null ? null : Number(levelParam);
    if (levelId !== null && !validDirectoryNumber(levelId)) return Response.json({ error: "关卡标识无效" }, { status: 400 });

    await ensureCourseNotesSchema();
    const noteQuery = levelId === null
      ? env.DB.prepare("SELECT course_id, chapter_id, level_id, title, content, created_at, updated_at FROM course_notes WHERE owner_id = ? AND course_id = ? ORDER BY chapter_id, level_id").bind(user.userId, courseId)
      : env.DB.prepare("SELECT course_id, chapter_id, level_id, title, content, created_at, updated_at FROM course_notes WHERE owner_id = ? AND course_id = ? AND level_id = ? ORDER BY chapter_id, level_id").bind(user.userId, courseId, levelId);
    const imageQuery = levelId === null
      ? env.DB.prepare("SELECT id, course_id, level_id, file_name, content_type, byte_size, created_at FROM course_note_images WHERE owner_id = ? AND course_id = ? ORDER BY level_id, created_at").bind(user.userId, courseId)
      : env.DB.prepare("SELECT id, course_id, level_id, file_name, content_type, byte_size, created_at FROM course_note_images WHERE owner_id = ? AND course_id = ? AND level_id = ? ORDER BY created_at").bind(user.userId, courseId, levelId);
    const [notesResult, imagesResult] = await env.DB.batch([noteQuery, imageQuery]);
    const notes = (notesResult.results as Row[]).map((row) => noteFromRow(row, imagesResult.results as Row[]));
    return Response.json({ courseId, notes });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取学习笔记失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "请先使用 ChatGPT 账户登录后再保存笔记" }, { status: 401 });
    const payload = await request.json() as Record<string, unknown>;
    if (!validCourseId(payload.courseId) || !validDirectoryNumber(payload.chapterId) || !validDirectoryNumber(payload.levelId)) {
      return Response.json({ error: "课程目录信息无效" }, { status: 400 });
    }
    const content = safeNoteContent(payload.content);
    if (content === null) return Response.json({ error: "笔记内容格式无效" }, { status: 400 });
    const title = safeNoteTitle(payload.title, payload.levelId);

    await ensureCourseNotesSchema();
    await env.DB.prepare("INSERT INTO course_notes (owner_id, course_id, chapter_id, level_id, title, content) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(owner_id, course_id, level_id) DO UPDATE SET chapter_id = excluded.chapter_id, title = excluded.title, content = excluded.content, updated_at = CURRENT_TIMESTAMP")
      .bind(user.userId, payload.courseId, payload.chapterId, payload.levelId, title, content).run();
    const saved = await env.DB.prepare("SELECT course_id, chapter_id, level_id, title, content, created_at, updated_at FROM course_notes WHERE owner_id = ? AND course_id = ? AND level_id = ? LIMIT 1")
      .bind(user.userId, payload.courseId, payload.levelId).first<Row>();
    return Response.json({ note: saved ? noteFromRow(saved, []) : null });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存学习笔记失败" }, { status: 500 });
  }
}
