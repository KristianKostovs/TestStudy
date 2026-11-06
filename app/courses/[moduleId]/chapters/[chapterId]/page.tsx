import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { learningModules, sourcesForModule } from "../../../../learning-registry";
import { blueprintChapters } from "../../../blueprint-chapters";
import BlueprintCourseClient from "../../../BlueprintCourseClient";

type Props = { params: Promise<{ moduleId: string; chapterId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleId, chapterId } = await params;
  const course = learningModules.find((item) => item.id === moduleId && item.status === "blueprint");
  const chapter = course && blueprintChapters(course).find((item) => item.id === Number(chapterId));
  if (!course || !chapter) return { title: "章节不存在 | 测试能力修炼场" };
  return { title: `${chapter.title} | ${course.title}`, description: chapter.subtitle, openGraph: { images: [] }, twitter: { card: "summary", images: [] } };
}

export default async function BlueprintChapterPage({ params }: Props) {
  const { moduleId, chapterId } = await params;
  const course = learningModules.find((item) => item.id === moduleId && item.status === "blueprint");
  if (!course || !blueprintChapters(course).some((item) => item.id === Number(chapterId))) notFound();
  return <BlueprintCourseClient course={course} sources={sourcesForModule(course)} chapterId={Number(chapterId)} />;
}
