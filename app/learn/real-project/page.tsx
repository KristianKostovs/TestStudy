import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "真实需求项目入口 | 测试能力修炼场",
  description: "以需求为引、以实际测试项目为输出，再由课程推进能力进度。",
  openGraph: { images: [] },
  twitter: { card: "summary", images: [] },
};

export default function RealProjectPage() {
  return <main className="ready real-project-page">
    <header>
      <p>REQUIREMENTS-FIRST LEARNING</p>
      <h1>先有真实需求和代码，<br />再让课程围绕项目推进。</h1>
      <span>当前状态：等待绑定具体需求与代码库。平台不会把教学示例标成真实项目。</span>
    </header>
    <section className="real-project-flow" aria-label="真实项目学习链路">
      <article><b>01</b><h2>输入真实需求</h2><p>明确使用者、场景、输入输出、失败边界、数据来源和不能发生的副作用。</p></article>
      <article><b>02</b><h2>形成测试项目</h2><p>固定仓库和 commit，脱敏后提供源码、测试、配置、样例数据与可复现环境。</p></article>
      <article><b>03</b><h2>课程推进进度</h2><p>概念课解释项目中的真实结构；实践课修改同一仓库，并用测试、日志和差异证明结果。</p></article>
    </section>
    <section className="real-project-contract">
      <h2>明天接入一个项目时需要什么</h2>
      <ul>
        <li><strong>需求：</strong>业务背景、字段、流程、异常与验收标准。</li>
        <li><strong>代码：</strong>仓库地址或本地目录、目标分支/commit、允许教学使用的文件。</li>
        <li><strong>环境：</strong>解释器、依赖、启动方式、测试命令和必要的模拟边界。</li>
        <li><strong>安全：</strong>需要删除的密钥、账号、客户数据、内部地址和不可执行操作。</li>
        <li><strong>证据：</strong>退出码、测试日志、失败复现、代码差异，以及必要的覆盖率或静态检查。</li>
      </ul>
    </section>
    <section className="real-project-status">
      <div><span>已经完成</span><p>本地课程连接器、VS Code 打开能力、固定 pytest 命令和结构化运行证据已经用 Python → Agent 第 8 关骨架验证。</p></div>
      <div><span>等待明天</span><p>真实需求和实际代码尚未绑定；绑定后再重排课程内容、文件映射和关卡进度。</p></div>
    </section>
    <nav><a href="/learn">← 返回学习中心</a><a href="https://github.com/KristianKostovs/TestStudy/blob/master/docs/REAL_REPOSITORY_LEARNING_PLAN.md" target="_blank" rel="noreferrer">查看 GitHub 中的改造记录 ↗</a></nav>
  </main>;
}
