#!/bin/zsh
set -euo pipefail

quest_dir="${0:A:h}"
cd "$quest_dir"

course_url="http://127.0.0.1:3000/courses/python-framework"
bridge_url="http://127.0.0.1:4317/health"
bridge_pid=""
site_pid=""
cleanup() {
  local pid
  for pid in "$bridge_pid" "$site_pid"; do
    if [[ -n "$pid" ]]; then kill "$pid" 2>/dev/null || true; fi
  done
  if [[ "$1" == 1 && -t 0 ]]; then read -r "?按回车关闭…" || true; fi
}
trap 'cleanup $?' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM HUP
fail() { print -u2 -r -- "$1"; exit 1; }

# Finder may start this file without Node or a package manager on PATH.
runtime_dir="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies"
path+=(/opt/homebrew/bin /usr/local/bin "$runtime_dir/bin/fallback")
node_bin=""
for candidate in "${commands[node]:-}" /opt/homebrew/bin/node /usr/local/bin/node "$runtime_dir/node/bin/node"; do
  # The desktop app's UI runtime cannot load the site's native Vite modules.
  [[ "${candidate:A}" == */Contents/Resources/cua_node/bin/node ]] && continue
  if [[ -x "$candidate" ]] && "$candidate" -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)' 2>/dev/null; then
    node_bin="$candidate"
    break
  fi
done
[[ -n "$node_bin" ]] || fail "启动学习站需要 Node.js 22.13 或更高版本。请安装 Node.js 后再双击此文件。"
export PATH="${node_bin:h}:$PATH"

fetch_local() { curl --noproxy '*' -fsS --max-time 5 "$1" 2>/dev/null; }
bridge_ready() { fetch_local "$bridge_url" | grep -E '"workspaceBridge"[[:space:]]*:[[:space:]]*true' >/dev/null; }
site_ready() { fetch_local "$course_url" | grep -F '/courses/python-framework/building-blocks' >/dev/null; }
require_free_port() {
  if lsof -nP -iTCP:"$1" -sTCP:LISTEN -t >/dev/null 2>&1; then
    fail "端口 $1 已有服务在监听，但未返回学习站预期的内容。请查看占用该端口的服务后重试。"
  fi
}

if ! bridge_ready; then
  require_free_port 4317
  echo "正在启动课程连接器…"
  PYTHON_QUEST_CODEX_PORT=4317 node local-companion/server.mjs &
  bridge_pid=$!
fi

if ! site_ready; then
  require_free_port 3000
  if [[ ! -x node_modules/.bin/vinext ]]; then
    echo "首次启动，正在安装学习站依赖…"
    if (( $+commands[pnpm] )); then
      pnpm install --frozen-lockfile || fail "学习站依赖安装失败。请查看上面的安装信息。"
    elif (( $+commands[npm] )); then
      npm ci || fail "学习站依赖安装失败。请查看上面的安装信息。"
    else
      fail "首次安装学习站依赖需要 pnpm 或 npm。请安装带 npm 的 Node.js 后再次启动。"
    fi
  fi
  echo "正在启动学习网页…"
  WRANGLER_LOG_PATH=.wrangler/wrangler.log node_modules/.bin/vinext dev --hostname 127.0.0.1 --port 3000 &
  site_pid=$!
fi

deadline=$((SECONDS + 75))
until bridge_ready && site_ready; do
  if [[ -n "$bridge_pid" ]] && ! kill -0 "$bridge_pid" 2>/dev/null; then
    fail "课程连接器启动失败，请查看上面的错误信息。"
  fi
  if [[ -n "$site_pid" ]] && ! kill -0 "$site_pid" 2>/dev/null; then
    fail "学习网页启动失败，请查看上面的错误信息。"
  fi
  (( SECONDS < deadline )) || fail "等待课程连接器或学习网页超时，请查看上面的启动日志。"
  sleep 0.5
done

echo "课程连接器已就绪，学习网页地址为 $course_url"
open "$course_url" || echo "请在浏览器中打开上面的网址。"
if [[ -n "$bridge_pid$site_pid" ]]; then
  echo "练习时请保留此窗口。按 Control+C 可以关闭本次启动的服务。"
  wait "${site_pid:-$bridge_pid}"
fi
