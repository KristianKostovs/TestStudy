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
    raise NotImplementedError("TODO：替换成实际值与 999 的断言")  # 检查整条流程的结果
finally:  # 正常结束或抛出异常，都会尝试执行这部分
    print("收尾")  # 此处只演示收尾位置，没有访问数据库
print("最终库存", context["available"])
