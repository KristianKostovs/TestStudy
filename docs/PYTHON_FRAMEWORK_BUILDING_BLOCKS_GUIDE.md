# Python 框架从底层积木到组装

面向已经学完框架基础、仍觉得抽象的学习者，用同一个库存例子重新串起每一块。先运行普通 Python，再看框架名字。

整条主线：库存 10 → 减少 2 → 剩余 8 → 增加 5 → 剩余 13。前四步的多组测试彼此独立，后面的流程步骤才把结果连续传下去。

每块先运行原例、观察值的变化，再只改一个地方。不要用 Python 优化模式运行示例，因为它会跳过 assert。

## 1 先写一次普通计算

先不用框架。我们只想知道：库存 10，减少 2，最后是多少？

三个变量加一次加法。变量名帮助你记住每个数的用途，print 只负责显示。

先认清：= 是把右边的值交给左边的名字；负数表示减少；# 后面是给人看的注释。

值怎样流动：

- available 是 10
- amount 是 -2
- 10 + (-2) 得到 8

完整可运行代码：

```python
available = 10  # 调整前库存
amount = -2  # 本次减少 2
result = available + amount  # 算出调整后的库存
print(result)  # 把结果显示出来
```

原例输出：

```text
8
```

动手只改一点：把减少量改成 3，运行后应显示 7。其余代码保持相同含义。

修改后的预期输出：

```text
7
```

验收：

- 运行显示 7
- 能指出原库存、变化量和结果分别在哪一行

练习包中执行：`python3 verify.py --block 1`。

## 2 把计算装进函数

现在要再算一次库存 20、减少 3。复制整段代码，修改时容易漏掉一处。

用 def 给计算起名，用参数传入不同的数，用 return 交回结果。业务计算没有变。

先认清：上一块的变量与加法；调用时的两个数按顺序交给两个参数；函数体向右缩进。

值怎样流动：

- 10 交给 available，-2 交给 amount
- 函数内部算出 8
- return 把 8 交给外面的 result

完整可运行代码：

```python
def adjust_stock(available, amount):  # 给这段计算起一个名字
    return available + amount  # 把结果交还给调用者

result = adjust_stock(10, -2)  # 传入两个数，拿回一个数
print(result)
```

原例输出：

```text
8
```

动手只改一点：保留第一次调用，再调用一次 adjust_stock(10, 5)，依次显示 8 和 15。

修改后的预期输出：

```text
8
15
```

验收：

- 两次调用使用同一个函数
- 输出依次为 8 和 15

练习包中执行：`python3 verify.py --block 2`。

## 3 让程序自己检查

每次靠眼睛看 print 的数字，很容易漏看。能不能让程序发现算错了？

加一条 assert：条件不成立就抛出 AssertionError。这是测试最小的检查动作；真实业务的输入校验仍应使用明确的条件检查。

先认清：上一块的函数调用；== 用来比较两个值；实际值与预期值。

值怎样流动：

- 先调用函数，actual 得到 8
- 比较 8 == 8，成立
- 没有报错，显示检查通过

完整可运行代码：

```python
def adjust_stock(available, amount):
    return available + amount

actual = adjust_stock(10, -2)  # 先执行，得到实际结果
assert actual == 8  # 实际结果不是 8 时，程序在这里报错
print("检查通过")  # 只有断言没有报错，才走到这里
```

原例输出：

```text
检查通过
```

动手只改一点：新增 10 + 5 应为 15 的检查，两项都通过后显示“两项检查通过”。

修改后的预期输出：

```text
两项检查通过
```

验收：

- 检查减少和增加两种输入
- 改错预期时，断言确实会失败

练习包中执行：`python3 verify.py --block 3`。

## 4 只换数据，重复检查

有 20 组输入时，要写 20 遍调用和断言吗？

把不同的输入与预期放进列表，用 for 反复执行同一段调用和检查。代码负责做法，数据负责变化。

