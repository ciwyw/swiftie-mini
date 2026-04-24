#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${SOURCE_DIR:-${HOME}/Downloads/live}"
BUCKET_NAME="${BUCKET_NAME:-swiftie-mini-assets}"
R2_PREFIX="${R2_PREFIX:-live}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev}"

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: missing curl."
  exit 1
fi

if ! command -v file >/dev/null 2>&1; then
  echo "Error: missing file."
  exit 1
fi

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Error: source directory not found: ${SOURCE_DIR}"
  exit 1
fi

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

uploaded_count=0
skipped_count=0

echo "Syncing ${#files[@]} file(s) from ${SOURCE_DIR}"
echo "R2 bucket: ${BUCKET_NAME}"
echo "R2 prefix: ${R2_PREFIX}"

for file_path in "${files[@]}"; do
  file_name="$(basename "${file_path}")"
  object_key="${R2_PREFIX}/${file_name}"
  public_url="${PUBLIC_BASE_URL}/${object_key}"

  status_code="$(curl -s -o /dev/null -w "%{http_code}" -I "${public_url}")"
  if [[ "${status_code}" == "200" ]]; then
    echo "Skip existing: ${object_key}"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  if [[ "${status_code}" != "404" ]]; then
    echo "Error: unexpected response ${status_code} for ${public_url}"
    exit 1
  fi

  mime_type="$(file --brief --mime-type "${file_path}" || echo "application/octet-stream")"
  echo "Upload: ${object_key}"
  npx wrangler r2 object put "${BUCKET_NAME}/${object_key}" \
    --remote \
    --file "${file_path}" \
    --content-type "${mime_type}"
  uploaded_count=$((uploaded_count + 1))
done

echo "Sync complete: uploaded=${uploaded_count}, skipped=${skipped_count}"
