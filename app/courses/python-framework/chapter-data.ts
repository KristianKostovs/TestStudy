export type PythonCourseChapter = {
  id: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  levelIds: number[];
};

export const pythonCourseChapters: PythonCourseChapter[] = [
  {
    id: 1,
    title: "第一章 · 筑基",
    shortTitle: "筑基",
    subtitle: "先掌握数据、异常和 Python 模块，让后面的框架代码不再陌生。",
    levelIds: [1, 2, 3],
  },
  {
    id: 2,
    title: "第二章 · 入阵",
    shortTitle: "入阵",
    subtitle: "用类型、pytest 和 Schema，把口头约定变成可以验证的边界。",
    levelIds: [4, 5, 6],
  },
  {
    id: 3,
    title: "第三章 · 破阵",
    shortTitle: "破阵",
    subtitle: "走进 Runner、HTTP Mock 和架构分层，理解自动化框架如何真正运行。",
    levelIds: [7, 8, 9],
  },
  {
    id: 4,
    title: "终章 · 出师",
    shortTitle: "出师",
    subtitle: "把前面能力组合成一条完整声明式接口链，并留下可诊断证据。",
    levelIds: [10],
  },
];

export function getPythonCourseChapter(chapterId: number) {
  return pythonCourseChapters.find((chapter) => chapter.id === chapterId);
}

export function getChapterForLevel(levelId: number) {
  return pythonCourseChapters.find((chapter) => chapter.levelIds.includes(levelId));
}
