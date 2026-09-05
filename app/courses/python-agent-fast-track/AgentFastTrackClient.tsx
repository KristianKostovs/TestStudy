"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- this app uses native cross-page navigation to avoid production prefetch failures */

import { useEffect, useMemo, useState } from "react";
import BlueprintPracticeEditor from "../BlueprintPracticeEditor";
import { agentFastTrackChapters, agentFastTrackLessons, lessonById } from "./course-data";

const completionKey = "python-agent-fast-track-completed-v1";

function loadCompleted() {
  if (typeof window === "undefined") return [] as number[];
  try {
    const value = JSON.parse(window.localStorage.getItem(completionKey) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => Number.isInteger(item) && item >= 1 && item <= agentFastTrackLessons.length) : [];
  } catch {
    return [];
  }
}

export default function AgentFastTrackClient() {
  const [activeId, setActiveId] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const lesson = lessonById(activeId) ?? agentFastTrackLessons[0];
  const nextLesson = lessonById(activeId + 1);
  const previousLesson = lessonById(activeId - 1);
  const progress = Math.round((completed.length / agentFastTrackLessons.length) * 100);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hashId = Number(window.location.hash.replace("#lesson-", ""));
      if (lessonById(hashId)) setActiveId(hashId);
      setCompleted(loadCompleted());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const currentChapter = useMemo(
    () => agentFastTrackChapters.find((chapter) => chapter.id === lesson.chapter),
    [lesson.chapter],
  );

  function selectLesson(id: number) {
    setActiveId(id);
    window.history.replaceState(null, "", `#lesson-${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleComplete() {
    const next = completed.includes(activeId)
      ? completed.filter((id) => id !== activeId)
      : [...completed, activeId].sort((left, right) => left - right);
    setCompleted(next);
    window.localStorage.setItem(completionKey, JSON.stringify(next));
  }

  return (
    <main className="agent-fast-track">
      <header className="agent-course-topbar">
        <a href="/learn" className="agent-course-brand"><i>λ</i><span><strong>Python → Agent</strong><small>工单查询助手实战线</small></span></a>
        <div className="agent-course-progress" aria-label={`课程进度 ${progress}%`}>
          <span><b>{completed.length}</b> / {agentFastTrackLessons.length} 节掌握</span>
          <i><em style={{ width: `${progress}%` }} /></i>
        </div>
      </header>

      <div className="agent-course-layout">
        <aside className="agent-lesson-nav" aria-label="课程目录">
          <div className="agent-course-summary">
            <span>20–30 小时参考学习量</span>
            <h1>Python 基础<br /><em>Agent 快速通道</em></h1>
            <p>跳过你已经会的通用编程概念，以独立完成任务为准。</p>
          </div>
          <label className="agent-mobile-picker">
            <span>快速跳到任意一节</span>
            <select value={activeId} onChange={(event) => selectLesson(Number(event.target.value))}>
              {agentFastTrackLessons.map((item) => <option value={item.id} key={item.id}>{String(item.id).padStart(2, "0")} · {item.title}</option>)}
            </select>
          </label>
          {agentFastTrackChapters.map((chapter) => (
            <section key={chapter.id}>
              <h2>{chapter.title}</h2>
              <p>{chapter.subtitle}</p>
              <ol>
                {chapter.lessonIds.map((id) => {
                  const item = lessonById(id);
                  if (!item) return null;
                  return (
                    <li key={id}>
                      <button className={id === activeId ? "active" : undefined} type="button" onClick={() => selectLesson(id)}>
                        <span>{completed.includes(id) ? "✓" : String(id).padStart(2, "0")}</span>
                        <b>{item.title}</b>
                        <small>{item.duration}</small>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          <nav className="agent-official-sources" aria-label="课程官方资料">
            <strong>遇到时查阅官方资料</strong>
            <a href="https://docs.python.org/3/" target="_blank" rel="noreferrer">Python 文档 ↗</a>
            <a href="https://docs.pydantic.dev/latest/" target="_blank" rel="noreferrer">Pydantic 文档 ↗</a>
            <a href="https://docs.langchain.com/oss/python/langchain/tools" target="_blank" rel="noreferrer">LangChain Tools ↗</a>
            <a href="https://docs.langchain.com/oss/python/langgraph/overview" target="_blank" rel="noreferrer">LangGraph 文档 ↗</a>
          </nav>
        </aside>

        <article className="agent-lesson" id={`lesson-${lesson.id}`}>
          <header className="agent-lesson-hero">
            <div>
              <span>{currentChapter?.title} · LESSON {String(lesson.id).padStart(2, "0")}</span>
              <h2>{lesson.title}</h2>
              <p>{lesson.objective}</p>
            </div>
            <dl>
              <div><dt>预计用时</dt><dd>{lesson.duration}</dd></div>
              <div><dt>学习优先级</dt><dd className={lesson.priority === "入门前必须会" ? "must" : undefined}>{lesson.priority}</dd></div>
            </dl>
          </header>

          {lesson.lookupOnly?.length ? (
            <section className="agent-learning-boundary">
              <strong>这一节只掌握用法即可</strong>
              <p>下面内容不阻塞进入 Agent 框架，遇到真实需求时再查：</p>
              <ul>{lesson.lookupOnly.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ) : null}

          <section className="agent-learning-block explanation">
            <div className="agent-block-title"><b>01</b><div><span>先理解</span><h3>这一节解决什么</h3></div></div>
            {lesson.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {lesson.javaBridge ? (
              <div className="java-bridge">
                <strong>Java 经验可以这样借</strong>
                <p>{lesson.javaBridge.useful}</p>
                <strong>但不要这样类比</strong>
                <p>{lesson.javaBridge.trap}</p>
              </div>
            ) : null}
          </section>

          <section className="agent-learning-block">
            <div className="agent-block-title"><b>02</b><div><span>最小可运行示例</span><h3>先运行，再逐行解释</h3></div></div>
            <pre className="agent-code-sample"><code>{lesson.example}</code></pre>
          </section>

          <section className="agent-learning-block diagnostic">
            <div className="agent-block-title"><b>03</b><div><span>先预测</span><h3>输出是什么，或错误在哪里？</h3></div></div>
            <p>{lesson.diagnostic.prompt}</p>
            <pre className="agent-code-sample compact"><code>{lesson.diagnostic.code}</code></pre>
            <details>
              <summary>查看判断与解释</summary>
              <div><strong>{lesson.diagnostic.answer}</strong><p>{lesson.diagnostic.why}</p></div>
            </details>
          </section>

          <section className="agent-learning-block pitfalls">
            <div className="agent-block-title"><b>!</b><div><span>重点提醒</span><h3>这一节最容易踩的坑</h3></div></div>
            <ul>{lesson.pitfalls.map((pitfall) => <li key={pitfall}>{pitfall}</li>)}</ul>
          </section>

          <section className="agent-learning-block practice">
            <div className="agent-block-title"><b>04</b><div><span>自己修改</span><h3>工单查询助手 · 本节任务</h3></div></div>
            <p>项目骨架已经放入编辑器。先独立完成所有 <code>TODO（你来完成）</code>，再展开参考答案。</p>
            <BlueprintPracticeEditor
              courseId="python-agent-fast-track"
              levelId={lesson.id}
              starter={lesson.starter}
              files={lesson.files}
            />
            <details className="agent-reference-answer">
              <summary>参考答案与解释（默认折叠）</summary>
              <pre className="agent-code-sample"><code>{lesson.referenceAnswer}</code></pre>
              <p>{lesson.referenceExplanation}</p>
            </details>
          </section>

          <section className="agent-learning-block pass-gate">
            <div className="agent-block-title"><b>05</b><div><span>通过标准</span><h3>不是看完，而是能够独立完成</h3></div></div>
            <ul>{lesson.pass.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
            <button className={completed.includes(activeId) ? "completed" : undefined} type="button" onClick={toggleComplete}>
              {completed.includes(activeId) ? "✓ 已达到本节通过标准" : "我已独立完成并达到标准"}
            </button>
          </section>

          <nav className="agent-next-nav" aria-label="上一节和下一节">
            {previousLesson ? <button type="button" onClick={() => selectLesson(previousLesson.id)}>← 上一节<br /><b>{previousLesson.title}</b></button> : <a href="/learn">← 返回学习中心</a>}
            {nextLesson ? <button type="button" onClick={() => selectLesson(nextLesson.id)}>下一步入口 →<br /><b>{nextLesson.title}</b></button> : <a href="/courses/ai-testing">下一步入口 →<br /><b>进入 AI 测试课程</b></a>}
          </nav>
        </article>
      </div>
    </main>
  );
}
