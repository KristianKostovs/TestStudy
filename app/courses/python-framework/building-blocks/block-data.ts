export type FrameworkBlock = {
  id: number; title: string; problem: string; addition: string; prerequisites: string[];
  code: string; output: string; trace: string[]; added: string[];
  task: string; starter: string; solution: string; taskOutput: string;
  checks: string[]; file: string; errorExpected?: string;
};

const calculation = `available = 10  # 调整前库存
amount = -2  # 本次减少 2
result = available + amount  # 算出调整后的库存
print(result)  # 把结果显示出来
`;

const functionCode = `def adjust_stock(available, amount):  # 给这段计算起一个名字
    return available + amount  # 把结果交还给调用者

result = adjust_stock(10, -2)  # 传入两个数，拿回一个数
print(result)
`;

const assertion = `def adjust_stock(available, amount):
    return available + amount

actual = adjust_stock(10, -2)  # 先执行，得到实际结果
assert actual == 8  # 实际结果不是 8 时，程序在这里报错
print("检查通过")  # 只有断言没有报错，才走到这里
`;

const cases = `def adjust_stock(available, amount):
    return available + amount

cases = [  # 列表装多组数据；每个字典装一组
    {"available": 10, "amount": -2, "expected": 8},
    {"available": 10, "amount": 5, "expected": 15},
]
for case in cases:  # 一次拿出一组，下面三行会重复执行
    actual = adjust_stock(case["available"], case["amount"])
    assert actual == case["expected"]
print("通过", len(cases), "组")
`;

const dispatch = `def adjust_stock(available, amount):
    return available + amount

actions = {"stock.adjust": adjust_stock}  # 保存函数本身，没有括号
case = {"action": "stock.adjust", "available": 10, "amount": -2, "expected": 8}
handler = actions[case["action"]]  # 用名字找到函数，暂时还没有执行
actual = handler(case["available"], case["amount"])  # 加括号才执行
assert actual == case["expected"]
print(actual)
`;

const contextCode = `def adjust_stock(available, amount):
    return available + amount

actions = {"stock.adjust": adjust_stock}
steps = [
    {"action": "stock.adjust", "amount": -2},
    {"action": "stock.adjust", "amount": 5},
]
context = {"available": 10}  # 用普通字典保存这次流程的当前库存
for step in steps:
    handler = actions[step["action"]]
    result = handler(context["available"], step["amount"])  # 读取上一步结果
    context["available"] = result  # 保存给下一步
print("最终库存", context["available"])
`;

const cleanup = `def adjust_stock(available, amount):
    return available + amount

actions = {"stock.adjust": adjust_stock}
steps = [
    {"action": "stock.adjust", "amount": -2},
    {"action": "stock.adjust", "amount": 5},
]
context = {"available": 10}
try:  # 把需要执行的步骤放在这里
    for step in steps:
        handler = actions[step["action"]]
        context["available"] = handler(context["available"], step["amount"])
    assert context["available"] == 13  # 检查整条流程的结果
finally:  # 正常结束或抛出异常，都会尝试执行这部分
    print("收尾")  # 此处只演示收尾位置，没有访问数据库
print("最终库存", context["available"])
`;

export const flowData = {
  initial_available: 10,
  steps: [
    { action: "stock.adjust", amount: -2, expected: 8 },
    { action: "stock.adjust", amount: 5, expected: 13 },
  ],
};

export const assembledRunner = `import json  # 把 JSON 文本读成 Python 字典与列表
from pathlib import Path  # 找到与当前脚本放在一起的文件


def adjust_stock(available, amount):
    result = available + amount
    if result < 0:  # 业务约束：库存不能小于 0
        raise ValueError("库存不足")
    return result


actions = {"stock.adjust": adjust_stock}  # 我们已经认识的动作表


def run_flow(flow):  # 只是把上一版的执行循环放进函数
    context = {"available": flow["initial_available"]}  # 每次运行都新建
    evidence = []  # 用列表记住每一步发生了什么
    try:
        for step in flow["steps"]:  # 步骤现在来自传入的数据
            handler = actions[step["action"]]
            before = context["available"]
            actual = handler(before, step["amount"])
            context["available"] = actual
            assert actual == step["expected"], f"预期 {step['expected']}，实际 {actual}"
            evidence.append({"before": before, "after": actual})
        return {"available": context["available"], "steps": evidence}
    finally:
        print("收尾")


if __name__ == "__main__":  # 直接运行脚本才读文件；被测试导入时不启动
    path = Path(__file__).with_name("flow.json")
    flow = json.loads(path.read_text(encoding="utf-8"))
    report = run_flow(flow)
    print("最终库存", report["available"])
    print("步骤", len(report["steps"]))
`;

