import type { LearningModule } from "../learning-registry";
import { careerChapterPlans } from "../career-curriculum";

export type BlueprintChapter = {
  id: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  levelIds: number[];
};

type ChapterPlan = { title: string; levelIds: number[] };

// Chapter boundaries follow each course's topics, rather than the Python course's 3/3/3/1 split.
const chapterPlans: Record<string, ChapterPlan[]> = {
  ...careerChapterPlans,
  "ui-automation": [
    { title: "页面与定位", levelIds: [1, 2] },
    { title: "组件交互与状态", levelIds: [3, 4, 5, 6] },
    { title: "工程化与执行证据", levelIds: [7, 8, 9, 10] },
  ],
  "api-automation": [
    { title: "协议与契约", levelIds: [1, 2] },
    { title: "客户端与结果封装", levelIds: [3, 4] },
    { title: "声明式流程与数据", levelIds: [5, 6, 7, 8] },
    { title: "断言、清理与完整链路", levelIds: [9, 10] },
    { title: "变更兼容与回放", levelIds: [11, 12] },
  ],
  "ai-testing": [
    { title: "对象与能力边界", levelIds: [1, 2] },
    { title: "评测集、指标与稳定性", levelIds: [3, 4, 5] },
    { title: "专项风险与过程归因", levelIds: [6, 7, 8] },
    { title: "性能成本与质量门禁", levelIds: [9, 10] },
    { title: "测试提效与评测可信度", levelIds: [11, 12, 13] },
  ],
  "performance-testing": [
    { title: "指标与负载模型", levelIds: [1, 2, 3] },
    { title: "脚本、数据与发压", levelIds: [4, 5, 6, 7] },
    { title: "观测、容量与报告", levelIds: [8, 9, 10] },
  ],
  "quality-engineering": [
    { title: "质量策略与测试视角", levelIds: [1, 2, 3] },
    { title: "代码验证与质量发现", levelIds: [4, 5, 6, 7, 8] },
    { title: "发布门禁与保障闭环", levelIds: [9, 10, 11] },
  ],
};

function planFor(courseId: string): ChapterPlan[] {
  const plan = chapterPlans[courseId];
  if (!plan) throw new Error(`课程 ${courseId} 缺少按内容编排的章节`);
  return plan;
}

export function blueprintChapters(course: LearningModule): BlueprintChapter[] {
  const plan = planFor(course.id);
  const ids = plan.flatMap((chapter) => chapter.levelIds);
  if (ids.length !== course.roadmap.length || ids.some((id, index) => id !== index + 1)) {
    throw new Error(`课程 ${course.id} 的章节未完整覆盖现有 ${course.roadmap.length} 关，请按内容更新章节计划`);
  }
  return plan.map((chapter, index) => {
    const first = course.roadmap[chapter.levelIds[0] - 1];
    const last = course.roadmap[chapter.levelIds[chapter.levelIds.length - 1] - 1];
    const firstTitle = typeof first === "string" ? first : first.title;
    const lastTitle = typeof last === "string" ? last : last.title;
    return {
      id: index + 1,
      title: `${index + 1 === plan.length ? "终章" : `第${["一", "二", "三", "四", "五", "六"][index] ?? index + 1}章`} · ${chapter.title}`,
      shortTitle: chapter.title,
      subtitle: firstTitle === lastTitle ? firstTitle : `${firstTitle} → ${lastTitle}`,
      levelIds: chapter.levelIds,
    };
  });
}

export function blueprintChapterForLevel(course: LearningModule, levelId: number) {
  return blueprintChapters(course).find((chapter) => chapter.levelIds.includes(levelId));
}

export function blueprintLevelHref(courseId: string, levelId: number) {
  const chapterIndex = planFor(courseId).findIndex((chapter) => chapter.levelIds.includes(levelId));
  if (chapterIndex < 0) throw new Error(`课程 ${courseId} 没有关卡 ${levelId}`);
  return `/courses/${courseId}/chapters/${chapterIndex + 1}#level-${levelId}`;
}
