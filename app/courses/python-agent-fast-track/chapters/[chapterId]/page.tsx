import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AgentFastTrackClient from "../../AgentFastTrackClient";
import { agentFastTrackChapters } from "../../course-data";
import "../../../python-framework/course-flow.css";
import "../../../../ai-developer-level5/course.css";

type Props = { params: Promise<{ chapterId: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapterId } = await params;
  const chapter = agentFastTrackChapters.find((item) => String(item.id) === chapterId);
  return { title: `${chapter?.title ?? "章节不存在"} | Python → Agent`, openGraph: { images: [] }, twitter: { card: "summary", images: [] } };
}
export default async function Page({ params }: Props) {
  const { chapterId } = await params;
  const chapter = agentFastTrackChapters.find((item) => String(item.id) === chapterId);
  if (!chapter) notFound();
  return <AgentFastTrackClient chapterId={chapter.id} />;
}