const task5 = dispatch.replace('def adjust_stock', 'def read_stock(available, amount):\n    return available  # 查询只读取，不改变库存\n\n\ndef adjust_stock')
  .replace('actions = {"stock.adjust": adjust_stock}', 'actions = {"stock.adjust": adjust_stock, "stock.read": read_stock}')
  .replace('"action": "stock.adjust", "available"', '"action": "stock.read", "available"')
  .replace('"expected": 8', '"expected": 10');

const task7 = cleanup.replace('assert context["available"] == 13', 'assert context["available"] == 999');
const runnerStarter = assembledRunner.slice(0, assembledRunner.indexOf("def run_flow")) +
  'def run_flow(flow):\n    # TODO：建立上下文、按动作表循环执行、断言、记录证据并收尾\n    raise NotImplementedError("完成通用 run_flow")\n\n\n' +
  assembledRunner.slice(assembledRunner.indexOf('if __name__'));

export const frameworkBlocks: FrameworkBlock[] = [
  {
    id: 1, title: "先写一次普通计算",
    problem: "先不用框架。我们只想知道：库存 10，减少 2，最后是多少？",
    addition: "三个变量加一次加法。变量名帮助你记住每个数的用途，print 只负责显示。",
    prerequisites: ["= 是把右边的值交给左边的名字", "负数表示减少", "# 后面是给人看的注释"],
    code: calculation, output: "8\n", trace: ["available 是 10", "amount 是 -2", "10 + (-2) 得到 8"],
    added: ["available =", "amount =", "result =", "print("],
    task: "把减少量改成 3，运行后应显示 7。其余代码保持相同含义。",
    starter: calculation.replace("amount = -2", "amount = None  # TODO：填写调整量；None 暂时表示未填写"),
    solution: calculation.replace("amount = -2", "amount = -3").replace("本次减少 2", "本次减少 3"),
    taskOutput: "7\n", checks: ["运行显示 7", "能指出原库存、变化量和结果分别在哪一行"],
    file: "01_values.py",
  },
  {
    id: 2, title: "把计算装进函数",
    problem: "现在要再算一次库存 20、减少 3。复制整段代码，修改时容易漏掉一处。",
    addition: "用 def 给计算起名，用参数传入不同的数，用 return 交回结果。业务计算没有变。",
    prerequisites: ["上一块的变量与加法", "调用时的两个数按顺序交给两个参数", "函数体向右缩进"],
    code: functionCode, output: "8\n", trace: ["10 交给 available，-2 交给 amount", "函数内部算出 8", "return 把 8 交给外面的 result"],
    added: ["def ", "return ", "adjust_stock(10"],
    task: "保留第一次调用，再调用一次 adjust_stock(10, 5)，依次显示 8 和 15。",
    starter: functionCode + "# TODO：再调用一次并显示结果\n",
    solution: functionCode + "print(adjust_stock(10, 5))\n",
    taskOutput: "8\n15\n", checks: ["两次调用使用同一个函数", "输出依次为 8 和 15"],
    file: "02_function.py",
  },
  {
    id: 3, title: "让程序自己检查",
    problem: "每次靠眼睛看 print 的数字，很容易漏看。能不能让程序发现算错了？",
    addition: "加一条 assert：条件不成立就抛出 AssertionError。这是测试最小的检查动作；真实业务的输入校验仍应使用明确的条件检查。",
    prerequisites: ["上一块的函数调用", "== 用来比较两个值", "实际值与预期值"],
    code: assertion, output: "检查通过\n", trace: ["先调用函数，actual 得到 8", "比较 8 == 8，成立", "没有报错，显示检查通过"],
    added: ["assert ", "actual ="],
    task: "新增 10 + 5 应为 15 的检查，两项都通过后显示“两项检查通过”。",
    starter: assertion.replace('print("检查通过")', 'raise NotImplementedError("TODO：补上第二个断言和完成提示")'),
    solution: assertion.replace('print("检查通过")', 'assert adjust_stock(10, 5) == 15\nprint("两项检查通过")'),
    taskOutput: "两项检查通过\n", checks: ["检查减少和增加两种输入", "改错预期时，断言确实会失败"],
    file: "03_assertion.py",
  },
  {
    id: 4, title: "只换数据，重复检查",
    problem: "有 20 组输入时，要写 20 遍调用和断言吗？",
    addition: "把不同的输入与预期放进列表，用 for 反复执行同一段调用和检查。代码负责做法，数据负责变化。",
    prerequisites: ["上一块的函数和断言", "字典按名字装字段，列表装多组字典", 'case["amount"] 取当前这组的变化量'],
    code: cases, output: "通过 2 组\n", trace: ["第一组从 10 减 2，检查 8", "第二组重新从 10 加 5，检查 15", "这两组相互独立，还没有串起来"],
    added: ["cases =", '{"available"', "for case", 'case["'],
    task: "增加第三组：库存 10、变化量 0、预期 10。循环仍只写一份。",
    starter: cases + "# TODO：在 cases 中增加第三组\n",
    solution: cases.replace('    {"available": 10, "amount": 5, "expected": 15},', '    {"available": 10, "amount": 5, "expected": 15},\n    {"available": 10, "amount": 0, "expected": 10},'),
    taskOutput: "通过 3 组\n", checks: ["三组数据均被检查", "不复制调用和断言形成第二段循环"],
    file: "04_cases.py",
  },
  {
    id: 5, title: "用名字选一个动作",
    problem: "数据以后可能要求“调整库存”，也可能要求“读取库存”。怎样从数据选中对应函数？",
    addition: "先用普通字典把动作名字对应到函数。这张动作表后来常被叫作 registry。此处不需要反射或动态导入。",
    prerequisites: ["字典可以保存函数", "adjust_stock 是函数本身", "adjust_stock(10, -2) 才是在调用函数"],
    code: dispatch, output: "8\n", trace: ["数据写 stock.adjust", "动作表找到 adjust_stock 函数", "handler 加括号执行，返回 8"],
    added: ["actions =", "handler =", '"action":'],
    task: "增加只读动作 stock.read，返回传入的库存。用相同的查表与调用方式显示 10。",
    starter: dispatch.replace('"action": "stock.adjust", "available"', '"action": "stock.read", "available"').replace('"expected": 8', '"expected": 10') + "# TODO：定义只读函数，并加入动作表\n",
    solution: task5, taskOutput: "10\n",
    checks: ["能用 stock.read 找到查询函数", "查询没有修改库存", "数据里不保存可执行 Python 字符串"],
    file: "05_actions.py",
  },
  {
    id: 6, title: "接住上一步的结果",
    problem: "现在要先减 2，再在剩余库存上加 5。两步必须接起来。",
    addition: "增加一个普通字典 context，保存本次流程的当前值。每一步读它、计算，再把新值存回去。",
    prerequisites: ["上一块的动作表", "字典里的值可以更新", "独立测试数据与连续步骤不同"],
    code: contextCode, output: "最终库存 13\n", trace: ["开始 context.available = 10", "第一步读取 10，写回 8", "第二步读取 8，写回 13"],
    added: ["context =", 'context["available"]', "steps ="],
    task: "再加一步减少 3，检查它从 13 开始算，最后显示 10。",
    starter: contextCode.replace('    {"action": "stock.adjust", "amount": 5},', '    {"action": "stock.adjust", "amount": 5},\n    {"action": "stock.adjust", "amount": None},  # TODO：填写第三步'),
    solution: contextCode.replace('    {"action": "stock.adjust", "amount": 5},', '    {"action": "stock.adjust", "amount": 5},\n    {"action": "stock.adjust", "amount": -3},'),
    taskOutput: "最终库存 10\n", checks: ["过程依次得到 8、13、10", "没有在每一步重新把库存设为 10"],
    file: "06_context.py",
  },
  {
    id: 7, title: "失败也留出收尾位置",
    problem: "中途断言失败，后面的普通语句就不会执行。以后谁来关闭文件、连接或清理临时数据？",
    addition: "try 放主要步骤，finally 放收尾。这里先打印“收尾”看执行顺序，不把它误当成真正的数据库回滚。",
    prerequisites: ["上一块的连续执行", "异常会打断当前执行", "finally 会在退出 try 时尝试执行"],
    code: cleanup, output: "收尾\n最终库存 13\n", trace: ["循环得到 13", "断言通过", "先执行 finally，再执行 try/finally 后的打印"],
    added: ["try:", "finally:", 'print("收尾")'],
    task: "把最终预期改为 999，主动制造一次断言失败。观察收尾仍执行，最后的“最终库存”不再打印。",
    starter: cleanup.replace('assert context["available"] == 13', 'raise NotImplementedError("TODO：替换成实际值与 999 的断言")'),
    solution: task7, taskOutput: "收尾\n", errorExpected: "AssertionError",
    checks: ["程序以非零状态退出并报告 AssertionError", "stdout 仍有“收尾”", "没有用 except 吞掉主错误"],
    file: "07_cleanup.py",
  },
  {
    id: 8, title: "把积木拼成小框架",
    problem: "循环和动作已经稳定，只想修改步骤数据；同时希望每次运行都留下结果。",
    addition: "把循环命名为 run_flow，从 JSON 文件读流程，用列表保存步骤证据。Runner 只是这段负责编排的普通函数。",
    prerequisites: ["前七块积木", "json.loads 把文本变成字典和列表", "每次 run_flow 都新建 context 和 evidence"],
    code: assembledRunner, output: "收尾\n最终库存 13\n步骤 2\n",
    trace: ["读 flow.json：初始 10，两步 -2、+5", "动作表选择函数；context 传值；assert 检查", "记录 10→8、8→13，返回报告，最后执行收尾"],
    added: ["import json", "from pathlib", "def run_flow", "evidence", 'if __name__', "json.loads"],
    task: "完成 exercises/08_runner.py 的 run_flow。它旁边的 flow.json 已增加第三步 +2、预期 15。保持通用循环，读同一份数据完成三步。",
    starter: runnerStarter,
    solution: assembledRunner, taskOutput: "收尾\n最终库存 15\n步骤 3\n",
    checks: ["三步最终库存为 15，报告有三条记录", "相同流程运行两次，结果不互相污染", "未知动作与错误预期会报错，并仍执行收尾"],
    file: "08_runner.py",
  },
];

