"use client";

import { useEffect, useState } from "react";
import LearningStepNav from "../courses/LearningStepNav";
import { blueprintLevelHref } from "../courses/blueprint-chapters";
import type { ProjectCourseTask, ProjectStudyPlan } from "./project-learning-format";
import "./project-learning.css";

type Props = {
  project: ProjectStudyPlan;
  tasks: readonly ProjectCourseTask[];
  starter: { path: string; command: string };
};

const labels = ["目标", "前置知识", "简明讲解", "动手任务", "客观验收"];
const courseName = (courseId: string) => courseId === "api-automation" ? "API 自动化" : courseId === "quality-engineering" ? "质量工程" : courseId;

export default function ProjectLearningTemplate({ project, tasks, starter }: Props) {
  const [stage, setStage] = useState(1);

  useEffect(() => {
    let scrollFrame = 0;
    function revealHash() {
      const hash = window.location.hash;
      if (hash.startsWith("#mapping-")) setStage(4);
      else if (hash === "#project-validation") setStage(5);
      else return;
      scrollFrame = window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" })));
    }
    const frame = window.requestAnimationFrame(revealHash);
    window.addEventListener("hashchange", revealHash);
    return () => { window.cancelAnimationFrame(frame); window.cancelAnimationFrame(scrollFrame); window.removeEventListener("hashchange", revealHash); };
  }, []);

  return <main className="course-workspace project-workspace ready">
    <header className="suite-topbar course-suite-topbar"><div><strong>学习中心 · 项目案例</strong><span>回到课程关卡时，练习与验收仍以关卡为准</span></div><div className="suite-live"><i />关联 {tasks.length} 个关卡</div></header>
    <header className="hero"><nav><a className="brand" href="/learn"><i>PR</i> 项目案例</a><div className="nav-actions"><a className="text-button course-back" href="/learn">← 返回学习中心</a></div></nav><div className="hero-grid"><section><p className="eyebrow">PROJECT PRACTICE</p><h1>{project.title}</h1><p className="lead">{project.problem}</p><a className="hero-cta" href="#project-case">查看案例材料 <span>→</span></a></section><aside className="progress-card"><div className="progress-top"><span>本案例关联课程</span><strong>{tasks.length} 关</strong></div><p>一个需求只覆盖对应能力点。</p><ol>{tasks.map((task) => <li key={`${task.courseId}-${task.levelId}`} title={task.title}>{task.levelId}</li>)}</ol></aside></div></header>

    <section className="map-section" id="project-case"><div className="section-heading"><p>PROJECT CASE</p><h2>案例练习 · 五步查看</h2><span>先看规则，再进入对应关卡完成练习。</span></div><div className="quest-map"><article className="level open"><div className="seal">1</div><div className="level-copy"><div className="level-header"><div><span className="level-no">CASE 01</span><h3>{project.title}</h3><p>需求契约、练习任务与验收范围</p></div></div><div className="level-body"><LearningStepNav active={stage} unlocked={5} onSelect={setStage} labels={labels} />
      {stage === 1 && <section className="stage-panel project-stage"><div className="objective"><b>目标</b><p>{project.goal}</p></div><button type="button" className="stage-continue" onClick={() => setStage(2)}>进入“前置知识” →</button></section>}
      {stage === 2 && <section className="stage-panel project-stage"><div className="beginner-note"><b>前置知识</b><ul>{project.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></div><button type="button" className="stage-continue" onClick={() => setStage(3)}>进入“简明讲解” →</button></section>}
      {stage === 3 && <section className="stage-panel project-stage"><div className="project-io"><p><b>输入</b>{project.input}</p><p><b>输出</b>{project.output}</p></div><div className="project-rules"><b>规则</b><ul>{project.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul></div><button type="button" className="stage-continue" onClick={() => setStage(4)}>进入“动手任务” →</button></section>}
      {stage === 4 && <section className="stage-panel project-stage"><ol className="project-task-list">{tasks.map((task) => <li id={`mapping-${task.courseId}-${task.levelId}`} key={`${task.courseId}-${task.levelId}`}><span>{courseName(task.courseId)} · 第 {task.levelId} 关</span><h4>{task.title}</h4><p>{task.task}</p><p>产出：{task.output}</p><a href={blueprintLevelHref(task.courseId, task.levelId)}>进入关卡 →</a></li>)}</ol><div className="project-run-sample"><b>自生成测试样例</b><code>{starter.path}</code><span>在目录内运行 <code>{starter.command}</code></span></div><button type="button" className="stage-continue" onClick={() => setStage(5)}>查看“客观验收” →</button></section>}
      {stage === 5 && <section className="stage-panel project-stage" id="project-validation"><div className="project-acceptance-list">{project.acceptance.map((item) => <article key={item.id}><b>{item.id}</b><div><h4>{item.scenario}</h4><p>{item.expected}</p></div></article>)}</div><p className="project-evidence-note">{project.status}。{project.evidence}</p></section>}
    </div></div></article></div><details className="project-evidence-boundary"><summary>范围与证据边界</summary><p>不涉及：{project.exclusions.join("、")}。</p></details></section>
    <footer><p>PROJECT PRACTICE</p><h2>返回课程，继续练习</h2><a href="/learn">← 返回学习中心</a></footer>
  </main>;
}
