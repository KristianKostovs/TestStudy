"use client";

import { useEffect, useRef, useState } from "react";
import { autocompletion, type Completion, type CompletionContext } from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { indentUnit, syntaxTree } from "@codemirror/language";
import { type Diagnostic, linter, lintGutter } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { basicSetup } from "codemirror";

type Problem = {
  line: number;
  message: string;
  severity: "error" | "warning";
};

type PythonAnswerEditorProps = {
  levelId: number;
  value: string;
  starter: string;
  onChange: (value: string) => void;
};

const pythonKeywords = new Set([
  "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del",
  "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import",
  "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True",
  "try", "while", "with", "yield",
]);

const pythonBuiltins = new Set([
  "abs", "all", "any", "bool", "callable", "dict", "enumerate", "filter", "float", "getattr",
  "hasattr", "int", "isinstance", "len", "list", "map", "max", "min", "next", "object", "open",
  "print", "range", "repr", "reversed", "round", "set", "setattr", "sorted", "str", "sum", "super",
  "tuple", "type", "zip", "Exception", "KeyError", "RuntimeError", "TypeError", "ValueError",
]);

const courseProvidedNames = new Set([
  "action", "body", "case", "client", "context", "entry", "handler", "request", "response", "result",
  "runtime", "status",
]);

const completionOptions: Completion[] = [
  ...Array.from(pythonKeywords, (label) => ({ label, type: "keyword" })),
  ...Array.from(pythonBuiltins, (label) => ({ label, type: "function" })),
  { label: "def", type: "keyword", apply: "def function_name():\n    pass", detail: "函数模板" },
  { label: "for", type: "keyword", apply: "for item in items:\n    pass", detail: "循环模板" },
  { label: "if", type: "keyword", apply: "if condition:\n    pass", detail: "条件模板" },
  { label: "try", type: "keyword", apply: "try:\n    pass\nexcept Exception as error:\n    raise", detail: "异常处理模板" },
];

