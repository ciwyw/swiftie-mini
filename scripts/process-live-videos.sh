#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PLAYLIST_URL=""
SKIP_DOWNLOAD=0
FORCE_COVERS=0
DOWNLOAD_DIR="${DOWNLOAD_DIR:-${HOME}/Downloads/live}"
TMP_DIR="${TMP_DIR:-/tmp/swiftie-mini-live-process}"

mkdir -p "${TMP_DIR}"

count_video_files() {
  local dir="$1"
  if [[ ! -d "${dir}" ]]; then
    echo 0
    return
  fi

  find "${dir}" -maxdepth 1 -type f \
    \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o -iname '*.mkv' \) \
    | wc -l | tr -d ' '
}

list_video_files() {
  local dir="$1"
  if [[ ! -d "${dir}" ]]; then
    return
  fi

  find "${dir}" -maxdepth 1 -type f \
    \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o -iname '*.mkv' \) \
    -print | while IFS= read -r path; do basename "${path}"; done | sort
}

print_summary_block() {
  local title="$1"
  local items="$2"

  if [[ -z "${items}" ]]; then
    echo "${title}: none"
    return
  fi

  echo "${title}:"
  while IFS= read -r line; do
    [[ -n "${line}" ]] && echo "  - ${line}"
  done <<< "${items}"
}

for arg in "$@"; do
  case "${arg}" in
    --skip-download)
      SKIP_DOWNLOAD=1
      ;;
    --force-covers)
      FORCE_COVERS=1
      ;;
    *)
      if [[ -z "${PLAYLIST_URL}" ]]; then
        PLAYLIST_URL="${arg}"
      else
        echo "Error: unsupported extra argument: ${arg}"
        exit 1
      fi
      ;;
  esac
done

before_download_count="$(count_video_files "${DOWNLOAD_DIR}")"
before_download_snapshot="${TMP_DIR}/before-download.txt"
after_download_snapshot="${TMP_DIR}/after-download.txt"
video_sync_log="${TMP_DIR}/video-sync.log"
cover_sync_log="${TMP_DIR}/cover-sync.log"
live_video_sql="${TMP_DIR}/live-videos-upsert.sql"

list_video_files "${DOWNLOAD_DIR}" > "${before_download_snapshot}"

echo "Live video pipeline"
echo "1/4 Download playlist videos"
if [[ "${SKIP_DOWNLOAD}" == "1" ]]; then
  echo "Skip download step."
else
  if [[ -n "${PLAYLIST_URL}" ]]; then
    bash "${SCRIPT_DIR}/ytb-download.sh" "${PLAYLIST_URL}"
  else
    bash "${SCRIPT_DIR}/ytb-download.sh"
  fi
fi

list_video_files "${DOWNLOAD_DIR}" > "${after_download_snapshot}"
after_download_count="$(count_video_files "${DOWNLOAD_DIR}")"
downloaded_delta=$((after_download_count - before_download_count))
downloaded_files="$(comm -13 "${before_download_snapshot}" "${after_download_snapshot}" || true)"

echo "Catalog check"
DOWNLOAD_DIR="${DOWNLOAD_DIR}" node "${SCRIPT_DIR}/check-live-video-catalog.mjs"

echo "2/4 Sync videos to R2"
bash "${SCRIPT_DIR}/r2-sync-live.sh" | tee "${video_sync_log}"

echo "3/4 Sync covers to R2"
if [[ "${FORCE_COVERS}" == "1" ]]; then
  bash "${SCRIPT_DIR}/r2-sync-live-covers.sh" --force | tee "${cover_sync_log}"
else
  bash "${SCRIPT_DIR}/r2-sync-live-covers.sh" | tee "${cover_sync_log}"
fi

echo "4/4 Sync live_videos rows to D1"
node "${SCRIPT_DIR}/sync-live-videos.mjs" > "${live_video_sql}"
npx wrangler d1 execute swiftie-mini --local --config "${SCRIPT_DIR}/../server/wrangler.jsonc" --file "${live_video_sql}"
npx wrangler d1 execute swiftie-mini --remote --config "${SCRIPT_DIR}/../server/wrangler.jsonc" --file "${live_video_sql}"
echo "live_videos sync complete."

video_uploaded_files="$(grep '^Upload: ' "${video_sync_log}" | sed 's/^Upload: //' || true)"
video_skipped_files="$(grep '^Skip existing: ' "${video_sync_log}" | sed 's/^Skip existing: //' || true)"
cover_uploaded_files="$(grep -E '^(Upload cover|Force upload cover): ' "${cover_sync_log}" | sed -E 's/^(Upload cover|Force upload cover): //' || true)"
cover_skipped_files="$(grep '^Skip existing cover: ' "${cover_sync_log}" | sed 's/^Skip existing cover: //' || true)"

echo "Pipeline complete."
echo
echo "Summary"
echo "  local videos before: ${before_download_count}"
echo "  local videos after: ${after_download_count}"
if [[ "${SKIP_DOWNLOAD}" == "1" ]]; then
  echo "  downloaded this run: skipped"
else
  echo "  downloaded this run: ${downloaded_delta}"
fi
print_summary_block "Downloaded files" "${downloaded_files}"
print_summary_block "Uploaded videos" "${video_uploaded_files}"
print_summary_block "Skipped existing videos" "${video_skipped_files}"
print_summary_block "Uploaded covers" "${cover_uploaded_files}"
print_summary_block "Skipped existing covers" "${cover_skipped_files}"
