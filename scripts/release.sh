#!/usr/bin/env bash
# Build, sign, and publish a Tokcat release.
#
# Usage:
#   scripts/release.sh <version> "<release notes>"
#
# Example:
#   scripts/release.sh 0.1.3 "Add auto-update support."
#
# Prerequisites:
#   - gh CLI authenticated for handlecusion/tokcat
#   - Updater private key at ~/.tauri/tokcat.key
#   - package.json / Cargo.toml / tauri.conf.json already bumped to <version>
#     and committed on main.

set -euo pipefail

VERSION="${1:-}"
NOTES="${2:-}"

if [[ -z "$VERSION" || -z "$NOTES" ]]; then
  echo "usage: $0 <version> <notes>" >&2
  exit 1
fi

KEY_PATH="${TAURI_SIGNING_PRIVATE_KEY_PATH:-$HOME/.tauri/tokcat.key}"
if [[ ! -f "$KEY_PATH" ]]; then
  echo "signing key not found at $KEY_PATH" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Ensure version files match the requested version.
PKG_VER="$(node -p "require('./package.json').version")"
if [[ "$PKG_VER" != "$VERSION" ]]; then
  echo "package.json version is $PKG_VER, expected $VERSION" >&2
  exit 1
fi

TAG="v$VERSION"
BUNDLE_DIR="src-tauri/target/release/bundle"
DMG="$BUNDLE_DIR/dmg/Tokcat_${VERSION}_aarch64.dmg"
APP_TGZ="$BUNDLE_DIR/macos/Tokcat.app.tar.gz"
APP_SIG="$BUNDLE_DIR/macos/Tokcat.app.tar.gz.sig"

echo "==> Building release with updater artifacts"
TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_PATH")" \
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD="${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" \
  pnpm tauri build

for f in "$DMG" "$APP_TGZ" "$APP_SIG"; do
  if [[ ! -f "$f" ]]; then
    echo "expected artifact missing: $f" >&2
    exit 1
  fi
done

# Tauri's dmg bundler writes a hidden .VolumeIcon.icns into the disk image.
# Users who have "show hidden files" enabled in Finder (Cmd+Shift+.) end up
# seeing it next to the app, which looks like a stray cache file. Strip it.
echo "==> Stripping .VolumeIcon.icns from $DMG"
DMG_RW="${DMG%.dmg}.rw.dmg"
DMG_MNT="$(mktemp -d)"
hdiutil convert "$DMG" -format UDRW -o "$DMG_RW" -ov >/dev/null
hdiutil attach -nobrowse -mountpoint "$DMG_MNT" "$DMG_RW" >/dev/null
rm -f "$DMG_MNT/.VolumeIcon.icns"
SetFile -a c "$DMG_MNT" 2>/dev/null || true
hdiutil detach "$DMG_MNT" >/dev/null
rmdir "$DMG_MNT" 2>/dev/null || true
hdiutil convert "$DMG_RW" -format UDZO -imagekey zlib-level=9 -o "$DMG" -ov >/dev/null
rm -f "$DMG_RW"

SIGNATURE="$(cat "$APP_SIG")"
PUB_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DOWNLOAD_BASE="https://github.com/handlecusion/tokcat/releases/download/$TAG"

LATEST_JSON="$BUNDLE_DIR/latest.json"
cat > "$LATEST_JSON" <<EOF
{
  "version": "$VERSION",
  "notes": $(printf '%s' "$NOTES" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),
  "pub_date": "$PUB_DATE",
  "platforms": {
    "darwin-aarch64": {
      "signature": "$SIGNATURE",
      "url": "$DOWNLOAD_BASE/Tokcat.app.tar.gz"
    }
  }
}
EOF

echo "==> latest.json"
cat "$LATEST_JSON"

# Tag must already exist (or be created here). We assume the commit is pushed.
if ! git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "==> Tagging $TAG"
  git tag "$TAG"
  git push origin "$TAG"
fi

echo "==> Creating GitHub release"
gh release create "$TAG" \
  "$DMG" \
  "$APP_TGZ" \
  "$APP_SIG" \
  "$LATEST_JSON" \
  --title "Tokcat $VERSION" \
  --notes "$NOTES"

echo "==> Done: https://github.com/handlecusion/tokcat/releases/tag/$TAG"
