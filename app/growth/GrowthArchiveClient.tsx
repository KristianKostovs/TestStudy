"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- native navigation avoids vinext RSC prefetch failures in production */

import { useEffect, useMemo, useState } from "react";

type InterviewSnapshot = {
  attempts: Array<{ id: number }>;
  scores: Array<{ competency: string; score: number | null; evidence_count: number }>;
  plan: Array<{ id: number; status: "open" | "done" }>;
};

export default function GrowthArchiveClient() {
  const [pythonCompleted, setPythonCompleted] = useState(0);
  const [interview, setInterview] = useState<InterviewSnapshot | null>(null);
  const [interviewUnavailable, setInterviewUnavailable] = useState(false);

  useEffect(() => {
    const progressTimer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("python-framework-quest-v2");
        if (stored) {
          const parsed = JSON.parse(stored) as { completed?: number[] };
          setPythonCompleted(parsed.completed?.length ?? 0);
        }
      } catch {
        setPythonCompleted(0);
      }
    }, 0);

    fetch("/api/interview")
      .then((response) => {
        if (!response.ok) throw new Error("interview unavailable");
        return response.json() as Promise<InterviewSnapshot>;
      })
      .then(setInterview)
      .catch(() => setInterviewUnavailable(true));
    return () => window.clearTimeout(progressTimer);
  }, []);

  const assessed = useMemo(() => interview?.scores.filter((score) => score.score !== null && score.evidence_count > 0) ?? [], [interview]);
  const average = assessed.length ? Math.round(assessed.reduce((sum, item) => sum + (item.score ?? 0), 0) / assessed.length) : null;
  const openPlans = interview?.plan.filter((item) => item.status === "open").length ?? 0;

  return (
    <main className="ready growth-archive-page">
      <header className="suite-topbar">
        <div><strong>成长档案</strong><span>课程进度与真实回答证据分别记录、统一查看</span></div>
        <div className="suite-live"><i />档案来自真实学习行为</div>
      </header>
      <header className="workspace-page-hero archive-hero">
        <p>YOUR GROWTH ARCHIVE</p>
        <h1>把学过的、练过的、<br /><em>暴露出的薄弱项放在一起看</em></h1>
        <span>这里不创造第二套分数。课程进度来自本机学习记录，面试能力来自你的真实回答证据。</span>
      </header>

      <section className="archive-summary-grid">
        <article><span>Python 已通关</span><strong>{pythonCompleted}<small>/10</small></strong><p>{pythonCompleted ? "继续完成下一关的任务与自动小测。" : "还没有本机通关记录，可以从第一关开始。"}</p><a href="/courses/python-framework">继续学习 →</a></article>
        <article><span>面试能力证据</span><strong>{interview?.attempts.length ?? "—"}<small> 次回答</small></strong><p>{interviewUnavailable ? "面试数据暂时无法读取，不影响本机课程记录。" : assessed.length ? `已有 ${assessed.length} 个能力项形成证据。` : "完成第一次回答后才会形成能力判断。"}</p><a href="/interview">进入面试成长 →</a></article>
        <article><span>面试准备度</span><strong>{average === null ? "—" : `${average}%`}</strong><p>{average === null ? "没有真实回答前，不显示虚假的能力分。" : `当前还有 ${openPlans} 项成长任务待完成。`}</p><a href="/interview">查看成长计划 →</a></article>
      </section>

      <section className="archive-next-step">
        <div><p>NEXT BEST ACTION</p><h2>{openPlans ? "先处理面试暴露出的薄弱项" : pythonCompleted < 10 ? "继续推进当前学习路线" : "用一次模拟面试检验迁移能力"}</h2><span>平台只推荐下一步，不会因为技术雷达新增内容就自动打乱你的学习节奏。</span></div>
        <a href={openPlans ? "/interview" : "/learn"}>{openPlans ? "打开成长计划" : "选择学习路线"} →</a>
      </section>
    </main>
  );
}
