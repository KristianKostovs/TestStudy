import type { Metadata } from "next";
import LearningHome from "../LearningHome";

export const metadata: Metadata = {
  title: "学习中心 | 测试能力修炼场",
  description: "选择 Python 框架、UI 自动化、API 自动化、AI 测试或性能测试路线。",
};

export default function LearnPage() {
  return <LearningHome />;
}
