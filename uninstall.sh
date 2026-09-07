#!/usr/bin/env bash
set -e

UUID="custom-menu-icon@extension-test.local"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

echo "==> Desinstalando extensão ($UUID)..."

gnome-extensions disable "$UUID" 2>/dev/null || true

ENABLED_LIST=$(gsettings get org.gnome.shell enabled-extensions)
if [[ "$ENABLED_LIST" == *"$UUID"* ]]; then
    python3 -c "
import ast, subprocess
raw = '''$ENABLED_LIST'''
exts = ast.literal_eval(raw)
if '$UUID' in exts:
    exts.remove('$UUID')
subprocess.run(['gsettings', 'set', 'org.gnome.shell', 'enabled-extensions', str(exts)])
"
fi

if [ -L "$EXT_DIR" ] || [ -d "$EXT_DIR" ]; then
    rm -rf "$EXT_DIR"
    echo "Extensão removida de $EXT_DIR."
fi

echo " Desinstalação concluída!"
