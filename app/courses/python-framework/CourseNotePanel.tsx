"use client";
/* eslint-disable @next/next/no-img-element -- protected note images use an authenticated same-origin API */

import { useCallback, useEffect, useRef, useState } from "react";

type NoteImage = {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
  url: string;
};

type Note = {
  title: string;
  content: string;
  updatedAt: string;
  images: NoteImage[];
};

type NoteSyncInfo = {
  accountFingerprint: string;
  lastUpdatedAt: string | null;
};

type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error" | "local";

const onlineSiteOrigin = "https://python-framework-quest.leafy-slug-3142.chatgpt.site";

export default function CourseNotePanel({
  courseId,
  chapterId,
  levelId,
  levelTitle,
  online,
}: {
  courseId: string;
  chapterId: number;
  levelId: number;
  levelTitle: string;
  online: boolean;
}) {
  const defaultTitle = `第 ${levelId} 关 · ${levelTitle}`;
  const localKey = `course-note-local:${courseId}:${levelId}`;
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<NoteImage[]>([]);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [message, setMessage] = useState("正在读取账号笔记…");
  const [uploading, setUploading] = useState(false);
  const [syncInfo, setSyncInfo] = useState<NoteSyncInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const loadNote = useCallback(async () => {
    if (!online) {
      try {
        const local = window.localStorage.getItem(localKey);
        if (local) {
          const parsed = JSON.parse(local) as { title?: string; content?: string };
          setTitle(parsed.title || defaultTitle);
          setContent(parsed.content || "");
        }
      } catch {
        // Keep the empty editor when local cache is malformed.
      }
      setImages([]);
      setStatus("local");
      setMessage("本机草稿只保存在这台电脑；图片请回到线上页面添加");
      hydratedRef.current = true;
      return;
    }
    setStatus("loading");
    setMessage("正在读取账号笔记…");
    try {
      const response = await fetch(`/api/course-notes?courseId=${encodeURIComponent(courseId)}&levelId=${levelId}`, { cache: "no-store" });
      const result = await response.json() as { notes?: Note[]; sync?: NoteSyncInfo; error?: string };
      if (!response.ok) throw new Error(result.error ?? "读取失败");
      const note = result.notes?.[0];
      setTitle(note?.title || defaultTitle);
      setContent(note?.content || "");
      setImages(note?.images || []);
      setSyncInfo(result.sync ?? null);
      setStatus("saved");
      setMessage(note ? "已从账号加载" : "还没有笔记，开始记录吧");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "读取笔记失败");
    } finally {
      hydratedRef.current = true;
    }
  }, [courseId, defaultTitle, levelId, localKey, online]);

  useEffect(() => {
    hydratedRef.current = false;
    void loadNote();
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, [loadNote]);

  const saveNow = useCallback(async (nextTitle = title, nextContent = content) => {
    if (!hydratedRef.current) return;
    if (!online) {
      window.localStorage.setItem(localKey, JSON.stringify({ title: nextTitle, content: nextContent }));
      setStatus("local");
      setMessage("本机草稿已保存；回到线上页面后才能进入成长档案");
      return;
    }
    setStatus("saving");
    setMessage("正在保存到账号…");
    try {
      const response = await fetch("/api/course-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, chapterId, levelId, title: nextTitle, content: nextContent }),
      });
      const result = await response.json() as { note?: Note; sync?: NoteSyncInfo; error?: string };
      if (!response.ok) throw new Error(result.error ?? "保存失败");
      setSyncInfo(result.sync ?? null);
      setStatus("saved");
      setMessage("已保存到账号 · 成长档案同步更新");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "保存笔记失败");
    }
  }, [chapterId, content, courseId, levelId, localKey, online, title]);

  function scheduleSave(nextTitle: string, nextContent: string) {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    setStatus(online ? "saving" : "local");
    setMessage(online ? "已修改，准备保存…" : "本机草稿准备保存…");
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void saveNow(nextTitle, nextContent);
    }, 750);
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    if (!online) {
      setStatus("error");
      setMessage("图片需要在登录后的线上页面上传");
      return;
    }
    setUploading(true);
    setMessage("正在上传图片…");
    try {
      await saveNow();
      const uploaded: NoteImage[] = [];
      for (const file of files) {
        const form = new FormData();
        form.set("courseId", courseId);
        form.set("chapterId", String(chapterId));
        form.set("levelId", String(levelId));
        form.set("image", file);
        const response = await fetch("/api/course-note-images", { method: "POST", body: form });
        const result = await response.json() as { image?: NoteImage; error?: string };
        if (!response.ok || !result.image) throw new Error(result.error ?? "图片上传失败");
        uploaded.push(result.image);
      }
      setImages((current) => [...current, ...uploaded]);
      setStatus("saved");
      setMessage(`已保存 ${uploaded.length} 张图片 · 成长档案同步更新`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "图片上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeImage(image: NoteImage) {
    if (!window.confirm(`从本关笔记中删除“${image.fileName}”吗？`)) return;
    try {
      const response = await fetch(`/api/course-note-image?id=${encodeURIComponent(image.id)}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "删除失败");
      setImages((current) => current.filter((item) => item.id !== image.id));
      setStatus("saved");
      setMessage("图片已删除");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "删除图片失败");
    }
  }

  function formatCloudTime(value: string | null) {
    if (!value) return "尚无云端记录";
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
      ? `${value.replace(" ", "T")}Z`
      : value;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }

  return (
    <details className="level-note-panel">
      <summary>
        <span><i>笔</i><b>本关学习笔记</b><small>文字、截图和自己的理解</small></span>
        <em>{content.trim() || images.length ? `${content.trim().length} 字 · ${images.length} 图` : "开始记录"}</em>
      </summary>
      <section className="level-note-editor">
        <header>
          <div><b>保存目录</b><span>Python 框架基础 / 第 {chapterId} 章 / 第 {levelId} 关</span></div>
          <p className={`note-save-state ${status}`}><i />{message}</p>
        </header>
        {online && syncInfo && <aside className="note-sync-identity" aria-label="云端同步身份">
          <div><span>同步账号编号</span><strong>{syncInfo.accountFingerprint}</strong></div>
          <div><span>本关云端更新时间</span><time dateTime={syncInfo.lastUpdatedAt ?? undefined}>{formatCloudTime(syncInfo.lastUpdatedAt)}</time></div>
          <p>在另一台电脑打开同一网站后核对这个编号；编号一致，才表示正在读取同一个云端账号。</p>
        </aside>}
        {!online && <aside className="note-local-warning">
          <span>当前是本机页面</span>
          <p>文字可以暂存在本机，但不会出现在另一台电脑和成长档案中。请使用线上页面记录正式笔记。</p>
          <a href={`${onlineSiteOrigin}/courses/python-framework/chapters/${chapterId}#level-${levelId}`}>打开线上本关 →</a>
        </aside>}
        <label className="note-title-field">
          <span>笔记标题</span>
          <input value={title} maxLength={160} onChange={(event) => {
            const next = event.target.value;
            setTitle(next);
            scheduleSave(next, content);
          }} />
        </label>
        <label className="note-content-field">
          <span>写下你的理解、疑问和容易忘记的点</span>
          <textarea
            value={content}
            maxLength={40_000}
            placeholder="例如：反射负责根据字符串找到函数；pytest fixture 解析是另一套基于参数名和作用域的依赖注入机制。也可以直接粘贴截图。"
            onChange={(event) => {
              const next = event.target.value;
              setContent(next);
              scheduleSave(title, next);
            }}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/"));
              if (files.length) {
                event.preventDefault();
                void uploadFiles(files);
              }
            }}
          />
        </label>
        <div className="note-toolbar">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => void uploadFiles(Array.from(event.target.files ?? []))} />
          <button type="button" disabled={!online || uploading || images.length >= 8} onClick={() => fileInputRef.current?.click()}>{uploading ? "正在上传…" : "上传图片"}</button>
          <span>支持粘贴截图；JPG、PNG、WebP、GIF，单张不超过 6MB，每关最多 8 张</span>
          <button className="note-save-button" type="button" disabled={status === "saving"} onClick={() => void saveNow()}>{status === "saving" ? "保存中…" : "立即保存"}</button>
        </div>
        {images.length > 0 && <div className="note-image-grid">
          {images.map((image) => <figure key={image.id}>
            <a href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt={image.fileName} loading="lazy" /></a>
            <figcaption><span>{image.fileName}</span><button type="button" onClick={() => void removeImage(image)}>删除</button></figcaption>
          </figure>)}
        </div>}
      </section>
    </details>
  );
}
