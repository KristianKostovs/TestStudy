"use client";

import { useEffect, useMemo, useState } from "react";

type Profile = { current_role: string; target_role: string; horizon: string; focus: string };
type Question = { id: number; prompt: string; competency: string; tags: string[]; source_ref: string };
type Diagnosis = { summary: string; strengths: string[]; improvements: string[]; followUp: string };
type Attempt = { id: number; prompt: string; competency: string; answer_text: string; score: number; diagnosis: Diagnosis; weakTags: string[]; created_at: string };
type Score = { competency: string; score: number; evidence_count: number };
type Signal = { id: string; title: string; summary: string; competency: string; source_url: string; source_type: string; observed_at: string };
type PlanItem = { id: number; title: string; competency: string; reason: string; duration_minutes: number; status: "open" | "done" };
type InterviewState = { profile: Profile; questions: Question[]; attempts: Attempt[]; scores: Score[]; signals: Signal[]; plan: PlanItem[] };
type View = "practice" | "wrongbook" | "plan" | "profile";

const viewTitles: Record<View, [string, string]> = {
  practice: ["综合模拟面试", "基于你的岗位画像与历史回答"],
  wrongbook: ["面试错题本", "不只记错题，也保留每次回答与诊断证据"],
  plan: ["个人成长计划", "由薄弱项、岗位要求和技术变化共同生成"],
  profile: ["岗位与发展画像", "这些信息决定题目选择、能力权重和规划方向"],
};

async function requestState(body?: Record<string, unknown>) {
  const response = await fetch("/api/interview", body ? {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  } : undefined);
  const result = await response.json() as InterviewState & { error?: string; latestDiagnosis?: { score: number; diagnosis: Diagnosis; weakTags: string[] } };
  if (!response.ok) throw new Error(result.error ?? "请求失败");
  return result;
}

