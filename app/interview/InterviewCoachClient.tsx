"use client";

import { useEffect, useMemo, useState } from "react";

type Profile = { current_role: string; target_role: string; horizon: string; focus: string };
type Question = { id: number; prompt: string; competency: string; tags: string[]; source_ref: string };
type Diagnosis = { summary: string; strengths: string[]; improvements: string[]; followUp: string };
type Attempt = { id: number; prompt: string; competency: string; answer_text: string; score: number; diagnosis: Diagnosis; weakTags: string[]; created_at: string };
type Score = { competency: string; score: number | null; evidence_count: number };
type Signal = { id: string; title: string; summary: string; competency: string; source_url: string; source_type: string; observed_at: string };
type PlanItem = { id: number; title: string; competency: string; reason: string; duration_minutes: number; status: "open" | "done" };
type CapabilityModule = {
  id: string; code: string; title: string; description: string; tone: string;
  kind: "core" | "adaptive" | "practice"; competency: string; priority: number;
  signalCount: number; questionCount: number; evidenceScore: number | null; evidenceCount: number;
  source_strategy: string; updated_at: string; content: { topics: string[] }; signals: Signal[];
};
type InterviewState = { profile: Profile; questions: Question[]; attempts: Attempt[]; scores: Score[]; signals: Signal[]; plan: PlanItem[]; modules: CapabilityModule[]; lastRefreshedAt: string | null };
type View = "overview" | "module" | "practice" | "wrongbook" | "plan" | "profile";

