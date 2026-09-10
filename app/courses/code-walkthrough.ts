/** Anchors are source fragments, not line numbers, so inserting blank lines is safe. */
export const walkthroughAnchors: Record<string, string[][]> = {
  'python-agent-fast-track': [
    ['first_id =', 'open_ids =', 'all_tags ='],
    ['raw =', 'cleaned =', 'ticket_id, summary'],
    ['tickets =', 'for ticket in', 'f"{ticket'],
    ['original =', 'isolated =', 'isolated[', 'print(original[', 'print(isolated[', 'print(original is'],
    ['def find_ticket', '    *,', 'return ticket'],
    ['class TicketNotFoundError', 'raise TicketNotFoundError', 'try:'],
    ['@dataclass', 'self.repository =', 'data = self.repository'],
    ['import os', '"api_url":', '"api_key":'],
    ['def load_tickets', 'with path.open', 'if not isinstance'],
    ['def fetch_ticket', 'response.raise_for_status', 'if not payload.get'],
    ['class TicketQuery', 'query =', 'print(query'],
    ['class TicketState', 'logs: Annotated', 'return {"logs"'],
    ['async def fetch', 'results = await', 'asyncio.run'],
    ['TICKETS =', '@tool', 'print(get_ticket.invoke'],
    ['class State', 'def load_ticket', 'def route'],
    ['TICKETS =', 'state =', 'if state['],
  ],
  'ai-developer-level5': [
    ['def find_records', 'result =', 'for record', 'if record.get', 'result.append', 'return result'],
    ['seen =', 'for row', 'clean.append', 'if key not in'],
    ['def lookup', 'if not device_id', 'if device_id not in', 'return {"status": 200'],
    ['if not isinstance', 'allowed =', 'return value', 'return value'],
    ['def prepare_context', 'if not documents', 'return {"question"', 'def prepare_context'],
    ['def submit_if_confirmed', 'if not confirmed', 'return {"status"', 'return submit'],
    ['if not results', 'successes =', 'return {"count": len', 'def summarize'],
    ['train_ids =', 'leaked =', 'assert not leaked', 'train_ids ='],
    ['return 0 <', 'def can_schedule', 'def can_schedule', 'assert can_schedule'],
  ],
  'python-framework-example': [
    ['response =', '"data":', '"flowNo":', '"flowNo":'],
    ['case_a =', 'case_b =', 'print(case_b'],
    ['ewms.stock.adapters  ->', 'resolve_fixture      ->', 'ewms.stock.adapters:'],
    ['def query', 'class DatabaseProvider', 'class DatabaseProvider'],
    ['yield client', 'client.close', 'client =', 'client ='],
    ['steps:', '- name:', '# 语法正确'],
    ['action:', 'save_as:', 'context['],
    ['POST ', 'POST ', '分支规则', '101 ->'],
    ['Provider:', 'resolve:', 'resolve:'],
    ['1. requirement', '3. collect-only', '5. 成功'],
  ],
  'python-framework': [
    ['current = data', 'def get_by_path', 'if not isinstance'],
    ['body =', 'body =', 'finally:'],
    ['from importlib', 'module =', 'module_name,'],
    ['from typing', 'class DatabaseProvider', '@dataclass'],
    ['@pytest.fixture', 'yield client', '@pytest.mark'],
    ['class FlowEntry', '@model_validator', 'if not self.action'],
    ['def call_handler', 'params =', 'kwargs["context"]'],
    ['return httpx.Response', 'def handler', 'transport ='],
    ['class DatabaseProvider', 'def resolve_after_sale_fixture', '# 基础设施'],
    ['common_flow:', 'save_as: processing_result', 'teardown:'],
  ],
};

export function codeWithComments(code: string, notes: string[], anchors: string[]): string {
  const lines = code.split('\n');
  const comments = new Map<number, string[]>();
  notes.forEach((note, index) => {
    const anchor = anchors[index];
    const found = anchor ? lines.findIndex((line) => line.includes(anchor)) : -1;
    // Preserve user-edited notes even if a later source edit removes an anchor.
    const at = found < 0 ? 0 : found;
    const indent = lines[at].match(/^\s*/)?.[0] ?? '';
    const block = note.split(/\r?\n/).map((text) => `${indent}# ${text}`);
    comments.set(at, [...(comments.get(at) ?? []), ...block]);
  });
  return lines.flatMap((line, index) => [...(comments.get(index) ?? []), line]).join('\n');
}
