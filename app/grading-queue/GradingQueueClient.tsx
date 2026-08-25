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
  pending: { label: "待评判", hint: "已进入队列，等待 Codex 领取" },
  judging: { label: "评判中", hint: "Codex 已领取，结果尚未回填" },
  completed: { label: "已完成", hint: "结果已保存，可回到关卡查看" },
} as const;

async function requestQueue(body?: Record<string, unknown>) {
  const response = await fetch("/api/course-grade", body ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } : { headers: { Accept: "application/json" } });
  const result = await response.json() as { submissions?: Submission[]; submission?: Submission; prompt?: string; error?: string };
  if (!response.ok) throw new Error(result.error ?? "批改队列操作失败");
  return result;
}

export default function GradingQueueClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<Record<number, string>>({});
  const [gradeDrafts, setGradeDrafts] = useState<Record<number, string>>({});
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

  async function claim(item: Submission) {
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      const result = await requestQueue({ action: "claim", id: item.id });
      replaceSubmission(result.submission);
      const prompt = result.prompt ?? "";
      setPrompts((current) => ({ ...current, [item.id]: prompt }));
      try {
        await navigator.clipboard.writeText(prompt);
        setNotice(`Level ${item.levelId} 的批改任务已复制，状态已变为“评判中”。`);
      } catch {
        setNotice("浏览器没有授予剪贴板权限；批改任务已在下方展开，可以手动复制。");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "领取失败");
    } finally {
      setBusyId(null);
    }
  }

  async function complete(item: Submission) {
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      const raw = (gradeDrafts[item.id] ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      if (!raw) throw new Error("请先粘贴 Codex 返回的 JSON 批改结果");
      const grade = JSON.parse(raw) as Record<string, unknown>;
      const result = await requestQueue({ action: "complete", id: item.id, grade });
      replaceSubmission(result.submission);
      setGradeDrafts((current) => ({ ...current, [item.id]: "" }));
      setNotice(`Level ${item.levelId} 已完成批改，学习页面会自动读取结果。`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存批改结果失败");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="queue-page">
      <header className="queue-hero">
        <nav><a href="/courses/python-framework">← 返回 Python 课程</a><button type="button" onClick={() => void loadQueue()}>刷新队列</button></nav>
        <p>CODEX ASYNC GRADING</p>
        <h1>异步批改队列</h1>
        <span>页面负责保存答案和状态，Codex 负责领取、评判并回填结果。当前流程不调用外部模型 API。</span>
      </header>

      <section className="queue-counts" aria-label="队列统计">
        <article><b>{counts.pending}</b><span>待评判</span></article>
        <article><b>{counts.judging}</b><span>评判中</span></article>
        <article><b>{counts.completed}</b><span>已完成</span></article>
      </section>

      <aside className="queue-howto">
        <b>当前怎么用</b>
        <p>在学习关卡提交答案后，它会进入这里。之后你可以让 Codex 打开“批改队列”；Codex 领取任务、按照验收标准评分，再把结果保存回来。关闭页面不会丢失记录。</p>
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
                <button type="button" disabled={busyId === item.id} onClick={() => void claim(item)}>{busyId === item.id ? "处理中…" : item.status === "pending" ? "领取并复制 Codex 批改单" : "重新显示 Codex 批改单"}</button>
                {prompts[item.id] && <label><span>Codex 批改单</span><textarea readOnly value={prompts[item.id]} onFocus={(event) => event.currentTarget.select()} /></label>}
                {item.status === "judging" && <label><span>粘贴 Codex 返回的 JSON 结果</span><textarea value={gradeDrafts[item.id] ?? ""} onChange={(event) => setGradeDrafts((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={'{"score": 80, "summary": "…", "strengths": [], "improvements": [], "criteria": [...]}'}/></label>}
                {item.status === "judging" && <button className="complete-grade" type="button" disabled={busyId === item.id} onClick={() => void complete(item)}>保存批改结果并标记完成</button>}
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
