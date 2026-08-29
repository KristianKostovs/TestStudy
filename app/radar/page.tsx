import type { Metadata } from "next";
import { learningModules, sourceAdapters } from "../learning-registry";

export const metadata: Metadata = {
  title: "技术雷达 | 测试能力修炼场",
  description: "每天巡检本地知识库、每周发现官方变化，每月形成课程与面试内容修改草稿。",
};

const radarSources = sourceAdapters.filter((source) => source.kind === "technology_radar");

export default function RadarPage() {
  return (
    <main className="ready radar-page">
      <header className="suite-topbar">
        <div><strong>技术雷达</strong><span>持续发现变化，经过判断后再更新课程</span></div>
        <div className="suite-live"><i />{radarSources.length} 个官方来源</div>
      </header>
      <header className="workspace-page-hero radar-hero">
        <p>YOUR TECHNOLOGY RADAR</p>
        <h1>新技术先进入雷达，<br /><em>经过判断再进入课程</em></h1>
        <span>每天巡检本地项目、每周发现官方变化，每月同时评审课程和面试内容。自动任务只形成候选与草稿，正式更新仍由你确认。</span>
      </header>

      <section className="radar-cadence">
        <article><b>周一 09:30</b><strong>官方候选</strong><p>扫描 Python、pytest、Playwright、AI Evals、Locust 等官方来源，只记录可追溯候选。</p></article>
        <article><b>首个周一 10:00</b><strong>双线草稿</strong><p>评审上月候选，分别形成课程修改草稿与面试内容修改草稿。</p></article>
        <article><b>每天 19:30</b><strong>本地知识库巡检</strong><p>自动识别 AI测试赋能 下的不同项目；发现变化后进入 Knowledge Diff 待评审队列。</p></article>
      </section>

      <section className="radar-decision-rule">
        <div><p>TWO DESTINATIONS</p><h2>同一份证据，两条独立去向</h2></div>
        <ol>
          <li><b>课</b><span><strong>课程草稿</strong>修事实、补知识卡、更新练习或建议新关卡</span></li>
          <li><b>面</b><span><strong>面试草稿</strong>更新能力优先级、题目、追问与评分证据</span></li>
          <li><b>审</b><span><strong>人工确认</strong>候选和草稿都不会自动修改线上内容</span></li>
          <li><b>发</b><span><strong>一键发布</strong>只有确认后才提交、测试并发布</span></li>
        </ol>
      </section>

      <section className="radar-source-board">
        <div className="workspace-section-heading"><p>WATCHING NOW</p><h2>当前关注的官方技术源</h2><span>{radarSources.length} 个来源 · 所有条目都可追溯</span></div>
        <div className="radar-source-grid">
          {radarSources.map((source) => {
            const affected = learningModules.filter((module) => module.sourceIds.includes(source.id));
            return (
              <article key={source.id}>
                <header><span>{source.provider}</span><time>核对于 {source.checkedAt}</time></header>
                <h3>{source.title}</h3>
                <p>{source.description}</p>
                <div>{affected.map((module) => <a href={`/courses/${module.id}`} key={module.id}>{module.sigil} · {module.title}</a>)}</div>
                {source.href && <a className="official-source-link" href={source.href} target="_blank" rel="noreferrer">查看官方来源 ↗</a>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="radar-decision-rule">
        <div><p>INGESTION RULE</p><h2>一条变化如何进入学习系统</h2></div>
        <ol>
          <li><b>1</b><span><strong>发现</strong>保存来源、版本与摘要</span></li>
          <li><b>2</b><span><strong>去重</strong>判断现有关卡是否已覆盖</span></li>
          <li><b>3</b><span><strong>分级</strong>主关 / 知识卡 / 练习 / 观察</span></li>
          <li><b>4</b><span><strong>验收</strong>补齐任务、标准与来源证据</span></li>
        </ol>
      </section>
    </main>
  );
}
