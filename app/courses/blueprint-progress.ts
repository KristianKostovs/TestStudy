export type BlueprintProgress = {
  unlocked: Record<number, number>;
  completed: number[];
  tests: Record<number, boolean>;
  reviews: Record<number, string>;
};

export const emptyBlueprintProgress: BlueprintProgress = { unlocked: {}, completed: [], tests: {}, reviews: {} };

function levelEntries<T>(value: unknown, accepts: (v: unknown) => v is T): Record<number, T> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([id, v]) => /^[1-9]\d*$/.test(id) && accepts(v)));
}

export function readBlueprintProgress(key: string, fallback = emptyBlueprintProgress): BlueprintProgress {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? "null");
    if (!saved || typeof saved !== "object") return fallback;
    return {
      unlocked: levelEntries(saved.unlocked, (v): v is number => typeof v === "number" && Number.isInteger(v)),
      completed: Array.isArray(saved.completed) ? saved.completed.filter((id: unknown) => Number.isInteger(id)) : [],
      tests: levelEntries(saved.tests, (v): v is boolean => typeof v === "boolean"),
      reviews: levelEntries(saved.reviews, (v): v is string => typeof v === "string" && Boolean(v.trim())),
    };
  } catch { return fallback; }
}
