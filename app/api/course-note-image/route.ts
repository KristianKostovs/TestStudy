import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureCourseNotesSchema, noteImageBucket } from "../../course-notes";

type Row = Record<string, string | number | null>;

async function ownedImage(request: Request, ownerId: string) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 80) return null;
  await ensureCourseNotesSchema();
  return env.DB.prepare("SELECT id, object_key, file_name, content_type, byte_size FROM course_note_images WHERE id = ? AND owner_id = ? LIMIT 1")
    .bind(id, ownerId).first<Row>();
}

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "请先登录后查看图片" }, { status: 401 });
    const image = await ownedImage(request, user.userId);
    if (!image) return Response.json({ error: "图片不存在" }, { status: 404 });
    const object = await noteImageBucket().get(String(image.object_key));
    if (!object) return Response.json({ error: "图片文件不存在" }, { status: 404 });
    const headers = new Headers({
      "Content-Type": String(image.content_type),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(String(image.file_name))}`,
      "X-Content-Type-Options": "nosniff",
    });
    if (object.httpEtag) headers.set("ETag", object.httpEtag);
    return new Response(object.body, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取图片失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "请先登录后删除图片" }, { status: 401 });
    const image = await ownedImage(request, user.userId);
    if (!image) return Response.json({ error: "图片不存在" }, { status: 404 });
    await noteImageBucket().delete(String(image.object_key));
    await env.DB.prepare("DELETE FROM course_note_images WHERE id = ? AND owner_id = ?").bind(String(image.id), user.userId).run();
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "删除图片失败" }, { status: 500 });
  }
}
