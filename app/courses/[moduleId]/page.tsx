import type { Metadata } from "next";
import { notFound } from "next/navigation";
/* eslint-disable @next/next/no-html-link-for-pages -- vinext Link prefetch crashes in production; full-page navigation is intentional */
import {
  learningModules,
  roadmapTitle,
  sourceKindMeta,
  sourcesForModule,
  type LearningModule,
  type SourceKind,
} from "../../learning-registry";

const sourceKinds: SourceKind[] = ["foundation", "technology_radar", "local_project"];

type CoursePageProps = {
  params: Promise<{ moduleId: string }>;
};

function findBlueprint(moduleId: string): LearningModule | undefined {
  return learningModules.find((module) => module.id === moduleId && module.status === "blueprint");
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { moduleId } = await params;
  const course = findBlueprint(moduleId);
  if (!course) return { title: "课程不存在 | 测试能力修炼场" };

  const title = `${course.title}十关路线 | 测试能力修炼场`;
  const description = `${course.subtitle} 当前已建立可持续扩展的十关学习蓝图。`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [] },
    twitter: { card: "summary", title, description, images: [] },
  };
}

export default async function BlueprintCoursePage({ params }: CoursePageProps) {
  const { moduleId } = await params;
  const course = findBlueprint(moduleId);
  if (!course) notFound();
  const sources = sourcesForModule(course);
  const detailedRoadmap = course.roadmap.some((item) => typeof item !== "string");

  return (
    <main className="ready blueprint-course">
      <header className="course-hero">
        <nav>
          <a className="brand" href="/learn"><i>{course.sigil}</i> {course.title}</a>
          <a className="text-button course-back" href="/learn">← 返回学习中心</a>
        </nav>
        <div className="course-hero-grid">
          <section>
            <p className="eyebrow">INDEPENDENT LEARNING PATH</p>
            <h1>{course.title}<br /><em>十关修炼路线</em></h1>
            <p className="lead">{course.subtitle}</p>
            <a className="hero-cta" href="#roadmap">查看十关路线 <span>↓</span></a>
          </section>
          <aside className="course-status-card">
            <span>当前建设状态</span>
            <strong>{detailedRoadmap ? "十关内容已补强" : "路线已建立"}</strong>
            <p>{detailedRoadmap ? "每关已经明确学习问题、基础知识、动手任务和验收证据；完整交互课将按关卡逐步开放。" : "这已经是独立课程页。后续会从第 1 关开始，逐关补齐小白讲解、动手任务和客观验证。"}</p>
          </aside>
        </div>
      </header>

      <section className="blueprint-intro">
        <article><b>学习目标</b><p>{course.subtitle}</p></article>
        <article><b>内容更新规则</b><p>{course.updateRule}</p></article>
        <article><b>关卡准入标准</b><p>只有出现新的可迁移能力或必要前置知识，才新增主关卡；新增案例只更新练习。</p></article>
      </section>

      {course.gapReview ? (
        <section className="course-gap-review" aria-labelledby="gap-review-title">
          <div className="section-heading">
            <p>KNOWLEDGE GAP REVIEW</p>
            <h2 id="gap-review-title">这次查漏补缺改了什么</h2>
            <span>{course.gapReview.summary}</span>
          </div>
          <div className="gap-review-head">
            <b>本次补充来源</b>
            <span>{course.gapReview.sourceTitle}</span>
          </div>
          <div className="gap-review-grid">
            {course.gapReview.items.map((item) => (
              <article className={`gap-review-card ${item.kind}`} key={item.title}>
                <span>{item.kind === "added" ? "补入" : item.kind === "retained" ? "保留" : "边界"}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="blueprint-roadmap" id="roadmap">
        <div className="section-heading">
          <p>THE ROADMAP</p>
          <h2>{course.title}十关地图</h2>
          <span>每一关是一个能力台阶，而不是某个页面或某条需求的临时教程。</span>
        </div>
        <ol className="standalone-roadmap">
          {course.roadmap.map((item, index) => (
            <li className={typeof item === "string" ? undefined : "detailed"} key={roadmapTitle(item)}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div>
                <span>LEVEL {String(index + 1).padStart(2, "0")}</span>
                <h3>{roadmapTitle(item)}</h3>
                {typeof item === "string" ? (
                  <p>将补齐：基础解释 → 最小例子 → 项目练习 → 自动验收。</p>
                ) : (
                  <>
                    <p className="level-question">{item.question}</p>
                    <ul className="level-foundations">
                      {item.foundations.map((foundation) => <li key={foundation}>{foundation}</li>)}
                    </ul>
                    <dl className="level-deliverables">
                      <div><dt>动手任务</dt><dd>{item.practice}</dd></div>
                      <div><dt>验收证据</dt><dd>{item.evidence}</dd></div>
                    </dl>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="source-section course-source-section" aria-labelledby="course-source-title">
        <div className="section-heading">
          <p>KNOWLEDGE SOURCES</p>
          <h2 id="course-source-title">这门课程的知识从哪里来</h2>
          <span>项目来源是实战材料；没有本地项目时，公认基础与官方技术雷达仍能独立支撑课程。</span>
        </div>
        <div className="source-columns">
          {sourceKinds.map((kind) => {
            const kindSources = sources.filter((source) => source.kind === kind);
            return (
              <section className={`source-column ${kind}`} key={kind}>
                <header><span>{sourceKindMeta[kind].short}</span><div><h3>{sourceKindMeta[kind].label}</h3><p>{kind === "foundation" ? "课程长期骨架" : kind === "technology_radar" ? "官方变化候选" : "真实案例与证据"}</p></div></header>
                {kindSources.length ? kindSources.map((source) => (
                  <article className="source-card" key={source.id}>
                    <div><b>{source.title}</b><small>{source.provider}</small></div>
                    <p>{source.description}</p>
                    {source.href ? <a href={source.href} target="_blank" rel="noreferrer">查看官方来源 ↗</a> : <span>{source.location}</span>}
                    <time>最近核对 {source.checkedAt}</time>
                  </article>
                )) : <div className="source-empty">当前没有本地或内部实践来源，不影响这门课程继续建设。</div>}
              </section>
            );
          })}
        </div>
      </section>

      <footer>
        <p>{course.title.toUpperCase()} QUEST</p>
        <h2>路线已经独立，下一步是把每一关做成真正可学、可练、可验证。</h2>
        <a className="footer-link" href="/learn">← 返回全部学习方向</a>
      </footer>
    </main>
  );
}
