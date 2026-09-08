import type { Metadata } from "next";
import InteractiveCourse from "./AiDeveloperCourse";
import "../courses/python-framework/course-flow.css";
import "./course.css";
import { learningStages } from "./learning-plan";
import { aiCourseId, exercises } from "./exercises";

export const metadata: Metadata = { title: "5 级 AI 开发岗学习路线 | 测试能力修炼场", description: "概念、示例、代码练习、在线助教和自动小测，按独立课程保存学习记录。", openGraph: { images: [] }, twitter: { card: "summary", images: [] } };

export default function Page() { return <InteractiveCourse config={{ id: aiCourseId, title: "AI 开发 5 级", brand: "AI 开发岗修炼", sigil: "AI", eyebrow: "AI DEVELOPER QUEST", mapTitle: "九节学习地图", nextHref: "/ai-developer-level5/guide#projects", nextTitle: "项目与验收要求", stages: learningStages, exercises }} />; }
