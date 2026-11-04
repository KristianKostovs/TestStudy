import type { ProjectCourseTask, ProjectStudyPlan } from "./project-learning-format";

type Props = {
  project: ProjectStudyPlan;
  tasks: readonly ProjectCourseTask[];
  starter: { path: string; command: string };
};

const courseName = (courseId: string) => courseId === "api-automation" ? "API 自动化" : courseId === "quality-engineering" ? "质量工程" : courseId;

export default function ProjectLearningTemplate({ project, tasks, starter }: Props) {
  return <main className="ready real-project-page">
    <header className="real-project-hero">
      <a href="/learn">← 学习中心</a>
      <span>真实项目 · 学习样例</span>
      <h1>{project.title}</h1>
      <p>{project.problem}</p>
      <nav><a href="#project-practice">开始任务 ↓</a><a href="#project-validation">查看验收</a></nav>
    </header>

    <div className="project-lesson-standard" aria-label="项目学习规范">
      <section className="project-lesson-section" id="project-goal">
        <header><span>01</span><h2>目标</h2></header>
        <p className="project-goal-text">{project.goal}</p>
      </section>

      <section className="project-lesson-section" id="project-prerequisites">
        <header><span>02</span><h2>前置知识</h2></header>
        <ul className="project-prerequisites">{project.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="project-lesson-section" id="project-explanation">
        <header><span>03</span><h2>简明讲解</h2></header>
        <div className="project-io"><p><b>输入</b>{project.input}</p><p><b>输出</b>{project.output}</p></div>
        <ul className="project-rules">{project.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
      </section>

      <section className="project-lesson-section" id="project-practice">
        <header><span>04</span><h2>动手任务</h2></header>
        <ol className="project-task-list">{tasks.map((task, index) => <li id={`mapping-${task.courseId}-${task.levelId}`} key={`${task.courseId}-${task.levelId}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div><small>{courseName(task.courseId)} · 第 {task.levelId} 关</small><h3>{task.title}</h3><p>{task.task}</p><p><b>产出</b>{task.output}</p></div>
          <a href={`/courses/${task.courseId}#level-${task.levelId}`}>进入关卡 →</a>
        </li>)}</ol>
        <div className="project-run-sample"><strong>自生成测试样例</strong><code>{starter.path}</code><span>在目录内运行 <code>{starter.command}</code></span></div>
      </section>

      <section className="project-lesson-section" id="project-validation">
        <header><span>05</span><h2>客观验收</h2></header>
        <div className="project-acceptance-list">{project.acceptance.map((item) => <article key={item.id}>
          <b>{item.id}</b><div><h3>{item.scenario}</h3><p>{item.expected}</p></div>
        </article>)}</div>
      </section>
    </div>

    <details className="project-evidence-boundary"><summary>范围与证据边界</summary>
      <p>{project.status}。{project.evidence}</p>
      <p>不涉及：{project.exclusions.join("、")}。</p>
    </details>
    <nav className="project-footer-nav"><a href="/learn">← 返回学习中心</a><a href="https://github.com/KristianKostovs/TestStudy/blob/main/docs/REAL_REPOSITORY_LEARNING_PLAN.md" target="_blank" rel="noreferrer">查看项目计划 ↗</a></nav>
  </main>;
}
