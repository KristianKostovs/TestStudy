import json  # 把 JSON 文本读成 Python 字典与列表
from pathlib import Path  # 找到与当前脚本放在一起的文件


def adjust_stock(available, amount):
    result = available + amount
    if result < 0:  # 业务约束：库存不能小于 0
        raise ValueError("库存不足")
    return result


actions = {"stock.adjust": adjust_stock}  # 我们已经认识的动作表


def run_flow(flow):
    # TODO：建立上下文、按动作表循环执行、断言、记录证据并收尾
    raise NotImplementedError("完成通用 run_flow")


if __name__ == "__main__":  # 直接运行脚本才读文件；被测试导入时不启动
    path = Path(__file__).with_name("flow.json")
    flow = json.loads(path.read_text(encoding="utf-8"))
    report = run_flow(flow)
    print("最终库存", report["available"])
    print("步骤", len(report["steps"]))
