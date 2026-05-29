#!/usr/bin/env bash
# serve.sh — 用本機 HTTP 伺服器開啟 FinMath Map
# 為什麼需要它：直接用 file:// 雙擊開啟 index.html，Chrome 會把每個檔案
# 視為獨立的安全來源（unique origin），導致 console 出現
# "Unsafe attempt to load URL ... 'file:' URLs are treated as unique security origins"，
# 且 localStorage 進度儲存可能被擋。改用 http://localhost 即可解決。
#
# 用法：
#   ./serve.sh            # 預設 port 8000
#   ./serve.sh 8080       # 指定 port

set -e
PORT="${1:-8000}"
URL="http://localhost:${PORT}"

# 切換到此腳本所在目錄（即專案根目錄）
cd "$(dirname "$0")"

echo "📈 FinMath Map 啟動中 → ${URL}"
echo "   （按 Ctrl+C 停止伺服器）"

# 嘗試自動開啟瀏覽器（背景延遲，等伺服器就緒）
( sleep 1
  if command -v open >/dev/null 2>&1; then open "${URL}";          # macOS
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "${URL}"; # Linux
  fi ) >/dev/null 2>&1 &

# 啟動靜態伺服器（優先 python3，其次 python）
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "${PORT}"
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "${PORT}"
else
  echo "❌ 找不到 python3 / python。請改用 VS Code 的 Live Server 擴充，或安裝 Python。"
  exit 1
fi
