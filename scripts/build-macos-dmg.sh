#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="${ROOT_DIR}/src-tauri/tauri.conf.json"

PRODUCT_NAME="$(plutil -extract productName raw -o - "${CONFIG_FILE}")"
VERSION="$(plutil -extract version raw -o - "${CONFIG_FILE}")"
ARCH="$(uname -m)"

APP_PATH="${ROOT_DIR}/src-tauri/target/release/bundle/macos/${PRODUCT_NAME}.app"
DMG_DIR="${ROOT_DIR}/src-tauri/target/release/bundle/dmg"
DMG_PATH="${DMG_DIR}/${PRODUCT_NAME}_${VERSION}_${ARCH}.dmg"
STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vision-space-dmg.XXXXXX")"

cleanup() {
  rm -rf "${STAGING_DIR}"
}

trap cleanup EXIT

if [[ ! -d "${APP_PATH}" ]]; then
  echo "App bundle not found: ${APP_PATH}" >&2
  echo "Run 'pnpm tauri build -b app' first." >&2
  exit 1
fi

mkdir -p "${DMG_DIR}"
rm -f "${DMG_PATH}"

cp -R "${APP_PATH}" "${STAGING_DIR}/"
ln -s /Applications "${STAGING_DIR}/Applications"

hdiutil create \
  -volname "${PRODUCT_NAME}" \
  -srcfolder "${STAGING_DIR}" \
  -ov \
  -format UDZO \
  "${DMG_PATH}"

echo "Created DMG: ${DMG_PATH}"
