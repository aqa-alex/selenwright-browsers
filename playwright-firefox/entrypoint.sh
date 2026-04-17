#!/usr/bin/env bash
set -euo pipefail

DISPLAY_NUM="${DISPLAY_NUM:-99}"
export DISPLAY="${DISPLAY:-:${DISPLAY_NUM}}"
SCREEN_RESOLUTION="${SCREEN_RESOLUTION:-1920x1080x24}"

normalize_bool() {
  local value
  value="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')"
  case "${value}" in
    1|true|yes|on)
      printf 'true'
      ;;
    *)
      printf 'false'
      ;;
  esac
}

ENABLE_VNC_NORMALIZED="$(normalize_bool "${ENABLE_VNC:-true}")"

wait_for_x() {
  local retries=50
  local delay=0.1
  local i

  for ((i = 0; i < retries; i++)); do
    if xdpyinfo -display "${DISPLAY}" >/dev/null 2>&1; then
      return 0
    fi
    sleep "${delay}"
  done

  echo "X display ${DISPLAY} did not become ready in time" >&2
  return 1
}

terminate_pid() {
  local pid="${1:-}"
  if [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1; then
    kill "${pid}" >/dev/null 2>&1 || true
    wait "${pid}" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  terminate_pid "${app_pid:-}"
  terminate_pid "${capture_pid:-}"
  terminate_pid "${clipboard_pid:-}"
  terminate_pid "${vnc_pid:-}"
  terminate_pid "${wm_pid:-}"
  terminate_pid "${xvfb_pid:-}"
}

capture_downloads() {
  local src_dir="${PW_DOWNLOADS_PATH:-}"
  local dst_dir="${SELENWRIGHT_DOWNLOADS_DIR:-}"
  if [[ -z "${src_dir}" || -z "${dst_dir}" ]]; then
    return 0
  fi
  mkdir -p "${dst_dir}"
  inotifywait -m -q -e close_write -e moved_to --format '%f' "${src_dir}" | while read -r name; do
    [[ -n "${name}" ]] || continue
    # Skip Chromium's atomic-write temp files (".org.chromium.Chromium.XXX") —
    # they get renamed to the final UUID on moved_to, which we will hardlink.
    [[ "${name}" == .* ]] && continue
    ln -f "${src_dir}/${name}" "${dst_dir}/${name}" 2>/dev/null || true
  done
}

trap cleanup EXIT
trap 'exit 143' TERM INT

Xvfb "${DISPLAY}" -screen 0 "${SCREEN_RESOLUTION}" -ac +extension RANDR -nolisten tcp &
xvfb_pid=$!

wait_for_x

fluxbox >/tmp/fluxbox.log 2>&1 &
wm_pid=$!

if [[ "${ENABLE_VNC_NORMALIZED}" == "true" ]]; then
  x11vnc \
    -display "${DISPLAY}" \
    -rfbport 5900 \
    -forever \
    -shared \
    -nopw \
    -xkb \
    >/tmp/x11vnc.log 2>&1 &
  vnc_pid=$!
fi

node /opt/playwright/clipboard.cjs >/tmp/clipboard.log 2>&1 &
clipboard_pid=$!

if [[ -n "${PW_DOWNLOADS_PATH:-}" && -n "${SELENWRIGHT_DOWNLOADS_DIR:-}" ]]; then
  capture_downloads >/tmp/capture.log 2>&1 &
  capture_pid=$!
fi

"$@" &
app_pid=$!
wait "${app_pid}"
