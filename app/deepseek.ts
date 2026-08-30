import { env } from "cloudflare:workers";

export const DEEPSEEK_MODEL = "deepseek-v4-flash";

type DeepSeekResponse = {
  model?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string | null; reasoning_content?: string | null };
    delta?: { content?: string | null; reasoning_content?: string | null };
  }>;
  error?: { message?: string };
};

type JsonRequest = {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  thinking?: boolean;
  reasoningEffort?: "low" | "high" | "max";
};

function cleanProviderMessage(value: unknown) {
  return String(value ?? "")
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[已隐藏]")
    .replace(/Bearer\s+\S+/gi, "Bearer [已隐藏]")
    .trim()
    .slice(0, 300);
}

function parseJsonObject(content: string) {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(normalized) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("DeepSeek 没有返回有效的 JSON 对象");
  }
  return parsed as Record<string, unknown>;
}

function parseDeepSeekEnvelope(rawBody: string): DeepSeekResponse | null {
  const normalized = rawBody.replace(/^\uFEFF/, "").trim();
  if (!normalized) return null;
  try {
    return JSON.parse(normalized) as DeepSeekResponse;
  } catch {
    // DeepSeek 偶尔会把非流式请求包装成 data: 行；将这些片段还原成普通响应。
  }

  const dataLines = normalized.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter((line) => line && line !== "[DONE]");
  if (!dataLines.length) return null;

  let model = DEEPSEEK_MODEL;
  let content = "";
  let reasoningContent = "";
  let finishReason: string | null = null;
  let parsedAny = false;
  for (const line of dataLines) {
    try {
      const chunk = JSON.parse(line) as DeepSeekResponse;
      parsedAny = true;
      model = cleanProviderMessage(chunk.model) || model;
      const choice = chunk.choices?.[0];
      content += choice?.message?.content ?? choice?.delta?.content ?? "";
      reasoningContent += choice?.message?.reasoning_content ?? choice?.delta?.reasoning_content ?? "";
      finishReason = choice?.finish_reason ?? finishReason;
    } catch {
      // 忽略单个损坏片段；只要其他片段完整，仍可恢复最终答案。
    }
  }
  if (!parsedAny) return null;
  return {
    model,
    choices: [{
      finish_reason: finishReason,
      message: { content, reasoning_content: reasoningContent },
    }],
  };
}

type ProviderAttempt = {
  thinking: boolean;
  reasoningEffort: "low" | "high" | "max";
  maxTokens: number;
};

type ProviderAttemptResult = {
  result: DeepSeekResponse | null;
  outputProblem?: string;
};

async function requestDeepSeekAttempt({
  apiKey,
  prompt,
  attempt,
  temperature,
  timeoutMs,
}: {
  apiKey: string;
  prompt: string;
  attempt: ProviderAttempt;
  temperature: number;
  timeoutMs: number;
}): Promise<ProviderAttemptResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [{ role: "user", content: prompt }],
        thinking: { type: attempt.thinking ? "enabled" : "disabled" },
        ...(attempt.thinking ? { reasoning_effort: attempt.reasoningEffort } : { temperature }),
        response_format: { type: "json_object" },
        max_tokens: attempt.maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("DeepSeek 响应超时，请稍后重试");
    }
    throw new Error("无法连接 DeepSeek，请稍后重试");
  } finally {
    clearTimeout(timeout);
  }

  let rawBody = "";
  try {
    rawBody = await response.text();
  } catch {
    if (response.ok) return { result: null, outputProblem: `DeepSeek 返回了无法读取的响应（${response.status}）` };
  }
  const result = parseDeepSeekEnvelope(rawBody);
  if (!response.ok) {
    const detail = cleanProviderMessage(result?.error?.message);
    throw new Error(detail ? `DeepSeek 暂时不可用：${detail}` : `DeepSeek 暂时不可用（${response.status}）`);
  }
  if (!result) {
    return { result: null, outputProblem: `DeepSeek 返回了空或非 JSON 响应（${response.status}）` };
  }
  return { result };
}

export async function requestDeepSeekJson({
  prompt,
  maxTokens = 2_000,
  temperature = 0.2,
  timeoutMs = 90_000,
  thinking = false,
  reasoningEffort = "high",
}: JsonRequest) {
  const runtimeEnv = env as typeof env & { DEEPSEEK_API_KEY?: string };
  const apiKey = runtimeEnv.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DeepSeek 在线服务尚未配置");

  const attempts: ProviderAttempt[] = [{ thinking, reasoningEffort, maxTokens }];
  if (thinking) {
    attempts.push({ thinking: false, reasoningEffort: "low", maxTokens: Math.max(maxTokens, 6_000) });
  }

  let outputProblem = "DeepSeek 没有返回有效内容";
  for (const attempt of attempts) {
    const attemptResult = await requestDeepSeekAttempt({ apiKey, prompt, attempt, temperature, timeoutMs });
    if (!attemptResult.result) {
      outputProblem = attemptResult.outputProblem ?? outputProblem;
      continue;
    }
    const result = attemptResult.result;
    const choice = result.choices?.[0];
    const content = choice?.message?.content?.trim();
    if (!content) {
      outputProblem = choice?.finish_reason === "length"
        ? "DeepSeek 推理耗尽了回答长度"
        : "DeepSeek 没有返回最终答案";
      continue;
    }
    try {
      return { data: parseJsonObject(content), model: cleanProviderMessage(result.model) || DEEPSEEK_MODEL };
    } catch (error) {
      outputProblem = error instanceof Error ? error.message : "DeepSeek 最终答案格式无效";
    }
  }
  throw new Error(`${outputProblem}，自动重试后仍未恢复`);
}
