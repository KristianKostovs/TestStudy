"use client";

import { useEffect, useRef, useState } from "react";
import { indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";

type BlueprintPracticeEditorProps = {
  courseId: string;
  levelId: number;
  starter: string;
  files: string[];
};

function draftKey(courseId: string, levelId: number) {
  return `learning-blueprint-draft-v1:${courseId}:${levelId}`;
}

export default function BlueprintPracticeEditor({ courseId, levelId, starter, files }: BlueprintPracticeEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [saveState, setSaveState] = useState("框架代码已载入");
  const [changed, setChanged] = useState(false);
  const storageKey = draftKey(courseId, levelId);

  useEffect(() => {
    if (!hostRef.current) return;
    const savedDraft = window.localStorage.getItem(storageKey);
    const initialDraft = savedDraft ?? starter;
    setChanged(initialDraft !== starter);

    const languageSupport = files.some((file) => file.endsWith(".py")) ? python() : [];
    const view = new EditorView({
      parent: hostRef.current,
      doc: initialDraft,
      extensions: [
        basicSetup,
        languageSupport,
        oneDark,
        keymap.of([indentWithTab]),
        EditorState.tabSize.of(4),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const nextDraft = update.state.doc.toString();
          window.localStorage.setItem(storageKey, nextDraft);
          setChanged(nextDraft !== starter);
          setSaveState("当前浏览器已自动保存");
        }),
        EditorView.theme({
          "&": { minHeight: "330px", backgroundColor: "#10231b" },
          ".cm-scroller": {
            minHeight: "330px",
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: "13px",
            lineHeight: "1.75",
          },
          ".cm-content": { padding: "15px 0 28px" },
          ".cm-gutters": { backgroundColor: "#0d1d17", color: "#71837a", borderRight: "1px solid #294137" },
          ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "rgba(73, 186, 144, .08)" },
          ".cm-cursor": { borderLeftColor: "#67dab2" },
          ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "rgba(78, 166, 133, .28)" },
        }),
      ],
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [files, starter, storageKey]);

  function restoreStarter() {
    if (changed && !window.confirm("恢复后会覆盖这一关在当前浏览器里的草稿，确认继续吗？")) return;
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: starter },
      selection: { anchor: starter.length },
    });
    window.localStorage.removeItem(storageKey);
    setChanged(false);
    setSaveState("已恢复默认框架");
    view.focus();
  }

  return (
    <div className="blueprint-editor-shell">
      <div className="blueprint-editor-topbar">
        <div className="blueprint-window-dots" aria-hidden="true"><i /><i /><i /></div>
        <strong>IDE 练习区</strong>
        <span>{saveState}</span>
      </div>
      <div className="blueprint-file-tabs" aria-label="本关项目文件">
        {files.map((file, index) => <span className={index === 0 ? "active" : undefined} key={file}>{file}</span>)}
      </div>
      <div ref={hostRef} className="blueprint-code-editor" aria-label={`第 ${levelId} 关代码编辑器`} />
      <div className="blueprint-editor-statusbar">
        <span>{changed ? "已保留你的修改" : "只需完成 TODO（你来完成）"}</span>
        <button type="button" onClick={restoreStarter}>恢复默认框架</button>
      </div>
    </div>
  );
}
