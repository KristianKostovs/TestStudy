import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { learningModules, sourcesForModule } from "../../learning-registry";
import BlueprintCourseClient from "../BlueprintCourseClient";

type Props = { params: Promise<{ moduleId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleId } = await params;
  const course = learningModules.find((item) => item.id === moduleId && item.status === "blueprint");
  if (!course) return { title: "课程不存在 | 测试能力修炼场" };
  return { title: `${course.title} | 测试能力修炼场`, description: course.subtitle, openGraph: { images: [] }, twitter: { card: "summary", images: [] } };
}

export default async function BlueprintCoursePage({ params }: Props) {
  const { moduleId } = await params;
  const course = learningModules.find((item) => item.id === moduleId && item.status === "blueprint");
  if (!course) notFound();
  return <BlueprintCourseClient course={course} sources={sourcesForModule(course)} />;
}
