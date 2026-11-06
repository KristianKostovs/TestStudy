"use client";

import { useEffect, useMemo, useState } from "react";
import type { LearningModule, SourceAdapter } from "../learning-registry";
import { roadmapTitle, sourceKindMeta } from "../learning-registry";
import { blueprintStarterFor } from "../blueprint-starters";
import { blueprintChapters, blueprintLevelHref } from "./blueprint-chapters";
import { getConceptLesson } from "./lesson-format";
import BlueprintPracticeEditor from "./BlueprintPracticeEditor";
import LearningStepNav from "./LearningStepNav";
import ProjectTrackLink from "./ProjectTrackLink";
import UnderstandingCheck from "./UnderstandingCheck";
import "./blueprint-course.css";

const stepLabels = ["先认词", "看数据", "逐行理解", "动手练", "客观验收"];

type Progress = { unlocked: Record<number, number>; completed: number[] };

function progressKey(courseId: string) {
  return `learning-blueprint-steps-v1:${courseId}`;
}

export default function BlueprintCourseClient({ course, sources, chapterId }: {
  course: LearningModule;
  sources: SourceAdapter[];
  chapterId?: number;
}) {
  const chapters = useMemo(() => blueprintChapters(course), [course]);
  const chapter = chapterId ? chapters.find((item) => item.id === chapterId) : undefined;
  const [ready, setReady] = useState(false);
  const [openId, setOpenId] = useState(chapter?.levelIds[0] ?? 0);
  const [activeStages, setActiveStages] = useState<Record<number, number>>({});
  const [progress, setProgress] = useState<Progress>({ unlocked: {}, completed: [] });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(progressKey(course.id)) ?? "null") as Progress | null;
        if (saved && typeof saved === "object") {
          setProgress({
            unlocked: saved.unlocked && typeof saved.unlocked === "object" ? saved.unlocked : {},
            completed: Array.isArray(saved.completed) ? saved.completed.filter((id) => Number.isInteger(id)) : [],
          });
        }
      } catch { /* Keep the course usable if an old browser draft is malformed. */ }
      const deepLink = Number(window.location.hash.match(/^#level-(\d+)$/)?.[1]);
      if (chapterId && chapter?.levelIds.includes(deepLink)) setOpenId(deepLink);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [course.id, chapterId, chapter]);

  function saveProgress(next: Progress) {
    setProgress(next);
    window.localStorage.setItem(progressKey(course.id), JSON.stringify(next));
  }

  function advance(levelId: number, nextStage: number) {
    saveProgress({ ...progress, unlocked: { ...progress.unlocked, [levelId]: Math.max(progress.unlocked[levelId] ?? 1, nextStage) } });
    setActiveStages((current) => ({ ...current, [levelId]: nextStage }));
  }

  function passConcept(levelId: number) {
    if (!progress.completed.includes(levelId)) saveProgress({ ...progress, completed: [...progress.completed, levelId] });
  }

  const completed = progress.completed.length;
  const progressPercent = Math.round((completed / course.roadmap.length) * 100);

  return <main className={`course-workspace blueprint-workspace ${ready ? "ready" : ""}`}>
    <header className="suite-topbar course-suite-topbar">
      <div><strong>学习中心 · {course.title}</strong><span>{chapter ? `${chapter.title} · 一次专注一个学习步骤` : "按课程内容分章，逐关学习"}</span></div>
      <div className="suite-live"><i />已验证 {completed} 关</div>
    </header>
    <header className="hero">
      <nav>
        <a className="brand" href="/learn"><i>{course.sigil}</i> {course.title}</a>
        <div className="nav-actions"><a className="text-button course-back" href={chapter ? `/courses/${course.id}` : "/learn"}>{chapter ? "← 返回章节选择" : "← 返回学习中心"}</a></div>
      </nav>
      <div className="hero-grid">
        <section>
          <p className="eyebrow">{chapter ? `${course.title.toUpperCase()} · CHAPTER ${chapter.id}` : `${course.title.toUpperCase()} QUEST`}</p>
          <h1>{chapter ? chapter.title : course.title}</h1>
          <p className="lead">{chapter?.subtitle ?? course.subtitle}</p>
          <a className="hero-cta" href={chapter ? `#level-${chapter.levelIds[0]}` : `#chapters`}>{chapter ? "进入本章关卡" : "选择学习章节"} <span>→</span></a>
        </section>
        <aside className="progress-card">
          <div className="progress-top"><span>当前验证进度</span><strong>{progressPercent}%</strong></div>
          <div className="bar"><i style={{ width: `${progressPercent}%` }} /></div>
          <p>已有 {completed} 关通过客观验收</p>
          <div className="course-sync-state local"><i /><span>当前浏览器保存步骤；实践关仍需运行证据</span></div>
          <ol>{course.roadmap.map((item, index) => <li className={progress.completed.includes(index + 1) ? "lit" : ""} key={roadmapTitle(item)} title={roadmapTitle(item)}>{index + 1}</li>)}</ol>
        </aside>
      </div>
    </header>

    <section className="map-section" id={chapter ? "roadmap" : "chapters"}>
      <div className="section-heading"><p>{chapter ? "CHAPTER LEVELS" : "THE ROADMAP"}</p><h2>{chapter ? `${chapter.shortTitle} · 本章关卡` : "课程修炼地图"}</h2><span>{chapter ? "每关一次只显示一个学习步骤。" : "先选章节，再进入关卡；案例练习会出现在对应关卡内。"}</span></div>
      {!chapter ? <div className="chapter-grid">{chapters.map((item) => <article className="chapter-card" key={item.id}>
        <span>CHAPTER {String(item.id).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.subtitle}</p>
        <div><b>{item.levelIds.filter((id) => progress.completed.includes(id)).length} / {item.levelIds.length} 关已验证</b><i>{item.levelIds.map((id) => `L${id}`).join(" · ")}</i></div>
        <a href={`/courses/${course.id}/chapters/${item.id}`}>进入本章 <b>→</b></a>
      </article>)}</div> : <div className="quest-map">{chapter.levelIds.map((levelId) => {
        const item = course.roadmap[levelId - 1];
        if (!item) return null;
        const concept = getConceptLesson(course.id, levelId);
        const starter = typeof item === "string" ? null : blueprintStarterFor(course.id, levelId - 1, item);
        const open = openId === levelId;
        const stage = activeStages[levelId] ?? 1;
        const unlocked = progress.unlocked[levelId] ?? 1;
        const done = progress.completed.includes(levelId);
        return <article id={`level-${levelId}`} className={`level ${open ? "open" : ""} ${done ? "done" : ""}`} key={levelId}>
          <div className="seal">{done ? "✓" : levelId}</div>
          <div className="level-copy">
            <button type="button" className="level-header" aria-expanded={open} onClick={() => setOpenId(open ? 0 : levelId)}>
              <div><span className="level-no">LEVEL {String(levelId).padStart(2, "0")}</span><h3>{roadmapTitle(item)}</h3><p>{typeof item === "string" ? "关卡材料待补齐" : item.question}</p></div><span className="expand">{open ? "−" : "+"}</span>
            </button>
            {open && <div className="level-body">
              <LearningStepNav active={stage} unlocked={unlocked} onSelect={(step) => setActiveStages((current) => ({ ...current, [levelId]: step }))} labels={stepLabels} />
              <ProjectTrackLink courseId={course.id} levelId={levelId} compact />
              {typeof item === "string" ? <div className="stage-panel"><p>这一关仍在补充知识、练习和验收材料。</p></div> : <>
                {stage === 1 && <section className="stage-panel blueprint-step"><div className="beginner-note"><b>小白先看这里</b><p>先理解本关要用到的概念，再看固定输入与输出。</p></div><div className="blueprint-concept-grid">{item.foundations.map((foundation) => <article key={foundation}><b>{foundation}</b></article>)}</div><button type="button" className="stage-continue" onClick={() => advance(levelId, 2)}>概念看懂了，进入“看数据” →</button></section>}
                {stage === 2 && <section className="stage-panel blueprint-step"><div className="stage-intro"><span>先看它长什么样</span><h4>本关固定契约</h4></div><ul className="blueprint-contract-list">{item.contract.map((part) => <li key={part}>{part}</li>)}</ul>{concept && <pre className="blueprint-example"><code>{concept.example}</code></pre>}<p className="blueprint-step-note">预期产出：{item.evidence}</p><button type="button" className="stage-continue" onClick={() => advance(levelId, 3)}>看懂输入输出，进入“逐行理解” →</button></section>}
                {stage === 3 && <section className="stage-panel blueprint-step"><div className="objective"><b>本关目标</b><p>{concept?.goal ?? item.question}</p></div><div className="blueprint-explanation"><h4>简明讲解</h4><p>{concept?.explanation ?? item.question}</p>{concept && <pre className="blueprint-example"><code>{concept.example}</code></pre>}</div><button type="button" className="stage-continue" onClick={() => advance(levelId, 4)}>理解完成，进入“动手练” →</button></section>}
                {stage === 4 && <section className="stage-panel blueprint-step"><div className="task"><div className="task-title"><span>通关任务</span><b>{concept ? "理解后可选做" : "实践关"}</b></div><p>{item.practice}</p><p>交付物：{item.evidence}</p></div>{starter && <details className="blueprint-practice"><summary>{concept ? "可选项目练习" : "打开项目练习区"}</summary><div className="blueprint-focus"><b>本关只需完成</b><ul>{starter.focus.map((focus) => <li key={focus}>{focus}</li>)}</ul></div><BlueprintPracticeEditor courseId={course.id} levelId={levelId} starter={starter.code} files={starter.files} /></details>}<button type="button" className="stage-continue" onClick={() => advance(levelId, 5)}>查看“客观验收” →</button></section>}
                {stage === 5 && <section className="stage-panel blueprint-step"><div className="verify-card"><b>客观验收</b><ul>{item.acceptance.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul></div>{concept ? <UnderstandingCheck lesson={concept} passed={done} onPass={() => passConcept(levelId)} /> : <p className="blueprint-evidence-note">练习代码保存在当前浏览器；通过记录需要实际运行结果。当前关卡尚未接通自动运行，不能仅凭阅读或编辑标记通过。</p>}<a className="blueprint-next-level" href={levelId < course.roadmap.length ? blueprintLevelHref(course.id, levelId + 1) : `/courses/${course.id}`}>{levelId < course.roadmap.length ? "继续下一关 →" : "返回课程总览 →"}</a></section>}
              </>}
            </div>}
          </div>
        </article>;
      })}</div>}
      {chapter && <nav className="chapter-pager"><span>{chapter.id > 1 ? <a href={`/courses/${course.id}/chapters/${chapter.id - 1}`}>← 上一章</a> : null}</span><a href={`/courses/${course.id}`}>课程总览</a><span>{chapter.id < chapters.length ? <a href={`/courses/${course.id}/chapters/${chapter.id + 1}`}>下一章 →</a> : null}</span></nav>}
    </section>

    {!chapter && <details className="blueprint-sources"><summary>查看课程知识来源与更新说明</summary><div className="blueprint-source-grid">{sources.map((source) => <article key={source.id}><small>{sourceKindMeta[source.kind].label}</small><h3>{source.title}</h3><p>{source.description}</p>{source.href ? <a href={source.href} target="_blank" rel="noreferrer">查看来源 ↗</a> : null}</article>)}</div>{course.gapReview && <p>最近补充：{course.gapReview.summary}</p>}</details>}
    <footer><p>{course.title.toUpperCase()} QUEST</p><h2>按能力继续练习</h2><a href="/learn">← 返回全部学习方向</a></footer>
  </main>;
}
