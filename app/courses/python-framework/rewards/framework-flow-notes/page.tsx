import type { Metadata } from "next";
import "./reward-notes.css";
/* eslint-disable @next/next/no-html-link-for-pages -- vinext Link prefetch is intentionally avoided on this static reward note */

const title = "声明式 pytest 框架全景笔记 | 第十关通关奖励";
const description = "从 YAML 用例收集、Schema 静态门禁、Fixture 依赖图、Runner 与 Adapter 调度，到 teardown 和 evidence 的完整 pytest 框架流程。";

export const metadata: Metadata = { title, description };

const phases = [
  {
    no: "01",
    title: "启动 pytest，读取工程配置",
    detail: "命令行参数、pytest.ini / pyproject.toml、插件和 conftest.py 共同决定收集范围、marker、fixture 与运行选项。",
    tags: ["pytest", "pytest.ini", "conftest.py"],
  },
  {
    no: "02",
    title: "Collector 收集可执行单元",
    detail: "Python 测试函数直接变成 pytest 测试节点；YAML 先由 safe_load 变成 dict / list，再由自定义 Collector 将每个 case 或参数组合转换成独立测试节点。",
    tags: ["YAML → dict/list", "Collector", "测试节点"],
  },
  {
    no: "03",
    title: "Schema 与静态门禁",
    detail: "先检查字段类型和层级，再检查阶段、action 注册、source / save_as 引用、assertion path 与模块导入。此时不访问 HTTP、数据库等真实环境。",
    tags: ["Pydantic", "FlowEntry", "collect-only"],
  },
  {
    no: "04",
    title: "构建 Fixture 依赖图",
    detail: "pytest 根据 fixture 函数参数的名字确认依赖并自动排序，例如 db_connection(db_engine) 表示 connection 依赖 engine。每个用例获得隔离的 context。",
    tags: ["依赖注入", "setup / yield / teardown", "context"],
  },
  {
    no: "05",
    title: "Runner 执行 setup → steps",
    detail: "Runner 是控制流程的架构逻辑：按顺序读取 entry、捕获结果和异常，并保证最终进入 teardown.always；它不是某一个业务动作。",
    tags: ["Runner", "setup", "steps"],
  },
  {
    no: "06",
    title: "Dispatcher 找 action，Adapter 对齐签名",
    detail: "entry[\"action\"] 是注册表键。Dispatcher 取出函数，解析 source 和 request；Adapter 把统一的 entry/context 输入转换成 Provider、Client 或业务函数所需参数。",
    tags: ["registry", "dispatch", "adapter"],
  },
  {
    no: "07",
    title: "执行动作并归一化 ActionResult",
    detail: "Provider / Client 完成数据库、文件或 HTTP 访问；Adapter 统一返回 success、request、response、outputs、side_effects 与 error，save_as 再把结果放入 context。",
    tags: ["Provider", "Client", "ActionResult"],
  },
  {
    no: "08",
    title: "执行 assertions",
    detail: "source 选择 context 中的对象，path 在该对象内部逐层取值，equals / exists 等规则完成可证伪判断。断言读取的是已经保存的运行结果。",
    tags: ["source", "path", "equals / exists"],
  },
  {
    no: "09",
    title: "成功或失败都执行 teardown.always",
    detail: "Runner 用 finally 执行业务清理，例如 fixture.restore；pytest 随后执行 fixture 的 yield 后清理，例如回滚事务、关闭 Client 和释放连接池。",
    tags: ["finally", "业务恢复", "资源释放"],
  },
  {
    no: "10",
    title: "生成 Evidence 与 pytest 报告",
    detail: "把请求、响应、输出、副作用、主异常和清理结果写入同一证据结构；pytest 汇总测试节点为终端、JUnit 或 HTML 报告。",
    tags: ["evidence.json", "JUnit", "report"],
  },
];

