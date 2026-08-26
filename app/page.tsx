import { learningModules, sourceAdapters } from "./learning-registry";
/* eslint-disable @next/next/no-html-link-for-pages -- native navigation avoids vinext RSC prefetch failures in production */

const radarCount = sourceAdapters.filter((source) => source.kind === "technology_radar").length;

export default function Home() {
  return (
    <main className="ready growth-dashboard">
      <header className="suite-topbar">
        <div><strong>测试成长总览</strong><span>学习、面试与技术更新共用一张能力地图</span></div>
        <div className="suite-live"><i />成长系统已连接</div>
      </header>
      <section className="dashboard-hero">
        <div>
          <p>YOUR TESTING GROWTH MAP</p>
          <h1>学习、实战与面试，<br /><em>都回到同一张成长地图</em></h1>
          <span>不用切换浏览器窗口。课程负责建立能力，面试负责暴露薄弱项，技术雷达负责持续发现新知识。</span>
          <div className="dashboard-actions">
            <a className="primary" href="/learn">继续学习 →</a>
            <a href="/interview">开始面试陪练</a>
          </div>
        </div>
        <aside>
          <small>本周建议</small>
          <strong>先完成一个可验证任务，再用面试题检验是否真正理解。</strong>
          <a href="/courses/python-framework">进入 Python 当前路线 →</a>
        </aside>
      </section>

      <section className="dashboard-metrics" aria-label="平台资产概览">
        <article><span>学习路线</span><strong>{learningModules.length}</strong><p>独立课程，进度互不干扰</p></article>
        <article><span>技术雷达源</span><strong>{radarCount}</strong><p>官方更新先观察再入课</p></article>
        <article><span>成长闭环</span><strong>3</strong><p>学习 → 练习 → 复盘</p></article>
      </section>

      <section className="dashboard-workspaces">
        <header><p>ONE PLATFORM · THREE WORKSPACES</p><h2>每个空间解决一个明确问题</h2></header>
        <div>
          <a href="/learn"><i>LEARN</i><h3>学习中心</h3><p>按能力方向学习基础、框架与项目实践，逐关完成任务。</p><b>选择课程 →</b></a>
          <a href="/interview"><i>INTERVIEW</i><h3>面试成长</h3><p>用真实回答形成能力证据，并把薄弱项转回学习路线。</p><b>打开能力地图 →</b></a>
          <a href="/radar"><i>RADAR</i><h3>技术雷达</h3><p>每周发现官方变化，每月判断应更新课程、练习还是仅观察。</p><b>查看新技术 →</b></a>
        </div>
      </section>

      <section className="dashboard-loop">
        <div><p>THE GROWTH LOOP</p><h2>两个系统不会重复，它们共享能力，但保留不同职责。</h2></div>
        <ol>
          <li><b>01</b><span><strong>学会</strong>课程讲清概念并安排任务</span></li>
          <li><b>02</b><span><strong>说清</strong>面试回答沉淀能力证据</span></li>
          <li><b>03</b><span><strong>补弱</strong>成长计划跳回对应课程</span></li>
          <li><b>04</b><span><strong>更新</strong>技术雷达持续补充新内容</span></li>
        </ol>
      </section>
    </main>
  );
}
