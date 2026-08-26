export type CapabilityRoute = {
  competency: string;
  courseId: string;
  courseTitle: string;
  href: string;
};

export const capabilityRoutes: CapabilityRoute[] = [
  { competency: "测试基础", courseId: "quality-engineering", courseTitle: "质量工程与保障", href: "/courses/quality-engineering" },
  { competency: "技术深度", courseId: "python-framework", courseTitle: "Python 框架基础", href: "/courses/python-framework" },
  { competency: "接口测试", courseId: "api-automation", courseTitle: "API 自动化", href: "/courses/api-automation" },
  { competency: "Web 自动化", courseId: "ui-automation", courseTitle: "UI 自动化", href: "/courses/ui-automation" },
  { competency: "AI 质量方法", courseId: "ai-testing", courseTitle: "AI 测试", href: "/courses/ai-testing" },
  { competency: "Agent 系统测试", courseId: "ai-testing", courseTitle: "AI 测试", href: "/courses/ai-testing" },
  { competency: "性能与可靠性", courseId: "performance-testing", courseTitle: "性能测试", href: "/courses/performance-testing" },
  { competency: "CI/CD", courseId: "quality-engineering", courseTitle: "质量工程与保障", href: "/courses/quality-engineering" },
  { competency: "架构判断", courseId: "quality-engineering", courseTitle: "质量工程与保障", href: "/courses/quality-engineering" },
];

export function courseForCompetency(competency: string): CapabilityRoute | undefined {
  return capabilityRoutes.find((item) => item.competency === competency);
}
