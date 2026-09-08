import type { Metadata } from "next";
import AiDeveloperCourse from "./AiDeveloperCourse";
import "../courses/python-framework/course-flow.css";
import "./course.css";

export const metadata: Metadata = { title: "5 级 AI 开发岗学习路线 | 测试能力修炼场", description: "概念、示例、代码练习、在线助教和自动小测，按独立课程保存学习记录。", openGraph: { images: [] }, twitter: { card: "summary", images: [] } };

export default function Page() { return <AiDeveloperCourse />; }