先认清：上一块的函数和断言；字典按名字装字段，列表装多组字典；case["amount"] 取当前这组的变化量。

值怎样流动：

- 第一组从 10 减 2，检查 8
- 第二组重新从 10 加 5，检查 15
- 这两组相互独立，还没有串起来

完整可运行代码：

```python
def adjust_stock(available, amount):
    return available + amount

cases = [  # 列表装多组数据；每个字典装一组
    {"available": 10, "amount": -2, "expected": 8},
    {"available": 10, "amount": 5, "expected": 15},
]
for case in cases:  # 一次拿出一组，下面三行会重复执行
    actual = adjust_stock(case["available"], case["amount"])
    assert actual == case["expected"]
print("通过", len(cases), "组")
```

原例输出：

```text
通过 2 组
```

动手只改一点：增加第三组：库存 10、变化量 0、预期 10。循环仍只写一份。

修改后的预期输出：

```text
通过 3 组
```

验收：

- 三组数据均被检查
- 不复制调用和断言形成第二段循环

练习包中执行：`python3 verify.py --block 4`。

## 5 用名字选一个动作

数据以后可能要求“调整库存”，也可能要求“读取库存”。怎样从数据选中对应函数？

先用普通字典把动作名字对应到函数。这张动作表后来常被叫作 registry。此处不需要反射或动态导入。

先认清：字典可以保存函数；adjust_stock 是函数本身；adjust_stock(10, -2) 才是在调用函数。

值怎样流动：

- 数据写 stock.adjust
- 动作表找到 adjust_stock 函数
- handler 加括号执行，返回 8

完整可运行代码：

```python
def adjust_stock(available, amount):
    return available + amount

actions = {"stock.adjust": adjust_stock}  # 保存函数本身，没有括号
case = {"action": "stock.adjust", "available": 10, "amount": -2, "expected": 8}
handler = actions[case["action"]]  # 用名字找到函数，暂时还没有执行
actual = handler(case["available"], case["amount"])  # 加括号才执行
assert actual == case["expected"]
print(actual)
```

原例输出：

```text
8
```

动手只改一点：增加只读动作 stock.read，返回传入的库存。用相同的查表与调用方式显示 10。

修改后的预期输出：

```text
10
```

验收：

- 能用 stock.read 找到查询函数
- 查询没有修改库存
- 数据里不保存可执行 Python 字符串

练习包中执行：`python3 verify.py --block 5`。

## 6 接住上一步的结果

现在要先减 2，再在剩余库存上加 5。两步必须接起来。

增加一个普通字典 context，保存本次流程的当前值。每一步读它、计算，再把新值存回去。

先认清：上一块的动作表；字典里的值可以更新；独立测试数据与连续步骤不同。

值怎样流动：

- 开始 context.available = 10
- 第一步读取 10，写回 8
- 第二步读取 8，写回 13

完整可运行代码：

```python
def adjust_stock(available, amount):
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
```

原例输出：

```text
最终库存 13
```

动手只改一点：再加一步减少 3，检查它从 13 开始算，最后显示 10。

修改后的预期输出：

```text
最终库存 10
```

验收：

- 过程依次得到 8、13、10
- 没有在每一步重新把库存设为 10

练习包中执行：`python3 verify.py --block 6`。

## 7 失败也留出收尾位置

中途断言失败，后面的普通语句就不会执行。以后谁来关闭文件、连接或清理临时数据？

try 放主要步骤，finally 放收尾。这里先打印“收尾”看执行顺序，不把它误当成真正的数据库回滚。

先认清：上一块的连续执行；异常会打断当前执行；finally 会在退出 try 时尝试执行。

值怎样流动：

- 循环得到 13
- 断言通过
- 先执行 finally，再执行 try/finally 后的打印

完整可运行代码：

```python
def adjust_stock(available, amount):
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
```

原例输出：

```text
收尾
最终库存 13
```

