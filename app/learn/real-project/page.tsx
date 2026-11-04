import type { Metadata } from "next";
import { firstProjectCourseMappings, firstRealProject } from "../../real-projects/first-project";

export const metadata: Metadata = {
  title: "首个真实需求项目 | 测试能力修炼场",
  description: "查看脱敏需求、验收场景和独立生成的测试项目。",
  openGraph: { images: [] },
  twitter: { card: "summary", images: [] },
};

export default function RealProjectPage() {
  return <main className="ready real-project-page">
    <header>
      <p>REQUIREMENTS-FIRST LEARNING</p>
      <h1>先有真实需求和代码，<br />再让课程围绕项目推进。</h1>
      <span>首个样本：{firstRealProject.title} · {firstRealProject.status}</span>
    </header>

    <section className="real-project-flow" aria-label="真实项目学习链路">
      <article><b>01</b><h2>固定需求与来源</h2><p>已核对需求范围和本机源码的固定提交。原始仓库、路径及校验信息只保存在本机来源映射中。</p></article>
      <article><b>02</b><h2>提取脱敏契约</h2><p>页面只展示通用业务规则、合成场景和验收条件，不发布原始源码、接口地址或真实人员数据。</p></article>
      <article><b>03</b><h2>自生成测试项目</h2><p>依据验收场景编写独立的 Python 测试代码，使用合成数据和内存替身；真实后端运行证据仍需单独采集。</p></article>
    </section>

    <section className="real-project-contract" aria-labelledby="first-project-title">
      <p className="real-project-kicker">首个固定版本样本</p>
      <h2 id="first-project-title">{firstRealProject.title}</h2>
      <p>{firstRealProject.problem}</p>
      <dl className="real-project-facts">
        <div><dt>输入</dt><dd>{firstRealProject.input}</dd></div>
        <div><dt>输出</dt><dd>{firstRealProject.output}</dd></div>
      </dl>
      <h3>已核对的业务规则</h3>
      <ul>{firstRealProject.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
      <h3>本次边界</h3>
      <ul>{firstRealProject.exclusions.map((rule) => <li key={rule}>{rule}</li>)}</ul>
    </section>

    <section className="real-project-contract" aria-labelledby="project-acceptance-title">
      <h2 id="project-acceptance-title">可证伪的验收场景</h2>
      <p>以下是后续练习和测试应验证的目标，尚不是已执行结果。</p>
      <div className="real-project-acceptance">
        {firstRealProject.acceptance.map((item) => <article key={item.id}>
          <b>{item.id}</b><div><h3>{item.scenario}</h3><p>{item.expected}</p></div>
        </article>)}
      </div>
    </section>

    <section className="real-project-contract" aria-labelledby="project-mappings-title">
      <h2 id="project-mappings-title">这个需求如何进入课程</h2>
      <div className="real-project-mappings">
        {firstProjectCourseMappings.map((mapping) => <article id={`mapping-${mapping.courseId}-${mapping.levelId}`} key={`${mapping.courseId}-${mapping.levelId}`}>
          <span>{mapping.courseId === "api-automation" ? "API 自动化" : "质量工程与保障"} · 第 {mapping.levelId} 关</span>
          <h3>{mapping.title}</h3>
          <p>{mapping.task}</p>
          <p><strong>预期产出：</strong>{mapping.output}</p>
          <a href={`/courses/${mapping.courseId}#level-${mapping.levelId}`}>查看对应关卡 →</a>
        </article>)}
      </div>
    </section>

    <section className="real-project-contract" aria-labelledby="project-test-title">
      <h2 id="project-test-title">自生成测试项目</h2>
      <p>项目中的示例实现、假人员查询、假账单存储和 A1–A6 测试均为独立编写。运行通过只说明示例符合公开契约，不能证明真实后端或 SIT 已通过。</p>
      <p>目录：<code>course-starters/active-worker-bill-contract</code>。在该目录运行 <code>python3 -m pytest -q</code>。</p>
    </section>

    <section className="real-project-status" aria-label="证据与下一阶段">
      <div><span>已核对的证据</span><p>{firstRealProject.evidence}</p></div>
      <div><span>下一阶段</span><p>把自生成测试项目接入本地课程连接器，记录运行日志与退出码；真实系统的接口和数据库验证仍在私有环境单独开展。</p></div>
    </section>
    <nav><a href="/learn">← 返回学习中心</a><a href="https://github.com/KristianKostovs/TestStudy/blob/main/docs/REAL_REPOSITORY_LEARNING_PLAN.md" target="_blank" rel="noreferrer">查看项目改造计划 ↗</a></nav>
  </main>;
}
