export type ProjectStudyPlan = {
  id: string;
  title: string;
  status: string;
  problem: string;
  goal: string;
  prerequisites: readonly string[];
  input: string;
  output: string;
  rules: readonly string[];
  exclusions: readonly string[];
  evidence: string;
  acceptance: readonly { id: string; scenario: string; expected: string }[];
};

export type ProjectCourseTask = {
  courseId: string;
  levelId: number;
  title: string;
  task: string;
  output: string;
};
