import type { Metadata } from "next";
import InterviewCoachClient from "./InterviewCoachClient";

const title = "岗位面试陪练";
const description = "根据岗位目标、市场信号与历史回答，持续诊断薄弱项并生成个人训练计划。";

export const metadata: Metadata = {
  title: `${title} | 测试能力修炼场`,
  description,
  openGraph: { title, description, images: [] },
  twitter: { card: "summary", title, description, images: [] },
};

export default function InterviewPage() {
  return <InterviewCoachClient />;
}