const projectTree = String.raw`declarative-pytest-framework/
├── pyproject.toml                  # 包、工具和 pytest 主配置
├── pytest.ini                     # testpaths、markers、addopts
├── requirements.txt               # 运行依赖
├── requirements-dev.txt           # pytest、ruff、mypy 等开发依赖
├── .env                           # 本机真实密钥；禁止提交 Git
├── .env.example                   # 变量名和安全示例
├── .gitignore
├── README.md
│
├── config/
│   ├── __init__.py
│   ├── models.py                  # Pydantic Settings / 配置 Schema
│   ├── settings.py                # 读取环境变量并选择环境
│   ├── logging.yaml
│   └── environments/
│       ├── local.yaml
│       ├── test.yaml
│       ├── sit.yaml
│       └── prod.yaml
│
├── framework/
│   ├── __init__.py
│   ├── collector/
│   │   ├── __init__.py
│   │   └── yaml_collector.py      # YAML case → pytest 测试节点
│   ├── schema/
│   │   ├── __init__.py
│   │   ├── flow.py                # FlowEntry / CommonFlow
│   │   ├── assertion.py           # AssertionRule
│   │   └── evidence.py            # Evidence 数据契约
│   ├── runner/
│   │   ├── __init__.py
│   │   ├── flow_runner.py         # setup → steps → assertions → teardown
│   │   └── context.py             # 每用例独立上下文
│   ├── dispatch/
│   │   ├── __init__.py
│   │   ├── registry.py            # action 名称与函数注册表
│   │   └── dispatcher.py          # 查找并调用 action
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── result.py              # ActionResult
│   │   └── signature.py           # 统一或兼容 handler 签名
│   ├── providers/
│   │   ├── __init__.py
│   │   ├── database.py            # SQL / 事务访问
│   │   ├── inventory.py           # 库存领域访问
│   │   └── ticket.py              # 工单领域访问
│   ├── clients/
│   │   ├── __init__.py
│   │   └── http_client.py         # HTTPX 封装
│   ├── assertions/
│   │   ├── __init__.py
│   │   └── evaluator.py           # source + path + equals / exists
│   ├── evidence/
│   │   ├── __init__.py
│   │   └── writer.py              # 证据 JSON 写入
│   └── exceptions.py
│
├── requirements/
│   └── BOSS_01/
│       ├── constraint_spec.yaml   # 需求约束和边界
│       ├── requirement_cases.yaml # 独立 YAML 用例
│       ├── adapters.py            # 需求 action 适配层
│       └── source_queries.py      # 需求相关查询
│
├── sql/
│   ├── inventory/
│   │   ├── select_snapshot.sql
│   │   └── restore_snapshot.sql
│   └── tickets/
│       └── select_ticket.sql
│
├── fixtures/
│   ├── inventory/
│   │   └── stock_snapshot.json
│   ├── tickets/
│   │   └── ticket_cases.json
│   └── responses/
│       ├── stock_success.json
│       └── stock_system_error.json
│
├── tests/
│   ├── conftest.py                # settings、DB、HTTP、registry fixtures
│   ├── unit/
│   │   ├── test_schema.py
│   │   ├── test_dispatcher.py
│   │   └── test_assertions.py
│   ├── contract/
│   │   └── test_action_contract.py
│   ├── integration/
│   │   ├── test_database_provider.py
│   │   └── test_http_client.py
│   └── requirements/
│       └── test_boss_01.py        # MockTransport 成功与失败链路
│
├── artifacts/
│   ├── evidence/                  # 每次运行的结构化证据
│   ├── logs/
│   └── reports/
│
└── scripts/
    ├── validate_cases.py          # 独立执行静态门禁
    ├── collect_only.sh            # pytest --collect-only
    ├── run_mock_tests.sh
    └── run_integration_tests.sh`;

const envExample = String.raw`# .env.example：只写变量名和安全示例
APP_ENV=test
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/test_db
API_BASE_URL=https://example.test
API_TOKEN=replace-me`;

const configModels = String.raw`# config/models.py
from pydantic import BaseModel, Field

class DatabaseSettings(BaseModel):
    url: str
    pool_size: int = Field(default=5, ge=1)

class Settings(BaseModel):
    app_env: str = "test"
    database: DatabaseSettings
    api_base_url: str
    api_token: str`;

