type ProjectTrackLinkProps = {
  courseId: string;
  levelId?: number;
  lessonTitle?: string;
  compact?: boolean;
};

export default function ProjectTrackLink({ courseId, levelId, lessonTitle, compact = false }: ProjectTrackLinkProps) {
  const query = new URLSearchParams({ course: courseId });
  if (levelId) query.set("level", String(levelId));
  return <aside className={`requirement-project-link ${compact ? "compact" : ""}`}>
    <div><span>REQUIREMENT → PROJECT → COURSE</span><strong>真实需求项目待绑定</strong></div>
    <p>{lessonTitle ? `“${lessonTitle}”` : "本课程"}最终会从同一个真实需求和测试项目中取材；目前尚未提供需求与代码，不用示例项目冒充真实项目。</p>
    <a href={`/learn/real-project?${query}`}>查看项目接入方式与当前状态 →</a>
  </aside>;
}
