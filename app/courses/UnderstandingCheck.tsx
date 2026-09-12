"use client";

import { useId, useState } from "react";
import type { ConceptLesson } from "./lesson-format";

export default function UnderstandingCheck({ lesson, onPass, passed = false }: { lesson: ConceptLesson; onPass?: () => void; passed?: boolean }) {
  const groupId = useId();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const allCorrect = lesson.questions.every((q, i) => answers[i] === q.correct);
  return <section className="stage-panel" aria-label="理解检查">
    <h3>理解检查</h3><p>{lesson.goal} 回答下面的问题即可完成本节。</p>
    {lesson.questions.map((q, i) => <fieldset className="ai5-quiz" key={q.question}>
      <legend>{i + 1}. {q.question}</legend>
      {q.options.map((option, index) => <label key={option}><input type="radio" name={`${groupId}-understanding-${i}`} checked={answers[i] === index} onChange={() => { setAnswers((old) => ({ ...old, [i]: index })); setChecked(false); }} />{option}</label>)}
      {checked && <p>{answers[i] === q.correct ? "✓ 正确" : answers[i] === undefined ? "请选择答案" : "再想一想"}：{q.explanation}</p>}
    </fieldset>)}
    <button type="button" className="stage-continue" onClick={() => { setChecked(true); if (allCorrect) onPass?.(); }}>检查理解</button>
    <p role="status">{checked ? (allCorrect ? "理解检查已通过，可以继续下一节。" : "还有问题需要再想一想，可修改后重新检查。") : passed ? "本节理解检查已通过，可随时复习。" : "无需提交代码或本机运行记录。"}</p>
    <details><summary>查看参考答案与解释</summary>{lesson.questions.map((q) => <p key={q.question}><b>{q.question}</b><br />{q.options[q.correct]}。{q.explanation}</p>)}</details>
  </section>;
}
