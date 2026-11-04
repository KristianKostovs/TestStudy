import type { Metadata } from "next";
import ProjectLearningTemplate from "../../real-projects/ProjectLearningTemplate";
import { firstProjectCourseMappings, firstRealProject } from "../../real-projects/first-project";

export const metadata: Metadata = {
  title: "真实项目学习 | 测试能力修炼场",
  description: "按目标、前置知识、简明讲解、动手任务和客观验收学习真实需求。",
  openGraph: { images: [] },
  twitter: { card: "summary", images: [] },
};

export default function RealProjectPage() {
  return <ProjectLearningTemplate
    project={firstRealProject}
    tasks={firstProjectCourseMappings}
    starter={{ path: "course-starters/active-worker-bill-contract", command: "python3 -m pytest -q" }}
  />;
}
