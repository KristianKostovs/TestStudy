"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- native navigation avoids vinext RSC prefetch failures in production */
/* eslint-disable @next/next/no-img-element -- protected note images use an authenticated same-origin API */

import { useEffect, useMemo, useState } from "react";
import { pythonCourseChapters } from "../courses/python-framework/chapter-data";

type InterviewSnapshot = {
  attempts: Array<{ id: number }>;
  scores: Array<{ competency: string; score: number | null; evidence_count: number }>;
  plan: Array<{ id: number; status: "open" | "done" }>;
};

type CourseNote = {
  courseId: string;
  chapterId: number;
  levelId: number;
  title: string;
  content: string;
  updatedAt: string;
  images: Array<{ id: string; fileName: string; url: string }>;
};

export default function GrowthArchiveClient() {
  const [pythonCompleted, setPythonCompleted] = useState(0);
  const [interview, setInterview] = useState<InterviewSnapshot | null>(null);
  const [interviewUnavailable, setInterviewUnavailable] = useState(false);
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [notesUnavailable, setNotesUnavailable] = useState(false);

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

    fetch("/api/learning-sync", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((result: { state?: { progress?: { completed?: number[] } } } | null) => {
        const cloudCompleted = result?.state?.progress?.completed?.length;
        if (typeof cloudCompleted === "number") setPythonCompleted(cloudCompleted);
      })
      .catch(() => undefined);

    fetch("/api/interview")
      .then((response) => {
        if (!response.ok) throw new Error("interview unavailable");
        return response.json() as Promise<InterviewSnapshot>;
      })
      .then(setInterview)
      .catch(() => setInterviewUnavailable(true));

    fetch("/api/course-notes?courseId=python-framework", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("notes unavailable");
        return response.json() as Promise<{ notes?: CourseNote[] }>;
      })
      .then((result) => setNotes((result.notes ?? []).filter((note) => note.content.trim() || note.images.length)))
      .catch(() => setNotesUnavailable(true));
    return () => window.clearTimeout(progressTimer);
  }, []);

  const assessed = useMemo(() => interview?.scores.filter((score) => score.score !== null && score.evidence_count > 0) ?? [], [interview]);
  const average = assessed.length ? Math.round(assessed.reduce((sum, item) => sum + (item.score ?? 0), 0) / assessed.length) : null;
  const openPlans = interview?.plan.filter((item) => item.status === "open").length ?? 0;
  const noteImageCount = notes.reduce((total, note) => total + note.images.length, 0);
  const notesByChapter = useMemo(() => pythonCourseChapters.map((chapter) => ({
    chapter,
    notes: notes.filter((note) => note.chapterId === chapter.id).sort((left, right) => left.levelId - right.levelId),
  })).filter((group) => group.notes.length), [notes]);

  return (
    <main className="ready growth-archive-page">
      <header className="suite-topbar">
        <div><strong>成长档案</strong><span>课程进度与真实回答证据分别记录、统一查看</span></div>
        <div className="suite-live"><i />真实学习行为 + 笔记证据 + DeepSeek 诊断</div>
      </header>
      <header className="workspace-page-hero archive-hero">
        <p>YOUR GROWTH ARCHIVE</p>
        <h1>把学过的、练过的、<br /><em>暴露出的薄弱项放在一起看</em></h1>
        <span>这里不创造第二套分数。课程进度来自学习记录，关卡笔记保留你的理解和截图，面试能力来自真实回答与 DeepSeek 逐项诊断；诊断后的任务会进入同一份成长计划。</span>
      </header>

      <section className="archive-summary-grid">
        <article><span>Python 已通关</span><strong>{pythonCompleted}<small>/10</small></strong><p>{pythonCompleted ? "继续完成下一关的任务与自动小测。" : "还没有本机通关记录，可以从第一关开始。"}</p><a href="/courses/python-framework">继续学习 →</a></article>
        <article><span>面试能力证据</span><strong>{interview?.attempts.length ?? "—"}<small> 次回答</small></strong><p>{interviewUnavailable ? "面试数据暂时无法读取，不影响课程记录。" : assessed.length ? `已有 ${assessed.length} 个能力项经过 DeepSeek 诊断并形成证据。` : "完成第一次回答后，DeepSeek 才会依据真实内容形成能力判断。"}</p><a href="/interview">进入面试成长 →</a></article>
        <article><span>面试准备度</span><strong>{average === null ? "—" : `${average}%`}</strong><p>{average === null ? "没有真实回答前，不显示虚假的能力分。" : `当前还有 ${openPlans} 项成长任务待完成。`}</p><a href="/interview">查看成长计划 →</a></article>
        <article><span>学习笔记</span><strong>{notesUnavailable ? "—" : notes.length}<small> 关</small></strong><p>{notesUnavailable ? "账号笔记暂时无法读取。" : notes.length ? `已沉淀 ${noteImageCount} 张学习截图，按课程和章节归档。` : "完成关卡学习时，可以随手记录理解、疑问和截图。"}</p><a href="#course-note-directory">查看笔记目录 →</a></article>
      </section>

      <section className="archive-note-library" id="course-note-directory">
        <header className="workspace-section-heading">
          <p>LEARNING NOTE DIRECTORY</p>
          <h2>学习笔记目录</h2>
          <span>按“课程 / 章节 / 关卡”归档。文字和图片跟随账号保存，换电脑后仍能继续查看。</span>
        </header>
        <div className="note-directory-root">
          <div className="note-directory-course">
            <i>PY</i><span><b>Python 框架基础</b><small>{notes.length} 关笔记 · {noteImageCount} 张图片</small></span>
          </div>
          {notesByChapter.length ? <div className="note-chapter-list">
            {notesByChapter.map(({ chapter, notes: chapterNotes }) => <section className="note-chapter-group" key={chapter.id}>
              <header><span>CHAPTER {String(chapter.id).padStart(2, "0")}</span><h3>{chapter.title}</h3><small>{chapterNotes.length} 关有记录</small></header>
              <div className="archive-note-grid">
                {chapterNotes.map((note) => <article className="archive-note-card" key={`${note.courseId}-${note.levelId}`}>
                  <div className="archive-note-path"><span>第 {note.levelId} 关</span><time>{new Date(note.updatedAt).toLocaleDateString("zh-CN")}</time></div>
                  <h4>{note.title}</h4>
                  <p>{note.content.trim() || "这条笔记目前只保存了图片。"}</p>
                  {note.images.length > 0 && <div className="archive-note-images">
                    {note.images.slice(0, 3).map((image) => <a href={image.url} target="_blank" rel="noreferrer" key={image.id}><img src={image.url} alt={image.fileName} loading="lazy" /></a>)}
                    {note.images.length > 3 && <span>+{note.images.length - 3}</span>}
                  </div>}
                  <a className="archive-note-open" href={`/courses/python-framework/chapters/${chapter.id}#level-${note.levelId}`}>返回本关继续整理 →</a>
                </article>)}
              </div>
            </section>)}
          </div> : <div className="archive-note-empty">
            <b>{notesUnavailable ? "账号笔记暂时无法读取" : "还没有学习笔记"}</b>
            <p>{notesUnavailable ? "稍后刷新成长档案即可重试，不影响课程进度。" : "进入任意 Python 关卡，展开“本关学习笔记”开始记录。"}</p>
            {!notesUnavailable && <a href="/courses/python-framework/chapters/1">从第一章开始记录 →</a>}
          </div>}
        </div>
      </section>

      <section className="archive-next-step">
        <div><p>NEXT BEST ACTION</p><h2>{openPlans ? "先处理面试暴露出的薄弱项" : pythonCompleted < 10 ? "继续推进当前学习路线" : "用一次模拟面试检验迁移能力"}</h2><span>平台只推荐下一步，不会因为技术雷达新增内容就自动打乱你的学习节奏。</span></div>
        <a href={openPlans ? "/interview" : "/learn"}>{openPlans ? "打开成长计划" : "选择学习路线"} →</a>
      </section>
    </main>
  );
}