const configLoader = String.raw`# config/settings.py
import os
from config.models import DatabaseSettings, Settings

def load_settings() -> Settings:
    return Settings(
        app_env=os.getenv("APP_ENV", "test"),
        database=DatabaseSettings(url=os.environ["DATABASE_URL"]),
        api_base_url=os.environ["API_BASE_URL"],
        api_token=os.environ["API_TOKEN"],
    )`;

const conftest = String.raw`# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from config.settings import load_settings
from framework.providers.database import DatabaseProvider

@pytest.fixture(scope="session")
def settings():
    return load_settings()

@pytest.fixture(scope="session")
def db_engine(settings):
    engine = create_engine(
        settings.database.url,
        pool_size=settings.database.pool_size,
    )
    yield engine
    engine.dispose()                 # 全部测试结束后释放连接池

@pytest.fixture
def db_connection(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    yield connection
    transaction.rollback()           # 每个用例回滚隔离数据
    connection.close()

@pytest.fixture
def database_provider(db_connection):
    return DatabaseProvider(db_connection)`;

const coreStructures = String.raw`# YAML 解析后的一个 entry
entry = {
    "action": "inventory.snapshot",
    "source": "resolved_fixture",
    "save_as": "before_snapshot",
}

# 一个用例独占的运行上下文
context = {
    "client": client,
    "resolved_fixture": {"skuId": "SKU-001", "available": 100},
}

@dataclass
class ActionResult:
    success: bool
    request: dict[str, Any] | None = None
    response: dict[str, Any] | None = None
    outputs: dict[str, Any] = field(default_factory=dict)
    side_effects: list[str] = field(default_factory=list)
    error: str | None = None`;

const executionSnippet = String.raw`def run_entry(entry, adapters, context):
    action_name = entry["action"]       # 必填：不存在就应立即失败
    action = adapters[action_name]       # 从注册表取得可调用函数
    result = action(entry, context)      # 调用函数并取得 ActionResult

    if entry.get("save_as"):            # 可选：没有时返回 None
        context[entry["save_as"]] = result
    return result

def evaluate(rule, context):
    value = resolve_path(
        context[rule["source"]],         # 先选对象
        rule["path"],                    # 再在对象内逐层取值
    )
    if "equals" in rule:
        assert value == rule["equals"]
    if rule.get("exists"):
        assert value is not None`;

const evidenceExample = String.raw`{
  "case_id": "boss_01_after_sale",
  "success": true,
  "request": {"skuId": "SKU-001", "adjustAmount": -10},
  "response": {"success": true, "data": {"flowNo": "FLOW-001"}},
  "outputs": {"flowNo": "FLOW-001"},
  "side_effects": ["inventory adjusted"],
  "error": null,
  "teardown": [{"action": "fixture.restore", "success": true}]
}`;