export const frameworkConnections = [
  { plain: "选择并执行动作的循环", name: "Runner", role: "按顺序调度动作、保存结果与检查。它不是新的 Python 语法。", href: "/courses/python-framework/chapters/3#level-7" },
  { plain: "保存当前库存的普通字典", name: "Context", role: "存本次流程的数据。每次运行新建，避免前后用例串数据。", href: "/courses/python-framework/chapters/1#level-2" },
  { plain: "从名字找到函数的字典", name: "Registry", role: "限制可以执行的动作。先用字典理解，再按需要学习动态导入。", href: "/courses/python-framework/chapters/3#level-7" },
  { plain: "文件里的输入与步骤", name: "JSON / YAML", role: "它们是数据格式。改成 YAML 后仍要读成 Python 字典与列表，再交给 Runner。", href: "/courses/python-framework/chapters/2#level-6" },
  { plain: "执行测试并报告断言失败", name: "pytest", role: "帮助发现测试、执行断言并报告结果；不需要每个项目自己再造一套。", href: "/courses/python-framework/chapters/2#level-5" },
  { plain: "资源准备和结束后的释放", name: "fixture", role: "pytest 的 fixture 可以把资源生命周期组织起来；具体释放逻辑仍由代码定义。", href: "/courses/python-framework/chapters/2#level-5" },
  { plain: "把统一参数转交给具体调用", name: "Adapter", role: "当动作不再计算内存库存，而要调用已有接口函数时，适配函数整理参数、执行调用并统一结果。", href: "/courses/python-framework/chapters/3#level-9" },
  { plain: "把内存计算换成真实 HTTP 调用", name: "HTTPX / Mock", role: "对外调用是另一个边界。先用 Mock 学失败与清理，再在授权环境验证真实结果。", href: "/courses/python-framework/chapters/3#level-8" },
];
