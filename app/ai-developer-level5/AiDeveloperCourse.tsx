"use client";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import KnowledgeDialog, { type KnowledgePoint } from "../courses/KnowledgeDialog";
import LearningStepNav, { learningStepLabels } from "../courses/LearningStepNav";
import CourseNotePanel from "../courses/python-framework/CourseNotePanel";
import type { LearningStage } from "./learning-plan";
import type { exercises as aiExercises } from "./exercises";
import { useCourseState } from "./useCourseState";

const PythonAnswerEditor = lazy(() => import("../courses/python-framework/PythonAnswerEditor"));

export type InteractiveCourseConfig = {
  baseHref?: string; chapters?: { id: number; title: string; subtitle: string; lessonIds: number[] }[];
  id: string; title: string; brand: string; sigil: string; eyebrow: string; mapTitle: string;
  nextHref: string; nextTitle: string; resources?: { title: string; href: string }[]; stages: (LearningStage & { chapter?: number })[];
  exercises: (typeof aiExercises[number] & { quizCode?: string; files?: string[] })[];
};

export default function InteractiveCourse({ config, chapterId }: { config: InteractiveCourseConfig; chapterId?: number }) {
  const { stages: learningStages, exercises, id: aiCourseId } = config;
  const chapter = config.chapters?.find((item) => item.id === chapterId);
  const [activeId, setActiveId] = useState(chapter?.lessonIds[0] ?? 1);
  const [inLesson, setInLesson] = useState(false);
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [knowledge, setKnowledge] = useState<KnowledgePoint | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const activeRef = useRef(activeId);
  const { state, ready, message, update, flush } = useCourseState(aiCourseId);
  const lesson = learningStages[activeId - 1];
  const exercise = exercises[activeId - 1];
  const unlocked = state.progress.stageUnlocked[activeId] ?? 1;
  const answer = state.progress.taskDrafts[activeId] ?? exercise.starter;
  const grade = state.progress.taskGrades[activeId];
  const completed = state.progress.completed;
  const available = (id: number) => !config.chapters || id === 1 || completed.includes(id) || completed.includes(id - 1);
  const chapterAvailable = !chapter || chapter.id === 1 || completed.includes(chapter.lessonIds[0] - 1) || chapter.lessonIds.some((id) => completed.includes(id));
  const visibleIds = chapter?.lessonIds ?? learningStages.map((_, index) => index + 1);
  const progress = Math.round(completed.length / learningStages.length * 100);

  useEffect(() => {
    function readHash() {
      const raw = window.location.hash.slice(1);
      const index = learningStages.findIndex((item, i) => item.id === raw || raw === `lesson-${i + 1}`);
      if (index >= 0 && config.chapters && !chapter) {
        const target = config.chapters.find((item) => item.lessonIds.includes(index + 1));
        if (target) window.location.replace(`${config.baseHref}/chapters/${target.id}#lesson-${index + 1}`);
        return;
      }
      setInLesson(index >= 0 && (!chapter || chapter.lessonIds.includes(index + 1)));
      if (index >= 0) { setActiveId(index + 1); activeRef.current = index + 1; setStep(1); setChoice(null); setQuizFeedback(""); setShowAnswer(false); }
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => { window.removeEventListener("hashchange", readHash); window.removeEventListener("popstate", readHash); };
  }, [learningStages, config.chapters, config.baseHref, chapter]);

  function selectLesson(id: number) {
    if (!available(id) || !ready) return;
    if (config.chapters && (!chapter || !chapter.lessonIds.includes(id))) {
      const target = config.chapters.find((item) => item.lessonIds.includes(id));
      if (target) window.location.assign(`${config.baseHref}/chapters/${target.id}#lesson-${id}`);
      return;
    }
    setInLesson(true);
    activeRef.current = id;
    setActiveId(id); setStep(1); setChoice(null); setQuizFeedback(""); setQuestion(""); setError(""); setShowAnswer(false);
    window.history.pushState(null, "", `#lesson-${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showOverview() {
    setInLesson(false);
    setKnowledge(null);
    window.history.pushState(null, "", "#roadmap");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function advance() {
    const next = Math.min(5, step + 1);
    update((s) => ({ ...s, progress: { ...s.progress, stageUnlocked: { ...s.progress.stageUnlocked, [activeId]: Math.max(unlocked, next) } } }), [`progress.stageUnlocked.${activeId}`]);
    setStep(next);
  }

  function editAnswer(value: string) {
    update((s) => {
      const grades = { ...s.progress.taskGrades, [activeId]: { passed: false, score: 0, summary: "答案已修改，请重新批改。", strengths: [], improvements: [], criteria: [] } };
      return { ...s, progress: { ...s.progress, taskDrafts: { ...s.progress.taskDrafts, [activeId]: value }, taskGrades: grades, completed: s.progress.completed.filter((id) => id !== activeId) } };
    }, [`progress.taskDrafts.${activeId}`, `progress.taskGrades.${activeId}`, `progress.completed.${activeId}`]);
  }

  async function askTutor(text: string) {
    if (!text.trim() || pending) return;
    const id = activeId;
    const submittedAnswer = answer;
    const userMessage = { role: "user" as const, content: text, createdAt: new Date().toISOString() };
    const history = state.chats[id] ?? [];
    update((s) => ({ ...s, chats: { ...s.chats, [id]: [...(s.chats[id] ?? []), userMessage] } }), [`chats.${id}`]);
    setPending(true); setError(""); setQuestion("");
    try {
      const response = await fetch("/api/learning-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: aiCourseId, level: { id }, answer: submittedAnswer, message: text, history }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "助教暂时不可用");
      update((s) => {
        const unchanged = (s.progress.taskDrafts[id] ?? exercises[id - 1].starter) === submittedAnswer;
        const nextGrade = unchanged ? result.grade : null;
        return { ...s, chats: { ...s.chats, [id]: [...(s.chats[id] ?? []), { role: "assistant", content: result.reply, createdAt: new Date().toISOString() }] }, progress: nextGrade ? { ...s.progress, taskGrades: { ...s.progress.taskGrades, [id]: nextGrade }, completed: nextGrade.passed && s.progress.quizPassed.includes(id) ? [...new Set([...s.progress.completed, id])] : s.progress.completed.filter((value) => value !== id) } : s.progress };
      }, [`chats.${id}`, `progress.taskGrades.${id}`, `progress.completed.${id}`]);
    } catch (reason) { if (activeRef.current === id) setError(reason instanceof Error ? reason.message : "助教调用失败，请重试"); }
    finally { setPending(false); }
  }

  function checkQuiz() {
    if (choice === null) { setQuizFeedback("请先选择一个答案。"); return; }
    if (choice !== exercise.quiz.correct) { setQuizFeedback(`再想一想：${exercise.quiz.explanation}`); return; }
    setQuizFeedback(`回答正确。${exercise.quiz.explanation}`);
    update((s) => ({ ...s, progress: { ...s.progress, quizPassed: [...new Set([...s.progress.quizPassed, activeId])], completed: s.progress.taskGrades[activeId]?.passed ? [...new Set([...s.progress.completed, activeId])] : s.progress.completed } }), ["progress.quizPassed", `progress.completed.${activeId}`]);
  }

  return <main className="ready course-workspace ai5-course">
    <header className="suite-topbar course-suite-topbar"><div><strong>学习中心 · {config.title}</strong><span>{inLesson ? `第 ${activeId} 节 · 一次专注一个学习步骤` : (chapter ? `${chapter.title} · 按顺序解锁关卡` : "课程总览 · 选择章节开始学习")}</span></div><div className="suite-live"><i />{completed.length} / {learningStages.length} 节</div></header>
    {!inLesson && <header className="hero">
      <nav><a className="brand" href="/learn"><i>{config.sigil}</i> {config.brand}</a><div className="nav-actions"><a className="text-button course-back" href="/learn">← 返回学习中心</a><a className="text-button" href={config.nextHref}>{config.nextTitle}</a></div></nav>
      <div className="hero-grid"><section><p className="eyebrow">{config.eyebrow} · LEVEL {activeId}</p><h1>{chapter?.title ?? config.title}</h1><p className="lead">{chapter?.subtitle ?? (config.chapters ? "从第一章开始，完成练习与小测后解锁下一关。" : "选择需要学习的关卡，按五个步骤完成练习与小测。")}</p><button type="button" className="hero-cta" disabled={!ready || !chapterAvailable} onClick={() => selectLesson(visibleIds.find((id) => !completed.includes(id)) ?? visibleIds[0])}>进入当前关卡 <span>→</span></button></section>
        <aside className="progress-card"><div className="progress-top"><span>{config.title}当前进度</span><strong>{progress}%</strong></div><div className="bar"><i style={{ width: `${progress}%` }} /></div><p>{completed.length} / {learningStages.length} 节已完成</p><div className="course-sync-state" role="status"><i /><span>{message}</span><button type="button" disabled={!ready} onClick={() => void flush()}>重试</button></div><ol>{learningStages.map((item, index) => <li className={completed.includes(index + 1) ? "lit" : ""} key={item.id}>{index + 1}</li>)}</ol></aside>
      </div>
    </header>}
    {inLesson && <nav className="lesson-return" aria-label="关卡导航"><button type="button" className="text-button" onClick={showOverview}>← 返回{chapter ? "本章关卡" : "课程总览"}</button>{chapter && <a className="text-button" href={config.baseHref}>课程总览</a>}<span>{config.title} · 第 {activeId} 节</span></nav>}
    <section className="map-section" id="roadmap">
      {!inLesson && <><div className="section-heading"><p>{config.eyebrow}</p><h2>{chapter ? "本章关卡" : config.chapters ? "五章学习路线" : config.mapTitle}</h2><span>概念、数据、逐行理解、练习与小测。进度与其他课程分别保存。</span></div>
      {config.chapters && !chapter ? <div className="chapter-grid">{config.chapters.map((item) => {
        const count = item.lessonIds.filter((id) => completed.includes(id)).length;
        const canEnter = item.id === 1 || completed.includes(item.lessonIds[0] - 1) || count > 0;
        return <article className={`chapter-card ${count === item.lessonIds.length ? "complete" : ""} ${!canEnter ? "locked" : ""}`} key={item.id}><span>CHAPTER {String(item.id).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.subtitle}</p><div><b>{count} / {item.lessonIds.length} 关完成</b><i>{item.lessonIds.map((id) => `L${id}`).join(" · ")}</i></div>{canEnter ? <a href={`${config.baseHref}/chapters/${item.id}`}>进入本章 <b>→</b></a> : <span className="chapter-locked-label">完成上一章后解锁</span>}</article>;
      })}</div> : <><nav className="ai5-level-picker" aria-label="本章关卡">{visibleIds.map((id) => <button type="button" disabled={!ready || !chapterAvailable || !available(id)} onClick={() => selectLesson(id)} key={id}><b>{completed.includes(id) ? "✓" : available(id) ? id : "锁"}</b><span>{learningStages[id - 1].title}{!available(id) && <small> · 通过第 {id - 1} 关后解锁</small>}</span></button>)}</nav>{chapter && <a className="text-button" href={config.baseHref}>← 返回课程总览</a>}</>}
      </>}
      {inLesson && (!ready || !chapterAvailable || !available(activeId)) && <section className="stage-panel"><h2>{!ready ? "正在读取关卡进度…" : "本关尚未解锁"}</h2><p>{ready ? `请先通过第 ${activeId - 1} 关的练习与小测。` : "读取完成后将显示已解锁的内容。"}</p><button className="stage-continue" type="button" onClick={showOverview}>返回本章关卡</button></section>}
      {inLesson && ready && chapterAvailable && available(activeId) && <div className="quest-map">
        <article className={`level open ${completed.includes(activeId) ? "done" : ""}`} id={`level-${activeId}`}>
          <div className="seal">{completed.includes(activeId) ? "✓" : activeId}</div>
          <div className="level-copy"><header className="level-header"><div><span className="level-no">LEVEL {String(activeId).padStart(2, "0")} · {learningStepLabels[step - 1]}</span><h3>{lesson.title}</h3><p>{lesson.mapping}</p></div></header><div className="level-body">
        <LearningStepNav active={step} unlocked={unlocked} onSelect={setStep} />
        <CourseNotePanel key={activeId} courseId={aiCourseId} chapterId={lesson.chapter ?? Math.ceil(activeId / 3)} levelId={activeId} levelTitle={lesson.title} online />

        {step === 1 && <section className="stage-panel"><div className="beginner-note"><b>小白先看这里</b><p><strong>前置知识：</strong>{lesson.prerequisite}</p><p>{lesson.explanation}</p></div><div className="glossary-grid">{exercise.terms.map(([term, meaning]) => <button className="glossary-card" type="button" key={term} onClick={() => setKnowledge({ term, plain: meaning, role: lesson.explanation, example: exercise.example })}><span><b>{term}</b><i>点开解释</i></span><p>{meaning}</p></button>)}</div><button className="stage-continue" type="button" disabled={!ready} onClick={advance}>概念看懂了，进入“看数据” →</button></section>}
        {step === 2 && <section className="stage-panel"><h3>先看输入和结果长什么样</h3><pre className="ai5-code"><code>{exercise.input}</code></pre><p>先找出示例中的输入、变量和预期结果，再沿着数据流看它们如何变化。可以把自己的预测记在本节笔记中。</p><button className="stage-continue" type="button" onClick={advance}>数据看懂了，进入“逐行理解” →</button></section>}
        {step === 3 && <section className="stage-panel"><h3>逐行理解最小示例</h3><pre className="ai5-code"><code>{exercise.example}</code></pre><ol className="ai5-walkthrough">{exercise.walkthrough.map((line) => <li key={line}>{line}</li>)}</ol><details className="ai5-term compact-disclosure"><summary>继续学习这一主题需要哪些知识？</summary>{lesson.topics.map(([title, content]) => <p key={title}><strong>{title}：</strong>{content}</p>)}</details><button className="stage-continue" type="button" onClick={advance}>代码理解完成，进入“动手练” →</button></section>}
        {step === 4 && <section className="stage-panel"><h3>通关任务</h3><p>{exercise.task}</p><ul>{exercise.acceptance.map((item) => <li key={item}>{item}</li>)}</ul>{exercise.files && <p>本节项目文件：{exercise.files.join(" · ")}</p>}<Suspense fallback={<p>正在载入课程编辑器…</p>}><PythonAnswerEditor key={activeId} courseId={aiCourseId} levelId={activeId} value={answer} starter={exercise.starter} onChange={editAnswer} /></Suspense>
          <div className="local-codex-chat ai5-tutor"><header><div><i>DS</i><span><b>即时学习助教</b><small>由 DeepSeek 在线提供 · 对话随账号同步</small></span></div><em>在线</em></header><p>可以请求提示、完整参考答案，或按本节标准批改。代码运行结果请在 Python 环境验证，助教反馈不等于实际执行证明。</p><div className="codex-quick-actions"><button type="button" disabled={pending || !ready} onClick={() => void askTutor("请按本节验收标准批改我的当前答案。")}>即时批改</button><button type="button" disabled={pending || !ready} onClick={() => void askTutor("请给我一点提示，不要直接给完整答案。")}>给一点提示</button><button type="button" onClick={() => setShowAnswer(!showAnswer)}>{showAnswer ? "收起参考答案" : "查看参考答案"}</button></div>
          {showAnswer && <pre className="ai5-code"><code>{exercise.reference}</code></pre>}
          <div className="codex-chat-messages" aria-label="本节助教对话">{(state.chats[activeId] ?? []).map((item, index) => <article className={item.role} key={`${item.createdAt}-${index}`}><strong>{item.role === "user" ? "你" : "助教"}</strong><p>{item.content}</p></article>)}</div>
          <form className="codex-chat-composer" onSubmit={(event) => { event.preventDefault(); void askTutor(question); }}><label htmlFor="ai5-question">向助教提问</label><textarea id="ai5-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); void askTutor(question); } }} placeholder="例如：这里为什么要用集合？" /><button type="submit" disabled={pending || !ready || !question.trim()}>{pending ? "助教正在回复…" : "发送"}</button></form>{error && <p role="alert">{error}</p>}
          {grade && <div className="ai5-grade" role="status"><strong>{grade.passed ? "本节练习批改通过" : "还需要修改"} · {grade.score} 分</strong><p>{grade.summary}</p><ul>{grade.criteria.map((criterion) => <li key={criterion.criterion}>{criterion.met ? "✓" : "待补充"} {criterion.criterion}<p>{criterion.evidence}</p></li>)}</ul></div>}
          </div><button className="stage-continue" type="button" onClick={advance}>进入“自动小测” →</button></section>}
        {step === 5 && <section className="stage-panel"><h3>自动小测</h3>{exercise.quizCode && <pre className="ai5-code"><code>{exercise.quizCode}</code></pre>}<fieldset className="ai5-quiz"><legend>{exercise.quiz.question}</legend>{exercise.quiz.options.map((option, index) => <label key={option}><input type="radio" name={`quiz-${activeId}`} checked={choice === index} onChange={() => { setChoice(index); setQuizFeedback(""); }} />{option}</label>)}</fieldset><button className="stage-continue" type="button" onClick={checkQuiz}>检查答案</button><p role="status">{quizFeedback}</p><div className="ai5-grade"><strong>{completed.includes(activeId) ? (grade?.passed ? "本节练习与小测已通过" : "已保留旧版完成记录，可继续复习") : "完成条件"}</strong><p>{state.progress.quizPassed.includes(activeId) ? "✓ 小测已通过" : "小测待通过"} · {grade?.passed ? "✓ 练习批改已通过" : "练习待批改通过"}</p><p>完整项目还需保存：{lesson.evidence}</p>{!grade?.passed && <button type="button" onClick={() => setStep(4)}>回到动手练并批改</button>}</div></section>}
        <nav className="chapter-pager ai5-pager" aria-label="课程翻页"><button type="button" disabled={activeId === 1 || !available(activeId - 1)} onClick={() => selectLesson(activeId - 1)}>上一节<br /><b>{learningStages[activeId - 2]?.title ?? "已经是第一节"}</b></button>{activeId < learningStages.length ? <button type="button" disabled={!available(activeId + 1)} onClick={() => selectLesson(activeId + 1)}>{available(activeId + 1) ? "下一关" : "通过本关后解锁下一关"}<br /><b>{learningStages[activeId].title}</b></button> : <a href={config.nextHref}>继续学习<br /><b>{config.nextTitle} →</b></a>}</nav>
          </div></div>
        </article>
      </div>}
    </section>
    {!inLesson && config.resources && <nav className="course-resources" aria-label="课程官方资料"><strong>遇到时查阅官方资料</strong>{config.resources.map((resource) => <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer">{resource.title} ↗</a>)}</nav>}
    {knowledge && <KnowledgeDialog knowledge={knowledge} onClose={() => setKnowledge(null)} />}
  </main>;
}
