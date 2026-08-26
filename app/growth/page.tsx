import type { Metadata } from "next";
import GrowthArchiveClient from "./GrowthArchiveClient";

export const metadata: Metadata = {
  title: "成长档案 | 测试能力修炼场",
  description: "聚合课程进度、面试能力证据与下一步成长建议。",
};

export default function GrowthPage() {
  return <GrowthArchiveClient />;
}
