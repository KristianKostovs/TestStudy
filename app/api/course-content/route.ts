import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import {
  canEditCourseContent,
  courseContentFromRow,
  ensureCourseContentSchema,
  safeCourseContent,
  validContentKey,
  validContentSection,
} from "../../course-content";
import { validCourseId, validDirectoryNumber } from "../../course-notes";

type Row = Record<string, string | number | null>;

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId") ?? "python-framework";
    const levelParam = url.searchParams.get("levelId");
    if (!validCourseId(courseId)) return Response.json({ error: "课程标识无效" }, { status: 400 });
    const levelId = levelParam === null ? null : Number(levelParam);
    if (levelId !== null && !validDirectoryNumber(levelId)) return Response.json({ error: "关卡标识无效" }, { status: 400 });

    await ensureCourseContentSchema();
    const result = levelId === null
      ? await env.DB.prepare("SELECT content_key, course_id, level_id, section, content_json, updated_at FROM course_content_overrides WHERE course_id = ? ORDER BY level_id, section, content_key").bind(courseId).all<Row>()
      : await env.DB.prepare("SELECT content_key, course_id, level_id, section, content_json, updated_at FROM course_content_overrides WHERE course_id = ? AND level_id = ? ORDER BY section, content_key").bind(courseId, levelId).all<Row>();
    return Response.json({
      courseId,
      overrides: result.results.map(courseContentFromRow),
      canEdit: await canEditCourseContent(user),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取课程内容失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "请先使用 ChatGPT 账户登录" }, { status: 401 });
    if (!await canEditCourseContent(user)) return Response.json({ error: "当前账号没有课程编辑权限" }, { status: 403 });
    const payload = await request.json() as Record<string, unknown>;
    if (!validCourseId(payload.courseId) || !validDirectoryNumber(payload.levelId) || !validContentKey(payload.contentKey) || !validContentSection(payload.section)) {
      return Response.json({ error: "课程内容定位信息无效" }, { status: 400 });
    }
    const content = safeCourseContent(payload.content);
    if (!content) return Response.json({ error: "课程内容格式无效或内容过长" }, { status: 400 });

    await ensureCourseContentSchema();
    await env.DB.prepare("INSERT INTO course_content_overrides (content_key, course_id, level_id, section, content_json, updated_by) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(content_key) DO UPDATE SET course_id = excluded.course_id, level_id = excluded.level_id, section = excluded.section, content_json = excluded.content_json, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP")
      .bind(payload.contentKey, payload.courseId, payload.levelId, payload.section, JSON.stringify(content), user.userId).run();
    const row = await env.DB.prepare("SELECT content_key, course_id, level_id, section, content_json, updated_at FROM course_content_overrides WHERE content_key = ? LIMIT 1")
      .bind(payload.contentKey).first<Row>();
    return Response.json({ override: row ? courseContentFromRow(row) : null });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存课程内容失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "请先使用 ChatGPT 账户登录" }, { status: 401 });
    if (!await canEditCourseContent(user)) return Response.json({ error: "当前账号没有课程编辑权限" }, { status: 403 });
    const payload = await request.json() as Record<string, unknown>;
    if (!validCourseId(payload.courseId) || !validContentKey(payload.contentKey)) {
      return Response.json({ error: "课程内容定位信息无效" }, { status: 400 });
    }
    await ensureCourseContentSchema();
    await env.DB.prepare("DELETE FROM course_content_overrides WHERE content_key = ? AND course_id = ?")
      .bind(payload.contentKey, payload.courseId).run();
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "恢复源码内容失败" }, { status: 500 });
  }
}
