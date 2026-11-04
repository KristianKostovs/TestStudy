import { firstProjectMappingFor, firstRealProject } from "../real-projects/first-project";

type ProjectTrackLinkProps = {
  courseId: string;
  levelId?: number;
  lessonTitle?: string;
  compact?: boolean;
};

export default function ProjectTrackLink({ courseId, levelId, lessonTitle, compact = false }: ProjectTrackLinkProps) {
  const mapping = firstProjectMappingFor(courseId, levelId);
  const query = new URLSearchParams({ course: courseId });
  if (levelId) query.set("level", String(levelId));
  if (mapping) return <aside className={`requirement-project-link ${compact ? "compact" : ""}`}>
    <div><span>REQUIREMENT → PROJECT → COURSE</span><strong>{firstRealProject.title}</strong></div>
    <p>本关映射：{mapping.task} 当前是固定源码的静态学习映射，运行验证尚未完成。</p>
    <a href={`/learn/real-project#mapping-${courseId}-${levelId}`}>查看需求与验收标准 →</a>
  </aside>;
  return <aside className={`requirement-project-link ${compact ? "compact" : ""}`}>
    <div><span>REQUIREMENT → PROJECT → COURSE</span><strong>真实需求项目待绑定</strong></div>
    <p>{lessonTitle ? `“${lessonTitle}”` : "本课程"}尚未映射真实项目；首个固定源码样本只关联与其能力目标相符的关卡。</p>
    <a href={`/learn/real-project?${query}`}>查看项目接入方式与当前状态 →</a>
  </aside>;
}
