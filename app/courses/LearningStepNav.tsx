"use client";

export const learningStepLabels = ["先认词", "看数据", "逐行理解", "动手练", "自动小测"];

export default function LearningStepNav({ active, unlocked, onSelect, steps = [1, 2, 3, 4, 5], labels = learningStepLabels }: { active: number; unlocked: number; onSelect: (step: number) => void; steps?: number[]; labels?: string[] }) {
  return <ol className="stage-tabs" aria-label="本关学习步骤">{steps.map((step, index) => {
    const label = labels[step - 1];
    return <li key={step}><button type="button" disabled={step > unlocked} aria-current={active === step ? "step" : undefined} className={`${active === step ? "active" : ""} ${step < unlocked ? "finished" : ""}`} onClick={() => onSelect(step)}><b>{index + 1}</b><span>{label}</span>{step > unlocked && <i>锁</i>}</button></li>;
  })}</ol>;
}
