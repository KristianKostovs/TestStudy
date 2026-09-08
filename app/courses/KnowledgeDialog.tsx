"use client";
import { useEffect, useRef } from "react";

export type KnowledgePoint = { term: string; plain: string; role: string; example?: string };

export default function KnowledgeDialog({ knowledge, onClose }: { knowledge: KnowledgePoint; onClose: () => void }) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") close.current();
      if (event.key === "Tab") {
        const buttons = panel.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons?.length) return;
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) { event.preventDefault(); buttons[0].focus(); }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, []);
  return <div className="knowledge-overlay" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panel} className="knowledge-modal" role="dialog" aria-modal="true" aria-labelledby="knowledge-title">
      <button className="knowledge-close" type="button" aria-label="关闭基础知识弹窗" onClick={onClose}>×</button>
      <span className="knowledge-kicker">基础知识 · 随点随查</span><h2 id="knowledge-title">{knowledge.term}</h2>
      <div className="knowledge-answer"><b>先用一句话理解</b><p>{knowledge.plain}</p></div>
      <div className="knowledge-answer role-answer"><b>它在当前代码里做什么</b><p>{knowledge.role}</p></div>
      {knowledge.example && <div className="knowledge-example"><b>最小例子</b><pre><code>{knowledge.example}</code></pre></div>}
      <button className="knowledge-return" type="button" onClick={onClose}>我明白了，返回本关</button><small>也可以点击弹窗外部或按 Esc 关闭</small>
    </section>
  </div>;
}
