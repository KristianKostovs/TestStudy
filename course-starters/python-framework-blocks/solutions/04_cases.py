def adjust_stock(available, amount):
    return available + amount

cases = [  # 列表装多组数据；每个字典装一组
    {"available": 10, "amount": -2, "expected": 8},
    {"available": 10, "amount": 5, "expected": 15},
    {"available": 10, "amount": 0, "expected": 10},
]
for case in cases:  # 一次拿出一组，下面三行会重复执行
    actual = adjust_stock(case["available"], case["amount"])
    assert actual == case["expected"]
print("通过", len(cases), "组")
