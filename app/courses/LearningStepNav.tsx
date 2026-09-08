"use client";

export const learningStepLabels = ["先认词", "看数据", "逐行理解", "动手练", "自动小测"];

export default function LearningStepNav({ active, unlocked, onSelect }: { active: number; unlocked: number; onSelect: (step: number) => void }) {
  return <ol className="stage-tabs" aria-label="本关学习步骤">{learningStepLabels.map((label, index) => {
    const step = index + 1;
    return <li key={label}><button type="button" disabled={step > unlocked} aria-current={active === step ? "step" : undefined} className={`${active === step ? "active" : ""} ${step < unlocked ? "finished" : ""}`} onClick={() => onSelect(step)}><b>{step}</b><span>{label}</span>{step > unlocked && <i>锁</i>}</button></li>;
  })}</ol>;
}
