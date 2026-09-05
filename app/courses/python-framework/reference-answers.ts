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
assert result.outputs["flow_no"] == "FLOW-001"

first = ActionResult(success=True)
second = ActionResult(success=True)
first.outputs["flow_no"] = "ONLY-FIRST"
first.side_effects.append("ONLY-FIRST")
assert second.outputs == {}
assert second.side_effects == []`,
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
    assert client.closed is True


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
    assert request.method == "POST"
    assert request.url.path == "/stock/adjust"
    assert request.headers["content-type"].startswith("application/json")
    payload = json.loads(request.content)
    assert payload["skuId"] == "SKU-001"
    amount = payload["adjustAmount"]

    if amount == 500:
        return httpx.Response(500, json={
            "success": False,
            "code": "SYSTEM_ERROR",
            "message": "server error",
        })
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
        json={"skuId": "SKU-001", "adjustAmount": 10},
    )
    http_error = client.post(
        "https://example.test/stock/adjust",
        json={"skuId": "SKU-001", "adjustAmount": 500},
    )
    business_error = client.post(
        "https://example.test/stock/adjust",
        json={"skuId": "SKU-001", "adjustAmount": 101},
    )

assert success.status_code == 200
assert success.json()["success"] is True
assert success.json()["data"]["flowNo"] == "FLOW-001"
assert http_error.status_code == 500
assert http_error.json()["code"] == "SYSTEM_ERROR"
assert business_error.status_code == 200
assert business_error.json()["success"] is False
assert business_error.json()["code"] == "A4500"`,
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
# 因为“选哪个 SKU”是会随需求变化的业务决策。


class FakeProvider:
    def query_inventory(self, sku_id):
        assert sku_id == "SKU-001"
        return [
            {"skuId": sku_id, "available": 80, "locked": False},
            {"skuId": sku_id, "available": 120, "locked": False},
        ]


rows = capture_inventory_snapshot(FakeProvider(), "SKU-001")
selected = select_legal_after_sale_sku(rows, {"minimum_available": 100})
assert selected["available"] == 120
assert selected["locked"] is False`,
  10: `# ===== requirements/BOSS_01/requirement_cases.yaml =====
name: boss_01_after_sale
common_flow:
  setup:
    - action: fixture.resolve
      save_as: resolved_fixture
    - action: inventory.snapshot
      source: resolved_fixture
      save_as: before_snapshot
  steps:
    - action: request.build
      source: resolved_fixture
      adjust_amount: -10
      save_as: request
    - action: stock.adjust
      source: request
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

# ===== requirements/BOSS_01/adapters.py =====
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ActionResult:
    success: bool
    request: dict[str, Any] | None = None
    response: dict[str, Any] | None = None
    outputs: dict[str, Any] = field(default_factory=dict)
    side_effects: list[str] = field(default_factory=list)
    error: str | None = None


def resolve_fixture(entry, context):
    return ActionResult(
        success=True,
        outputs={"skuId": "SKU-001", "available": 100},
    )


def inventory_snapshot(entry, context):
    fixture = context[entry["source"]].outputs
    return ActionResult(success=True, outputs=dict(fixture))


def build_request(entry, context):
    fixture = context[entry["source"]].outputs
    request = {
        "skuId": fixture["skuId"],
        "adjustAmount": entry["adjust_amount"],
    }
    return ActionResult(success=True, request=request, outputs=request)


def adjust_stock(entry, context):
    payload = context[entry["source"]].outputs
    response = context["client"].post(
        "https://example.test/stock/adjust",
        json=payload,
    )
    body = response.json()
    success = response.status_code < 400 and body.get("success") is True
    return ActionResult(
        success=success,
        request=payload,
        response=body,
        outputs={"flowNo": body.get("data", {}).get("flowNo")},
        side_effects=["inventory adjusted"] if success else [],
        error=None if success else body.get("code", "stock adjust failed"),
    )


def restore_fixture(entry, context):
    snapshot = context[entry["source"]].outputs
    return ActionResult(
        success=True,
        outputs={"restored": snapshot},
        side_effects=["inventory restored"],
    )


ADAPTERS = {
    "fixture.resolve": resolve_fixture,
    "inventory.snapshot": inventory_snapshot,
    "request.build": build_request,
    "stock.adjust": adjust_stock,
    "fixture.restore": restore_fixture,
}

# ===== framework/runner.py =====
from requirements.BOSS_01.adapters import ActionResult


def read_path(value, path):
    current = value
    for part in path.split("."):
        current = current[part] if isinstance(current, dict) else getattr(current, part)
    return current


