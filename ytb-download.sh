#!/usr/bin/env bash
set -euo pipefail

# =========================
# Config
# =========================
DEFAULT_PLAYLIST_URL="https://youtube.com/playlist?list=PLfWKEhMbWILYtzOTznu2paIGnI5YjyE5X&si=PaOvzmyVO_0GmNHQ"
PLAYLIST_URL="${1:-${PLAYLIST_URL:-${DEFAULT_PLAYLIST_URL}}}"
DOWNLOAD_DIR="${HOME}/Downloads/live"
ARCHIVE_FILE="./ytb-archive.txt"
COOKIE_BROWSER="${COOKIE_BROWSER:-chrome}"

# 输出模板：
# - 固定输出到 live 目录
# - 文件名前保留两位列表顺序
# - 标题使用纯英文/ASCII 安全风格，便于管理
OUTPUT_TEMPLATE="${DOWNLOAD_DIR}/%(playlist_index)02d_%(title).120B.%(ext)s"

# 格式策略：
# - 720p 及以下最佳视频 + 最佳音频
# - 如果拿不到分离流，则回退到 720p 及以下最佳单文件
FORMAT_SELECTOR='bv*[height<=720]+ba/b[height<=720]'

# =========================
# Checks
# =========================
if [[ "${PLAYLIST_URL}" == "YOUR_PLAYLIST_URL" || -z "${PLAYLIST_URL}" ]]; then
  echo "Error: 请传入有效的 YouTube 播放列表链接。"
  echo "示例：bash ytb-download.sh 'https://www.youtube.com/playlist?list=xxxx'"
  exit 1
fi

if ! command -v yt-dlp >/dev/null 2>&1; then
  echo "Error: 未检测到 yt-dlp。"
  echo "安装示例："
  echo "  macOS (Homebrew): brew install yt-dlp"
  echo "  Python/pip:        python3 -m pip install -U yt-dlp"
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: 未检测到 ffmpeg。"
  echo "安装示例："
  echo "  macOS (Homebrew): brew install ffmpeg"
  echo "  Ubuntu/Debian:    sudo apt install ffmpeg"
  exit 1
fi

mkdir -p "${DOWNLOAD_DIR}"
touch "${ARCHIVE_FILE}"

echo "开始下载播放列表：${PLAYLIST_URL}"
echo "下载目录：${DOWNLOAD_DIR}"
echo "归档文件：${ARCHIVE_FILE}"
echo "Cookies 浏览器：${COOKIE_BROWSER}"

yt-dlp \
  "${PLAYLIST_URL}" \
  -f "${FORMAT_SELECTOR}" \
  --merge-output-format mp4 \
  --download-archive "${ARCHIVE_FILE}" \
  --cookies-from-browser "${COOKIE_BROWSER}" \
  -o "${OUTPUT_TEMPLATE}" \
  --trim-filenames 120 \
  --windows-filenames \
  --restrict-filenames \
  --no-overwrites \
  --ignore-errors \
  --continue

echo "下载完成。再次执行本脚本时，会自动跳过 ytb-archive.txt 中已记录的视频。"
