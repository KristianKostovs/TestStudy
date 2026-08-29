import { env } from "cloudflare:workers";

export const DEEPSEEK_MODEL = "deepseek-v4-flash";

type DeepSeekResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

type JsonRequest = {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
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

export async function requestDeepSeekJson({
  prompt,
  maxTokens = 2_000,
  temperature = 0.2,
  timeoutMs = 90_000,
}: JsonRequest) {
  const runtimeEnv = env as typeof env & { DEEPSEEK_API_KEY?: string };
  const apiKey = runtimeEnv.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DeepSeek 在线服务尚未配置");

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
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature,
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

  let result: DeepSeekResponse;
  try {
    result = await response.json() as DeepSeekResponse;
  } catch {
    throw new Error(`DeepSeek 返回了无法解析的响应（${response.status}）`);
  }
  if (!response.ok) {
    const detail = cleanProviderMessage(result.error?.message);
    throw new Error(detail ? `DeepSeek 暂时不可用：${detail}` : `DeepSeek 暂时不可用（${response.status}）`);
  }
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek 没有返回有效内容");
  return { data: parseJsonObject(content), model: cleanProviderMessage(result.model) || DEEPSEEK_MODEL };
}
