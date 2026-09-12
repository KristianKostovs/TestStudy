# Python → Agent 第 8 关项目骨架

你不需要已有项目。这个目录就是一个最小的“工单查询助手”项目，练习目标是从零建立虚拟环境、安装固定依赖，并把配置从代码外部传入。

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

打开 `ticket_assistant/settings.py`，补齐 `TICKET_API_URL` 和 `TICKET_API_KEY` 两行。

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

## 5. 自动验证

```bash
python verify_setup.py
```

看到 `第 8 关环境验证通过`，才表示真实终端练习完成。网页中的 DeepSeek 只能检查你写出的文件内容，不能代替这条本机执行证据。
