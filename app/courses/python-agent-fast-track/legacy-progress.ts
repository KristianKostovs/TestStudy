import { stampLearningState, type LearningSyncState } from "../python-framework/learning-sync";

// Import once after an authenticated cloud read; never overwrite newer cloud work.
export function importAgentLegacyState(state: LearningSyncState, storage: Pick<Storage, "getItem">): LearningSyncState {
  const marker = "migration.agent-local-v1";
  if (state.clocks[marker]) return state;
  try {
    const raw = JSON.parse(storage.getItem("python-agent-fast-track-completed-v1") ?? "[]");
    const completed: number[] = Array.isArray(raw) ? [...new Set(raw.filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= 16))] : [];
    const next = { ...state, progress: { ...state.progress, completed: [...state.progress.completed], stageUnlocked: { ...state.progress.stageUnlocked }, taskDrafts: { ...state.progress.taskDrafts } } };
    const keys = [marker];
    for (let id = 1; id <= 16; id += 1) {
      const draft = storage.getItem(`learning-blueprint-draft-v1:python-agent-fast-track:${id}`);
      if (draft !== null && next.progress.taskDrafts[id] === undefined && !state.clocks[`progress.taskDrafts.${id}`]) {
        next.progress.taskDrafts[id] = draft;
        keys.push(`progress.taskDrafts.${id}`);
      }
      if (completed.includes(id) && !state.clocks[`progress.completed.${id}`]) {
        next.progress.completed = [...new Set([...next.progress.completed, id])];
        next.progress.stageUnlocked[id] = 5;
        keys.push(`progress.completed.${id}`, `progress.stageUnlocked.${id}`);
      }
    }
    return stampLearningState(next, keys);
  } catch { return state; }
}
