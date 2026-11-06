import type { LearningModule } from "../learning-registry";

export type BlueprintChapter = {
  id: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  levelIds: number[];
};

const chapterShape = [
  { title: "第一章 · 筑基", shortTitle: "筑基", levelIds: [1, 2, 3] },
  { title: "第二章 · 入阵", shortTitle: "入阵", levelIds: [4, 5, 6] },
  { title: "第三章 · 破阵", shortTitle: "破阵", levelIds: [7, 8, 9] },
  { title: "终章 · 出师", shortTitle: "出师", levelIds: [10] },
] as const;

export function blueprintChapters(course: LearningModule): BlueprintChapter[] {
  return chapterShape.map((shape, index) => {
    const levelIds = shape.levelIds.filter((id) => id <= course.roadmap.length);
    const first = course.roadmap[levelIds[0] - 1];
    const last = course.roadmap[levelIds[levelIds.length - 1] - 1];
    const firstTitle = typeof first === "string" ? first : first?.title;
    const lastTitle = typeof last === "string" ? last : last?.title;
    return {
      id: index + 1,
      title: shape.title,
      shortTitle: shape.shortTitle,
      subtitle: firstTitle === lastTitle ? firstTitle ?? "" : `${firstTitle} → ${lastTitle}`,
      levelIds,
    };
  }).filter((chapter) => chapter.levelIds.length > 0);
}

export function blueprintChapterForLevel(course: LearningModule, levelId: number) {
  return blueprintChapters(course).find((chapter) => chapter.levelIds.includes(levelId));
}

export function blueprintLevelHref(courseId: string, levelId: number) {
  const chapterId = levelId <= 3 ? 1 : levelId <= 6 ? 2 : levelId <= 9 ? 3 : 4;
  return `/courses/${courseId}/chapters/${chapterId}#level-${levelId}`;
}
