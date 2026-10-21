"use client";

import { useEffect, useState } from "react";

const bridgeOrigin = "http://127.0.0.1:4317";

export type WorkspacePracticeConfig = {
  exerciseId: string;
  title: string;
  requirement: string;
};

type VerificationResult = {
  ok: boolean;
  workspacePath: string;
  command: string;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  hint: string;
};

export default function WorkspacePractice({ config, downloadHref }: { config: WorkspacePracticeConfig; downloadHref?: string }) {
  const [bridgeReady, setBridgeReady] = useState<boolean | null>(null);
  const [pending, setPending] = useState<"open" | "run" | null>(null);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    fetch(`${bridgeOrigin}/health`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((health) => setBridgeReady(health.workspaceBridge === true))
      .catch(() => setBridgeReady(false))
      .finally(() => window.clearTimeout(timeout));
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [config.exerciseId]);

  async function invoke(action: "open" | "run") {
    setPending(action); setMessage("");
    if (action === "run") setResult(null);
    try {
      const response = await fetch(`${bridgeOrigin}/workspace/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: config.exerciseId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "本地课程项目操作失败");
      if (action === "open") setMessage(`${payload.message}：${payload.workspacePath}`);
      else setResult(payload as VerificationResult);
      setBridgeReady(true);
    } catch (error) {
      setBridgeReady(false);
      setMessage(error instanceof Error ? error.message : "无法连接本地课程项目");
    } finally {
      setPending(null);
    }
  }

  return <section className="workspace-practice" aria-label="可运行项目技术样板">
    <header><span>可运行项目技术样板</span><strong>{config.title}</strong></header>
    <p>{config.requirement}</p>
    <ol>
      <li>打开课程创建的独立小型仓库，不会覆盖已有练习。</li>
      <li>在 VS Code 中补 TODO、打断点并观察测试失败原因。</li>
      <li>运行固定的 pytest 命令，以退出码和日志作为真实证据。</li>
    </ol>
    <div className="workspace-actions">
      <button type="button" disabled={pending !== null || bridgeReady === false} onClick={() => void invoke("open")}>{pending === "open" ? "正在打开…" : "在 VS Code 中打开"}</button>
      <button type="button" disabled={pending !== null || bridgeReady === false} onClick={() => void invoke("run")}>{pending === "run" ? "正在运行…" : "运行本关验证"}</button>
      {downloadHref && <a href={downloadHref} download>下载 ZIP 备用</a>}
    </div>
    {bridgeReady === null && <p className="workspace-status">正在检查本地课程连接器…</p>}
    {bridgeReady === false && <div className="workspace-offline"><strong>本地课程连接器尚未运行</strong><p>先在 TestStudy 仓库双击“启动本地Codex学习站.command”，再刷新页面。你仍可下载 ZIP 手动打开。</p></div>}
    {message && <p className="workspace-status" role="status">{message}</p>}
    {result && <div className={`workspace-evidence ${result.ok ? "passed" : "failed"}`} role="status">
      <strong>{result.ok ? "✓ 真实测试已通过" : "测试尚未通过"}</strong>
      <p><code>{result.command}</code> · 退出码 {result.exitCode ?? "无"} · {result.durationMs} ms</p>
      <p>{result.hint}</p>
      {(result.stdout || result.stderr) && <pre><code>{[result.stdout, result.stderr].filter(Boolean).join("\n")}</code></pre>}
    </div>}
  </section>;
}
