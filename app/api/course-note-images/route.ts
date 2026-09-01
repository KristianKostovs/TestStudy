import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import {
  ensureCourseNotesSchema,
  imageResponseUrl,
  noteImageBucket,
  noteImageBytesLimit,
  noteImageLimit,
  ownerDirectory,
  safeFileName,
  supportedImageType,
  validCourseId,
  validDirectoryNumber,
} from "../../course-notes";

type Row = Record<string, string | number | null>;

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "请先使用 ChatGPT 账户登录后再上传图片" }, { status: 401 });
    const form = await request.formData();
    const courseId = form.get("courseId");
    const chapterId = Number(form.get("chapterId"));
    const levelId = Number(form.get("levelId"));
    const file = form.get("image");
    if (!validCourseId(courseId) || !validDirectoryNumber(chapterId) || !validDirectoryNumber(levelId)) {
      return Response.json({ error: "课程目录信息无效" }, { status: 400 });
    }
    if (!(file instanceof File)) return Response.json({ error: "请选择图片文件" }, { status: 400 });
    if (!supportedImageType(file.type)) return Response.json({ error: "仅支持 JPG、PNG、WebP 和 GIF 图片" }, { status: 415 });
    if (file.size <= 0 || file.size > noteImageBytesLimit) return Response.json({ error: "单张图片不能超过 6MB" }, { status: 413 });

    await ensureCourseNotesSchema();
    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM course_note_images WHERE owner_id = ? AND course_id = ? AND level_id = ?")
      .bind(user.userId, courseId, levelId).first<Row>();
    if (Number(count?.total ?? 0) >= noteImageLimit) return Response.json({ error: `每关最多保存 ${noteImageLimit} 张图片` }, { status: 409 });

    await env.DB.prepare("INSERT INTO course_notes (owner_id, course_id, chapter_id, level_id, title, content) VALUES (?, ?, ?, ?, ?, '') ON CONFLICT(owner_id, course_id, level_id) DO UPDATE SET chapter_id = excluded.chapter_id")
      .bind(user.userId, courseId, chapterId, levelId, `第 ${levelId} 关学习笔记`).run();

    const id = crypto.randomUUID();
    const ownerPath = await ownerDirectory(user.userId);
    const objectKey = `course-notes/${ownerPath}/${courseId}/chapter-${chapterId}/level-${levelId}/${id}`;
    const fileName = safeFileName(file.name);
    const bytes = await file.arrayBuffer();
    await noteImageBucket().put(objectKey, bytes, {
      httpMetadata: { contentType: file.type },
      customMetadata: { owner: ownerPath, courseId, chapterId: String(chapterId), levelId: String(levelId) },
    });
    try {
      await env.DB.prepare("INSERT INTO course_note_images (id, owner_id, course_id, chapter_id, level_id, object_key, file_name, content_type, byte_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, user.userId, courseId, chapterId, levelId, objectKey, fileName, file.type, file.size).run();
    } catch (error) {
      await noteImageBucket().delete(objectKey);
      throw error;
    }
    return Response.json({ image: { id, fileName, contentType: file.type, byteSize: file.size, createdAt: new Date().toISOString(), url: imageResponseUrl(id) } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "上传笔记图片失败" }, { status: 500 });
  }
}