function stripStringsAndComments(line: string) {
  return line
    .replace(/(?:[rubf]{0,2})(["'])(?:\\.|(?!\1).)*\1/gi, (match) => " ".repeat(match.length))
    .replace(/#.*/, "");
}

function levenshtein(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, (_, row) => {
    const values = Array(right.length + 1).fill(0) as number[];
    values[0] = row;
    return values;
  });
  for (let column = 0; column <= right.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
  }
  return rows[left.length][right.length];
}

function collectDeclaredNames(source: string) {
  const declared = new Set([...pythonBuiltins, ...courseProvidedNames]);
  for (const rawLine of source.split("\n")) {
    const line = stripStringsAndComments(rawLine);
    const functionMatch = line.match(/^\s*def\s+([A-Za-z_]\w*)\s*\(([^)]*)/);
    if (functionMatch) {
      declared.add(functionMatch[1]);
      for (const parameter of functionMatch[2].split(",")) {
        const name = parameter.trim().replace(/^\*{1,2}/, "").split(/[:=]/)[0]?.trim();
        if (name) declared.add(name);
      }
    }
    const classMatch = line.match(/^\s*class\s+([A-Za-z_]\w*)/);
    if (classMatch) declared.add(classMatch[1]);
    const assignmentMatch = line.match(/^\s*([A-Za-z_]\w*)\s*(?::[^=]+)?=/);
    if (assignmentMatch) declared.add(assignmentMatch[1]);
    const forMatch = line.match(/\bfor\s+([A-Za-z_]\w*)\s+in\b/);
    if (forMatch) declared.add(forMatch[1]);
    const aliasMatches = line.matchAll(/\b(?:import|as)\s+([A-Za-z_]\w*)/g);
    for (const match of aliasMatches) declared.add(match[1]);
    const importedNames = line.match(/^\s*from\s+[\w.]+\s+import\s+(.+)/)?.[1];
    if (importedNames) {
      for (const name of importedNames.split(",")) declared.add(name.trim().split(/\s+as\s+/).at(-1) ?? "");
    }
  }
  return declared;
}

function closestDeclaredName(name: string, declared: Set<string>) {
  let closest = "";
  let distance = 3;
  for (const candidate of declared) {
    if (candidate.length < 3 || Math.abs(candidate.length - name.length) > 2) continue;
    const candidateDistance = levenshtein(name, candidate);
    if (candidateDistance < distance) {
      closest = candidate;
      distance = candidateDistance;
    }
  }
  return closest;
}

function collectPythonDiagnostics(state: EditorState): Diagnostic[] {
  const source = state.doc.toString();
  if (!source.trim()) return [];
  const diagnostics: Diagnostic[] = [];
  const seenRanges = new Set<string>();

  syntaxTree(state).iterate({
    enter(node) {
      if (!node.type.isError) return;
      const from = Math.min(node.from, Math.max(0, state.doc.length - 1));
      const to = Math.min(state.doc.length, Math.max(from + 1, node.to));
      const key = `${from}:${to}:syntax`;
      if (seenRanges.has(key)) return;
      seenRanges.add(key);
      diagnostics.push({ from, to, severity: "error", source: "Python 语法", message: "这里的 Python 结构不完整，请检查括号、冒号或缩进。" });
    },
  });

  let previousMeaningful: { indent: number; text: string } | null = null;
  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    const text = line.text;
    if (!text.trim() || text.trimStart().startsWith("#")) continue;
    const leading = text.match(/^[\t ]*/)?.[0] ?? "";
    const indent = leading.replace(/\t/g, "    ").length;
    if (leading.includes("\t")) {
      diagnostics.push({ from: line.from, to: line.from + leading.length, severity: "warning", source: "缩进", message: "这里使用了 Tab。Python 建议统一使用 4 个空格。" });
    }
    if (indent % 4 !== 0) {
      diagnostics.push({ from: line.from, to: line.from + Math.max(1, leading.length), severity: "error", source: "缩进", message: `当前是 ${indent} 个空格，请改为 4 的倍数。` });
    }
    if (previousMeaningful?.text.trimEnd().endsWith(":") && indent <= previousMeaningful.indent) {
      diagnostics.push({ from: line.from, to: line.to, severity: "error", source: "缩进", message: "上一行以冒号结尾，这一行必须再缩进 4 个空格。" });
    }
    previousMeaningful = { indent, text };
  }

  const declared = collectDeclaredNames(source);
  const warnedNames = new Set<string>();
  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    const cleanLine = stripStringsAndComments(line.text);
    for (const match of cleanLine.matchAll(/[A-Za-z_]\w*/g)) {
      const name = match[0];
      const index = match.index ?? 0;
      const previousCharacter = cleanLine[index - 1];
      if (pythonKeywords.has(name) || declared.has(name) || previousCharacter === "." || /^[A-Z]/.test(name) || warnedNames.has(name)) continue;
      const suggestion = closestDeclaredName(name, declared);
      if (!suggestion) continue;
      warnedNames.add(name);
      diagnostics.push({
        from: line.from + index,
        to: line.from + index + name.length,
        severity: "warning",
        source: "名称检查",
        message: `找不到名为 ${name} 的定义。你是不是想写 ${suggestion}？`,
      });
    }
  }
  return diagnostics;
}

function pythonCompletions(context: CompletionContext) {
  const word = context.matchBefore(/[A-Za-z_]\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  const declared = collectDeclaredNames(context.state.doc.toString());
  const dynamicOptions = Array.from(declared)
    .filter((label) => !pythonBuiltins.has(label) && !courseProvidedNames.has(label))
    .map((label) => ({ label, type: "variable" }));
  return { from: word.from, options: [...dynamicOptions, ...completionOptions] };
}

export default function PythonAnswerEditor({ levelId, value, starter, onChange }: PythonAnswerEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [problems, setProblems] = useState<Problem[]>([]);
  const valueRef = useRef(value);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    if (!hostRef.current) return;
    let mounted = true;
    const inspection = linter((view) => {
      const diagnostics = collectPythonDiagnostics(view.state);
      const nextProblems = diagnostics.slice(0, 6).map((diagnostic) => ({
        line: view.state.doc.lineAt(diagnostic.from).number,
        message: diagnostic.message,
        severity: diagnostic.severity === "error" ? "error" as const : "warning" as const,
      }));
      window.setTimeout(() => { if (mounted) setProblems(nextProblems); }, 0);
      return diagnostics;
    }, { delay: 300 });

    const view = new EditorView({
      parent: hostRef.current,
      doc: valueRef.current,
      extensions: [
        basicSetup,
        python(),
        oneDark,
        indentUnit.of("    "),
        keymap.of([indentWithTab]),
        autocompletion({ override: [pythonCompletions], activateOnTyping: true }),
        inspection,
        lintGutter(),
        placeholder(starter),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          if (update.docChanged || update.selectionSet) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            setCursor({ line: line.number, column: head - line.from + 1 });
          }
        }),
        EditorView.theme({
          "&": { minHeight: "360px", backgroundColor: "#10231b" },
          ".cm-scroller": { minHeight: "360px", fontFamily: "var(--font-geist-mono), ui-monospace, monospace", fontSize: "13px", lineHeight: "1.75" },
          ".cm-content": { padding: "16px 0 30px" },
          ".cm-gutters": { backgroundColor: "#0d1d17", color: "#647a70", borderRight: "1px solid #294137" },
          ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "rgba(73, 186, 144, .08)" },
          ".cm-cursor": { borderLeftColor: "#67dab2" },
          ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "rgba(78, 166, 133, .28)" },
          ".cm-tooltip": { border: "1px solid #49665a", backgroundColor: "#172720", color: "#e5eee8" },
          ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "#236c56", color: "white" },
        }),
      ],
    });
    viewRef.current = view;
    return () => {
      mounted = false;
      view.destroy();
      viewRef.current = null;
    };
  }, [levelId, starter]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  function loadStarter() {
    const view = viewRef.current;
    if (!view || view.state.doc.length > 0) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: starter },
      selection: { anchor: starter.length },
      scrollIntoView: true,
    });
    view.focus();
  }

  return (
    <section className="task-answer-editor" aria-label="Python IDE 答案编辑器">
      <div className="editor-heading">
        <span>在 IDE 学习模式中完成你的答案</span>
        <i>语法高亮 · 自动缩进 · 代码补全 · 实时检查</i>
      </div>
      <div className="code-editor-shell ide-editor-shell">
        <header className="code-editor-toolbar">
          <div className="editor-window-dots" aria-hidden="true"><i /><i /><i /></div>
          <div className="editor-file-tab"><b>PY</b><span>{`level_${String(levelId).padStart(2, "0")}.py`}</span></div>
          <button type="button" disabled={Boolean(value.trim())} onClick={loadStarter}>{value.trim() ? "草稿已自动保存" : "载入起步代码"}</button>
        </header>
        <div className="codemirror-host" ref={hostRef} />
        <footer className="code-editor-statusbar">
          <span>Ln {cursor.line}, Col {cursor.column}</span>
          <span>Spaces: 4</span><span>UTF-8</span><span>Python</span>
          <strong className={problems.length ? "has-problems" : ""}>{problems.length ? `${problems.length} 个问题` : "检查通过"}</strong>
        </footer>
      </div>
      <section className={`editor-problems ${problems.length ? "has-problems" : "clean"}`} aria-live="polite">
        <header><b>问题</b><span>{value.trim() ? (problems.length ? `发现 ${problems.length} 处需要注意` : "未发现明显的语法、缩进或名称问题") : "开始输入后会自动检查"}</span></header>
        {problems.length > 0 && <ul>{problems.map((problem, index) => (
          <li className={problem.severity} key={`${problem.line}-${problem.message}-${index}`}><i>{problem.severity === "error" ? "×" : "!"}</i><span><b>第 {problem.line} 行</b>{problem.message}</span></li>
        ))}</ul>}
      </section>
      <small>按 Ctrl/⌘ + Space 主动唤起补全；按 F8 跳到下一个问题；这里先做语法和初级名称检查，业务正确性仍由 Codex 对照验收标准判定。</small>
    </section>
  );
}
