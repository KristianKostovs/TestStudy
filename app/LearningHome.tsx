import {
  learningModules,
  sourceKindMeta,
  sourcesForModule,
  type SourceKind,
} from "./learning-registry";
import { careerStages } from "./career-curriculum";
import "./career-learning.css";

const sourceKinds: SourceKind[] = ["foundation", "technology_radar", "local_project"];
const mainCourseIds = careerStages.flatMap((stage) => stage.courseIds);
const orderedModules = [...mainCourseIds.map((id) => learningModules.find((module) => module.id === id)!), ...learningModules.filter((module) => !mainCourseIds.includes(module.id))];

export default function LearningHome() {
  return (
    <main className="ready platform-home">
      <header className="suite-topbar">
        <div><strong>学习中心</strong><span>选择能力方向，进入各自独立的课程与关卡</span></div>
        <div className="suite-live"><i />{learningModules.length} 条学习路线</div>
      </header>
      <header className="hero platform-hero">
        <div className="hero-grid">
          <section>
            <p className="eyebrow">YOUR LEARNING MAP</p>
            <h1>从独立编码，<br /><em>走向质量工程</em></h1>
            <p className="lead">服务端测试开发为主线，AI 测试与评测为特色。按能力依赖学习，用项目结果验收。</p>
            <div className="learning-home-actions"><a className="hero-cta" href="#career-path">查看学习顺序 <span>↓</span></a><a href="/learn/real-project">查看案例练习 →</a></div>
          </section>
          <aside className="platform-summary">
            <span>当前课程地图</span>
            <strong>{learningModules.length}</strong>
            <p>个独立学习方向</p>
            <ul>
              <li><b>{learningModules.filter((module) => module.status === "active").length}</b> 条路线已有分步互动课程</li>
              <li><b>{learningModules.filter((module) => module.status === "blueprint").length}</b> 条路线已备讲解与实践任务</li>
              <li><b>3</b> 类知识来源持续供给内容</li>
            </ul>
          </aside>
        </div>
      </header>

      <section className="module-section career-path-section" id="career-path">
        <div className="section-heading"><p>CAREER LEARNING PATH</p><h2>先补基础，再形成工程能力</h2><span>已掌握的内容可直接用任务自测；每阶段以产出决定下一步。</span></div>
        <ol className="career-stage-grid">{careerStages.map((stage, index) => <li key={stage.title}>
          <span>{String(index + 1).padStart(2, "0")} · {stage.priority}</span><h3>{stage.title}</h3>
          <div>{stage.courseIds.map((id) => <a href={`/courses/${id}`} key={id}>{learningModules.find((module) => module.id === id)?.title} →</a>)}</div>
          <p>{stage.output}</p>
        </li>)}</ol>
      </section>

      <section className="principles" aria-label="学习平台原则">
        <article><b>01</b><div><h2>能力构成主线</h2><p>按通用知识、前置依赖和客观验收组织课程。</p></div></article>
        <article><b>02</b><div><h2>需求提供案例</h2><p>一个需求只进入适合的关卡，不代表整门课程。</p></div></article>
        <article><b>03</b><div><h2>持续查漏补缺</h2><p>用权威更新和不同项目补知识、练习与证据。</p></div></article>
      </section>

      <section className="module-section home-module-section" id="modules">
        <div className="section-heading">
          <p>LEARNING DIRECTIONS</p>
          <h2>按能力选择课程</h2>
          <span>课程按建议顺序排列；UI 自动化与 AI 开发扩展作为专项选修。</span>
        </div>
        <div className="module-grid">
          {orderedModules.map((module) => {
            const sourceKindsInModule = new Set(sourcesForModule(module).map((source) => source.kind));
            return (
              <a className="module-card route-card" href={`/courses/${module.id}`} key={module.id}>
                <span className="module-sigil">{module.sigil}</span>
                <span className="module-state">{mainCourseIds.includes(module.id) ? "职业主线" : "专项选修"} · {module.status === "active" ? "互动课程" : "讲解与任务"}</span>
                <h3>{module.title}</h3>
                <p>{module.subtitle}</p>
                <span className="module-source-badges">
                  {sourceKinds.map((kind) => sourceKindsInModule.has(kind) && <i key={kind}>{sourceKindMeta[kind].short}</i>)}
                </span>
                <span className="module-enter">进入这条路线 <b>→</b></span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="home-source-summary">
        <div className="section-heading">
          <p>PLUGIN-STYLE GROWTH</p>
          <h2>模块可以增加，关卡也可以增加</h2>
          <span>统一课程注册表只负责发现方向；真正的学习内容留在各自页面独立演进。</span>
        </div>
        <div className="source-principle-grid">
          {sourceKinds.map((kind) => (
            <article key={kind} className={kind}>
              <span>{sourceKindMeta[kind].short}</span>
              <h3>{sourceKindMeta[kind].label}</h3>
              <p>{kind === "foundation" ? "构成长期不变的课程骨架。" : kind === "technology_radar" ? "稳定的新能力进入进阶关，实验性内容先观察。" : "真实项目变化用于更新案例、任务和能力差异。"}</p>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <p>AI TESTING LEARNING PLATFORM</p>
        <h2>方向分开，成长相连。</h2>
        <span>完成学习任务后，可以进入面试成长系统检验表达与迁移能力。</span>
      </footer>
    </main>
  );
}