def validate_flow(flow, adapters):
    for section in ("setup", "steps", "assertions", "teardown"):
        if section not in flow:
            raise ValueError(f"缺少生命周期区段: {section}")
    if "always" not in flow["teardown"]:
        raise ValueError("teardown 缺少 always")

    executable = flow["setup"] + flow["steps"] + flow["teardown"]["always"]
    for entry in executable:
        action_name = entry.get("action")
        if not action_name:
            raise ValueError("步骤缺少 action")
        if action_name not in adapters:
            raise KeyError(f"未绑定 action: {action_name}")


def run_entry(entry, adapters, context):
    result = adapters[entry["action"]](entry, context)
    if not isinstance(result, ActionResult):
        raise TypeError("action 必须返回 ActionResult")
    if entry.get("save_as"):
        context[entry["save_as"]] = result
    return result


def run_flow(flow, adapters, context, case_id):
    validate_flow(flow, adapters)
    evidence = {
        "case_id": case_id,
        "success": False,
        "request": None,
        "response": None,
        "outputs": {},
        "side_effects": [],
        "error": None,
        "teardown": [],
    }

    try:
        for section in ("setup", "steps"):
            for entry in flow[section]:
                result = run_entry(entry, adapters, context)
                evidence["side_effects"].extend(result.side_effects)

        for rule in flow["assertions"]:
            source = read_path(context, rule["source"])
            actual = read_path(source, rule["path"])
            if "equals" in rule and actual != rule["equals"]:
                raise AssertionError(
                    f"{rule['source']}.{rule['path']} expected "
                    f"{rule['equals']!r}, got {actual!r}"
                )
            if rule.get("exists") is True and actual is None:
                raise AssertionError(f"{rule['source']}.{rule['path']} 不存在")
        evidence["success"] = True
    except Exception as error:
        evidence["error"] = f"{type(error).__name__}: {error}"
    finally:
        action_result = context.get("processing_result")
        if action_result:
            evidence["request"] = action_result.request
            evidence["response"] = action_result.response
            evidence["outputs"] = action_result.outputs
        for entry in flow["teardown"]["always"]:
            try:
                result = run_entry(entry, adapters, context)
                evidence["teardown"].append({
                    "action": entry["action"],
                    "success": result.success,
                })
                evidence["side_effects"].extend(result.side_effects)
            except Exception as teardown_error:
                evidence["teardown"].append({
                    "action": entry.get("action"),
                    "success": False,
                    "error": str(teardown_error),
                })
    return evidence

# ===== tests/test_boss_mock.py =====
from copy import deepcopy
import json
from pathlib import Path

import httpx
import pytest
import yaml

from framework.runner import run_flow, validate_flow
from requirements.BOSS_01.adapters import ADAPTERS


FLOW = yaml.safe_load(
    Path("requirements/BOSS_01/requirement_cases.yaml").read_text()
)["common_flow"]


def handler(request: httpx.Request):
    assert request.method == "POST"
    assert request.url.path == "/stock/adjust"
    payload = json.loads(request.content)
    assert payload["skuId"] == "SKU-001"
    if payload["adjustAmount"] == 500:
        return httpx.Response(500, json={"success": False, "code": "SYSTEM_ERROR"})
    return httpx.Response(
        200,
        json={"success": True, "data": {"flowNo": "FLOW-001"}},
    )


@pytest.mark.parametrize(
    ("adjust_amount", "expected_success"),
    [(-10, True), (500, False)],
)
def test_boss_flow_success_and_failure(adjust_amount, expected_success):
    flow = deepcopy(FLOW)
    flow["steps"][0]["adjust_amount"] = adjust_amount
    validate_flow(flow, ADAPTERS)

    transport = httpx.MockTransport(handler)
    with httpx.Client(transport=transport, timeout=2.0) as client:
        evidence = run_flow(
            flow,
            ADAPTERS,
            {"client": client},
            "boss_01_after_sale",
        )

    assert evidence["success"] is expected_success
    assert evidence["teardown"] == [
        {"action": "fixture.restore", "success": True}
    ]
    if expected_success:
        assert evidence["outputs"]["flowNo"] == "FLOW-001"
        assert evidence["error"] is None
    else:
        assert evidence["response"]["code"] == "SYSTEM_ERROR"
        assert evidence["error"] is not None

# ===== evidence/boss_01_after_sale.json =====
{
  "case_id": "boss_01_after_sale",
  "success": true,
  "request": {"skuId": "SKU-001", "adjustAmount": -10},
  "response": {"success": true, "data": {"flowNo": "FLOW-001"}},
  "outputs": {"flowNo": "FLOW-001"},
  "side_effects": ["inventory adjusted", "inventory restored"],
  "error": null,
  "teardown": [{"action": "fixture.restore", "success": true}]
}`,
};
