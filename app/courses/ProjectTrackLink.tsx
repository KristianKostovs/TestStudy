import { firstProjectMappingFor, firstRealProject } from "../real-projects/first-project";

type ProjectTrackLinkProps = {
  courseId: string;
  levelId?: number;
  lessonTitle?: string;
  compact?: boolean;
};

export default function ProjectTrackLink({ courseId, levelId, compact = false }: ProjectTrackLinkProps) {
  const mapping = firstProjectMappingFor(courseId, levelId);
  if (!mapping) return null;
  return <aside className={`requirement-project-link ${compact ? "compact" : ""}`}>
    <div><span>项目练习</span><strong>{firstRealProject.title}</strong></div>
    <p>{mapping.task}</p>
    <a href={`/learn/real-project#mapping-${courseId}-${levelId}`}>查看任务 →</a>
  </aside>;
}
