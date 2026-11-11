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
