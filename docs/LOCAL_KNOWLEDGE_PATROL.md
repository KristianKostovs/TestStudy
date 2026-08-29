# 本地知识库巡检

## 巡检范围

原电脑通过本地配置 `.local/learning-sources.json` 指向知识库总目录。该配置不会上传 GitHub。

巡检把根目录下的每个一级子文件夹识别为独立项目，例如 EWMS、MOM、SPSP 和不同 Knowledge Skill。以后新增的一级项目文件夹会自动进入下一次巡检，无需修改脚本。

默认检查 Markdown、Python、YAML、JSON、HTML、JavaScript、TypeScript、TOML、INI、TXT 和 Java 文本文件，并排除：

- Git、CodeGraph、Node、Python 和构建缓存。
- `output`、`outputs`、`reports`、`_reports` 等执行产物。
- 图片、Excel、XMind 等二进制材料。
- 超过 2 MB 的单个文件。

## 工作方式

首次执行只建立 SHA-256 内容指纹基线。后续执行识别新增、修改和删除：

```bash
npm run knowledge:scan
```

发现变化后，结果保存在本地 `work/knowledge-diff/`：

- `latest.json`：机器可读的完整变化。
- `latest.md`：按项目展示的巡检摘要。
- `pending.json`：等待 Knowledge Diff 评审的快照。
- `review-latest.md`：Codex 生成的课程影响评审。
- `state.json`：已经确认的上次基线。

待评审变化不会因为下一次巡检而消失。只有成功生成课程影响评审后才执行：

```bash
npm run knowledge:ack
```

## 安全边界

- 巡检仅阅读本地知识库，不改动原始项目。
- 巡检结果和本地绝对路径不提交 GitHub。
- 自动任务不修改网站课程、不执行 Git 提交、不调用一键发布。
- 课程变更仍由用户确认后实施并发布。
- 原电脑关闭、休眠或 Codex 未运行时，本地巡检不会执行；恢复后可手动运行一次。
