"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { emptyLearningState, mergeLearningStates, stampLearningState, type LearningSyncState } from "../courses/python-framework/learning-sync";
import { aiCourseId } from "./exercises";

const endpoint = `/api/learning-sync?courseId=${aiCourseId}`;

export function useCourseState() {
  const [state, setState] = useState(emptyLearningState);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("正在读取账号学习记录…");
  const current = useRef(state);
  const revision = useRef(0);
  const dirty = useRef(false);
  const saving = useRef(false);
  const alive = useRef(true);
  const [change, setChange] = useState(0);

  const flush = useCallback(async () => {
    if (saving.current || !dirty.current) return;
    saving.current = true;
    try {
      // A bounded retry handles another tab saving between our read and write.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const snapshot = current.current;
        setMessage("正在保存本课程的答案与进度…");
        const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: aiCourseId, state: snapshot, baseRevision: revision.current }) });
        const result = await response.json();
        if (response.status === 409) {
          revision.current = result.revision;
          current.current = mergeLearningStates(current.current, result.state ?? emptyLearningState());
          if (alive.current) setState(current.current);
          continue;
        }
        if (!response.ok) throw new Error(result.error ?? "保存失败");
        revision.current = result.revision;
        if (current.current === snapshot) {
          dirty.current = false;
          if (alive.current) setMessage("已随账号保存 · 本课程独立记录");
          return;
        }
      }
      if (alive.current) { setMessage("还有更新待保存，请点击重试保存"); setChange((n) => n + 1); }
    } catch (error) {
      if (alive.current) setMessage(`${error instanceof Error ? error.message : "同步失败"}；修改仍在当前页面，请重试保存`);
    } finally { saving.current = false; }
  }, []);

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    fetch(endpoint, { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "读取失败");
      if (cancelled) return;
      current.current = result.state ?? emptyLearningState();
      revision.current = result.revision;
      setState(current.current);
      setMessage("已从账号加载 · 本课程独立记录");
    }).catch((error) => {
      if (!cancelled) setMessage(`${error instanceof Error ? error.message : "读取失败"}；可以阅读，修改后请登录并重试保存`);
    }).finally(() => { if (!cancelled) setReady(true); });
    const preventLoss = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", preventLoss);
    return () => { cancelled = true; alive.current = false; window.removeEventListener("beforeunload", preventLoss); };
  }, []);

  useEffect(() => {
    if (!ready || !dirty.current) return;
    const timer = window.setTimeout(() => void flush(), 700);
    return () => window.clearTimeout(timer);
  }, [change, ready, flush]);

  const update = useCallback((apply: (value: LearningSyncState) => LearningSyncState, keys: string[]) => {
    current.current = stampLearningState(apply(current.current), keys);
    dirty.current = true;
    setState(current.current);
    setMessage("有修改待保存…");
    setChange((n) => n + 1);
  }, []);

  return { state, ready, message, update, flush };
}
