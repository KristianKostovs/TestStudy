export const referenceAnswers: Readonly<Record<number, string>> = {
  1: `def get_by_path(data: dict, path: str):
    current = data
    for part in path.split("."):
        if not isinstance(current, dict) or part not in current:
            raise KeyError(f"找不到字段: {path}")
        current = current[part]
    return current


response = {
    "success": True,
    "data": {"flowNo": "FLOW-710"},
}

assert get_by_path(response, "data.flowNo") == "FLOW-710"
assert response == {"success": True, "data": {"flowNo": "FLOW-710"}}

try:
    get_by_path({}, "data.flowNo")
except KeyError as error:
    assert "data.flowNo" in str(error)`,
  2: `import pytest
from copy import deepcopy


fixture = {"request": {"businessStatus": 710}}


def test_shallow_copy_reproduces_pollution():
    case_a = dict(fixture)
    case_b = dict(fixture)
    case_a["request"]["businessStatus"] = 720
    assert case_b["request"]["businessStatus"] == 720


def test_deepcopy_isolates_and_cleanup_always_runs():
    case_a = deepcopy(fixture)
    case_b = deepcopy(fixture)
    cleanup_log = []

    with pytest.raises(RuntimeError):
        try:
            case_a["request"]["businessStatus"] = 720
            raise RuntimeError("模拟接口调用失败")
        finally:
            cleanup_log.append("client.close")

    assert case_b["request"]["businessStatus"] == 710
    assert cleanup_log == ["client.close"]`,
  3: `from importlib import import_module

import pytest


def resolve_callable(ref: str):
    module_name, function_name = ref.split(":", 1)
    module = import_module(module_name)
    handler = getattr(module, function_name)
    if not callable(handler):
        raise TypeError(f"{ref} 不可调用")
    return handler


def test_resolve_real_function():
    assert resolve_callable("math:sqrt")(9) == 3


def test_missing_module():
    with pytest.raises(ModuleNotFoundError):
        resolve_callable("missing_package:run")


def test_missing_function():
    with pytest.raises(AttributeError):
        resolve_callable("math:missing_function")


def test_rejects_non_callable_attribute():
    with pytest.raises(TypeError):
        resolve_callable("math:pi")`,
  4: `from dataclasses import dataclass, field
from typing import Any


@dataclass
class ActionResult:
    success: bool
    request: dict[str, Any] | None = None
    response: dict[str, Any] | None = None
    outputs: dict[str, Any] = field(default_factory=dict)
    side_effects: list[str] = field(default_factory=list)


def adjust_stock_action(sku_id: str, adjust_amount: int) -> ActionResult:
    request = {"skuId": sku_id, "adjustAmount": adjust_amount}
    response = {
        "success": True,
        "data": {"flowNo": "FLOW-001", "remainingStock": 90},
    }
    return ActionResult(
        success=response["success"],
        request=request,
        response=response,
        outputs={
            "flow_no": response["data"]["flowNo"],
            "remaining_stock": response["data"]["remainingStock"],
        },
        side_effects=[
            f"库存发生变化：sku={sku_id}，adjustAmount={adjust_amount}"
        ],
    )


result = adjust_stock_action("SKU-001", -10)
assert result.success is True
assert result.outputs["flow_no"] == "FLOW-001"`,
  5: `import pytest


class FakeHttpClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.closed = False

    def close(self):
        self.closed = True


@pytest.fixture
def api_client():
    client = FakeHttpClient(base_url="https://example.test")
    yield client
    client.close()


@pytest.mark.parametrize("status", [710, 720])
def test_status(api_client, status):
    assert api_client.closed is False
    assert status in (710, 720)`,
  6: `import pytest
from pydantic import BaseModel, ValidationError, model_validator


class FlowEntry(BaseModel):
    action: str | None = None
    request: dict | None = None
    save_as: str | None = None

    @model_validator(mode="after")
    def has_executor(self):
        if not self.action and not self.request:
            raise ValueError("必须声明 action 或 request")
        return self


def test_action_entry_is_valid():
    entry = FlowEntry(action="fixture.resolve", save_as="fixture")
    assert entry.action == "fixture.resolve"


def test_request_entry_is_valid():
    entry = FlowEntry(request={"method": "GET", "url": "/stock"})
    assert entry.request["method"] == "GET"


def test_empty_entry_is_rejected():
    with pytest.raises(ValidationError, match="必须声明 action 或 request"):
        FlowEntry()`,
  7: `def run_entry(entry, adapters, context):
    action_name = entry["action"]
    if action_name not in adapters:
        raise KeyError(f"未绑定 action: {action_name}")

    result = adapters[action_name](entry, context)
    if entry.get("save_as"):
        context[entry["save_as"]] = result
    return result


def resolve_fixture(entry, context):
    return {"skuId": "SKU-001", "available": 100}


def build_request(entry, context):
    fixture = context["resolved_fixture"]
    return {"skuId": fixture["skuId"], "adjustAmount": -10}


adapters = {
    "fixture.resolve": resolve_fixture,
    "request.build": build_request,
}
context = {}

run_entry(
    {"action": "fixture.resolve", "save_as": "resolved_fixture"},
    adapters,
    context,
)
request = run_entry(
    {"action": "request.build", "save_as": "request"},
    adapters,
    context,
)

assert request == {"skuId": "SKU-001", "adjustAmount": -10}
assert context["request"] == request`,
  8: `import json

import httpx


def handler(request: httpx.Request):
    assert request.url.path == "/stock/adjust"
    payload = json.loads(request.content)
    amount = payload["adjustAmount"]

    if amount == 500:
        return httpx.Response(500, json={"message": "server error"})
    if amount > 100:
        return httpx.Response(200, json={
            "success": False,
            "code": "A4500",
            "msg": "库存不足",
        })
    return httpx.Response(200, json={
        "success": True,
        "data": {"flowNo": "FLOW-001"},
    })


transport = httpx.MockTransport(handler)
with httpx.Client(transport=transport, timeout=2.0) as client:
    success = client.post(
        "https://example.test/stock/adjust",
        json={"adjustAmount": 10},
    )
    http_error = client.post(
        "https://example.test/stock/adjust",
        json={"adjustAmount": 500},
    )
    business_error = client.post(
        "https://example.test/stock/adjust",
        json={"adjustAmount": 101},
    )

assert success.status_code == 200
assert success.json()["success"] is True
assert http_error.status_code == 500
assert business_error.status_code == 200
assert business_error.json()["success"] is False`,
  9: `# [Provider]
def query_rows(connection, sql, params):
    """只负责连接、参数化 SQL 和返回结果；不理解售后规则。"""
    return connection.execute(sql, params).fetchall()


# [Shared Action]
def capture_inventory_snapshot(provider, sku_id):
    """多个需求都会复用的稳定动作：按 sku_id 获取库存快照。"""
    return provider.query_inventory(sku_id)


# [Requirement]
def select_legal_after_sale_sku(rows, constraints):
    """当前售后需求特有：根据库存、占用和风险约束选择 SKU。"""
    candidates = [
        row for row in rows
        if row["available"] >= constraints["minimum_available"]
        and row["locked"] is False
    ]
    if not candidates:
        raise LookupError("没有满足本售后场景约束的 SKU")
    return candidates[0]


# 依赖方向：Requirement -> Shared Action -> Provider
# Provider 不应导入或调用 select_legal_after_sale_sku，
# 因为“选哪个 SKU”是会随需求变化的业务决策。`,
  10: `# requirement_cases.yaml
name: boss_01_after_sale
common_flow:
  setup:
    - action: fixture.resolve
      save_as: resolved_fixture
    - action: inventory.snapshot
      source: resolved_fixture
      save_as: before_snapshot
  steps:
    - action: after_sale.notify
      request:
        skuId: "{{ resolved_fixture.skuId }}"
        adjustAmount: -10
      save_as: processing_result
  assertions:
    - source: processing_result.response
      path: success
      equals: true
    - source: processing_result.response
      path: data.flowNo
      exists: true
  teardown:
    always:
      - action: fixture.restore
        source: before_snapshot

# adapters.py
# 每个 action 都返回 ActionResult：
# request/response 保存调用证据，outputs 给后续步骤使用，
# side_effects 记录库存变化和恢复动作。

# tests/test_boss_mock.py 至少验证：
# 1. YAML 通过 FlowEntry schema 校验；
# 2. 所有 action ref 都能导入；
# 3. pytest --collect-only 不访问网络；
# 4. MockTransport 成功路径保存 flowNo；
# 5. MockTransport 失败路径保留主异常和已完成步骤；
# 6. 成功和失败两条路径都执行 fixture.restore。`,
};