动手只改一点：把最终预期改为 999，主动制造一次断言失败。观察收尾仍执行，最后的“最终库存”不再打印。

修改后的预期输出：

```text
收尾
```

本项故意触发 AssertionError，子程序非零退出是预期行为；收尾仍应发生。

验收：

- 程序以非零状态退出并报告 AssertionError
- stdout 仍有“收尾”
- 没有用 except 吞掉主错误

练习包中执行：`python3 verify.py --block 7`。

## 8 把积木拼成小框架

循环和动作已经稳定，只想修改步骤数据；同时希望每次运行都留下结果。

把循环命名为 run_flow，从 JSON 文件读流程，用列表保存步骤证据。Runner 只是这段负责编排的普通函数。

先认清：前七块积木；json.loads 把文本变成字典和列表；每次 run_flow 都新建 context 和 evidence。

值怎样流动：

- 读 flow.json：初始 10，两步 -2、+5
- 动作表选择函数；context 传值；assert 检查
- 记录 10→8、8→13，返回报告，最后执行收尾

同目录的 flow.json：

```json
{
  "initial_available": 10,
  "steps": [
    {
      "action": "stock.adjust",
      "amount": -2,
      "expected": 8
    },
    {
      "action": "stock.adjust",
      "amount": 5,
      "expected": 13
    }
  ]
}
```

完整可运行代码：

```python
import json  # 把 JSON 文本读成 Python 字典与列表
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
```

原例输出：

```text
收尾
最终库存 13
步骤 2
```

动手只改一点：完成 exercises/08_runner.py 的 run_flow。它旁边的 flow.json 已增加第三步 +2、预期 15。保持通用循环，读同一份数据完成三步。

修改后的预期输出：

```text
收尾
最终库存 15
步骤 3
```

验收：

- 三步最终库存为 15，报告有三条记录
- 相同流程运行两次，结果不互相污染
- 未知动作与错误预期会报错，并仍执行收尾

练习包中执行：`python3 verify.py --block 8`。

## 再把名字对应回来

| 刚才的普通做法 | 框架名称 | 作用 |
| --- | --- | --- |
| 选择并执行动作的循环 | Runner | 按顺序调度动作、保存结果与检查。它不是新的 Python 语法。 |
| 保存当前库存的普通字典 | Context | 存本次流程的数据。每次运行新建，避免前后用例串数据。 |
| 从名字找到函数的字典 | Registry | 限制可以执行的动作。先用字典理解，再按需要学习动态导入。 |
| 文件里的输入与步骤 | JSON / YAML | 它们是数据格式。改成 YAML 后仍要读成 Python 字典与列表，再交给 Runner。 |
| 执行测试并报告断言失败 | pytest | 帮助发现测试、执行断言并报告结果；不需要每个项目自己再造一套。 |
| 资源准备和结束后的释放 | fixture | pytest 的 fixture 可以把资源生命周期组织起来；具体释放逻辑仍由代码定义。 |
| 把统一参数转交给具体调用 | Adapter | 当动作不再计算内存库存，而要调用已有接口函数时，适配函数整理参数、执行调用并统一结果。 |
| 把内存计算换成真实 HTTP 调用 | HTTPX / Mock | 对外调用是另一个边界。先用 Mock 学失败与清理，再在授权环境验证真实结果。 |

## 本机练习

[下载练习包](../public/downloads/python-framework-blocks.zip)

解压后，examples 是完整例子，exercises 是待完成任务，solutions 是参考修改。先运行 `python3 examples/01_values.py`，再修改自己的练习并运行 `python3 verify.py --block 1`。`--reference` 只检查参考修改。最后执行 `python3 -m unittest discover -s tests -v` 检查小框架。

网页草稿、本机代码和原课程通关记录彼此独立。finally 中的打印只说明执行顺序，不等于真实清理或数据库回滚。这个小框架未验证真实 HTTP、数据库、并发、输入 Schema 与生产系统。
