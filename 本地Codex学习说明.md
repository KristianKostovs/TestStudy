# 网页内 Codex 即时学习模式

## 怎么使用

在 Codex 内嵌浏览器中，推荐直接打开本机学习入口：

`http://127.0.0.1:3000/courses/python-framework`

本机学习网页和 Codex 后台服务都会随 macOS 登录自动启动。网页与 Codex 都位于本机地址，不再依赖浏览器的“本地网络访问”授权弹窗。

也可以先打开正式网站。页面检测到 Codex 内嵌浏览器无法连接时，点击“进入本机学习模式”，会在当前浏览器切换到本机页面，并迁移已有课程进度、答案和对话。

进入任一关的“动手练”，先在代码框写答案。看到“本机 Codex 已连接”后，可以在网页内：

- 点击“立即批改当前答案”；
- 点击“只给我一点提示”；
- 在聊天框继续问“为什么错”“这个函数是什么意思”或“再检查一次”。

批改结果会写回当前浏览器的课程进度。整个学习、提交、对话和查看结果的过程都不需要离开网页。

## VS Code 真实项目练习

支持真实项目的关卡会显示“在 VS Code 中打开”和“运行本关验证”。第一次打开时，本地连接器会把课程登记过的项目复制到 `~/PythonQuestWorkspaces/`；再次打开会保留已有代码，不会用新版骨架覆盖练习。

网页只能请求登记过的课程项目和固定测试命令，不能传入任意本地路径或 Shell 命令。测试输出、退出码和耗时会回到网页，作为实际执行证据。当前首个试点是 Python → Agent 第 8 关。

## 后台服务

- 配置文件：`~/Library/LaunchAgents/com.baiyi.python-framework-quest-codex.plist`
- 服务名称：`com.baiyi.python-framework-quest-codex`
- 日志：`~/Library/Logs/python-framework-quest-codex.log`
- 本机网页配置：`~/Library/LaunchAgents/com.baiyi.python-framework-quest-site.plist`
- 本机网页服务：`com.baiyi.python-framework-quest-site`
- 本机网页日志：`~/Library/Logs/python-framework-quest-site.log`
- 旧的 `启动本地Codex学习站.command` 只保留为开发调试备用，不再是日常入口。

## 安全边界

- 学习桥只监听 `127.0.0.1`，不会对局域网或公网开放。
- 本机学习网页只监听 `127.0.0.1:3000`，不会对局域网或公网开放。
- 只接受正式学习站和本地开发课程页面的请求。
- Codex 助教仍以非交互只读沙箱运行，不允许修改课程或其他本地文件。
- VS Code 项目桥只会在 `~/PythonQuestWorkspaces/` 创建登记过的练习副本，并只运行登记过的验证命令。
- 不需要 API Key；调用使用本机当前的 Codex 登录。
