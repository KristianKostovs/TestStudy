# Python → Agent 第 8 关：工单查询助手技术样板

你不需要已有项目。这个目录是课程用于验证 VS Code、pytest 和运行证据链路的小型仓库；它不是用户的真实业务项目。

## 样例场景

客服系统需要调用工单查询接口：本地开发可以使用默认 URL，但 API Key 是必需配置，缺失时必须在启动阶段立即失败，不能带着 `Bearer None` 继续请求。项目还必须能用 MockTransport 验证 HTTP 行为，测试期间不得访问真实网络。

本关只要求你完成 `src/ticket_assistant/settings.py` 中的配置读取 TODO。`client.py`、`service.py`、测试入口和 VS Code 配置都由课程提供，让你把精力放在本关的关键逻辑上。

## 1. 创建虚拟环境

macOS / Linux：

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows PowerShell：

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

## 2. 安装课程验证过的依赖

```bash
python -m pip install -r requirements.txt
```

使用 `python -m pip` 是为了确保安装依赖与运行程序使用同一个解释器。

## 3. 完成 TODO

打开 `src/ticket_assistant/settings.py`，补齐 `load_settings()` 中的两处 TODO。

## 4. 创建本地配置

复制 `.env.example` 为 `.env`，将示例密钥改成仅供本地练习的值。不要填写真实密钥，也不要把 `.env` 提交到 Git。

macOS / Linux：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

## 5. 在 VS Code 中调试

项目已经包含：

- `.vscode/tasks.json`：运行本关测试；
- `.vscode/launch.json`：给 pytest 打断点；
- `.vscode/settings.json`：启用 pytest 并指定 `src` 目录。

在测试左侧点击调试图标，或者在“运行和调试”里选择“第 8 关：调试 pytest”。

## 6. 自动验证

```bash
python -m pytest -q
```

看到全部测试通过，才表示本机终端练习完成。网页中的“运行本关验证”会调用同一条固定命令并保存退出码与日志；DeepSeek 的文字判断不能代替这条本机执行证据。

## 项目结构

```text
ticket-assistant-level-08/
├── src/ticket_assistant/       # 配置、HTTP client 和 service
├── tests/                      # 配置与 MockTransport 测试
├── data/tickets.json           # 后续关卡可复用的本地样例
├── .vscode/                    # 测试任务与断点配置
├── .env.example
├── .gitignore
├── pyproject.toml
└── README.md
```
