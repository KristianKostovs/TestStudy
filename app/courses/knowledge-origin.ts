// Keep the source of a term explicit. A course editor may introduce a new term;
// leave its source unclassified until it has been reviewed rather than guessing.
const groups: [string, string[]][] = [
  ["Python 语法与内置能力", [
    "列表 list", "字典 dict", "集合 set", "不可变字符串", "切片", "短路判断", "推导式", "可变对象", "is 与 ==", "None", "关键字参数", "类型标注", "模块", "异常边界", "self", "coroutine", "await", "yield", "函数", "return", "module", "package", "callable", "finally", "type hint", "Any", "可变默认值",
    "path: str", "split(\".\")", "for ... in ...", "isinstance()", "not / or", "raise KeyError", "变量赋值 =", "字典取值 []", "try / finally", "split(\":\", 1)", "getattr()", "callable()", "类型标注 :", "默认值 = ()", "assert", "class", "| None", "装饰器 @", ".parameters", "kwargs 字典", "**kwargs", "类与实例", "方法参数 self", "函数参数",
  ]],
  ["Python 标准库", [
    "dataclass", "虚拟环境", "Path", "TypedDict", "Annotated", "deepcopy()", "deepcopy", "import_module()", "@dataclass", "Protocol", "signature()", "field", "default_factory", "signature",
  ]],
  ["第三方库 API", [
    "Schema", "ValidationError", "@pytest.fixture", "fixture", "parametrize", "collect-only", "httpx.Request", "request.method / content / headers", "request.url.path", "json={...}", "Client / Transport", "Pydantic Model", "safe_load", "MockTransport",
  ]],
  ["框架与工具概念", ["reducer", "工具 tool", "invoke", "节点 node", "条件边"]],
  ["通用编程与测试概念", [
    "依赖注入", "超时", "timeout", "provider / service", "工作流", "清洗", "去重", "异常清单", "接口", "Mock", "结构化输出", "状态", "记忆", "评测集", "灰度", "延迟", "测试集", "过拟合", "推理引擎", "回调 handler", "parse", "schema", "reflection", "dispatch", "static gate", "Mock full flow", "evidence", "环境变量",
  ]],
  ["数据格式与网络协议", ["JSON", "协议与业务状态", "状态码", "HTTP status", "business success", "YAML 缩进", "冒号 :", "短横线 -", "true", "点路径", "response"]],
  ["课程项目字段与约定", ["data", "flowNo", "data.flowNo", "callable ref", "context", "Provider", "Adapter", "Registry", "resolve", "teardown.always"]],
  ["AI 领域概念", ["提示词", "Few-shot", "RAG", "向量", "引用", "工具调用", "微调"]],
  ["计算机硬件", ["GPU", "显存"]],
];

const origins = new Map(groups.flatMap(([origin, terms]) => terms.map((term): [string, string] => [term, origin])));
const preciseOrigins: Record<string, string> = {
  Annotated: "Python 标准库 · typing.Annotated",
  TypedDict: "Python 标准库 · typing.TypedDict",
  dataclass: "Python 标准库 · dataclasses.dataclass",
  "@dataclass": "Python 标准库 · dataclasses.dataclass",
  Path: "Python 标准库 · pathlib.Path",
  "deepcopy()": "Python 标准库 · copy.deepcopy",
  deepcopy: "Python 标准库 · copy.deepcopy",
  "import_module()": "Python 标准库 · importlib.import_module",
  Protocol: "Python 标准库 · typing.Protocol",
  "signature()": "Python 标准库 · inspect.signature",
  signature: "Python 标准库 · inspect.signature",
  Any: "Python 标准库 · typing.Any",
  field: "Python 标准库 · dataclasses.field",
  default_factory: "Python 标准库 · dataclasses.field 参数",
  "@pytest.fixture": "第三方库 · pytest",
  parametrize: "第三方库 · pytest",
  fixture: "第三方库 · pytest 夹具概念",
  "collect-only": "第三方库 · pytest 命令选项",
  "httpx.Request": "第三方库 · HTTPX",
  "request.method / content / headers": "第三方库 · HTTPX 请求对象",
  "request.url.path": "第三方库 · HTTPX 请求对象",
  "json={...}": "第三方库 · HTTPX 响应参数",
  "Client / Transport": "第三方库 · HTTPX",
  MockTransport: "第三方库 · HTTPX",
  Schema: "第三方库 · Pydantic",
  ValidationError: "第三方库 · Pydantic",
  "Pydantic Model": "第三方库 · Pydantic",
  safe_load: "第三方库 · PyYAML",
  "工具 tool": "框架与工具概念 · LangChain",
  invoke: "框架 API · LangChain 工具",
  "节点 node": "框架与工具概念 · LangGraph",
  "条件边": "框架与工具概念 · LangGraph",
  reducer: "框架概念 · LangGraph 状态合并",
};

export function knowledgeOrigin(term: string): string {
  return preciseOrigins[term] ?? origins.get(term) ?? "来源待标注";
}
