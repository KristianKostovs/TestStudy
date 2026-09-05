import type { Metadata } from "next";
import AgentFastTrackClient from "./AgentFastTrackClient";
import "./python-agent-fast-track.css";

const title = "Python 基础 Agent 快速通道 | 测试能力修炼场";
const description = "面向测试开发工程师的 Python 最短学习路径，通过工单查询助手衔接 LangChain 与 LangGraph。";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", images: [] },
  twitter: { card: "summary", title, description, images: [] },
};

export default function PythonAgentFastTrackPage() {
  return <AgentFastTrackClient />;
}
