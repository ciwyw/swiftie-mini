#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${SOURCE_DIR:-${HOME}/Downloads/live}"
COVER_DIR="${COVER_DIR:-/tmp/swiftie-mini-live-covers}"
BUCKET_NAME="${BUCKET_NAME:-swiftie-mini-assets}"
R2_PREFIX="${R2_PREFIX:-live/covers}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev}"
FORCE_REUPLOAD=0

for arg in "$@"; do
  if [[ "${arg}" == "--force" ]]; then
    FORCE_REUPLOAD=1
  fi
done

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: missing curl."
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: missing ffmpeg."
  exit 1
fi

if ! command -v ffprobe >/dev/null 2>&1; then
  echo "Error: missing ffprobe."
  exit 1
fi

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Error: source directory not found: ${SOURCE_DIR}"
  exit 1
fi

get_remote_status_code() {
  local url="$1"
  local attempt
  local status_code

  for attempt in 1 2 3; do
    status_code="$(curl -s -o /dev/null -w "%{http_code}" -I --connect-timeout 10 --max-time 20 "${url}")" && {
      echo "${status_code}"
      return 0
    }
    sleep 1
  done

  echo "Error: failed to check remote object after retries: ${url}"
  return 1
}

mkdir -p "${COVER_DIR}"

files=()
while IFS= read -r -d '' file_path; do
  files+=("${file_path}")
done < <(
  find "${SOURCE_DIR}" -maxdepth 1 -type f \
    \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o -iname '*.mkv' \) \
    -print0 | sort -z
)

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No video files found in ${SOURCE_DIR}"
  exit 0
fi

pick_window_start() {
  local duration="$1"
  awk -v d="${duration}" 'BEGIN {
    t = d * 0.12;
    if (t < 8) t = 8;
    if (t > 28) t = 28;
    if (t > d / 3) t = d / 3;
    if (t < 1) t = 1;
    printf "%.3f", t;
  }'
}

pick_window_duration() {
  local duration="$1"
  local start="$2"
  awk -v d="${duration}" -v s="${start}" 'BEGIN {
    remaining = d - s - 2;
    t = d * 0.35;
    if (t < 18) t = 18;
    if (t > 36) t = 36;
    if (remaining < t) t = remaining;
    if (t < 6) t = 6;
    printf "%.3f", t;
  }'
}

uploaded_count=0
skipped_count=0

echo "Generating and syncing cover(s) for ${#files[@]} file(s) from ${SOURCE_DIR}"
echo "Cover temp dir: ${COVER_DIR}"
echo "R2 bucket: ${BUCKET_NAME}"
echo "R2 prefix: ${R2_PREFIX}"

for file_path in "${files[@]}"; do
  file_name="$(basename "${file_path}")"
  file_stem="${file_name%.*}"
  cover_name="${file_stem}.jpg"
  cover_path="${COVER_DIR}/${cover_name}"
  object_key="${R2_PREFIX}/${cover_name}"
  public_url="${PUBLIC_BASE_URL}/${object_key}"

  duration="$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${file_path}")"
  window_start="$(pick_window_start "${duration}")"
  window_duration="$(pick_window_duration "${duration}" "${window_start}")"

  ffmpeg \
    -loglevel error \
    -y \
    -ss "${window_start}" \
    -i "${file_path}" \
    -t "${window_duration}" \
    -frames:v 1 \
    -vf "fps=1,thumbnail=30,scale='min(960,iw)':-2" \
    -q:v 2 \
    "${cover_path}"

  if [[ "${FORCE_REUPLOAD}" == "1" ]]; then
    echo "Force upload cover: ${object_key}"
    npx wrangler r2 object put "${BUCKET_NAME}/${object_key}" \
      --remote \
      --file "${cover_path}" \
      --content-type "image/jpeg"
    uploaded_count=$((uploaded_count + 1))
    continue
  fi

  status_code="$(get_remote_status_code "${public_url}")"
  if [[ "${status_code}" == "200" ]]; then
    echo "Skip existing cover: ${object_key}"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  if [[ "${status_code}" != "404" ]]; then
    echo "Error: unexpected response ${status_code} for ${public_url}"
    exit 1
  fi

  echo "Upload cover: ${object_key}"
  npx wrangler r2 object put "${BUCKET_NAME}/${object_key}" \
    --remote \
    --file "${cover_path}" \
    --content-type "image/jpeg"
  uploaded_count=$((uploaded_count + 1))
done

echo "Cover sync complete: uploaded=${uploaded_count}, skipped=${skipped_count}"
