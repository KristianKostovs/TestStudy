def adjust_stock(available, amount):
    return available + amount

actual = adjust_stock(10, -2)  # 先执行，得到实际结果
assert actual == 8  # 实际结果不是 8 时，程序在这里报错
raise NotImplementedError("TODO：补上第二个断言和完成提示")  # 只有断言没有报错，才走到这里
