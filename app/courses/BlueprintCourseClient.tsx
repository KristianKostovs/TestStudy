"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LearningModule, SourceAdapter } from "../learning-registry";
import { learningModules, roadmapTitle, sourceKindMeta } from "../learning-registry";
import { coursePreparation } from "../career-curriculum";
import { blueprintStarterFor } from "../blueprint-starters";
import { blueprintChapters, blueprintLevelHref } from "./blueprint-chapters";
import { getConceptLesson } from "./lesson-format";
import { emptyBlueprintProgress, readBlueprintProgress, type BlueprintProgress } from "./blueprint-progress";
import qualityLab from "../../config/quality-lab.json";
import WorkspacePractice from "./WorkspacePractice";
import BlueprintPracticeEditor from "./BlueprintPracticeEditor";
import LearningStepNav from "./LearningStepNav";
import ProjectTrackLink from "./ProjectTrackLink";
import UnderstandingCheck from "./UnderstandingCheck";
import "./blueprint-course.css";

const steps = [1, 2, 3, 4];
const practiceLabels = ["先认词", "看数据", "逐行理解", "练习与验证"];
const conceptLabels = ["先认词", "看例子", "理解关系", "理解检查"];

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
  const key = `learning-blueprint-steps-v1:${course.id}`;
  const [progress, setProgress] = useState(emptyBlueprintProgress);
  const latest = useRef(progress);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    function loadProgress() {
      latest.current = readBlueprintProgress(key);
      setProgress(latest.current);
    }
    function followLevel() {
      const deepLink = Number(window.location.hash.match(/^#level-(\d+)$/)?.[1]);
      if (chapterId && chapter?.levelIds.includes(deepLink)) setOpenId(deepLink);
    }
    function syncTabs(event: StorageEvent) {
      if (event.key === key || event.key === null) loadProgress();
    }
    const frame = window.requestAnimationFrame(() => {
      loadProgress();
      followLevel();
      setReady(true);
    });
    window.addEventListener("hashchange", followLevel);
    window.addEventListener("storage", syncTabs);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", followLevel);
      window.removeEventListener("storage", syncTabs);
    };
  }, [key, chapterId, chapter]);

  function saveProgress(change: (current: BlueprintProgress) => BlueprintProgress) {
    const next = change(storageError ? latest.current : readBlueprintProgress(key, latest.current));
    latest.current = next;
    setProgress(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
      setStorageError("");
    } catch { setStorageError("浏览器未能保存这次记录，请先复制需要保留的内容。"); }
  }

  function advance(levelId: number, nextStage: number) {
    saveProgress((current) => ({ ...current, unlocked: { ...current.unlocked, [levelId]: Math.max(current.unlocked[levelId] ?? 1, nextStage) } }));
    setActiveStages((current) => ({ ...current, [levelId]: nextStage }));
  }

  function passConcept(levelId: number) {
    saveProgress((current) => ({ ...current, completed: [...new Set([...current.completed, levelId])] }));
  }

  function recordReview(levelId: number, note: string) {
    saveProgress((current) => {
      const reviews = { ...current.reviews };
      if (note) reviews[levelId] = note;
      else delete reviews[levelId];
      return { ...current, reviews };
    });
  }

  const passedTests = Object.keys(progress.tests).map(Number).filter((id) => progress.tests[id]);
  const reviewed = Object.keys(progress.reviews).map(Number);
  const recorded = new Set([...progress.completed, ...passedTests, ...reviewed]);
  const progressPercent = Math.round((recorded.size / course.roadmap.length) * 100);

  return <main className={`course-workspace blueprint-workspace ${ready ? "ready" : ""}`}>
    <header className="suite-topbar course-suite-topbar">
      <div><strong>学习中心 · {course.title}</strong><span>{chapter ? `${chapter.title} · 一次专注一个学习步骤` : "按课程内容分章，逐关学习"}</span></div>
      <div className="suite-live"><i />已记录 {recorded.size} 关</div>
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
          {!chapter && coursePreparation[course.id]?.length > 0 && <p className="course-prerequisites">建议先学：{coursePreparation[course.id].map((id) => <a href={`/courses/${id}`} key={id}>{learningModules.find((item) => item.id === id)?.title}</a>)}</p>}
          {!chapter && qualityLab.tasks.some((task) => task.courseId === course.id) && <p className="course-prerequisites"><a href="/downloads/quality-engineering-lab.zip" download>下载离线练习包 · 5 项任务</a></p>}
          <a className="hero-cta" href={chapter ? `#level-${chapter.levelIds[0]}` : `#chapters`}>{chapter ? "进入本章关卡" : "选择学习章节"} <span>→</span></a>
        </section>
        <aside className="progress-card">
          <div className="progress-top"><span>有学习记录的关卡</span><strong>{progressPercent}%</strong></div>
          <div className="bar"><i style={{ width: `${progressPercent}%` }} /></div>
          <p>理解检查通过 {progress.completed.length} 关 · 本机测试通过 {passedTests.length} 关 · 已自查 {reviewed.length} 关</p>
          <div className="course-sync-state local"><i /><span>记录保存在当前浏览器</span></div>
          {storageError && <p role="alert">{storageError}</p>}
          <ol>{course.roadmap.map((item, index) => <li className={recorded.has(index + 1) ? "lit" : ""} key={roadmapTitle(item)} title={roadmapTitle(item)}>{index + 1}</li>)}</ol>
        </aside>
      </div>
    </header>

    <section className="map-section" id={chapter ? "roadmap" : "chapters"}>
      <div className="section-heading"><p>{chapter ? "CHAPTER LEVELS" : "THE ROADMAP"}</p><h2>{chapter ? `${chapter.shortTitle} · 本章关卡` : "课程修炼地图"}</h2><span>{chapter ? "每关一次只显示一个学习步骤。" : "先选章节，再进入关卡；案例练习会出现在对应关卡内。"}</span></div>
      {!chapter ? <div className="chapter-grid">{chapters.map((item) => <article className="chapter-card" key={item.id}>
        <span>CHAPTER {String(item.id).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.subtitle}</p>
        <div><b>{item.levelIds.filter((id) => recorded.has(id)).length} / {item.levelIds.length} 关有记录</b><i>{item.levelIds.map((id) => `L${id}`).join(" · ")}</i></div>
        <a href={`/courses/${course.id}/chapters/${item.id}`}>进入本章 <b>→</b></a>
      </article>)}</div> : <div className="quest-map">{chapter.levelIds.map((levelId) => {
        const item = course.roadmap[levelId - 1];
        if (!item) return null;
        const concept = getConceptLesson(course.id, levelId);
        const starter = typeof item === "string" ? null : blueprintStarterFor(course.id, levelId - 1, item);
        const open = openId === levelId;
        const stage = activeStages[levelId] ?? 1;
        const unlocked = Math.max(1, Math.min(4, progress.unlocked[levelId] ?? 1));
        const done = progress.completed.includes(levelId);
        const lab = qualityLab.tasks.find((task) => task.courseId === course.id && task.levelId === levelId);
        const test = progress.tests[levelId];
        const review = progress.reviews[levelId];
        const status = done ? "理解检查已通过" : test === true ? "本机测试已通过" : test === false ? "上次本机测试未通过" : review ? "已保存自查记录" : "";
        const draft = starter && <details className="blueprint-practice">
          <summary>{concept ? "选做练习" : lab ? "查看网页草稿（选用）" : "打开网页练习草稿"}</summary>
          <div className="blueprint-focus">
            {concept && typeof item !== "string" && <p>{item.practice}</p>}
            {lab ? <p>网页草稿保存在此浏览器。本机测试读取 VS Code 中保存的文件。</p> : <p>在这里起草答案，编辑内容会保存在当前浏览器。</p>}
            <ul>{starter.focus.map((focus) => <li key={focus}>{focus}</li>)}</ul>
          </div>
          <BlueprintPracticeEditor courseId={course.id} levelId={levelId} starter={starter.code} files={starter.files} legacyMarkedLines={starter.legacyMarkedLines} />
        </details>;
        return <article id={`level-${levelId}`} className={`level ${open ? "open" : ""} ${done ? "done" : ""}`} key={levelId}>
          <div className="seal">{done || test === true ? "✓" : levelId}</div>
          <div className="level-copy">
            <button type="button" className="level-header" aria-expanded={open} onClick={() => setOpenId(open ? 0 : levelId)}>
              <div><span className="level-no">LEVEL {String(levelId).padStart(2, "0")}{status && ` · ${status}`}</span><h3>{roadmapTitle(item)}</h3><p>{typeof item === "string" ? "关卡材料待补齐" : item.question}</p></div><span className="expand">{open ? "−" : "+"}</span>
            </button>
            {open && <div className="level-body">
              <LearningStepNav active={stage} unlocked={unlocked} onSelect={(step) => setActiveStages((current) => ({ ...current, [levelId]: step }))} steps={steps} labels={concept ? conceptLabels : practiceLabels} />
              <ProjectTrackLink courseId={course.id} levelId={levelId} compact />
              {typeof item === "string" ? <div className="stage-panel"><p>这一关仍在补充知识、练习和验收材料。</p></div> : <>
                {stage === 1 && <section className="stage-panel blueprint-step"><div className="beginner-note"><b>小白先看这里</b><p>先理解本关要用到的概念，再看固定输入与输出。</p></div><div className="blueprint-concept-grid">{item.foundations.map((foundation) => <article key={foundation}><b>{foundation}</b></article>)}</div><button type="button" className="stage-continue" onClick={() => advance(levelId, 2)}>{concept ? "继续看例子" : "继续看数据"}</button></section>}
                {stage === 2 && <section className="stage-panel blueprint-step"><div className="stage-intro"><span>先看它长什么样</span><h4>本关固定契约</h4></div><ul className="blueprint-contract-list">{item.contract.filter((part) => part !== item.example).map((part) => <li key={part}>{part}</li>)}</ul>{(concept?.example ?? item.example) && <pre className="blueprint-example"><code>{concept?.example ?? item.example}</code></pre>}{!concept && <p className="blueprint-step-note">本关交付物 · {item.evidence}</p>}<button type="button" className="stage-continue" onClick={() => advance(levelId, 3)}>{concept ? "继续理解关系" : "继续逐行理解"}</button></section>}
                {stage === 3 && <section className="stage-panel blueprint-step"><div className="objective"><b>本关目标</b><p>{concept?.goal ?? item.goal ?? item.question}</p></div><div className="blueprint-explanation"><h4>简明讲解</h4><p>{concept?.explanation ?? item.explanation ?? item.question}</p>{(concept?.example ?? item.example) && <pre className="blueprint-example"><code>{concept?.example ?? item.example}</code></pre>}</div><button type="button" className="stage-continue" onClick={() => advance(levelId, 4)}>{concept ? "进入理解检查" : "进入练习与验证"}</button></section>}
                {stage === 4 && <section className="stage-panel blueprint-step blueprint-finish" aria-label={concept ? "本关理解检查" : "本关练习与验证"}>
                  {concept ? <>
                    <UnderstandingCheck lesson={concept} passed={done} onPass={() => passConcept(levelId)} />
                    {draft}
                  </> : <>
                    {lab ? <WorkspacePractice config={{
                      exerciseId: `quality-lab-${lab.task}`, title: item.title, requirement: item.practice,
                      exerciseFile: qualityLab.file, symbol: lab.symbol,
                    }} downloadHref="/downloads/quality-engineering-lab.zip" onVerification={(passed) => {
                      saveProgress((current) => ({ ...current, tests: { ...current.tests, [levelId]: passed } }));
                    }} /> : <div className="blueprint-assignment">
                      <h4>本关练习</h4>
                      <p>{item.practice}</p>
                      {starter && <p className="blueprint-targets">练习文件 {starter.files.map((file) => <code key={file}>{file}</code>)}</p>}
                    </div>}
                    <div className="verify-card blueprint-criteria">
                      <h4>验收标准</h4>
                      <p>交付物 · {item.evidence}</p>
                      <ul>{item.acceptance.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
                      {lab ? <details className="blueprint-manual"><summary>在终端运行本关测试</summary>
                        <p>打开练习包，在含有 <code>run_tests.py</code> 的目录执行以下命令。</p>
                        <pre><code>python3 run_tests.py --task {lab.task}</code></pre>
                        <p>网页按钮会登记本机测试结果。手动运行后，也可以在下方保存结果和其他交付物的位置。</p>
                      </details> : <p className="blueprint-evidence-note">本关按以上标准自查。你可以记录实际结果或交付文件的位置。</p>}
                    </div>
                    {draft}
                    <details className="blueprint-review">
                      <summary>{review ? "查看或编辑自查记录" : "保存自查记录（选用）"}</summary>
                      <form onSubmit={(event) => {
                        event.preventDefault();
                        recordReview(levelId, String(new FormData(event.currentTarget).get("review") ?? "").trim());
                      }}>
                        <label htmlFor={`review-${course.id}-${levelId}`}>实际结果或证据位置</label>
                        <textarea key={review} id={`review-${course.id}-${levelId}`} name="review" rows={3} defaultValue={review ?? ""} />
                        <button type="submit">保存自查记录</button>
                        {(review || storageError) && <span role="status">{storageError || "自查记录已保存"}</span>}
                      </form>
                    </details>
                  </>}
                  <a className="blueprint-next-level" href={levelId < course.roadmap.length ? blueprintLevelHref(course.id, levelId + 1) : `/courses/${course.id}`}>{levelId < course.roadmap.length ? "继续下一关" : "返回课程总览"}</a>
                </section>}
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
