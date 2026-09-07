import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

// Importação da classe base para preferências de extensões no GNOME 45+
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CustomMenuIconPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // 1. Página principal de preferências (Libadwaita)
        const page = new Adw.PreferencesPage({
            title: 'Geral',
            icon_name: 'preferences-desktop-theme-symbolic',
        });
        window.add(page);

        // 2. Grupo: Seleção de Arquivo Personalizado
        const fileGroup = new Adw.PreferencesGroup({
            title: 'Ícone de Mostrar Aplicativos',
            description: 'Escolha uma imagem SVG ou PNG do seu computador para exibir na dock do Ubuntu e no Dash.',
        });
        page.add(fileGroup);

        // Linha com o status e pré-visualização do arquivo atual
        const fileRow = new Adw.ActionRow({
            title: 'Imagem Atual',
            subtitle: 'Carregando...',
        });
        fileGroup.add(fileRow);

        // Widget de pré-visualização (Thumbnail da imagem)
        const previewImage = new Gtk.Image({
            pixel_size: 40,
            margin_end: 8,
        });
        fileRow.add_prefix(previewImage);

        // Função auxiliar para atualizar o preview e o subtítulo
        const updateUI = () => {
            const currentPath = settings.get_string('icon-path');
            if (currentPath && Gio.File.new_for_path(currentPath).query_exists(null)) {
                fileRow.set_subtitle(currentPath);
                previewImage.set_from_file(currentPath);
            } else {
                const defaultPath = `${this.path}/icons/custom-menu.svg`;
                fileRow.set_subtitle('Padrão da Extensão (custom-menu.svg)');
                previewImage.set_from_file(defaultPath);
            }
        };

        // Botão para abrir o seletor de arquivos
        const chooseButton = new Gtk.Button({
            label: 'Escolher Imagem...',
            icon_name: 'document-open-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['suggested-action'],
        });

        chooseButton.connect('clicked', () => {
            const chooser = new Gtk.FileChooserNative({
                title: 'Selecione uma imagem para o ícone do menu',
                transient_for: window,
                action: Gtk.FileChooserAction.OPEN,
                accept_label: 'Selecionar',
                cancel_label: 'Cancelar',
            });

            // Filtro para arquivos de imagem comuns
            const filter = new Gtk.FileFilter();
            filter.set_name('Imagens (*.svg, *.png, *.jpg)');
            filter.add_mime_type('image/svg+xml');
            filter.add_mime_type('image/png');
            filter.add_mime_type('image/jpeg');
            filter.add_pattern('*.svg');
            filter.add_pattern('*.png');
            filter.add_pattern('*.jpg');
            chooser.add_filter(filter);

            chooser.connect('response', (dialog, responseId) => {
                if (responseId === Gtk.ResponseType.ACCEPT) {
                    const file = dialog.get_file();
                    if (file) {
                        const path = file.get_path();
                        settings.set_string('icon-path', path);
                        updateUI();
                    }
                }
                chooser.destroy();
            });

            chooser.show();
        });
        fileRow.add_suffix(chooseButton);

        // Botão para restaurar o ícone padrão da extensão
        const resetButton = new Gtk.Button({
            label: 'Restaurar Padrão',
            icon_name: 'edit-undo-symbolic',
            valign: Gtk.Align.CENTER,
            margin_start: 6,
        });
        resetButton.connect('clicked', () => {
            settings.set_string('icon-path', '');
            updateUI();
        });
        fileRow.add_suffix(resetButton);

        // 3. Grupo com atalhos para os ícones de exemplo embutidos
        const presetsGroup = new Adw.PreferencesGroup({
            title: 'Ícones Prontos de Exemplo',
            description: 'Clique em qualquer um para aplicar imediatamente:',
        });
        page.add(presetsGroup);

        const presets = [
            { name: 'Menu com Gradiente', file: 'custom-menu.svg', desc: 'Ícone moderno de menu com gradiente Ubuntu' },
            { name: 'Foguete', file: 'rocket.svg', desc: 'Símbolo de foguete estilizado' },
            { name: 'Estrela', file: 'star.svg', desc: 'Símbolo de estrela dourada' },
            { name: 'Ubuntu', file: 'ubuntu-icon.svg', desc: 'Ubuntu icon' },
            { name: 'Debian', file: 'debian-icon.svg', desc: 'Debian icon' },
            { name: 'Fedora', file: 'fedora-icon.svg', desc: 'Fedora icon' },
        ];

        for (const preset of presets) {
            const presetPath = `${this.path}/icons/${preset.file}`;
            const row = new Adw.ActionRow({
                title: preset.name,
                subtitle: preset.desc,
            });

            // Ícone de preview do preset
            const img = new Gtk.Image({
                file: presetPath,
                pixel_size: 32,
                margin_end: 8,
            });
            row.add_prefix(img);

            const applyBtn = new Gtk.Button({
                label: 'Usar Este',
                valign: Gtk.Align.CENTER,
            });
            applyBtn.connect('clicked', () => {
                settings.set_string('icon-path', presetPath);
                updateUI();
            });
            row.add_suffix(applyBtn);

            presetsGroup.add(row);
        }

        // Inicializa o estado visual inicial
        updateUI();
    }
}
