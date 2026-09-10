import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import ts from 'typescript';

async function sourceConstant(path, name, bindings = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(ast) !== name) continue;
      const { outputText } = ts.transpileModule(`const value = ${declaration.initializer.getText(ast)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } });
      return Function(...Object.keys(bindings), `${outputText}; return value;`)(...Object.values(bindings));
    }
  }
  throw new Error(`Missing ${name}`);
}
const helper = await readFile(new URL('../app/courses/code-walkthrough.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(helper, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const { codeWithComments, walkthroughAnchors } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('三门课程 35 关及框架数据示例的每条解释均放在指定代码旁，Python 语义不变', async () => {
  const agent = await sourceConstant('../app/courses/python-agent-fast-track/course-data.ts', 'agentFastTrackLessons');
  const agentNotes = await sourceConstant('../app/courses/python-agent-fast-track/interactive-data.ts', 'walkthroughs');
  const ai = await sourceConstant('../app/ai-developer-level5/exercises.ts', 'exercises');
  const framework = await sourceConstant('../app/courses/python-framework/PythonCourseClient.tsx', 'levels');
  const support = await sourceConstant('../app/courses/python-framework/PythonCourseClient.tsx', 'supportByLevel', { referenceAnswers: {} });
  const groups = {
    'python-agent-fast-track': agent.map((item, i) => [item.example, agentNotes[i]]),
    'ai-developer-level5': ai.map(item => [item.example, item.walkthrough]),
    'python-framework': framework.map(item => [item.code, item.lessons]),
    'python-framework-example': Object.values(support).map(item => [item.example, item.walkthrough]),
  };
  let count = 0;
  for (const [course, examples] of Object.entries(groups)) {
    assert.equal(examples.length, walkthroughAnchors[course].length);
    for (const [[code, notes], i] of examples.map((item, index) => [item, index])) {
      const anchors = walkthroughAnchors[course][i];
      assert.equal(notes.length, anchors.length, `${course} ${i + 1}`);
      for (const anchor of anchors) assert.ok(code.split('\n').some(line => line.includes(anchor)), `${course} ${i + 1}: ${anchor}`);
      const annotated = codeWithComments(code, notes, anchors);
      for (const note of notes) assert.ok(annotated.includes(`# ${note}`));
      const result = spawnSync('python3', ['-c', `import ast,json,sys
before,after=json.load(sys.stdin)
try: original=ast.parse(before)
except SyntaxError: sys.exit(0) # Explicit mixed YAML / conceptual snippets.
assert ast.dump(original)==ast.dump(ast.parse(after))`], { input: JSON.stringify([code, annotated]), encoding: 'utf8' });
      assert.equal(result.status, 0, `${course} ${i + 1}: ${result.stderr}`);
      count++;
    }
  }
  assert.equal(count, 45);
});

test('在线编辑的多行说明均成为注释，缺少定位也不会丢失文字', () => {
  assert.equal(codeWithComments('    x = 1', ['说明\n第二行'], ['x =']), '    # 说明\n    # 第二行\n    x = 1');
  assert.equal(codeWithComments('x = 1', ['保留'], ['old']), '# 保留\nx = 1');
});
