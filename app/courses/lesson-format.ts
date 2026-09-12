export type UnderstandingQuestion = { question: string; options: string[]; correct: number; explanation: string };
export type ConceptLesson = { goal: string; explanation: string; example: string; questions: UnderstandingQuestion[] };

// Explicit curriculum decisions, shared by the page and tutor. Unlisted lessons
// retain their existing implementation/project requirements.
const conceptLessons: Record<string, Record<number, ConceptLesson>> = {
  "python-agent-fast-track": {
    8: {
      goal: "理解解释器、依赖与配置的关系，能判断缺失配置和提交敏感文件的后果。",
      explanation: "虚拟环境为项目隔离第三方依赖；requirements.txt 记录依赖版本，便于重新安装。环境变量为同一份程序提供不同地址和密钥。.gitignore 告诉 Git 忽略尚未跟踪的文件，它不会删除文件，也不会撤回已经提交的密钥。",
      example: "项目 A：.venv → Python + 本项目依赖\nrequirements.txt → 重建依赖所需的版本清单\n.env → 本机配置（不提交）\n.env.example → 配置键名和示例（可以提交）\n.gitignore → 忽略 .env、.venv/、__pycache__/、*.pyc",
      questions: [
        { question: "为什么用当前环境的 python -m pip 安装依赖？", options: ["让安装依赖和运行程序使用同一个解释器环境", "自动把依赖上传到 Git", "所有 Python 都共享一份依赖，所以随便用"], correct: 0, explanation: "-m pip 使用当前 python 的 pip，避免安装到另一个解释器的环境。" },
        { question: "URL 用 os.environ.get(key, default)，必填密钥用 os.environ[key]。两项都缺失时会怎样？", options: ["两项都返回 None", "URL 使用默认值；读取密钥时抛 KeyError", "Python 自动创建真实密钥"], correct: 1, explanation: "get 可以给可选配置提供默认值；下标读取不存在的键会立即失败。" },
        { question: "哪些文件通常应提交到 Git？", options: ["真实 .env 和整个 .venv", "包含真实密钥的 settings.py", "requirements.txt、.env.example 和 .gitignore"], correct: 2, explanation: "提交重建项目所需的说明与配置样例；本机依赖和真实密钥不提交。已跟踪文件不会因加入 .gitignore 自动退出历史。" },
      ],
    },
  },
  "ai-developer-level5": {
    9: {
      goal: "区分 GPU、显存、调度器和推理引擎，理解模拟结果能够证明的范围。",
      explanation: "GPU 执行计算，显存保存计算需要的数据。调度器寻找满足资源条件的节点；推理引擎加载模型并处理请求。本节先认识它们的职责，部署实验可在具备环境后选做。",
      example: "任务申请 2 个 GPU → 调度器检查节点资源\n节点只有 1 个可用 GPU → 资源条件不足\n调度成功后 → 推理引擎加载模型 → 接收推理请求",
      questions: [
        { question: "显存主要指什么？", options: ["GPU 使用的内存", "磁盘剩余空间", "HTTP 请求数"], correct: 0, explanation: "显存用于存放模型及计算数据，不等于普通磁盘空间。" },
        { question: "任务申请 2 个 GPU，但只有 1 个可用。首先应检查什么？", options: ["提示词长度一定有错", "调度资源是否满足申请", "JSON 缩进"], correct: 1, explanation: "申请量超过可用量会阻碍调度；实际还需检查标签、配额等约束。" },
        { question: "模拟资源判断函数通过，能证明生产模型已部署成功吗？", options: ["能，函数代表整个集群", "能，只要返回 True", "不能，部署成功需要实际运行证据"], correct: 2, explanation: "模拟只能验证所建模的逻辑，真实部署是后续可选实验。" },
      ],
    },
  },
  "ui-automation": {
    1: {
      goal: "认识 Browser、Context、Page 和 DOM，能从 HTML 找到控件的语义。",
      explanation: "Browser 是浏览器实例；Context 是隔离的浏览器会话；Page 是其中的页面。DOM 表达页面节点、属性和层级，可访问名称帮助按用户可识别的语义定位控件。截图展示像素，不能直接表达这些节点关系。",
      example: '<form aria-label="登录">\n  <label for="username">用户名</label>\n  <input id="username" />\n  <button type="submit">登录</button>\n</form>',
      questions: [
        { question: "两个登录账号需要隔离会话，应使用什么？", options: ["两个独立 Context", "同一 Page 的两个变量名", "两张截图"], correct: 0, explanation: "Context 提供隔离的浏览器会话。" },
        { question: "示例中 input 的标签如何关联到输入框？", options: ["靠截图中的距离", "label 的 for 对应 input 的 id", "靠变量名"], correct: 1, explanation: "for=username 与 id=username 明确建立关联。" },
        { question: "截图是否足以判断 DOM 父子关系？", options: ["足以，位置就是层级", "足以，颜色就是属性", "不足，需要查看节点结构"], correct: 2, explanation: "布局位置与 DOM 层级并不总是一致。" },
      ],
    },
  },
  "api-automation": {
    1: {
      goal: "识别 HTTP 请求组成，区分 HTTP 状态和业务结果。",
      explanation: "方法表达操作方式，URL 指向资源，Header 承载元信息，Body 承载请求数据。HTTP 状态码和 JSON 中的 success 属于两层约定，都需要按接口契约理解。",
      example: 'POST /stock/adjust\nContent-Type: application/json\n{"skuId":"SKU-001","adjustAmount":10}\n\n响应 A：HTTP 200 {"success":true}\n响应 B：HTTP 500 {"success":false,"code":"SYSTEM_ERROR"}\n响应 C：HTTP 200 {"success":false,"code":"A4500"}',
      questions: [
        { question: "adjustAmount 在示例请求的哪里？", options: ["JSON Body", "状态码", "方法名"], correct: 0, explanation: "调整数量是 JSON 请求体中的业务字段。" },
        { question: "响应 C 表示什么？", options: ["业务一定成功", "HTTP 返回 200，但业务失败", "没有收到响应"], correct: 1, explanation: "还需检查 success 和业务 code。" },
        { question: "响应 B 和 C 的共同点是什么？", options: ["HTTP 状态相同", "错误码相同", "业务 success 都是 false"], correct: 2, explanation: "二者均报告业务失败，但 HTTP 状态和错误码不同。" },
      ],
    },
  },
  "performance-testing": {
    1: {
      goal: "区分响应时间、并发和吞吐，能在给定窗口下读懂指标。",
      explanation: "响应时间是一条请求从开始到结束的耗时；并发是在同一时刻尚未结束的请求数；吞吐是一个时间窗口里完成的请求量。用户数不等于正在处理的请求数。",
      example: "观察窗口：10 秒\n完成请求：20 个\n这些请求的平均耗时：0.4 秒\n某一时刻仍在处理：3 个请求",
      questions: [
        { question: "窗口平均吞吐是多少？", options: ["2 请求/秒", "20 请求/秒", "0.4 请求/秒"], correct: 0, explanation: "20 ÷ 10 = 2 请求/秒。" },
        { question: "示例时刻的并发是多少？", options: ["20", "3", "10"], correct: 1, explanation: "该时刻仍在处理的请求为 3 个。" },
        { question: "100 个登录用户意味着 100 个并发请求吗？", options: ["必然相等", "并发必然为 0", "不一定，用户可能空闲或等待"], correct: 2, explanation: "并发取决于同一时刻实际进行中的请求。" },
      ],
    },
  },
  "quality-engineering": {
    1: {
      goal: "区分测试、质量控制与质量保障，认识质量的共同责任。",
      explanation: "测试通过执行或检查发现产品问题，是质量控制的重要活动。质量控制关注产物是否满足要求；质量保障关注流程是否有助于持续产出可靠产品。一个活动可能支持多种目的，分类时应说明主要目的和证据。",
      example: "运行库存扣减用例，检查结果 → 测试活动，也支持质量控制\n根据验收标准检查发布包 → 质量控制\n制定评审与缺陷复盘流程并检查执行 → 质量保障",
      questions: [
        { question: "运行库存扣减用例并检查结果，直接属于什么？", options: ["测试活动", "只有流程制定", "采购活动"], correct: 0, explanation: "该活动直接检查产品行为，也为质量控制提供证据。" },
        { question: "制定评审流程并检查执行，主要关注什么？", options: ["某次响应字段", "质量保障中的过程可靠性", "测试机器颜色"], correct: 1, explanation: "QA 关注流程能否持续支持质量目标。" },
        { question: "质量责任只属于测试人员吗？", options: ["是，开发不负责", "是，产品只提需求", "不是，产品、开发、测试和运维共同承担"], correct: 2, explanation: "需求、实现、验证与运行均会影响质量。" },
      ],
    },
  },
  "ai-testing": {
    1: {
      goal: "理解智能体结果、重复稳定性和执行过程三个检查角度。",
      explanation: "同一任务可能有多种正确表述。除了结果符合需求，还要观察重复运行是否稳定，以及工具调用、权限和关键步骤是否正确。一次文本完全匹配不能覆盖这些要求。",
      example: "任务：查工单 T-101 状态\n结果：正确报告 open\n稳定性：重复运行记录成功与失败\n过程：调用查询工具，参数 T-101，未调用删除工具",
      questions: [
        { question: "两种不同表述都准确报告 open，应该如何判定？", options: ["按业务含义与契约判断", "只要字不同就失败", "一律通过不看内容"], correct: 0, explanation: "开放式回答需要按含义和任务约束判定。" },
        { question: "回答正确但调用了未授权删除工具，能通过吗？", options: ["能，只看答案", "不能，过程违反权限约束", "多运行一次即可忽略"], correct: 1, explanation: "结果正确不抵消过程中的越权行为。" },
        { question: "评估稳定性需要什么？", options: ["只挑最好一次", "只看模型名称", "重复运行并保留成功和失败记录"], correct: 2, explanation: "单次结果不能说明波动。" },
      ],
    },
    2: {
      goal: "按能力与副作用识别智能体类型，确定测试边界。",
      explanation: "知识问答重点看依据；数据查询重点看参数、过滤和结果；执行工具还要检查权限与副作用。一个系统可以同时包含多种能力，风险取决于它能做什么及失败影响。",
      example: "助手 A：只读制度并回答 → 检查引用与答案\n助手 B：查询库存 → 检查查询条件与结果\n助手 C：调整库存 → 额外检查授权、重复执行与恢复",
      questions: [
        { question: "知识问答最直接需要检查哪项？", options: ["引用是否支持结论", "GPU 外观", "回答字数越长越好"], correct: 0, explanation: "知识问答的结论需要可追溯依据。" },
        { question: "调整库存相比只读查询新增什么风险？", options: ["没有差别", "修改数据的权限与副作用", "只多了一个函数名"], correct: 1, explanation: "写操作会影响业务数据，应检查授权、幂等和恢复。" },
        { question: "既查资料又执行工具的助手如何分类？", options: ["只能选一种能力", "不需要分类", "分别列出各能力及其风险边界"], correct: 2, explanation: "混合能力应分别定义可测的边界。" },
      ],
    },
  },
};

export function getConceptLesson(courseId: string, levelId: number): ConceptLesson | undefined {
  return conceptLessons[courseId]?.[levelId];
}

export function lessonCompleted(concept: boolean, quizPassed: boolean, practicePassed: boolean) {
  return quizPassed && (concept || practicePassed);
}

export function lessonStepIds(concept: boolean) {
  return concept ? [1, 2, 3, 5] : [1, 2, 3, 4, 5];
}

export function getConceptRubric(courseId: string, levelId: number, title: string) {
  const lesson = getConceptLesson(courseId, levelId);
  if (!lesson) return null;
  return { levelId, title, task: lesson.goal,
    taskContract: ["概念课：通过页面理解检查；本机实践可选"],
    acceptance: lesson.questions.map((q) => q.question),
    referenceAnswer: lesson.questions.map((q) => `${q.question}\n${q.options[q.correct]}。${q.explanation}`).join("\n\n"),
    authoritativeNotes: ["本节通过理解检查完成，grade 必须为 null，不得要求提交代码、项目文件或运行证据。旧版练习评分不再作为通关条件。"],
  };
}
