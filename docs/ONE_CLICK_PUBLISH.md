# 两台电脑一键提交并发布

## 目标

任意一台维护电脑修改 TestStudy 后，通过同一入口完成：

1. 检查本地敏感文件与登录状态。
2. 安全整合另一台电脑已经提交的 GitHub 更新。
3. 构建并运行测试。
4. 提交并推送 GitHub `main`。
5. 将同一个提交发布到现有 Sites 项目。

启动器不会上传 EWMS/MOM 原始项目、`.env.local`、API Key、Cookie 或本机登录状态，也不会改变 GitHub 仓库或学习网站的访问范围。

## 每台电脑首次准备

1. 安装 Git、Node.js 22.13+、GitHub CLI 和 Codex 桌面应用。
2. 使用同一个 ChatGPT/Codex 账号登录 Codex。
3. 获取网站源码：

   ```bash
   git clone https://github.com/KristianKostovs/TestStudy.git
   cd TestStudy
   npm install
   ```

4. 首次运行时，如果 GitHub CLI 尚未授权，启动器会打开 GitHub 官方设备授权页面。

## 使用方式

macOS 双击仓库根目录的 `一键提交并发布.command`。

Windows 双击仓库根目录的 `一键提交并发布.cmd`。

也可以在任意系统的终端执行：

```bash
npm run publish:site -- "补充 UI 自动化第 3 关"
```

启动后输入本次修改说明并保持窗口开启。完成后刷新线上学习网站即可。

## 冲突与失败策略

- 另一台电脑已经更新了同一文件：停止发布，保留两边内容，等待人工决定如何合并。
- 测试失败：不推送、不发布。
- GitHub 或 Sites 临时断开：停止在当前步骤，本地文件和已经创建的本地提交仍保留，网络恢复后重新运行即可。
- 发现 `.env`、私钥、Cookie 或登录状态文件：立即停止，不上传。
- 没有内容变化：仍可验证并重新发布当前提交。

## 数据同步边界

- GitHub 同步网站源码与已经提炼、脱敏的课程内容。
- Sites D1 保存网站上的跨设备学习记录。
- EWMS/MOM 等本地项目只在有源码的电脑上用于更新课程，不会上传到 TestStudy。
- 托管环境中的模型密钥由 Sites 保存，不进入 GitHub；另一台电脑使用线上页面时不需要复制密钥。
