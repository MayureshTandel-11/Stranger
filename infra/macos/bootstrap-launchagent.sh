#!/usr/bin/env bash
set -euo pipefail

PLIST_NAME="com.stranger.agent.plist"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST_DIR="$HOME/Library/LaunchAgents"

mkdir -p "$DEST_DIR"
cp "$SRC_DIR/$PLIST_NAME" "$DEST_DIR/$PLIST_NAME"

launchctl unload "$DEST_DIR/$PLIST_NAME" >/dev/null 2>&1 || true
launchctl load "$DEST_DIR/$PLIST_NAME"

echo "Stranger LaunchAgent installed and loaded."
