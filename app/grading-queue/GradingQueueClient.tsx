"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./grading-queue.css";
/* eslint-disable @next/next/no-html-link-for-pages -- vinext Link prefetch crashes in production; full-page navigation is intentional */

type TaskGrade = {
  passed: boolean;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  criteria: Array<{ criterion: string; met: boolean; evidence: string }>;
};

type Submission = {
  id: number;
  levelId: number;
  answer: string;
  status: "pending" | "judging" | "completed";
  grade: TaskGrade | null;
  createdAt: string;
  updatedAt: string;
};

const statusCopy = {
  pending: { label: "待评判", hint: "答案已保存，可以重新交给 DeepSeek" },
  judging: { label: "评判中", hint: "DeepSeek 正在逐条对照验收标准" },
  completed: { label: "已完成", hint: "结果已保存，可回到关卡查看" },
} as const;

async function requestQueue(body?: Record<string, unknown>) {
  const response = await fetch("/api/course-grade", body ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } : { headers: { Accept: "application/json" } });
  const result = await response.json() as { submissions?: Submission[]; submission?: Submission; error?: string };
  if (!response.ok) throw new Error(result.error ?? "批改队列操作失败");
  return result;
}

export default function GradingQueueClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    try {
      const result = await requestQueue();
      setSubmissions(result.submissions ?? []);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "加载批改队列失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadQueue(), 0);
    const timer = window.setInterval(() => void loadQueue(), 30_000);
    return () => { window.clearTimeout(initialTimer); window.clearInterval(timer); };
  }, [loadQueue]);

  const counts = useMemo(() => ({
    pending: submissions.filter((item) => item.status === "pending").length,
    judging: submissions.filter((item) => item.status === "judging").length,
    completed: submissions.filter((item) => item.status === "completed").length,
  }), [submissions]);

  function replaceSubmission(next?: Submission) {
    if (!next) return;
    setSubmissions((current) => [next, ...current.filter((item) => item.id !== next.id)]);
  }

  async function grade(item: Submission) {
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      const result = await requestQueue({ action: "grade", id: item.id });
      replaceSubmission(result.submission);
      setNotice(`Level ${item.levelId} 已由 DeepSeek 完成批改。`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "DeepSeek 批改失败");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="queue-page">
      <header className="queue-hero">
        <nav><a href="/courses/python-framework">← 返回 Python 课程</a><button type="button" onClick={() => void loadQueue()}>刷新队列</button></nav>
        <p>DEEPSEEK GRADING HISTORY</p>
        <h1>在线批改记录</h1>
        <span>答案提交后由 DeepSeek 立即逐条对照验收标准；失败的记录会保留在这里，稍后可以一键重试。</span>
      </header>

      <section className="queue-counts" aria-label="队列统计">
        <article><b>{counts.pending}</b><span>待评判</span></article>
        <article><b>{counts.judging}</b><span>评判中</span></article>
        <article><b>{counts.completed}</b><span>已完成</span></article>
      </section>

      <aside className="queue-howto">
        <b>这里记录什么</b>
        <p>课程里的即时对话和备用提交都由同一个 DeepSeek 服务评判。这里用于查看历史结果和重新处理网络中断时留下的待评判答案。</p>
      </aside>

      {notice && <p className="queue-notice" role="status">{notice}</p>}
      {error && <p className="queue-error" role="alert">{error}</p>}

      <section className="queue-list">
        {loading && <p className="queue-empty">正在读取批改队列…</p>}
        {!loading && submissions.length === 0 && <p className="queue-empty">还没有批改任务。先去任一关的“动手练”提交答案。</p>}
        {submissions.map((item) => {
          const copy = statusCopy[item.status];
          return (
            <article className={`queue-item ${item.status}`} key={item.id}>
              <header>
                <div><span>LEVEL {String(item.levelId).padStart(2, "0")}</span><h2>第 {item.levelId} 关批改任务</h2></div>
                <i>{copy.label}</i>
              </header>
              <div className="queue-state"><b>{copy.hint}</b><time>{new Date(item.updatedAt).toLocaleString("zh-CN")}</time></div>
              <details><summary>查看本次答案</summary><pre><code>{item.answer}</code></pre></details>

              {item.status !== "completed" && <div className="queue-actions">
                <button type="button" disabled={busyId === item.id || item.status === "judging"} onClick={() => void grade(item)}>{busyId === item.id ? "DeepSeek 批改中…" : item.status === "judging" ? "正在评判" : "重新交给 DeepSeek 批改"}</button>
              </div>}

              {item.grade && <section className="queue-grade">
                <strong>{item.grade.score}<small>分 · {item.grade.passed ? "通过" : "继续完善"}</small></strong>
                <p>{item.grade.summary}</p>
                <ul>{item.grade.criteria.map((criterion) => <li key={criterion.criterion}><b>{criterion.met ? "✓" : "×"} {criterion.criterion}</b><span>{criterion.evidence}</span></li>)}</ul>
              </section>}
            </article>
          );
        })}
      </section>
    </main>
  );
}
