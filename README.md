# Extensão: Custom Show Apps Icon (Trocar Ícone do Menu da Dock)

Esta extensão substitui o ícone padrão de **Mostrar Aplicativos** (a grade de 9 pontinhos) na dock do Ubuntu e no Dash do GNOME por um ícone personalizado, **com tela gráfica de configurações para você escolher qualquer imagem do seu computador com um clique!**

---

## 📂 Estrutura do Projeto

```
icon_menu/
├── metadata.json       # UUID, versão e referência ao schema de configurações
├── extension.js        # Lógica de substituição do ícone e ouvinte de configurações
├── prefs.js            # Tela de preferências oficial do GNOME Shell (Libadwaita)
├── config.py           # Aplicativo gráfico direto para abrir a tela de configurações
├── stylesheet.css      # Estilos adicionais
├── install.sh          # Script de compilação dos schemas, link e ativação
├── uninstall.sh        # Script de desativação e limpeza
├── schemas/            # Definição do banco de configurações (GSettings)
│   ├── org.gnome.shell.extensions.custom-menu-icon.gschema.xml
│   └── gschemas.compiled
├── icons/              # Pasta com ícones de exemplo embutidos
│   ├── custom-menu.svg # Ícone padrão (Gradiente Ubuntu)
│   ├── rocket.svg      # Opção de Foguete
│   └── star.svg        # Opção de Estrela
└── README.md
```

---

## 🚀 Como Instalar e Testar

### 1. Instalar a extensão
Abra o terminal na pasta `icon_menu` e execute:

```bash
./install.sh
```
*(O script compila os schemas de configuração e conecta a extensão ao sistema).*

---

## ⚙️ Como Escolher a Imagem com o Botão na Configuração

Você tem duas formas de abrir a janela de configuração visual:

### Opção A: Abrir o Painel Direto (Recomendado para Testes Imediatos)
No terminal dentro da pasta `icon_menu`, execute:

```bash
./config.py
```

### Opção B: Pelo comando oficial do GNOME
```bash
gnome-extensions prefs custom-menu-icon@extension-test.local
```
*(Ou abrindo o aplicativo **Extensões** do Ubuntu e clicando no botão de engrenagem ao lado da extensão).*

---

## 🖼️ O que você encontra na Janela de Configurações:

1. **Pré-visualização em tempo real:** Mostra a miniatura do ícone atualmente selecionado.
2. **Botão "Escolher Imagem...":** Abre a janela de seleção de arquivos do sistema (filtrando `.svg`, `.png`, `.jpg`).
3. **Botão "Restaurar Padrão":** Redefine o ícone para o design padrão da extensão.
4. **Atalhos Rápidos:** Botões para aplicar na hora os modelos embutidos (*Menu Gradiente*, *Foguete*, *Estrela*).

> **Atualização Instantânea:** Assim que você escolhe a imagem na janela, o `extension.js` detecta a alteração no GSettings e atualiza o ícone da dock **em tempo real sem precisar reiniciar**!

---

## 🧪 Testando na Janela Aninhada (Wayland)

Para ver a dock e o ícone funcionando em uma janela isolada:

```bash
dbus-run-session -- gnome-shell --nested --wayland
```

---

## 🧠 Como o Código Funciona (Explicação Técnica)

1. **`schemas/org...gschema.xml`**: Cria uma chave `icon-path` no banco de dados `dconf/GSettings` para salvar o caminho da imagem de forma persistente.
2. **`prefs.js`**: Constrói a interface com **Libadwaita** (`Adw.PreferencesWindow`, `Adw.ActionRow`) e usa o seletor nativo `Gtk.FileChooserNative`.
3. **`extension.js`**:
   - Escuta eventos de alteração de configuração:
     ```javascript
     this._settings.connect('changed::icon-path', () => this._reloadCustomIcon());
     ```
   - Converte o arquivo escolhido em um `Gio.FileIcon` e aplica em todos os componentes `St.Icon` da dock e do Dash.
4. **`disable()`**: Quando a extensão é desativada, remove os ouvintes e restaura o ícone padrão de 9 pontinhos (`view-app-grid-symbolic`).
