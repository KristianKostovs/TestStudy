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
