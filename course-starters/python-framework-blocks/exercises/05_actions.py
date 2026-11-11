def adjust_stock(available, amount):
    return available + amount

actions = {"stock.adjust": adjust_stock}  # 保存函数本身，没有括号
case = {"action": "stock.read", "available": 10, "amount": -2, "expected": 10}
handler = actions[case["action"]]  # 用名字找到函数，暂时还没有执行
actual = handler(case["available"], case["amount"])  # 加括号才执行
assert actual == case["expected"]
print(actual)
# TODO：定义只读函数，并加入动作表