export default function FrameworkFlowRewardPage() {
  return (
    <main className="reward-notes">
      <header className="reward-hero">
        <nav aria-label="页面导航">
          <a href="/courses/python-framework/chapters/4#level-10">← 返回第十关</a>
          <span>Python 框架基础 · Boss 战通关奖励</span>
        </nav>
        <p className="reward-kicker">LEVEL 10 CLEARED · REWARD NOTE</p>
        <h1>声明式 pytest 框架<br /><em>从文件到证据的完整链路</em></h1>
        <p className="reward-lead">这份 HTML 笔记把你刚刚形成的理解完整落图：每份 YAML 用例怎样被收集、校验、调度、执行、清理，工程里的每类文件又分别放在哪里。</p>
        <div className="reward-index" aria-label="笔记目录">
          <a href="#flow">01 全流程</a>
          <a href="#roles">02 角色边界</a>
          <a href="#structures">03 核心数据</a>
          <a href="#tree">04 完整目录</a>
          <a href="#database">05 数据库配置</a>
          <a href="#cleanup">06 清理与证据</a>
        </div>
      </header>

      <section className="reward-section" id="flow">
        <div className="section-heading"><span>01</span><div><p>EXECUTION MAP</p><h2>一份 YAML 用例如何真正跑起来</h2></div></div>
        <p className="section-intro">你的理解是对的，但要补上两点：YAML 不是 pytest 原生测试，需要 Collector 转成测试节点；Adapter 不是“执行参数匹配”本身，而是把统一框架输入翻译成具体实现能接收的调用。</p>
        <ol className="flow-map">
          {phases.map((phase) => (
            <li key={phase.no}>
              <span className="flow-number">{phase.no}</span>
              <div className="flow-card">
                <h3>{phase.title}</h3>
                <p>{phase.detail}</p>
                <div>{phase.tags.map((tag) => <code key={tag}>{tag}</code>)}</div>
              </div>
            </li>
          ))}
        </ol>
        <aside className="collect-branch">
          <strong><code>pytest --collect-only</code> 的分支</strong>
          <p>执行到“生成测试节点”就停止：会导入测试模块并运行收集钩子，但不会进入普通 fixture 的 setup / yield / teardown，也不会运行测试函数。静态门禁必须在这里发现结构、导入和 action 绑定问题，同时不得访问真实网络或数据库。</p>
        </aside>
      </section>

      <section className="reward-section" id="roles">
        <div className="section-heading"><span>02</span><div><p>BOUNDARIES</p><h2>框架角色不是同一个东西</h2></div></div>
        <div className="role-grid">
          <article><b>Collector</b><p>发现文件，把 YAML case / 参数组合转换成 pytest 可调度的测试节点。</p></article>
          <article><b>Schema</b><p>规定输入结构和类型；model_validator 再补充字段之间的业务关系。</p></article>
          <article><b>Fixture</b><p>向测试提供数据、依赖或资源，并用函数参数名形成有向依赖图。</p></article>
          <article><b>Runner</b><p>掌管阶段、顺序、上下文、失败捕获、清理和证据，是抽象控制流程。</p></article>
          <article><b>Dispatcher</b><p>用 action 名称查询注册表，选择当前 entry 要调用的函数。</p></article>
          <article><b>Adapter</b><p>把统一 entry / context 转成具体 handler 参数，并把结果统一成 ActionResult。</p></article>
          <article><b>Provider / Client</b><p>真正接触 SQL、文件、HTTP 等外部能力，不反向依赖需求层。</p></article>
          <article><b>Assertions</b><p>从 source 选择结果，用 path 取内部字段，再执行 equals / exists。</p></article>
          <article><b>Teardown</b><p>业务补偿放 teardown.always；底层资源释放放 pytest fixture 的 yield 之后。</p></article>
          <article><b>Evidence</b><p>统一保存请求、响应、输出、副作用、异常与清理结果，供复盘和报告使用。</p></article>
        </div>
        <div className="dependency-rule"><strong>固定依赖方向</strong><code>Requirement → Shared Action → Provider / Client</code><p>底层 Provider 不得反向导入某个具体需求，否则复用层会被业务场景污染。</p></div>
      </section>

      <section className="reward-section" id="structures">
        <div className="section-heading"><span>03</span><div><p>DATA CONTRACTS</p><h2>运行时真正传递的三个对象</h2></div></div>
        <div className="explain-grid">
          <div><h3><code>entry</code></h3><p>一条 YAML 动作解析后的字典。约定一个 entry 只有一个 action；若要执行多个动作，就拆成多个 entry。</p></div>
          <div><h3><code>context</code></h3><p>当前用例的共享上下文。save_as 写入，后续 source 或 Adapter 读取；不同用例不能共享可变 context。</p></div>
          <div><h3><code>ActionResult</code></h3><p>不同动作的统一输出契约。default_factory 为每次实例化创建新 dict / list，避免共享可变默认值污染。</p></div>
        </div>
        <pre><code>{coreStructures}</code></pre>
        <h3 className="subheading">Dispatcher、save_as 与断言路径</h3>
        <pre><code>{executionSnippet}</code></pre>
        <aside className="syntax-note"><b>为什么有时用 <code>[]</code>，有时用 <code>.get()</code>？</b><p><code>{'entry["action"]'}</code>、<code>{'rule["source"]'}</code> 和 <code>{'rule["path"]'}</code> 是必填字段，缺失就应暴露错误；<code>{'entry.get("save_as")'}</code> 和 <code>{'rule.get("exists")'}</code> 是可选字段，缺失时返回 None 即可。</p></aside>
      </section>

      <section className="reward-section wide-section" id="tree">
        <div className="section-heading"><span>04</span><div><p>PROJECT LAYOUT</p><h2>可落地的完整 pytest 工程结构</h2></div></div>
        <p className="section-intro">这不是唯一目录写法，但边界清楚：框架能力、具体需求、SQL、固定样例、测试入口、产物与脚本各自归位。</p>
        <pre className="tree-block"><code>{projectTree}</code></pre>
      </section>

      <section className="reward-section" id="database">
        <div className="section-heading"><span>05</span><div><p>DATABASE CHAIN</p><h2>配置数据库的完整依赖链</h2></div></div>
        <div className="chain" aria-label="数据库配置依赖链">
          {['.env', 'settings.py', 'settings fixture', 'db_engine fixture', 'db_connection fixture', 'DatabaseProvider', 'Adapter', 'Runner'].map((item, index) => <span key={item}>{item}{index < 7 && <i>→</i>}</span>)}
        </div>
        <p className="section-intro">环境变量只负责提供值；Pydantic 配置模型负责类型和必填校验；fixture 负责资源生命周期；Provider 封装数据库操作；Adapter 再把它接入统一 action 契约。</p>
        <div className="code-stack">
          <article><h3>1. 安全变量模板</h3><pre><code>{envExample}</code></pre></article>
          <article><h3>2. 配置结构</h3><pre><code>{configModels}</code></pre></article>
          <article><h3>3. 配置读取</h3><pre><code>{configLoader}</code></pre></article>
          <article><h3>4. pytest 资源生命周期</h3><pre><code>{conftest}</code></pre></article>
        </div>
        <aside className="security-note"><strong>安全边界</strong><p>真实密码、Token 和生产连接串只放本机或部署平台的 Secret / <code>.env</code>，绝不写进 Git、YAML 用例、日志或 Evidence。集成测试数据库应与生产库物理或权限隔离。</p></aside>
      </section>

      <section className="reward-section" id="cleanup">
        <div className="section-heading"><span>06</span><div><p>FAILURE PROOF</p><h2>失败以后，框架仍必须留下证据</h2></div></div>
        <div className="cleanup-grid">
          <article>
            <span>Runner 层</span><h3>业务清理</h3>
            <p><code>teardown.always</code> 处理可观察的业务恢复，例如把库存恢复到 before_snapshot。成功和失败链路都必须执行，并把清理结果写入 evidence。</p>
          </article>
          <article>
            <span>pytest fixture 层</span><h3>资源清理</h3>
            <p><code>yield</code> 后处理事务回滚、连接关闭、临时目录清理和连接池释放。它不代替业务补偿，两者职责不同。</p>
          </article>
        </div>
        <h3 className="subheading">统一 Evidence 示例</h3>
        <pre><code>{evidenceExample}</code></pre>
        <div className="final-model">
          <p>最终心智模型</p>
          <strong>文件是输入，节点是 pytest 的执行单位，Fixture 提供依赖，Runner 控制流程，Dispatcher 选择动作，Adapter 翻译边界，Provider 接触环境，ActionResult 与 Evidence 保留可验证事实。</strong>
        </div>
      </section>

      <footer className="reward-footer">
        <div><span>奖品已解锁</span><strong>你已经可以从“会写测试”进入“会设计测试框架”的阶段。</strong></div>
        <a href="/courses/python-framework/chapters/4#level-10">返回第十关复盘 →</a>
      </footer>
    </main>
  );
}
