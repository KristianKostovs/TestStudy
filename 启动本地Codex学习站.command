#!/bin/zsh
set -euo pipefail

quest_dir="${0:A:h}"
cd "$quest_dir"

codex_bin="/Applications/ChatGPT.app/Contents/Resources/codex"
if [[ ! -x "$codex_bin" ]]; then
  codex_bin="$(command -v codex || true)"
fi

if [[ -z "$codex_bin" ]]; then
  echo "没有找到 Codex。请先安装或打开 Codex 桌面应用。"
  read "?按回车关闭…"
  exit 1
fi

if ! "$codex_bin" login status >/dev/null 2>&1; then
  echo "Codex 还没有登录。请先在 Codex 应用中登录 ChatGPT。"
  read "?按回车关闭…"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "首次启动，正在安装学习站依赖…"
  npm install
fi

bridge_pid=""
site_pid=""
cleanup() {
  [[ -n "$bridge_pid" ]] && kill "$bridge_pid" >/dev/null 2>&1 || true
  [[ -n "$site_pid" ]] && kill "$site_pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "正在连接本机 Codex…"
PYTHON_QUEST_CODEX_BIN="$codex_bin" node local-companion/server.mjs &
bridge_pid=$!

echo "正在启动学习网页…"
npm run dev &
site_pid=$!

for attempt in {1..80}; do
  if curl -fsS http://127.0.0.1:4317/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:3000/courses/python-framework >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

echo "学习站已打开。保留此窗口即可继续使用本地 Codex；按 Control+C 关闭。"
open "http://localhost:3000/courses/python-framework"
wait "$site_pid"
