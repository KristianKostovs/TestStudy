/* eslint-disable @next/next/no-html-link-for-pages -- preserve native navigation used by the platform */
import type { Metadata } from "next";
import { learningStages, projects } from "./learning-plan";
import "./learning-plan.css";

export const metadata: Metadata = {
  title: "5 级 AI 开发岗学习路线 | 测试能力修炼场",
  description: "从零基础到业务 AI 项目：基础知识、学习顺序、项目实践与客观验收要求。独立岗位学习专区。",
};

export default function AiDeveloperLevel5Page() {
  return (
    <main className="ready ai5-page">
      <header className="ai5-header">
        <p className="ai5-eyebrow">独立岗位学习专区 · 2026 能力模型</p>
        <h1>5 级 AI 开发岗<br /><em>从基础到完整项目</em></h1>
        <p>先学会写程序和处理数据，再让 AI 检索知识、调用工具，最后交付一个能验证、能复盘的业务应用。</p>
        <div className="ai5-actions"><a href="#python">从 Python 基础开始</a><a href="#projects">查看项目要求</a></div>
        <p className="ai5-isolation">本专区独立阅读，不计入其他课程的关卡、进度或面试评分。</p>
      </header>

      <nav className="ai5-toc" aria-label="5 级 AI 开发岗学习目录">
        <a href="#requirements">岗位要求</a><a href="#foundations">基础学习</a><a href="#projects">项目实践</a><a href="#evidence">成果准备</a><a href="#resources">学习资料</a>
      </nav>

      <section className="ai5-section" id="requirements">
        <p className="ai5-eyebrow">先知道目标</p><h2>5 级要求你能做到什么？</h2>
        <p>能设计中等复杂度的 AI 应用，并独立完成部分开发和测试；模型训练、微调和部署中的部分工作可以协助完成。</p>
        <div className="ai5-grid">
          <article><h3>应用设计</h3><p>处理多步骤、多输入来源和多角色协同。安排知识、工具、规则和人工复核，考虑效果、成本、时延、稳定性、灰度和复盘。</p></article>
          <article><h3>模型基础与应用</h3><p>定义并集成工具，按规模、查询与成本选择向量数据库；用示例、边界和结构化输出改善提示词。原表中的智能体开发框架技能为可选。</p></article>
          <article><h3>工程能力</h3><p>独立做基础模型选型、数据处理、简单智能体模块开发与接口测试；参与训练环境、微调和部署。Python 编程是明确要求。</p></article>
          <article><h3>基础设施</h3><p>内部两个技能点选一个：AI 云原生部署，或推理引擎部署与基础优化。根据你的申报方向安排专题实验。</p></article>
        </div>
        <aside className="ai5-note"><strong>学习建议与申报规则分开看</strong><p>依据《AI&算法通道-AI开发工程师能力模型-2026版-员工版》Sheet1 的 E3:E6 整理。下面的项目数量、顺序和练习验收是学习建议，不是公司新增门槛。表底通用说明要求至少申报 3 项，工程能力与基础设施二选一举证，但 5 级举证栏 E10:E13 均为“/”；正式申报前需确认其含义及适用范围。</p></aside>
      </section>

      <section className="ai5-section" id="foundations">
        <p className="ai5-eyebrow">按能力逐步学习</p><h2>基础知识与动手顺序</h2>
        <p>每完成一个阶段，就检查能否处理新的输入、解释代码和定位失败。可以使用 AI 辅助编程，但需要自己验证结果。</p>
        <ol className="ai5-stage-index">{learningStages.map((stage, index) => <li key={stage.id}><a href={`#${stage.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{stage.title}</a></li>)}</ol>
        <div className="ai5-stages">{learningStages.map((stage, index) => (
          <article className="ai5-stage" id={stage.id} key={stage.id}>
            <header><span className="ai5-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{stage.title}</h3><p>{stage.goal}</p></div></header>
            <p className="ai5-prerequisite"><strong>前置知识：</strong>{stage.prerequisite}</p>
            <p>{stage.explanation}</p>
            <dl className="ai5-topics">{stage.topics.map(([term, explanation]) => <div key={term}><dt>{term}</dt><dd>{explanation}</dd></div>)}</dl>
            <div className="ai5-task"><strong>动手任务</strong><p>{stage.task}</p></div>
            <details open={index === 0}><summary>自检要求与成果材料</summary><ul>{stage.checks.map((check) => <li key={check}>{check}</li>)}</ul><p><strong>保存成果：</strong>{stage.evidence}</p><p className="ai5-mapping">{stage.mapping}</p></details>
          </article>
        ))}</div>
      </section>

      <section className="ai5-section" id="projects">
        <p className="ai5-eyebrow">用项目串起知识</p><h2>一个主项目分三步升级，再补一次微调实验</h2>
        <p>用“物资报修与制度助手”作为练习主题，复用已有的数据和代码。项目使用你有权使用的资料；模拟验证和真实系统验证分别记录。</p>
        <div className="ai5-projects">{projects.map((project) => <article id={project.id} key={project.id}>
          <span className="ai5-project-label">{project.number} / {project.stage}</span><h3>{project.title}</h3><p>{project.outcome}</p>
          <p><strong>需要基础：</strong>{project.prerequisite}</p><ul>{project.tasks.map((task) => <li key={task}>{task}</li>)}</ul>
          <div className="ai5-task"><strong>完成标准</strong><p>{project.acceptance}</p></div><p><strong>成果材料：</strong>{project.evidence}</p><a className="ai5-text-link" href={`#${project.next}`}>回到相关基础学习 ↑</a>
        </article>)}</div>
      </section>

      <section className="ai5-section" id="evidence">
        <p className="ai5-eyebrow">让能力可验证</p><h2>每个项目留下六类材料</h2>
        <ol className="ai5-evidence">
          <li><strong>需求与流程说明</strong><span>说明目标用户、输入输出、边界、业务规则和人工参与点。</span></li>
          <li><strong>源代码与运行说明</strong><span>别人能复现，关键代码你能解释和修改。</span></li>
          <li><strong>数据规则与选型记录</strong><span>说明数据如何得到，为什么选择这个模型、数据库或方案。</span></li>
          <li><strong>测试与真实结果</strong><span>覆盖正常、空结果、错误输入、接口失败等场景，保留失败样例。</span></li>
          <li><strong>修复与迭代对比</strong><span>同一批样例比较改进前后，说明准确性、耗时与费用的变化。</span></li>
          <li><strong>个人负责范围</strong><span>区分独立实现、协助完成及 AI 辅助的部分，说明你如何验证。</span></li>
        </ol>
        <aside className="ai5-note"><strong>答辩时试着回答</strong><p>我解决了什么问题？为什么这样设计？哪些部分由我独立实现？遇到了什么失败？用什么证据证明它能工作？还有哪些限制？</p></aside>
      </section>

      <section className="ai5-section" id="resources">
        <p className="ai5-eyebrow">按阶段查阅</p><h2>基础学习资料</h2>
        <div className="ai5-resources">
          <a href="https://docs.python.org/zh-cn/3/tutorial/index.html" target="_blank" rel="noopener noreferrer"><strong>Python 中文教程 ↗</strong><span>语言、函数、文件、异常与虚拟环境。官方教程假定已有基本编程概念，零基础先从小练习开始。</span></a>
          <a href="https://fastapi.tiangolo.com/tutorial/" target="_blank" rel="noopener noreferrer"><strong>FastAPI 官方教程 ↗</strong><span>学习参数、响应、校验和接口服务，配合设备查询练习使用。</span></a>
          <a href="https://docs.pytorch.org/tutorials/beginner/basics/intro.html" target="_blank" rel="noopener noreferrer"><strong>PyTorch 基础教程 ↗</strong><span>学习数据加载、模型、梯度、优化和保存，再进入微调实验。</span></a>
        </div>
        <p className="ai5-source">整理日期：2026-09-08。岗位要求来自用户提供的 2026 员工版能力模型；通俗解释、RAG 学习路径、项目设计和自检方法为配套学习建议。本页提供路线和练习要求，不自动判定岗位达标。</p>
        <a className="ai5-text-link" href="#python">开始第一项：Python 编程与开发工具 ↑</a>
      </section>
    </main>
  );
}
