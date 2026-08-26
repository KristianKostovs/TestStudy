import type { Metadata } from "next";
import { learningModules, sourceAdapters } from "../learning-registry";

export const metadata: Metadata = {
  title: "技术雷达 | 测试能力修炼场",
  description: "每周发现测试技术变化，每月评审哪些内容应进入课程。",
};

const radarSources = sourceAdapters.filter((source) => source.kind === "technology_radar");

export default function RadarPage() {
  return (
    <main className="ready radar-page">
      <header className="workspace-page-hero radar-hero">
        <p>TECHNOLOGY RADAR</p>
        <h1>新技术先进入雷达，<br /><em>经过判断再进入课程</em></h1>
        <span>每周发现官方变化，每月做一次课程影响评审。更新不是机械加关，而是判断它带来了新能力、必要前置知识，还是只需补充案例。</span>
      </header>

      <section className="radar-cadence">
        <article><b>每周新增</b><strong>发现候选</strong><p>读取官方发布、版本说明和权威规范，记录变化与影响方向。</p></article>
        <article><b>每月更新</b><strong>课程评审</strong><p>新能力才新增主关；用法变化更新知识卡；项目变化优先更新练习。</p></article>
        <article><b>随时触发</b><strong>项目差异</strong><p>本地项目出现新的可迁移能力时，进入待评审队列而不是直接堆内容。</p></article>
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