export default function InterviewCoachClient() {
  const [data, setData] = useState<InterviewState | null>(null);
  const [activeView, setActiveView] = useState<View>("practice");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [latestDiagnosis, setLatestDiagnosis] = useState<{ score: number; diagnosis: Diagnosis; weakTags: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    requestState().then(setData).catch((cause: Error) => setError(cause.message));
  }, []);

  const wrongAnswers = useMemo(() => data?.attempts.filter((attempt) => attempt.score < 75 || attempt.weakTags.length) ?? [], [data]);
  const readiness = useMemo(() => data?.scores.length ? Math.round(data.scores.reduce((sum, item) => sum + Number(item.score), 0) / data.scores.length) : 0, [data]);
  const weakest = data?.scores[0];
  const question = data?.questions[questionIndex % Math.max(data.questions.length, 1)];
  const openPlanCount = data?.plan.filter((item) => item.status === "open").length ?? 0;
  const [title, subtitle] = viewTitles[activeView];

  async function submitAnswer() {
    if (!question || answer.trim().length < 12 || saving) return;
    setSaving(true); setError("");
    try {
      const result = await requestState({ action: "submit_answer", questionId: question.id, answer });
      setData(result); setLatestDiagnosis(result.latestDiagnosis ?? null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "保存失败"); }
    finally { setSaving(false); }
  }

  function nextQuestion() {
    if (!data?.questions.length) return;
    setQuestionIndex((current) => (current + 1) % data.questions.length);
    setAnswer(""); setLatestDiagnosis(null); setError("");
  }

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await requestState({
        action: "update_profile",
        currentRole: form.get("currentRole"), targetRole: form.get("targetRole"),
        horizon: form.get("horizon"), focus: form.get("focus"),
      });
      setData(result); setActiveView("practice");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "保存失败"); }
    finally { setSaving(false); }
  }

  async function completePlan(id: number) {
    setSaving(true);
    try { setData(await requestState({ action: "complete_plan", id })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "更新失败"); }
    finally { setSaving(false); }
  }

  if (!data) return <main className="interview-loading"><div className="coach-avatar">AI</div><strong>{error || "正在加载你的面试档案……"}</strong></main>;

  return (
    <main className="interview-shell">
      <aside className="interview-sidebar">
        <div className="interview-brand"><span>IN</span><div><strong>岗位面试陪练</strong><small>Interview intelligence</small></div></div>
        <button className="new-session" type="button" onClick={() => { setActiveView("practice"); nextQuestion(); }}>＋ 开始新面试</button>
        <nav className="interview-nav" aria-label="面试陪练导航">
          <p>我的面试</p>
          <button className={activeView === "practice" ? "active" : ""} type="button" onClick={() => setActiveView("practice")}><span>◉</span><b>综合模拟面试</b><small>进行中</small></button>
          <button className={activeView === "wrongbook" ? "active" : ""} type="button" onClick={() => setActiveView("wrongbook")}><span>◎</span><b>错题本</b><small>{wrongAnswers.length} 题</small></button>
          <button className={activeView === "plan" ? "active" : ""} type="button" onClick={() => setActiveView("plan")}><span>◇</span><b>成长计划</b><small>{openPlanCount} 项</small></button>
          <p>能力专项</p>
          {data.scores.map((item) => <button key={item.competency} type="button" onClick={() => setActiveView("practice")}><span>⌁</span><b>{item.competency}</b><small>{item.score}%</small></button>)}
        </nav>
        <button className="profile-chip" type="button" onClick={() => setActiveView("profile")}><span>白</span><div><strong>个人岗位画像</strong><small>{data.profile.current_role} → {data.profile.target_role}</small></div></button>
      </aside>

      <section className="interview-main">
        <header className="interview-topbar">
          <div><strong>{title}</strong><span>{subtitle}</span></div>
          <div className="live-source"><i />市场信号已更新 · {data.signals[0]?.observed_at ?? "待更新"}</div>
        </header>

        {activeView === "practice" && question && (
          <>
            <div className="interview-conversation">
              <section className="coach-message">
                <div className="coach-avatar">AI</div>
                <div>
                  <p className="message-label">面试官 · {question.competency}</p>
                  <h1>{question.prompt}</h1>
                  <p>请用真实经历回答，建议按“背景—判断—行动—结果—复盘”组织。回答会被持久保存，并用来更新薄弱项与计划。</p>
                  <div className="question-tags">{question.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
              </section>
              {latestDiagnosis && (
                <section className="answer-message">
                  <div className="user-answer"><p>{answer}</p></div>
                  <div className="coach-feedback">
                    <div className="coach-avatar">AI</div>
                    <div>
                      <p className="message-label">即时诊断 · {latestDiagnosis.score} 分</p>
                      <p>{latestDiagnosis.diagnosis.summary}</p>
                      <div className="diagnosis-points">
                        {latestDiagnosis.diagnosis.strengths.length > 0 && <p><b>已展现：</b>{latestDiagnosis.diagnosis.strengths.join("、")}</p>}
                        {latestDiagnosis.weakTags.length > 0 && <p><b>待加强：</b>{latestDiagnosis.weakTags.join("、")}</p>}
                        <p><b>追问：</b>{latestDiagnosis.diagnosis.followUp}</p>
                      </div>
                      <div className="feedback-actions"><button type="button" onClick={() => setActiveView("wrongbook")}>收录已保存</button><button className="primary" type="button" onClick={nextQuestion}>下一题 →</button></div>
                    </div>
                  </div>
                </section>
              )}
              {error && <p className="interview-error">{error}</p>}
            </div>
            <div className="answer-composer">
              <textarea aria-label="输入你的面试回答" placeholder="输入你的回答……" value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void submitAnswer(); }} />
              <div><span>回答将写入个人档案 · 按 Ctrl/⌘ + Enter 提交</span><button type="button" onClick={() => void submitAnswer()} disabled={answer.trim().length < 12 || saving}>{saving ? "·" : "↑"}</button></div>
            </div>
          </>
        )}

        {activeView === "wrongbook" && (
          <div className="interview-workspace">
            <div className="workspace-heading"><div><p>ANSWER EVIDENCE</p><h1>每次回答都是一条能力证据</h1></div><span>{wrongAnswers.length} 条待加强记录</span></div>
            <div className="wrongbook-list">
              {wrongAnswers.length === 0 ? <div className="empty-state">完成第一次回答后，薄弱题会出现在这里。</div> : wrongAnswers.map((attempt) => (
                <article key={attempt.id}>
                  <div className="attempt-score"><b>{attempt.score}</b><small>分</small></div>
                  <div><span>{attempt.competency} · {new Date(attempt.created_at).toLocaleDateString("zh-CN")}</span><h2>{attempt.prompt}</h2><p>{attempt.answer_text}</p><footer><em>{attempt.weakTags.join("、") || "继续精炼"}</em><button type="button" onClick={() => { setActiveView("practice"); setQuestionIndex(Math.max(0, data.questions.findIndex((item) => item.prompt === attempt.prompt))); setAnswer(attempt.answer_text); setLatestDiagnosis(null); }}>重答这题 →</button></footer></div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeView === "plan" && (
          <div className="interview-workspace">
            <div className="workspace-heading"><div><p>ADAPTIVE PLAN</p><h1>计划会随你的回答和市场变化</h1></div><span>{openPlanCount} 项待完成</span></div>
            <section className="market-radar">
              <header><strong>影响本期计划的新信号</strong><small>每条都可追溯</small></header>
              <div>{data.signals.map((signal) => <a href={signal.source_url} target="_blank" rel="noreferrer" key={signal.id}><span>{signal.source_type === "job" ? "岗位" : signal.source_type === "market" ? "市场" : "技术"}</span><strong>{signal.title}</strong><p>{signal.summary}</p><small>{signal.observed_at} · {signal.competency}</small></a>)}</div>
            </section>
            <div className="plan-list">
              {data.plan.length === 0 ? <div className="empty-state">回答面试题后，系统会根据最弱证据生成训练任务。</div> : data.plan.map((item, index) => (
                <article className={item.status === "done" ? "done" : ""} key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{item.competency} · {item.duration_minutes} 分钟</small><h2>{item.title}</h2><p>{item.reason}</p></div><button type="button" disabled={item.status === "done" || saving} onClick={() => void completePlan(item.id)}>{item.status === "done" ? "已完成" : "标记完成"}</button></article>
              ))}
            </div>
          </div>
        )}

        {activeView === "profile" && (
          <div className="interview-workspace profile-workspace">
            <div className="workspace-heading"><div><p>ROLE PROFILE</p><h1>先定义去哪里，才能判断缺什么</h1></div></div>
            <form className="profile-form" onSubmit={(event) => void updateProfile(event)}>
              <label><span>当前岗位与主要职责</span><textarea name="currentRole" defaultValue={data.profile.current_role} required /></label>
              <label><span>目标岗位 / 未来方向</span><textarea name="targetRole" defaultValue={data.profile.target_role} required /></label>
              <div><label><span>计划周期</span><input name="horizon" defaultValue={data.profile.horizon} required /></label><label><span>重点发展能力</span><input name="focus" defaultValue={data.profile.focus} required /></label></div>
              <p>修改后，后续题目和计划会按新目标演进；历史回答不会丢失。</p>
              <button type="submit" disabled={saving}>{saving ? "正在保存……" : "保存岗位画像"}</button>
            </form>
          </div>
        )}
      </section>

      <aside className="insight-panel">
        <header><strong>岗位能力雷达</strong><button type="button" onClick={() => setActiveView("profile")}>···</button></header>
        <div className="readiness-score"><span><b>{readiness}</b><small>/ 100</small></span><div><strong>岗位准备度</strong><small>{data.attempts.length} 条回答证据</small></div></div>
        <section className="ability-list">{data.scores.map((item) => <div key={item.competency}><p><span>{item.competency}</span><b>{item.score}%</b></p><i><em className={item === weakest ? "weak" : ""} style={{ width: `${item.score}%` }} /></i></div>)}</section>
        <section className="weakness-card"><span>当前最弱项</span><strong>{weakest?.competency}</strong><p>该分数由你的实际回答持续校准，而不是一次性自评。</p><button type="button" onClick={() => setActiveView("plan")}>打开针对性计划</button></section>
        <section className="source-snapshot"><div><span>动态数据源</span><b>{data.signals.length} 条有效</b></div><p><i />目标岗位与个人发展画像</p><p><i />实时招聘能力信号</p><p><i />官方技术发布雷达</p><p><i />个人回答与错题记录</p></section>
      </aside>
    </main>
  );
}
