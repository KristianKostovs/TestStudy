import { learningStages } from "./learning-plan";
import type { GradingRubric } from "../courses/python-framework/grading-rubrics";

export const aiCourseId = "ai-developer-level5";
export const exercises = [
  {
    terms: [["字典 dict", "按字段名保存一条记录，例如设备编号和故障描述。"], ["列表 list", "按顺序保存多条记录。"], ["函数", "把输入变成输出的一段可重复使用的指令。"], ["return", "把结果交回调用函数的位置。"]],
    input: '[{"device_id": "001", "fault": "无法开机"}, {"device_id": "002", "fault": "断网"}]',
    example: 'def find_records(records, device_id):\n    result = []\n    for record in records:\n        if record.get("device_id") == device_id:\n            result.append(dict(record))\n    return result\n\nprint(find_records([{"device_id": "001", "fault": "无法开机"}], "001"))',
    walkthrough: ["def 定义函数，两个参数接收记录列表和设备编号。", "result 是一个新的空列表，用于收集结果。", "for 每次取出一条字典记录。", "get 读取编号；用字符串比较，保留前导零。", "dict(record) 复制这一条记录，append 把它加入结果。", "return 在循环结束后返回全部匹配记录。"],
    task: "实现 find_records(records, device_id)，按字符串设备编号筛选记录。空列表或查不到时返回 []；不得修改输入。",
    starter: 'def find_records(records, device_id):\n    # TODO：创建结果列表，筛选并返回记录\n    pass\n\nrecords = [{"device_id": "001", "fault": "无法开机"}]\n# TODO：断言查到、查不到、空列表，验证输入没有变化\n',
    acceptance: ["查询 001 返回其记录，并保留字符串编号。", "空列表和不存在的编号均返回空列表。", "不修改输入，并提供三种场景的断言。"],
    reference: 'def find_records(records, device_id):\n    return [dict(row) for row in records if row.get("device_id") == device_id]\n\nrecords = [{"device_id": "001", "fault": "无法开机"}]\nbefore = [dict(row) for row in records]\nassert find_records(records, "001") == before\nassert find_records(records, "002") == []\nassert find_records([], "001") == []\nassert records == before',
    quiz: { question: "设备编号 001 应该用哪种值保存？", options: ["字符串 '001'，保留前导零", "整数 1，编号都可以去掉前导零", "浮点数 1.0"], correct: 0, explanation: "设备编号是标识，不用于数学运算。字符串可以保留前导零。" },
  },
  {
    terms: [["清洗", "按明确规则统一数据并识别异常。"], ["去重", "根据业务键判断是否是同一条记录。"], ["异常清单", "保留不能直接使用的记录及其原因。"]],
    input: '[{"ticket_id":"T1","device_id":"001"},{"ticket_id":"T1","device_id":"001"},{"ticket_id":"T2","device_id":""}]',
    example: 'rows = [{"ticket_id": "T1"}, {"ticket_id": "T1"}]\nseen = set()\nclean = []\nfor row in rows:\n    key = row["ticket_id"]\n    if key not in seen:\n        clean.append(dict(row))\n        seen.add(key)\nprint(clean)',
    walkthrough: ["set 创建集合，用于记录已经见过的工单编号。", "遍历记录，按 ticket_id 作为去重键。", "第一次遇到编号时保留一份副本。", "已见过的编号跳过；实际任务还要保留排除原因。"],
    task: "实现 clean_records(rows)，返回 (clean, rejected)。工单号或设备编号为空的行进入 rejected；有效记录按工单号去重，重复行也注明原因。",
    starter: 'def clean_records(rows):\n    # TODO：返回有效记录与包含 row/reason 的异常记录\n    pass\n\n# TODO：验证重复、空编号与数量对账\n',
    acceptance: ["有效记录按工单号去重且保留字符串设备编号。", "空工单号、空设备编号和重复记录均有排除原因。", "输入数等于有效数加排除数，且不修改原始行。"],
    reference: 'def clean_records(rows):\n    clean, rejected, seen = [], [], set()\n    for row in rows:\n        key = row.get("ticket_id")\n        reason = "缺工单号" if not key else "缺设备编号" if not row.get("device_id") else "重复工单" if key in seen else None\n        if reason:\n            rejected.append({"row": dict(row), "reason": reason})\n        else:\n            clean.append(dict(row))\n            seen.add(key)\n    return clean, rejected\n\nrows = [{"ticket_id":"T1","device_id":"001"},{"ticket_id":"T1","device_id":"001"},{"ticket_id":"T2","device_id":""}]\nclean, rejected = clean_records(rows)\nassert len(clean) == 1 and len(rejected) == 2\nassert len(rows) == len(clean) + len(rejected)\nassert clean[0]["device_id"] == "001"',
    quiz: { question: "遇到缺失的故障类别，应该先怎么做？", options: ["全部填成正常", "根据已确认的规则处理，无法判断则列入异常", "删除且不记录"], correct: 1, explanation: "缺失值处理必须有业务依据，不能把未知伪装成正常。" },
  },
  {
    terms: [["接口", "程序之间约定好的调用入口。"], ["状态码", "表示请求处理结果的数字。"], ["Mock", "用可控的模拟实现代替真实外部服务。"]],
    input: '{"device_id":"001"} → {"status":200,"data":{"name":"打印机"}}',
    example: 'def lookup(device_id, devices):\n    if not device_id:\n        return {"status": 400, "error": "缺设备编号"}\n    if device_id not in devices:\n        return {"status": 404, "error": "设备不存在"}\n    return {"status": 200, "data": dict(devices[device_id])}',
    walkthrough: ["device_id 来自调用者，devices 是注入的模拟数据。", "先校验参数，缺少时返回 400。", "参数有效但数据不存在时返回 404。", "成功时返回 200 和数据；这只是服务逻辑练习，不会发网络请求。"],
    task: "实现 lookup(device_id, devices)，按照示例约定处理成功、缺参和不存在三种情况，并提供断言。",
    starter: 'def lookup(device_id, devices):\n    # TODO：实现三种返回分支\n    pass\n\n# TODO：用字典模拟设备库并测试\n',
    acceptance: ["缺编号返回 status=400。", "不存在的设备返回 status=404。", "存在的设备返回 status=200 和 data，并有三种断言。"],
    reference: 'def lookup(device_id, devices):\n    if not device_id:\n        return {"status": 400, "error": "缺设备编号"}\n    if device_id not in devices:\n        return {"status": 404, "error": "设备不存在"}\n    return {"status": 200, "data": dict(devices[device_id])}\n\ndevices = {"001": {"name": "打印机"}}\nassert lookup("", devices)["status"] == 400\nassert lookup("002", devices)["status"] == 404\nassert lookup("001", devices)["data"]["name"] == "打印机"',
    quiz: { question: "参数有效，但编号对应的设备不存在，属于什么？", options: ["一定是网络断开", "模型训练失败", "业务查询无结果，需要明确返回"], correct: 2, explanation: "无结果和网络失败是不同状态，应有不同的诊断。" },
  },
  {
    terms: [["提示词", "给模型的角色、任务、依据和边界说明。"], ["Few-shot", "给出少量正确示例引导输出。"], ["结构化输出", "按固定字段和类型返回结果。"]],
    input: '{"category":"电源","missing_fields":[]}',
    example: 'def validate_output(value):\n    if not isinstance(value, dict):\n        return False\n    allowed = {"电源", "网络", "其他", "待确认"}\n    return value.get("category") in allowed and isinstance(value.get("missing_fields"), list)',
    walkthrough: ["isinstance 判断结果是否是字典。", "allowed 明确可接受的分类范围。", "检查字段类别和类型，不能只相信模型按格式回答。", "练习还应检查 missing_fields 内每个元素都是字符串。"],
    task: "实现 validate_output(value)，仅接受允许的 category，以及全部为字符串的 missing_fields 列表。用注释写一段提示词，要求缺依据时返回待确认。",
    starter: '# TODO：写清任务、允许分类、缺依据处理与输出示例\ndef validate_output(value):\n    pass\n\n# TODO：验证正常、非法类别、错误字段类型\n',
    acceptance: ["提示词说明分类范围、缺依据时待确认和固定输出。", "检查字典、允许类别、missing_fields 列表及字符串元素。", "覆盖正常、非法分类和字段类型错误的断言。"],
    reference: '# 按故障描述分类为电源/网络/其他；无足够依据返回待确认。\n# 仅返回 category 和 missing_fields，例如 {"category":"待确认","missing_fields":["故障表现"]}。\ndef validate_output(value):\n    return isinstance(value, dict) and value.get("category") in {"电源", "网络", "其他", "待确认"} and isinstance(value.get("missing_fields"), list) and all(isinstance(x, str) for x in value["missing_fields"])\n\nassert validate_output({"category":"电源","missing_fields":[]})\nassert not validate_output({"category":"未知","missing_fields":[]})\nassert not validate_output({"category":"电源","missing_fields":[1]})',
    quiz: { question: "模型返回合法 JSON，能证明什么？", options: ["一定符合业务规则", "至少格式可解析，还需验证字段和事实", "一定没有越权"], correct: 1, explanation: "可解析不等于事实正确，也不等于字段、权限与业务约束都满足。" },
  },
  {
    terms: [["RAG", "先检索资料，再依据资料生成回答。"], ["向量", "用一组数字表示文本特征，辅助比较含义。"], ["引用", "指出结论依据哪份资料的哪段原文。"]],
    input: '{"question":"报修需确认什么？","source":{"file":"报修制度","text":"提交前需申请人确认。"}}',
    example: 'def prepare_context(question, documents):\n    if not documents:\n        return {"status": "insufficient", "sources": []}\n    return {"question": question, "sources": [{"file": d["file"], "text": d["text"]} for d in documents]}',
    walkthrough: ["documents 是检索后的资料列表，不是模型编造的来源。", "没有资料时返回依据不足，不构造确定答案。", "同时保留文件名和原文，供生成与核验使用。", "示例演示资料传递；向量检索和答案事实核验仍需在完整项目中实现。"],
    task: "实现 prepare_context(question, documents)，无资料时明确 insufficient；有资料时保留问题、文件名与原文，不能编造来源。",
    starter: 'def prepare_context(question, documents):\n    # TODO：区分无依据与有依据\n    pass\n\n# TODO：测试空资料和一份明确来源的资料\n',
    acceptance: ["空资料返回 status=insufficient 和空 sources。", "有资料时保留 question、原文件名和 text。", "有空资料和正常资料的断言，未伪造来源。"],
    reference: 'def prepare_context(question, documents):\n    if not documents:\n        return {"status":"insufficient", "sources":[]}\n    return {"question":question, "sources":[{"file":d["file"],"text":d["text"]} for d in documents]}\n\nassert prepare_context("如何报修", []) == {"status":"insufficient","sources":[]}\ndocs = [{"file":"制度A","text":"提交前需确认"}]\nassert prepare_context("如何报修", docs) == {"question":"如何报修","sources":docs}',
    quiz: { question: "答案引用了文件，但原文不支持结论，应该算什么？", options: ["引用正确", "只要文件存在就通过", "依据不成立，需要修复"], correct: 2, explanation: "引用需要真正支持结论，不能只核对文件名是否存在。" },
  },
  {
    terms: [["工具调用", "模型提出操作与参数，程序负责校验和执行。"], ["状态", "记录任务已经走到哪一步。"], ["记忆", "保存之后仍需使用的信息，并区分不同会话。"]],
    input: '{"device_id":"001","confirmed":false}',
    example: 'def submit_if_confirmed(form, confirmed, submit):\n    if not confirmed:\n        return {"status": "awaiting_confirmation"}\n    return submit(dict(form))',
    walkthrough: ["submit 通过参数传入，测试可以用模拟函数。", "先检查人工确认状态。", "未确认时直接返回，不触发外部操作。", "确认后传入表单副本，真实系统还需要检查权限和重复提交。"],
    task: "实现 submit_if_confirmed(form, confirmed, submit)，严格要求 confirmed is True 才调用工具。使用调用记录列表验证未确认零调用、确认后一次调用。",
    starter: 'def submit_if_confirmed(form, confirmed, submit):\n    # TODO：检查显式确认，再调用注入的工具\n    pass\n\n# TODO：使用模拟工具验证调用次数，不发真实请求\n',
    acceptance: ["仅 confirmed is True 才调用 submit。", "未确认返回 awaiting_confirmation 且工具零调用。", "确认后调用一次、传递表单并返回结果，有模拟断言。"],
    reference: 'def submit_if_confirmed(form, confirmed, submit):\n    if confirmed is not True:\n        return {"status":"awaiting_confirmation"}\n    return submit(dict(form))\n\ncalls = []\ndef fake_submit(form):\n    calls.append(form)\n    return {"status":"submitted"}\nassert submit_if_confirmed({"device_id":"001"}, False, fake_submit)["status"] == "awaiting_confirmation"\nassert submit_if_confirmed({}, "yes", fake_submit)["status"] == "awaiting_confirmation"\nassert calls == []\nassert submit_if_confirmed({"device_id":"001"}, True, fake_submit)["status"] == "submitted"\nassert calls == [{"device_id":"001"}]',
    quiz: { question: "模型说“用户已经同意”，就可以提交吗？", options: ["程序仍需检查真实确认状态和权限", "模型说了就提交", "重复提交一次确认"], correct: 0, explanation: "授权依据必须由程序核验，不能由模型的一句话替代。" },
  },
  {
    terms: [["评测集", "用于固定比较方案的一批样例。"], ["灰度", "先给小范围用户使用，再逐步扩大。"], ["延迟", "从请求开始到获得结果所经历的时间。"]],
    input: '[{"success":true,"latency_ms":200},{"success":false,"latency_ms":800}]',
    example: 'def summarize(results):\n    if not results:\n        return {"count": 0, "success_rate": None}\n    successes = sum(1 for row in results if row["success"] is True)\n    return {"count": len(results), "success_rate": successes / len(results)}',
    walkthrough: ["空数据没有可计算的成功率，用 None 表示未知。", "successes 统计真正成功的请求。", "分母包含成功和失败的全部请求，避免选择性展示。", "完整评测还应记录耗时、费用、测试环境与失败原因。"],
    task: "实现 summarize(results)，返回 count、success_rate、mean_latency_ms。空输入两项指标为 None；非空时包含失败样例一起统计。",
    starter: 'def summarize(results):\n    # TODO：统计数量、成功率和平均耗时\n    pass\n\n# TODO：验证空集与一成功一失败的结果\n',
    acceptance: ["空列表 count=0，两项指标为 None。", "成功率使用全部请求作分母。", "平均耗时包含失败请求，并用固定样例断言。"],
    reference: 'def summarize(results):\n    if not results:\n        return {"count":0,"success_rate":None,"mean_latency_ms":None}\n    return {"count":len(results),"success_rate":sum(r["success"] is True for r in results)/len(results),"mean_latency_ms":sum(r["latency_ms"] for r in results)/len(results)}\n\nassert summarize([])["success_rate"] is None\nassert summarize([{"success":True,"latency_ms":200},{"success":False,"latency_ms":800}]) == {"count":2,"success_rate":0.5,"mean_latency_ms":500}',
    quiz: { question: "只挑成功的请求计算成功率，有什么问题？", options: ["数据更干净", "没有问题", "排除了失败，不能反映真实效果"], correct: 2, explanation: "指标必须说明样本范围和分母，失败样例同样需要记录。" },
  },
  {
    terms: [["微调", "利用任务数据继续训练已有模型。"], ["测试集", "留作最终检验、不能参与训练的一批数据。"], ["过拟合", "记住训练样例，却不能处理新的数据。"]],
    input: '{"train_ids":["T1","T2"],"test_ids":["T3"]}',
    example: 'train_ids = {"T1", "T2"}\ntest_ids = {"T3"}\nleaked = train_ids & test_ids\nassert not leaked',
    walkthrough: ["用集合保存每份数据的标识。", "& 求交集，找出同时出现在训练与测试中的标识。", "交集为空是基本检查；还要识别不同编号但内容重复的样本。", "这是微调前的数据检查练习，不代表已经完成模型训练。"],
    task: "实现 check_split(train_ids, test_ids)，存在交集时抛 ValueError，无交集返回 True。注释说明验证集和测试集的不同用途。",
    starter: '# TODO：解释训练集、验证集、测试集\ndef check_split(train_ids, test_ids):\n    pass\n\n# TODO：验证无交集及有重复标识\n',
    acceptance: ["检测训练与测试标识的交集。", "有交集抛 ValueError，无交集返回 True，并有验证。", "说明验证集用于调整方案，测试集用于最终独立检验。"],
    reference: '# 训练集调整参数，验证集帮助选择配置，测试集留作最终检验。\ndef check_split(train_ids, test_ids):\n    if set(train_ids) & set(test_ids):\n        raise ValueError("训练测试数据重复")\n    return True\n\nassert check_split(["T1"], ["T2"]) is True\ntry:\n    check_split(["T1"], ["T1"])\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("应拒绝重复数据")',
    quiz: { question: "反复根据测试集结果调整模型，会怎样？", options: ["测试集可能不再是独立的最终检验", "一定提升泛化能力", "等于没有用测试集"], correct: 0, explanation: "测试集应保留独立性；选择配置与调参主要使用验证集。" },
  },
  {
    terms: [["GPU", "常用于模型并行计算的硬件。"], ["显存", "GPU 使用的内存。"], ["推理引擎", "运行模型并向外提供服务的软件。"]],
    input: '{"requested_gpu":2,"available_gpu":1}',
    example: 'def can_schedule(requested_gpu, available_gpu):\n    return 0 < requested_gpu <= available_gpu\n\nassert can_schedule(1, 2)\nassert not can_schedule(2, 1)',
    walkthrough: ["比较申请量和可用量，理解资源不足时为何等待。", "实际 K8s 调度还涉及节点标签、配额和其他约束。", "这个函数只是概念练习，不能作为真实集群调度器。", "基础设施方向仍需在实验环境完成一次实际部署与排障。"],
    task: "实现 can_schedule(requested_gpu, available_gpu)，拒绝非整数、布尔值、非正申请量和负可用量。合法输入返回资源是否足够。",
    starter: 'def can_schedule(requested_gpu, available_gpu):\n    # TODO：校验参数，再比较资源\n    pass\n\n# TODO：覆盖足够、不足和非法参数\n',
    acceptance: ["拒绝非整数、布尔值、申请量<=0或可用量<0，抛 ValueError。", "合法输入按资源是否足够返回布尔值。", "覆盖资源足够、不足和非法输入的断言；说明实际部署仍待验证。"],
    reference: 'def can_schedule(requested_gpu, available_gpu):\n    if type(requested_gpu) is not int or type(available_gpu) is not int or requested_gpu <= 0 or available_gpu < 0:\n        raise ValueError("资源参数无效")\n    return requested_gpu <= available_gpu\n\nassert can_schedule(1, 2) is True\nassert can_schedule(2, 1) is False\ntry:\n    can_schedule(True, 1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("应拒绝布尔值")\n# 本练习未部署集群；需另做真实部署与故障排查实验。',
    quiz: { question: "模拟资源判断函数测试通过，能证明什么？", options: ["生产集群性能达标", "仅证明这个函数在测试样例下符合约定", "已经完成模型部署"], correct: 1, explanation: "模拟验证和真实环境验证必须区分，实际部署要有实际运行记录。" },
  },
];

export function getAiGradingRubric(levelId: number): GradingRubric | null {
  const stage = learningStages[levelId - 1];
  const exercise = exercises[levelId - 1];
  if (!Number.isInteger(levelId) || !stage || !exercise) return null;
  return { levelId, title: stage.title, task: exercise.task, taskContract: exercise.acceptance, acceptance: exercise.acceptance, referenceAnswer: exercise.reference, authoritativeNotes: ["仅按本节练习判定，不套用 Python 框架课程同编号题目。", "网页中的代码练习不代表真实部署、训练或业务项目已经完成。"] };
}
