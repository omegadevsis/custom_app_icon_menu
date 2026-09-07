#!/usr/bin/env bash
set -e

UUID="custom-menu-icon@extension-test.local"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Instalando extensão ($UUID)..."

# 1. Compila os arquivos de schema de configurações (GSettings)
echo "Compilando schemas de configuração..."
glib-compile-schemas "$PROJECT_DIR/schemas"

# 2. Prepara o diretório de extensões do usuário
mkdir -p "$HOME/.local/share/gnome-shell/extensions"

if [ -L "$EXT_DIR" ] || [ -d "$EXT_DIR" ]; then
    rm -rf "$EXT_DIR"
fi

ln -s "$PROJECT_DIR" "$EXT_DIR"
echo "Link simbólico configurado em: $EXT_DIR"

# 3. Habilita a extensão nas configurações do sistema
ENABLED_LIST=$(gsettings get org.gnome.shell enabled-extensions)
if [[ "$ENABLED_LIST" != *"$UUID"* ]]; then
    NEW_LIST=$(echo "$ENABLED_LIST" | sed "s/]/, '$UUID']/")
    if [[ "$ENABLED_LIST" == "[]" || "$ENABLED_LIST" == "@as []" ]]; then
        NEW_LIST="['$UUID']"
    fi
    gsettings set org.gnome.shell enabled-extensions "$NEW_LIST"
    echo "Extensão adicionada à lista de extensões ativas do sistema."
else
    echo "Extensão já consta na lista de extensões ativas."
fi

gnome-extensions enable "$UUID" 2>/dev/null || true

echo ""
echo " Instalação concluída com sucesso!"
echo ""
echo "⚙️ Para abrir a janela de preferências e escolher sua imagem:"
echo "   gnome-extensions prefs $UUID"
echo ""
echo "🧪 Para testar na sessão aninhada (Wayland):"
echo "   dbus-run-session -- gnome-shell --nested --wayland"
