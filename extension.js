import Gio from 'gi://Gio';
import St from 'gi://St';

// Importações dos módulos internos do GNOME Shell (padrão ESM do GNOME 45+)
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Dash from 'resource:///org/gnome/shell/ui/dash.js';

export default class CustomMenuIconExtension extends Extension {
    enable() {
        console.log(`[${this.metadata.uuid}] Ativando extensão de ícone de menu customizado...`);

        // 1. Obtém as configurações (GSettings) vinculadas ao schema da extensão
        this._settings = this.getSettings();

        // 2. Salva o método original de criação de ícones do Dash
        this._originalCreateIcon = Dash.ShowAppsIcon.prototype._createIcon;
        const extensionRef = this;

        // 3. Intercepta a criação de novos ícones (monitores adicionais ou redimensionamento)
        Dash.ShowAppsIcon.prototype._createIcon = function (size) {
            const iconActor = extensionRef._originalCreateIcon.call(this, size);
            if (extensionRef._customGIcon) {
                iconActor.gicon = extensionRef._customGIcon;
            }
            return iconActor;
        };

        // 4. Carrega o ícone configurado atualmente e aplica na tela
        this._reloadCustomIcon();

        // 5. Ouve por alterações nas configurações em tempo real (quando o usuário escolhe outro arquivo nas preferências)
        this._settingsChangedId = this._settings.connect('changed::icon-path', () => {
            console.log(`[${this.metadata.uuid}] Configuração de ícone alterada!`);
            this._reloadCustomIcon();
        });

        // 6. Ouve mudanças na árvore de extensões (ex: dock reiniciando)
        this._extensionChangedId = Main.extensionManager.connect('extension-state-changed', () => {
            this._applyCustomIcon();
        });
    }

    /**
     * Carrega a imagem a partir do caminho configurado no GSettings (ou padrão).
     */
    _reloadCustomIcon() {
        let configuredPath = this._settings.get_string('icon-path');

        // Se nenhum arquivo foi selecionado ou o arquivo não existir mais, usa o SVG padrão embutido
        if (!configuredPath || !Gio.File.new_for_path(configuredPath).query_exists(null)) {
            configuredPath = `${this.path}/icons/custom-menu.svg`;
        }

        const iconFile = Gio.File.new_for_path(configuredPath);
        this._customGIcon = new Gio.FileIcon({ file: iconFile });

        // Aplica a nova imagem nos ícones da dock e dash
        this._applyCustomIcon();
    }

    /**
     * Aplica o novo ícone em todos os botões de aplicativos presentes na tela.
     */
    _applyCustomIcon() {
        if (!this._customGIcon) return;

        const iconActors = this._findShowAppsIconActors(Main.uiGroup);
        for (const actor of iconActors) {
            actor.gicon = this._customGIcon;
        }
    }

    /**
     * Procura recursivamente por todos os St.Icon que representam o botão de aplicativos
     * no Dash do GNOME e na dock do Ubuntu.
     */
    _findShowAppsIconActors(parentActor) {
        const results = [];
        if (!parentActor || !parentActor.get_children) return results;

        const traverse = (actor) => {
            if (!actor) return;

            // O botão de aplicativos usa a classe CSS 'show-apps-icon'
            if (actor instanceof St.Icon && actor.has_style_class_name('show-apps-icon')) {
                results.push(actor);
            }

            const children = actor.get_children ? actor.get_children() : [];
            for (const child of children) {
                traverse(child);
            }
        };

        traverse(parentActor);
        return results;
    }

    /**
     * Restaura tudo ao estado original quando a extensão é desativada.
     */
    disable() {
        console.log(`[${this.metadata.uuid}] Desativando e restaurando ícone padrão...`);

        // 1. Restaura o protótipo original da classe Dash.ShowAppsIcon
        if (this._originalCreateIcon) {
            Dash.ShowAppsIcon.prototype._createIcon = this._originalCreateIcon;
            this._originalCreateIcon = null;
        }

        // 2. Desconecta os ouvintes de sinais
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        if (this._extensionChangedId) {
            Main.extensionManager.disconnect(this._extensionChangedId);
            this._extensionChangedId = null;
        }

        // 3. Restaura o ícone padrão de 9 pontos ('view-app-grid-symbolic')
        const iconActors = this._findShowAppsIconActors(Main.uiGroup);
        for (const actor of iconActors) {
            actor.gicon = null;
            actor.icon_name = 'view-app-grid-symbolic';
        }

        this._customGIcon = null;
        this._settings = null;
    }
}
