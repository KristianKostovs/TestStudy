import type { Metadata } from "next";
import PythonCourseClient from "./PythonCourseClient";

const origin = "https://python-framework-quest.leafy-slug-3142.chatgpt.site";
const title = "Python 框架基础十关 | 测试能力修炼场";
const description = "从 Python 数据、函数和 pytest，逐关学习 YAML、Runner、Adapter、HTTP 与架构边界。";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", images: [`${origin}/og.png`] },
  twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
};

export default function PythonFrameworkCoursePage() {
  return <PythonCourseClient />;
}
