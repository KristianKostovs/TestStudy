# 网页内 Codex 即时学习模式

## 怎么使用

在 Mac 上双击仓库中的 `启动本地Codex学习站.command`。课程连接器与学习网页就绪后，浏览器会打开以下地址。练习时请保留启动窗口。

`http://127.0.0.1:3000/courses/python-framework`

VS Code 练习和本关验证仅需本地连接器。使用 AI 助教时，还需要本机已登录 Codex。

也可以先打开正式网站。页面检测到 Codex 内嵌浏览器无法连接时，点击“进入本机学习模式”，会在当前浏览器切换到本机页面，并迁移已有课程进度、答案和对话。

进入任一关的“动手练”，先在代码框写答案。看到“本机 Codex 已连接”后，可以在网页内：

- 点击“立即批改当前答案”；
- 点击“只给我一点提示”；
- 在聊天框继续问“为什么错”“这个函数是什么意思”或“再检查一次”。

批改结果会写回当前浏览器的课程进度。整个学习、提交、对话和查看结果的过程都不需要离开网页。

## VS Code 真实项目练习

支持真实项目的关卡会显示“在 VS Code 中打开”和“运行本关验证”。第一次打开时，本地连接器会把课程登记过的项目复制到 `~/PythonQuestWorkspaces/`；再次打开会保留已有代码，不会用新版骨架覆盖练习。

在“课前积木”中，VS Code 会直接选中本关要修改的文件。第一关打开 `exercises/01_values.py`。保存修改后，网页的“运行本关验证”会检查这个文件。`examples/` 目录里的同名文件供阅读和对照。

网页只能请求登记过的课程项目和固定测试命令，不能传入任意本地路径或 Shell 命令。测试输出、退出码和耗时会回到网页。Python 框架课前积木的八个练习使用 Python 标准库，Python → Agent 第 8 关使用 pytest。

Python → Agent 第 8 关的选做练习会打开 `src/ticket_assistant/settings.py`。职业课程的五项本机测试共用 `quality-engineering-lab/src/lab.py`，按钮会定位到本关函数。网页登记本机测试结果，手动运行的结果可以写入自查记录。

## 已单独配置登录自启的 Mac

- 配置文件：`~/Library/LaunchAgents/com.baiyi.python-framework-quest-codex.plist`
- 服务名称：`com.baiyi.python-framework-quest-codex`
- 日志：`~/Library/Logs/python-framework-quest-codex.log`
- 本机网页配置：`~/Library/LaunchAgents/com.baiyi.python-framework-quest-site.plist`
- 本机网页服务：`com.baiyi.python-framework-quest-site`
- 本机网页日志：`~/Library/Logs/python-framework-quest-site.log`
- 如果以上服务已在运行，双击启动文件会复用已就绪的服务。

## 安全边界

- 学习桥只监听 `127.0.0.1`，不会对局域网或公网开放。
- 本机学习网页只监听 `127.0.0.1:3000`，不会对局域网或公网开放。
- 只接受正式学习站和本地开发课程页面的请求。
- Codex 助教仍以非交互只读沙箱运行，不允许修改课程或其他本地文件。
- VS Code 项目桥只会在 `~/PythonQuestWorkspaces/` 创建登记过的练习副本，并只运行登记过的验证命令。
- 不需要 API Key；调用使用本机当前的 Codex 登录。
