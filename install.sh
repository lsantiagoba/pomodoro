#!/usr/bin/env bash
set -euo pipefail

UUID="pomodoro@lsbcodes"
SRC_DIR="src/v45-46-47-48-49-50"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
VERSION="$(gnome-shell --version | awk '{split($3,v,"."); print v[1]}')"

if (( VERSION < 45 || VERSION > 51 )); then
    echo "Focus Timer supports GNOME Shell 45 through 51 (detected $VERSION)."
    exit 1
fi

mkdir -p "$DEST/schemas"
cp "$SRC_DIR"/{extension.js,prefs.js,stylesheet.css,metadata.json} "$DEST/"
cp "$SRC_DIR/schemas/"*.xml "$DEST/schemas/"
glib-compile-schemas "$DEST/schemas"
rm -rf "$DEST/locale"
for po_file in "$SRC_DIR"/po/*.po; do
    language="$(basename "$po_file" .po)"
    mkdir -p "$DEST/locale/$language/LC_MESSAGES"
    msgfmt "$po_file" -o "$DEST/locale/$language/LC_MESSAGES/$UUID.mo"
done

echo "Focus Timer installed for GNOME Shell $VERSION."
echo "Log out and back in, then enable it with:"
echo "  gnome-extensions enable $UUID"