const viewTitles: Record<View, [string, string]> = {
  overview: ["面试能力地图", "板块、内容和优先级都由岗位与技术数据驱动"],
  module: ["能力板块详情", "内容随岗位要求、技术发布与个人证据刷新"],
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
  const [activeView, setActiveView] = useState<View>("overview");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [latestDiagnosis, setLatestDiagnosis] = useState<{ score: number; diagnosis: Diagnosis; weakTags: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshNote, setRefreshNote] = useState("");

  useEffect(() => {
    requestState().then((result) => {
      setData(result);
      const snapshotAge = result.lastRefreshedAt ? Date.now() - new Date(`${result.lastRefreshedAt}T00:00:00Z`).getTime() : Number.POSITIVE_INFINITY;
      if (snapshotAge > 7 * 24 * 60 * 60 * 1000) {
        requestState({ action: "refresh_sources" }).then(setData).catch(() => undefined);
      }
    }).catch((cause: Error) => setError(cause.message));
  }, []);

  const wrongAnswers = useMemo(() => data?.attempts.filter((attempt) => attempt.score < 75 || attempt.weakTags.length) ?? [], [data]);
  const assessedScores = useMemo(() => data?.scores.filter((item): item is Score & { score: number } => item.score !== null && item.evidence_count > 0) ?? [], [data]);
  const readiness = useMemo(() => assessedScores.length ? Math.round(assessedScores.reduce((sum, item) => sum + item.score, 0) / assessedScores.length) : null, [assessedScores]);
  const weakest = assessedScores.length ? assessedScores.reduce((lowest, item) => item.score < lowest.score ? item : lowest) : undefined;
  const selectedModule = data?.modules.find((module) => module.id === selectedModuleId);
  const practiceQuestions = useMemo(() => {
    if (!data) return [];
    if (!selectedModule || selectedModule.kind === "practice") return data.questions;
    const matched = data.questions.filter((item) => item.competency === selectedModule.competency);
    return matched.length ? matched : data.questions;
  }, [data, selectedModule]);
  const question = practiceQuestions[questionIndex % Math.max(practiceQuestions.length, 1)];
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
    if (!practiceQuestions.length) return;
    setQuestionIndex((current) => (current + 1) % practiceQuestions.length);
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

  function openModule(module: CapabilityModule) {
    if (module.kind === "practice") {
      setSelectedModuleId(null); setQuestionIndex(0); setActiveView("practice");
      return;
    }
    setSelectedModuleId(module.id); setActiveView("module");
  }

  function startModulePractice(module: CapabilityModule) {
    setSelectedModuleId(module.id); setQuestionIndex(0); setAnswer(""); setLatestDiagnosis(null); setActiveView("practice");
  }

  async function refreshSources() {
    if (saving) return;
    setSaving(true); setError(""); setRefreshNote("");
    try {
      const result = await requestState({ action: "refresh_sources" }) as InterviewState & { refresh?: { updated: number; failed: number } };
      setData(result);
      setRefreshNote(`已刷新 ${result.refresh?.updated ?? 0} 个官方技术源${result.refresh?.failed ? `，${result.refresh.failed} 个暂未连通` : ""}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "刷新失败"); }
    finally { setSaving(false); }
  }

  if (!data) return <main className="interview-loading"><div className="coach-avatar">AI</div><strong>{error || "正在加载你的面试档案……"}</strong></main>;

  return (
    <main className="interview-shell">
      <aside className="interview-sidebar">
        <div className="interview-brand"><span>IN</span><div><strong>面试成长系统</strong><small>Career intelligence</small></div></div>
        <button className="new-session" type="button" onClick={() => { setSelectedModuleId(null); setQuestionIndex(0); setActiveView("practice"); }}>＋ 开始新面试</button>
        <nav className="interview-nav" aria-label="面试陪练导航">
          <p>我的面试</p>
          <button className={activeView === "overview" || activeView === "module" ? "active" : ""} type="button" onClick={() => setActiveView("overview")}><span>▦</span><b>能力地图</b><small>{data.modules.length} 块</small></button>
          <button className={activeView === "practice" ? "active" : ""} type="button" onClick={() => setActiveView("practice")}><span>◉</span><b>综合模拟面试</b><small>进行中</small></button>
          <button className={activeView === "wrongbook" ? "active" : ""} type="button" onClick={() => setActiveView("wrongbook")}><span>◎</span><b>错题本</b><small>{wrongAnswers.length} 题</small></button>
          <button className={activeView === "plan" ? "active" : ""} type="button" onClick={() => setActiveView("plan")}><span>◇</span><b>成长计划</b><small>{openPlanCount} 项</small></button>
          <p>能力专项</p>
          {data.scores.map((item) => <button key={item.competency} type="button" onClick={() => setActiveView("practice")}><span>⌁</span><b>{item.competency}</b><small>{item.score === null ? "未评估" : `${item.score}%`}</small></button>)}
        </nav>
        <button className="profile-chip" type="button" onClick={() => setActiveView("profile")}><span>白</span><div><strong>个人岗位画像</strong><small>{data.profile.current_role} → {data.profile.target_role}</small></div></button>
      </aside>

      <section className="interview-main">
        <header className="interview-topbar">
          <div><strong>{title}</strong><span>{subtitle}</span></div>
          <div className="live-source"><i />数据源快照 · {data.lastRefreshedAt ?? "待更新"}</div>
        </header>

        {activeView === "overview" && (
          <div className="interview-overview">
            <section className="overview-hero">
              <div><p>YOUR INTERVIEW MAP</p><h1>不是背一套题，<br />而是持续对齐<em>下一个岗位</em></h1></div>
              <aside><span>当前目标</span><strong>{data.profile.target_role}</strong><p>{data.profile.horizon} · {data.profile.focus}</p></aside>
            </section>
            <section className="module-map-heading">
              <div><span>动态能力板块</span><strong>市场与技术信号变化时，这里会增、减或调整优先级。</strong></div>
              <button type="button" onClick={() => void refreshSources()} disabled={saving}>{saving ? "正在读取官方数据……" : "刷新数据源 ↻"}</button>
            </section>
            {(refreshNote || error) && <p className={error ? "overview-refresh-note error" : "overview-refresh-note"}>{error || refreshNote}</p>}
            <div className="capability-module-grid">
              {data.modules.map((module, index) => (
                <button type="button" className={`capability-module ${module.tone}`} key={module.id} onClick={() => openModule(module)}>
                  <span className="module-glyph">{module.code}</span>
                  <i>{module.kind === "adaptive" ? "技术新增" : module.signalCount ? `更新 +${module.signalCount}` : module.kind === "practice" ? "可开始" : "核心"}</i>
                  <strong>{module.title}</strong>
                  <p>{module.description}</p>
                  <small>{String(index + 1).padStart(2, "0")} · {module.questionCount} 道针对题 · 优先级 {module.priority}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeView === "module" && selectedModule && (
          <div className="interview-module-detail">
            <button className="module-back" type="button" onClick={() => setActiveView("overview")}>← 返回能力地图</button>
            <section className="module-detail-hero">
              <span className={`module-glyph ${selectedModule.tone}`}>{selectedModule.code}</span>
              <div><p>{selectedModule.kind === "adaptive" ? "ADAPTIVE MODULE · 技术信号驱动" : "CORE INTERVIEW MODULE"}</p><h1>{selectedModule.title}</h1><strong>{selectedModule.description}</strong></div>
              <aside><span>当前优先级</span><b>{selectedModule.priority}</b><small>{selectedModule.evidenceScore === null ? "个人证据 · 未评估" : `个人证据 ${selectedModule.evidenceScore}% · ${selectedModule.evidenceCount} 次回答`}</small></aside>
            </section>
            <div className="module-detail-grid">
              <section className="module-topic-panel">
                <header><div><span>本板块内容</span><strong>根据数据源刷新</strong></div><small>{selectedModule.questionCount} 道针对题</small></header>
                <div className="module-topic-list">{selectedModule.content.topics.map((topic, index) => <article key={topic}><span>{String(index + 1).padStart(2, "0")}</span><strong>{topic}</strong><small>面试理解 · 追问 · 实战证据</small></article>)}</div>
                <button className="start-module-practice" type="button" onClick={() => startModulePractice(selectedModule)}>开始本板块面试 →</button>
              </section>
              <aside className="module-source-panel">
                <header><span>内容来源</span><b>{selectedModule.signalCount} 条有效新信号</b></header>
                <p className="source-strategy">{selectedModule.source_strategy}</p>
                {selectedModule.signals.length ? selectedModule.signals.map((signal) => <a href={signal.source_url} target="_blank" rel="noreferrer" key={signal.id}><span>{signal.source_type === "job" ? "岗位" : signal.source_type === "market" ? "市场" : "技术"} · {signal.observed_at}</span><strong>{signal.title}</strong><p>{signal.summary}</p></a>) : <div className="module-source-empty">当前以长期基础和个人岗位画像为主；暂无需要改变板块的新信号。</div>}
              </aside>
            </div>
          </div>
        )}

        {activeView === "practice" && question && (
          <>
            <div className="interview-conversation">
              <section className="coach-message">
                <div className="coach-avatar">AI</div>
                <div>
                  <p className="message-label">面试官 · {selectedModule?.title ?? "综合模拟面试"} · {question.competency}</p>
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
        <div className={`readiness-score${readiness === null ? " unassessed" : ""}`}><span><b>{readiness ?? "—"}</b><small>{readiness === null ? "待评估" : "/ 100"}</small></span><div><strong>岗位准备度</strong><small>{data.attempts.length} 条回答证据</small></div></div>
        <section className="ability-list">{data.scores.map((item) => <div className={item.score === null ? "unassessed" : ""} key={item.competency}><p><span>{item.competency}</span><b>{item.score === null ? "未评估" : `${item.score}% · ${item.evidence_count}次`}</b></p><i><em className={weakest?.competency === item.competency ? "weak" : ""} style={{ width: `${item.score ?? 0}%` }} /></i></div>)}</section>
        <section className="weakness-card"><span>{weakest ? "当前最弱项" : "尚未形成能力结论"}</span><strong>{weakest?.competency ?? "先完成一道面试题"}</strong><p>{weakest ? "该分数由你的实际回答持续校准，并显示证据次数。" : "市场与技术数据只调整内容优先级，不会生成你的个人能力分。"}</p><button type="button" onClick={() => setActiveView(weakest ? "plan" : "practice")}>{weakest ? "打开针对性计划" : "开始第一次评估"}</button></section>
        <section className="source-snapshot"><div><span>动态数据源</span><b>{data.signals.length} 条有效</b></div><p><i />目标岗位与个人发展画像</p><p><i />实时招聘能力信号</p><p><i />官方技术发布雷达</p><p><i />个人回答与错题记录</p></section>
      </aside>
    </main>
  );
}
