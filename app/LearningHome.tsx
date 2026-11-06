import {
  learningModules,
  sourceKindMeta,
  sourcesForModule,
  type SourceKind,
} from "./learning-registry";

const sourceKinds: SourceKind[] = ["foundation", "technology_radar", "local_project"];

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
            <h1>先选方向，<br /><em>再进入专属修炼场</em></h1>
            <p className="lead">先学可迁移能力，再用真实项目练习验证。每条课程路线独立维护。</p>
            <div className="learning-home-actions"><a className="hero-cta" href="#modules">选择修炼方向 <span>↓</span></a><a href="/learn/real-project">查看案例练习 →</a></div>
          </section>
          <aside className="platform-summary">
            <span>当前课程地图</span>
            <strong>{learningModules.length}</strong>
            <p>个独立学习方向</p>
            <ul>
              <li><b>{learningModules.filter((module) => module.status === "active").length}</b> 条路线已有完整互动课程</li>
              <li><b>{learningModules.filter((module) => module.status === "blueprint").length}</b> 条路线已备分章 IDE 框架练习</li>
              <li><b>3</b> 类知识来源持续供给内容</li>
            </ul>
          </aside>
        </div>
      </header>

      <section className="principles" aria-label="学习平台原则">
        <article><b>01</b><div><h2>能力构成主线</h2><p>按通用知识、前置依赖和客观验收组织课程。</p></div></article>
        <article><b>02</b><div><h2>需求提供案例</h2><p>一个需求只进入适合的关卡，不代表整门课程。</p></div></article>
        <article><b>03</b><div><h2>持续查漏补缺</h2><p>用权威更新和不同项目补知识、练习与证据。</p></div></article>
      </section>

      <section className="module-section home-module-section" id="modules">
        <div className="section-heading">
          <p>LEARNING DIRECTIONS</p>
          <h2>你想先修炼哪一种能力？</h2>
          <span>选择后进入独立课程页面；左侧平台导航随时可以切换方向。</span>
        </div>
        <div className="module-grid">
          {learningModules.map((module) => {
            const sourceKindsInModule = new Set(sourcesForModule(module).map((source) => source.kind));
            return (
              <a className="module-card route-card" href={`/courses/${module.id}`} key={module.id}>
                <span className="module-sigil">{module.sigil}</span>
                <span className="module-state">{module.status === "active" ? `${module.roadmap.length} 节已开放` : `${module.roadmap.length} 关框架已备`}</span>
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
