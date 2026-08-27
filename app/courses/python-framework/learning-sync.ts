export type TaskGrade = {
  passed: boolean;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  criteria: Array<{ criterion: string; met: boolean; evidence: string }>;
};

export type ProgressState = {
  completed: number[];
  quizPassed: number[];
  stageUnlocked: Record<number, number>;
  taskDrafts: Record<number, string>;
  taskGrades: Record<number, TaskGrade>;
};

export type CodexChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type LearningSyncState = {
  progress: ProgressState;
  chats: Record<number, CodexChatMessage[]>;
  clocks: Record<string, string>;
};

type PartialProgressState = Partial<ProgressState>;

export function emptyLearningState(): LearningSyncState {
  return {
    progress: {
      completed: [],
      quizPassed: [],
      stageUnlocked: {},
      taskDrafts: {},
      taskGrades: {},
    },
    chats: {},
    clocks: {},
  };
}

function recordValue<T>(value: unknown): Record<number, T> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<number, T>;
}

function listValue(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= 10);
}

function hasData(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value && typeof value === "object" && Object.keys(value).length > 0);
}

function inferLegacyClocks(state: LearningSyncState, timestamp: string) {
  const clocks = { ...state.clocks };
  for (const levelId of state.progress.completed) {
    const key = `progress.completed.${levelId}`;
    if (!clocks[key]) clocks[key] = timestamp;
  }
  if (hasData(state.progress.quizPassed) && !clocks["progress.quizPassed"]) clocks["progress.quizPassed"] = timestamp;
  for (const levelId of Object.keys(state.progress.stageUnlocked)) {
    const key = `progress.stageUnlocked.${levelId}`;
    if (!clocks[key]) clocks[key] = timestamp;
  }
  for (const levelId of Object.keys(state.progress.taskDrafts)) {
    const key = `progress.taskDrafts.${levelId}`;
    if (!clocks[key]) clocks[key] = timestamp;
  }
  for (const levelId of Object.keys(state.progress.taskGrades)) {
    const key = `progress.taskGrades.${levelId}`;
    if (!clocks[key]) clocks[key] = timestamp;
  }
  for (const levelId of Object.keys(state.chats)) {
    const key = `chats.${levelId}`;
    if (!clocks[key]) clocks[key] = timestamp;
  }
  return { ...state, clocks };
}

export function normalizeLearningState(
  progressValue: unknown,
  chatsValue: unknown,
  clocksValue: unknown,
  legacyTimestamp = new Date().toISOString(),
): LearningSyncState {
  const progress = progressValue && typeof progressValue === "object" && !Array.isArray(progressValue)
    ? progressValue as PartialProgressState
    : {};
  const state: LearningSyncState = {
    progress: {
      completed: listValue(progress.completed),
      quizPassed: listValue(progress.quizPassed),
      stageUnlocked: recordValue<number>(progress.stageUnlocked),
      taskDrafts: recordValue<string>(progress.taskDrafts),
      taskGrades: recordValue<TaskGrade>(progress.taskGrades),
    },
    chats: recordValue<CodexChatMessage[]>(chatsValue),
    clocks: clocksValue && typeof clocksValue === "object" && !Array.isArray(clocksValue)
      ? clocksValue as Record<string, string>
      : {},
  };
  return inferLegacyClocks(state, legacyTimestamp);
}

function newerSide(localClock?: string, remoteClock?: string) {
  if (localClock && !remoteClock) return "local";
  if (!localClock && remoteClock) return "remote";
  if (!localClock && !remoteClock) return "merge";
  return Date.parse(localClock as string) >= Date.parse(remoteClock as string) ? "local" : "remote";
}

function mergeList(local: number[], remote: number[], side: string) {
  if (side === "local") return local;
  if (side === "remote") return remote;
  return [...new Set([...local, ...remote])].sort((left, right) => left - right);
}

function mergeMessages(local: CodexChatMessage[], remote: CodexChatMessage[]) {
  const unique = new Map<string, CodexChatMessage>();
  for (const message of [...local, ...remote]) {
    unique.set(`${message.createdAt}\u0000${message.role}\u0000${message.content}`, message);
  }
  return [...unique.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function mergeCompleted(local: LearningSyncState, remote: LearningSyncState) {
  const completed: number[] = [];
  for (let levelId = 1; levelId <= 10; levelId += 1) {
    const key = `progress.completed.${levelId}`;
    const side = newerSide(
      local.clocks[key] ?? local.clocks["progress.completed"],
      remote.clocks[key] ?? remote.clocks["progress.completed"],
    );
    const localHas = local.progress.completed.includes(levelId);
    const remoteHas = remote.progress.completed.includes(levelId);
    if ((side === "local" && localHas) || (side === "remote" && remoteHas) || (side === "merge" && (localHas || remoteHas))) {
      completed.push(levelId);
    }
  }
  return completed;
}

function mergeLevelRecord<T>(
  prefix: string,
  local: Record<number, T>,
  remote: Record<number, T>,
  clocks: Record<string, string>,
  remoteClocks: Record<string, string>,
  mergeEqual?: (localValue: T, remoteValue: T, side: string) => T,
) {
  const merged: Record<number, T> = {};
  const levelIds = new Set([...Object.keys(local), ...Object.keys(remote)]);
  for (const rawLevelId of levelIds) {
    const levelId = Number(rawLevelId);
    const key = `${prefix}.${levelId}`;
    const side = newerSide(clocks[key], remoteClocks[key]);
    const localValue = local[levelId];
    const remoteValue = remote[levelId];
    if (localValue === undefined) merged[levelId] = remoteValue;
    else if (remoteValue === undefined) merged[levelId] = localValue;
    else merged[levelId] = mergeEqual ? mergeEqual(localValue, remoteValue, side) : side === "remote" ? remoteValue : localValue;
  }
  return merged;
}

function mergeClocks(local: Record<string, string>, remote: Record<string, string>) {
  const merged: Record<string, string> = {};
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const localValue = local[key];
    const remoteValue = remote[key];
    if (!localValue) merged[key] = remoteValue;
    else if (!remoteValue) merged[key] = localValue;
    else merged[key] = Date.parse(localValue) >= Date.parse(remoteValue) ? localValue : remoteValue;
  }
  return merged;
}

export function mergeLearningStates(local: LearningSyncState, remote: LearningSyncState): LearningSyncState {
  return {
    progress: {
      completed: mergeCompleted(local, remote),
      quizPassed: mergeList(local.progress.quizPassed, remote.progress.quizPassed, "merge"),
      stageUnlocked: mergeLevelRecord("progress.stageUnlocked", local.progress.stageUnlocked, remote.progress.stageUnlocked, local.clocks, remote.clocks),
      taskDrafts: mergeLevelRecord("progress.taskDrafts", local.progress.taskDrafts, remote.progress.taskDrafts, local.clocks, remote.clocks),
      taskGrades: mergeLevelRecord("progress.taskGrades", local.progress.taskGrades, remote.progress.taskGrades, local.clocks, remote.clocks),
    },
    chats: mergeLevelRecord("chats", local.chats, remote.chats, local.clocks, remote.clocks, mergeMessages),
    clocks: mergeClocks(local.clocks, remote.clocks),
  };
}

export function stampLearningState(state: LearningSyncState, keys: string[], timestamp = new Date().toISOString()) {
  return {
    ...state,
    clocks: {
      ...state.clocks,
      ...Object.fromEntries(keys.map((key) => [key, timestamp])),
    },
  };
}

export function sameLearningState(left: LearningSyncState, right: LearningSyncState) {
  return JSON.stringify(left) === JSON.stringify(right);
}
