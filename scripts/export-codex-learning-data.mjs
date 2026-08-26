import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = process.argv[2];

if (!outputPath || !path.isAbsolute(outputPath)) {
  throw new Error("请传入一个明确的绝对输出路径，例如 /Users/name/plugins/python-learning-quest/assets/course-data.json");
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  throw new Error(`不支持的属性名: ${node.getText()}`);
}

function literalValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalValue);
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(node.properties.map((property) => {
      if (!ts.isPropertyAssignment(property)) throw new Error(`不支持的对象字段: ${property.getText()}`);
      return [propertyName(property.name), literalValue(property.initializer)];
    }));
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) return -literalValue(node.operand);
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return literalValue(node.expression);
  throw new Error(`不支持的课程数据表达式: ${node.getText().slice(0, 120)}`);
}

async function extractConstant(relativePath, constantName, scriptKind = ts.ScriptKind.TSX) {
  const absolutePath = path.join(projectRoot, relativePath);
  const sourceText = await readFile(absolutePath, "utf8");
  const source = ts.createSourceFile(absolutePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  let initializer;
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === constantName) initializer = declaration.initializer;
    }
  });
  if (!initializer) throw new Error(`在 ${relativePath} 中找不到常量 ${constantName}`);
  return literalValue(initializer);
}

const [
  levels,
  supportByLevel,
  knowledgeByLevel,
  inlineTokensByTerm,
  chapters,
  modules,
  gradingRubrics,
] = await Promise.all([
  extractConstant("app/courses/python-framework/PythonCourseClient.tsx", "levels"),
  extractConstant("app/courses/python-framework/PythonCourseClient.tsx", "supportByLevel"),
  extractConstant("app/courses/python-framework/PythonCourseClient.tsx", "knowledgeByLevel"),
  extractConstant("app/courses/python-framework/PythonCourseClient.tsx", "inlineTokensByTerm"),
  extractConstant("app/courses/python-framework/chapter-data.ts", "pythonCourseChapters", ts.ScriptKind.TS),
  extractConstant("app/learning-registry.ts", "learningModules", ts.ScriptKind.TS),
  extractConstant("app/courses/python-framework/grading-rubrics.ts", "gradingRubrics", ts.ScriptKind.TS),
]);

const chapterForLevel = new Map(chapters.flatMap((chapter) => chapter.levelIds.map((levelId) => [levelId, chapter.id])));
const rubricForLevel = new Map(gradingRubrics.map((rubric) => [rubric.levelId, rubric]));

const exportedLevels = levels.map((level) => ({
  ...level,
  chapterId: chapterForLevel.get(level.id),
  support: supportByLevel[String(level.id)] ?? {},
  knowledge: (knowledgeByLevel[String(level.id)] ?? []).map((item) => ({
    ...item,
    tokens: inlineTokensByTerm[item.term] ?? [],
  })),
  rubric: rubricForLevel.get(level.id) ?? null,
}));

if (!modules.length || exportedLevels.length !== 10 || chapters.flatMap((chapter) => chapter.levelIds).length !== exportedLevels.length) {
  throw new Error("课程导出完整性检查失败：模块、章节或十关数据不一致");
}

const payload = {
  schemaVersion: 1,
  source: "python-framework-quest",
  modules,
  chapters,
  levels: exportedLevels,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
process.stdout.write(`已导出 ${modules.length} 个方向、${chapters.length} 个章节、${exportedLevels.length} 个关卡到 ${outputPath}\n`);
