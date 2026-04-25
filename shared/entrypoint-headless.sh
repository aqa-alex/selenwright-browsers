#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "$(realpath "$0")")/common.sh"

cleanup() {
  terminate_pid "${app_pid:-}"
  terminate_pid "${capture_pid:-}"
}

trap cleanup EXIT
trap 'exit 143' TERM INT

if [[ -n "${PW_DOWNLOADS_PATH:-}" && -n "${SELENWRIGHT_DOWNLOADS_DIR:-}" ]]; then
  capture_downloads >/tmp/capture.log 2>&1 &
  capture_pid=$!
fi

"$@" &
app_pid=$!
wait "${app_pid}"
