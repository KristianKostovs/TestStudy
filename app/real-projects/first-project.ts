/** Public, de-identified teaching contract. The private source map stays in .local/. */
import type { ProjectCourseTask, ProjectStudyPlan } from "./project-learning-format";

export const firstRealProject = {
  id: "active-worker-bill",
  title: "员工状态过滤与新账单生成",
  status: "已核对需求与固定源码；运行证据待补",
  problem: "定时生成新账单时，已离职人员可能收到无法确认的账单。生成前必须核对人员状态。",
  goal: "能用可运行测试验证状态过滤、分批失败和无重复写入，并区分样例与真实系统证据。",
  prerequisites: ["Python 与 pytest 基础", "接口假响应与依赖隔离", "账单查重的基本顺序"],
  input: "候选在手明细按人员标识分组；人员状态由已有批量查询能力返回。",
  output: "只为明确在职且尚未生成当期账单的人员创建新账单及明细。",
  rules: [
    "只保留明确返回在职状态的人员；离职、状态缺失、未返回者均不生成新账单。",
    "人员状态每批最多查询 500 个标识；失败批次不放行其人员。",
    "过滤发生在查重和写入之前；已有账单仍按原有查重规则处理。",
  ],
  exclusions: ["不处理历史账单", "不修改其他账单类型", "不处理离职事件的实时通知"],
  evidence: "已核对固定版本的生成流程与过滤分支；独立生成的合成测试项目不构成真实后端验证。尚未执行真实接口、数据库或 SIT。",
  acceptance: [
    { id: "A1", scenario: "全部在职", expected: "符合原有查重规则的人员生成新账单及明细" },
    { id: "A2", scenario: "在职与离职混合", expected: "只为在职人员生成；离职人员没有新增记录" },
    { id: "A3", scenario: "状态缺失或接口未返回", expected: "对应人员不生成新账单" },
    { id: "A4", scenario: "部分批次或全部查询失败", expected: "失败批次人员不生成；全部失败时没有新增记录" },
    { id: "A5", scenario: "超过 500 人", expected: "按每批最多 500 人查询，跨批结果仍按人员正确过滤" },
    { id: "A6", scenario: "当期账单已存在", expected: "不重复创建账单或明细" },
  ],
} as const satisfies ProjectStudyPlan;

export const firstProjectCourseMappings = [
  {
    courseId: "quality-engineering",
    levelId: 3,
    title: "代码分支与白盒用例",
    task: "把状态过滤、缺失响应、分批失败和查重分支对应到 A1–A6。",
    output: "分支与验收场景对应表",
  },
  {
    courseId: "api-automation",
    levelId: 3,
    title: "Client 与 fixture",
    task: "用本地假响应覆盖成功、空结果和失败，不访问真实服务。",
    output: "固定输入与假响应",
  },
  {
    courseId: "quality-engineering",
    levelId: 4,
    title: "单元测试与依赖隔离",
    task: "隔离查询与存储，断言被过滤人员没有写入副作用。",
    output: "A1–A6 测试与运行结果",
  },
  {
    courseId: "api-automation",
    levelId: 9,
    title: "断言、证据与 teardown",
    task: "分别记录查询失败、账单未创建和清理结果。",
    output: "可追溯的断言与清理证据",
  },
] as const satisfies readonly ProjectCourseTask[];

export function firstProjectMappingFor(courseId: string, levelId?: number) {
  return firstProjectCourseMappings.find((mapping) => mapping.courseId === courseId && mapping.levelId === levelId);
}
