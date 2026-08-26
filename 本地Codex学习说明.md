# 网页内 Codex 即时学习模式

## 怎么使用

直接打开正式学习网站：

`https://python-framework-quest.leafy-slug-3142.chatgpt.site/courses/python-framework`

本机后台服务会随 macOS 登录自动启动。网页检测到服务后，会在当前关卡内直接显示 Codex 对话区。

进入任一关的“动手练”，先在代码框写答案。看到“本机 Codex 已连接”后，可以在网页内：

- 点击“立即批改当前答案”；
- 点击“只给我一点提示”；
- 在聊天框继续问“为什么错”“这个函数是什么意思”或“再检查一次”。

批改结果会写回当前浏览器的课程进度。整个学习、提交、对话和查看结果的过程都不需要离开网页。

## 后台服务

- 配置文件：`~/Library/LaunchAgents/com.baiyi.python-framework-quest-codex.plist`
- 服务名称：`com.baiyi.python-framework-quest-codex`
- 日志：`~/Library/Logs/python-framework-quest-codex.log`
- 旧的 `启动本地Codex学习站.command` 只保留为开发调试备用，不再是日常入口。

## 安全边界

- 学习桥只监听 `127.0.0.1`，不会对局域网或公网开放。
- 只接受正式学习站和本地开发课程页面的请求。
- Codex 以非交互只读沙箱运行，不允许修改课程或其他本地文件。
- 不需要 API Key；调用使用本机当前的 Codex 登录。
