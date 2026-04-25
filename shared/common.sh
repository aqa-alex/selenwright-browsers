#!/usr/bin/env bash

terminate_pid() {
  local pid="${1:-}"
  if [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1; then
    kill "${pid}" >/dev/null 2>&1 || true
    wait "${pid}" >/dev/null 2>&1 || true
  fi
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
    [[ "${name}" == .* ]] && continue
    [[ "${name}" == *.crdownload ]] && continue
    [[ "${name}" == *.part ]] && continue
    ln -f "${src_dir}/${name}" "${dst_dir}/${name}" 2>/dev/null || true
  done
}
