import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PythonCourseClient from "../../PythonCourseClient";
import { getPythonCourseChapter } from "../../chapter-data";

const origin = "https://python-framework-quest.leafy-slug-3142.chatgpt.site";

type ChapterPageProps = {
  params: Promise<{ chapterId: string }>;
};

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { chapterId } = await params;
  const chapter = getPythonCourseChapter(Number(chapterId));
  if (!chapter) return { title: "章节不存在 | Python 框架修炼" };

  const title = `${chapter.title} | Python 框架修炼`;
  const description = chapter.subtitle;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [`${origin}/og.png`] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
  };
}

export default async function PythonChapterPage({ params }: ChapterPageProps) {
  const { chapterId } = await params;
  const chapter = getPythonCourseChapter(Number(chapterId));
  if (!chapter) notFound();
  return <PythonCourseClient chapterId={chapter.id} />;
}
