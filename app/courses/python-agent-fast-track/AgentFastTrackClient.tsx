"use client";
import InteractiveCourse from "../../ai-developer-level5/AiDeveloperCourse";
import { agentCourseConfig } from "./interactive-data";

export default function AgentFastTrackClient({ chapterId }: { chapterId?: number }) {
  return <InteractiveCourse config={agentCourseConfig} chapterId={chapterId} />;
}
