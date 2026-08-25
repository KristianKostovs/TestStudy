import type { Metadata } from "next";
import GradingQueueClient from "./GradingQueueClient";

export const metadata: Metadata = {
  title: "Codex 批改队列 | Python 框架修炼",
  description: "查看 Python 课程待评判、评判中和已完成的异步批改任务。",
};

export default function GradingQueuePage() {
  return <GradingQueueClient />;
}
