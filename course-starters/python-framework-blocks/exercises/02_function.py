def adjust_stock(available, amount):  # 给这段计算起一个名字
    return available + amount  # 把结果交还给调用者

result = adjust_stock(10, -2)  # 传入两个数，拿回一个数
print(result)
# TODO：再调用一次并显示结果
