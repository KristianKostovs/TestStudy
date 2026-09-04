"use client";

import { useEffect, useState } from "react";
import type { CourseContentOverride, CourseContentValue } from "../../course-content";

export type CourseContentField = {
  name: string;
  label: string;
  value: string;
  multiline?: boolean;
  code?: boolean;
};

async function readApiResult<T>(response: Response, action: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`${action}接口返回了损坏的 JSON，请刷新页面后重试`);
    }
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(`${action}请求被登录保护拦截，请刷新页面确认登录状态后重试`);
  }
  throw new Error(`${action}接口返回了网页而不是数据（HTTP ${response.status}），请刷新后重试`);
}

export default function CourseContentEditButton({
  courseId,
  levelId,
  section,
  contentKey,
  fields,
  overridden,
  canEdit,
  onSaved,
  onReset,
}: {
  courseId: string;
  levelId: number;
  section: string;
  contentKey: string;
  fields: CourseContentField[];
  overridden: boolean;
  canEdit: boolean;
  onSaved: (record: CourseContentOverride) => void;
  onReset: (contentKey: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CourseContentValue>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (!canEdit) return null;

  async function save() {
    setBusy(true);
    setMessage("正在保存…");
    try {
      const response = await fetch("/api/course-content", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", courseId, levelId, section, contentKey, content: draft }),
      });
      const result = await readApiResult<{ override?: CourseContentOverride; error?: string }>(response, "保存");
      if (!response.ok || !result.override) throw new Error(result.error ?? "保存失败");
      onSaved(result.override);
      setMessage("已保存到云端，其他设备刷新后即可看到");
      window.setTimeout(() => setOpen(false), 650);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm("恢复源码中的默认内容吗？当前网页修改会被删除。")) return;
    setBusy(true);
    setMessage("正在恢复…");
    try {
      const response = await fetch("/api/course-content", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", courseId, contentKey }),
      });
      const result = await readApiResult<{ deleted?: boolean; error?: string }>(response, "恢复");
      if (!response.ok || !result.deleted) throw new Error(result.error ?? "恢复失败");
      onReset(contentKey);
      setOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "恢复失败");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button className={`course-content-edit-trigger ${overridden ? "overridden" : ""}`} type="button" onClick={() => {
      setDraft(Object.fromEntries(fields.map((field) => [field.name, field.value])));
      setMessage("");
      setOpen(true);
    }}>
      {overridden ? "已改 · 编辑" : "编辑"}
    </button>
    {open && <div className="course-content-editor-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="course-content-editor" role="dialog" aria-modal="true" aria-label="编辑课程内容">
        <header><div><span>COURSE CONTENT</span><h3>编辑本段课程说明</h3></div><button type="button" aria-label="关闭编辑窗口" onClick={() => setOpen(false)}>×</button></header>
        <p className="course-content-editor-path">Python 框架基础 / 第 {levelId} 关 / {section}</p>
        <div className="course-content-editor-fields">
          {fields.map((field) => <label key={field.name}>
            <span>{field.label}</span>
            {field.multiline || field.code
              ? <textarea className={field.code ? "code" : ""} value={draft[field.name] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [field.name]: event.target.value }))} />
              : <input value={draft[field.name] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [field.name]: event.target.value }))} />}
          </label>)}
        </div>
        <p className="course-content-editor-help">保存后立即覆盖线上显示内容，但不会修改源码默认版本。需要撤销时可恢复源码内容。</p>
        {message && <p className="course-content-editor-message" role="status">{message}</p>}
        <footer>
          {overridden && <button className="restore" type="button" disabled={busy} onClick={() => void reset()}>恢复源码内容</button>}
          <button type="button" disabled={busy} onClick={() => setOpen(false)}>取消</button>
          <button className="save" type="button" disabled={busy} onClick={() => void save()}>{busy ? "处理中…" : "保存到云端"}</button>
        </footer>
      </section>
    </div>}
  </>;
}
