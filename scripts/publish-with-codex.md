你正在执行用户主动触发的“TestStudy 一键提交并发布”。用户已经在本次启动器操作中明确授权：将当前变更提交到 KristianKostovs/TestStudy，并把验证通过的版本发布到该 Sites 项目当前已有的访问范围。不要改变仓库可见性、Sites 访问范围、域名、环境变量或数据库内容。

项目目录：{{PROJECT_DIRECTORY}}
提交说明：{{COMMIT_MESSAGE}}

必须完整执行以下流程；任一步存在冲突、权限失败或验证失败时立即停止并说明，不得覆盖远端或丢弃本地修改：

1. 完整阅读并遵循 sites-building 与 sites-hosting skills。读取 `.openai/hosting.json`，复用其中现有 project_id，绝不创建新 Site。
2. 确认当前目录是独立 Git 仓库、远端为 `https://github.com/KristianKostovs/TestStudy.git`，并检查不存在正在进行的 merge/rebase。不得提交 `.env*`（`.env.example` 除外）、Token、Cookie、私钥、storage state、数据库凭证或其他敏感内容。
3. 读取远端 `main` 的最新 SHA。安全整合远端更新并保留本地修改；正常 Git 网络超时后可以改用已登录的 GitHub CLI/API，但更新远端前必须重新核对远端 SHA，禁止 force push。发生内容冲突时停止，让用户决定。
4. 运行 `npm install`（仅在依赖缺失时）和 `npm test`。失败时停止，不提交失败版本到远端，也不发布。
5. 使用提交说明 `{{COMMIT_MESSAGE}}` 提交所有经过检查的站点修改。没有文件变化时复用当前 HEAD。把当前完整源码安全推送到 GitHub `main`，并确认远端树与本地 HEAD 树一致。
6. 按 sites-hosting 流程把同一提交推送到该 Site 的内部源码仓库，使用官方打包脚本从成功构建的同一源码生成发布包，保存一个 Site 版本。
7. 获取 Site 当前访问配置。本次启动器点击即代表用户批准将该版本部署到“当前已有访问范围”；使用与当前访问配置匹配的部署工具，绝不扩大或缩小访问范围。轮询到成功或失败。
8. 成功后只报告 GitHub 已同步、构建已通过、生产发布 URL；失败则明确指出停在哪一步以及本地修改是否已安全保留。

不得修改产品功能来绕过测试，不得隐藏错误，不得把短期发布凭证写入文件、远端 URL、Git 配置、日志或最终答复。
