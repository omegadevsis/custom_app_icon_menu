#!/usr/bin/env python3
"""
Painel de Configurações da Extensão: Custom Show Apps Icon
Permite escolher graficamente o arquivo de imagem para o menu de aplicativos.
"""

import sys
import os
import gi

gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw, Gio, GLib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCHEMA_DIR = os.path.join(BASE_DIR, 'schemas')
SCHEMA_ID = 'org.gnome.shell.extensions.custom-menu-icon'

class ConfigApp(Adw.Application):
    def __init__(self):
        super().__init__(application_id='org.gnome.shell.extensions.custom_menu_icon.config')

    def do_activate(self):
        # Carrega o schema compilado
        schema_source = Gio.SettingsSchemaSource.new_from_directory(
            SCHEMA_DIR,
            Gio.SettingsSchemaSource.get_default(),
            False
        )
        schema = schema_source.lookup(SCHEMA_ID, True)
        if not schema:
            print(f"Erro: Schema {SCHEMA_ID} não encontrado em {SCHEMA_DIR}")
            return
        
        self.settings = Gio.Settings.new_full(schema, None, None)

        # Janela de Preferências com visual moderno Adwaita
        win = Adw.PreferencesWindow(application=self)
        win.set_title('Configurar Ícone do Menu de Aplicativos')
        win.set_default_size(600, 480)

        page = Adw.PreferencesPage(title='Geral', icon_name='preferences-desktop-theme-symbolic')
        win.add(page)

        # Grupo 1: Imagem Personalizada
        group_custom = Adw.PreferencesGroup(
            title='Ícone de Mostrar Aplicativos',
            description='Selecione uma imagem do seu computador para exibir no botão da dock.'
        )
        page.add(group_custom)

        row_current = Adw.ActionRow(title='Imagem Atual', subtitle='Carregando...')
        group_custom.add(row_current)

        preview_img = Gtk.Image(pixel_size=42, margin_end=12)
        row_current.add_prefix(preview_img)

        def update_ui():
            current_path = self.settings.get_string('icon-path')
            if current_path and os.path.exists(current_path):
                row_current.set_subtitle(current_path)
                preview_img.set_from_file(current_path)
            else:
                default_icon = os.path.join(BASE_DIR, 'icons', 'custom-menu.svg')
                row_current.set_subtitle('Padrão da Extensão (custom-menu.svg)')
                preview_img.set_from_file(default_icon)

        # Botão para abrir o seletor de arquivos
        btn_choose = Gtk.Button(
            label='Escolher Imagem...',
            icon_name='document-open-symbolic',
            valign=Gtk.Align.CENTER,
            css_classes=['suggested-action']
        )

        def on_file_selected(dialog, response_id):
            if response_id == Gtk.ResponseType.ACCEPT:
                f = dialog.get_file()
                if f:
                    selected_path = f.get_path()
                    self.settings.set_string('icon-path', selected_path)
                    update_ui()
                    print(f"Novo ícone configurado: {selected_path}")
            dialog.destroy()

        def on_choose_clicked(button):
            chooser = Gtk.FileChooserNative(
                title='Escolha uma imagem para o ícone do menu',
                transient_for=win,
                action=Gtk.FileChooserAction.OPEN,
                accept_label='Selecionar',
                cancel_label='Cancelar'
            )
            img_filter = Gtk.FileFilter()
            img_filter.set_name('Imagens (*.svg, *.png, *.jpg)')
            img_filter.add_mime_type('image/svg+xml')
            img_filter.add_mime_type('image/png')
            img_filter.add_mime_type('image/jpeg')
            img_filter.add_pattern('*.svg')
            img_filter.add_pattern('*.png')
            img_filter.add_pattern('*.jpg')
            chooser.add_filter(img_filter)
            chooser.connect('response', on_file_selected)
            chooser.show()

        btn_choose.connect('clicked', on_choose_clicked)
        row_current.add_suffix(btn_choose)

        # Botão Restaurar Padrão
        btn_reset = Gtk.Button(
            label='Restaurar Padrão',
            icon_name='edit-undo-symbolic',
            valign=Gtk.Align.CENTER,
            margin_start=8
        )
        def on_reset_clicked(button):
            self.settings.set_string('icon-path', '')
            update_ui()
            print("Ícone restaurado para o padrão da extensão.")

        btn_reset.connect('clicked', on_reset_clicked)
        row_current.add_suffix(btn_reset)

        # Grupo 2: Atalhos Rápidos
        group_presets = Adw.PreferencesGroup(
            title='Ícones de Exemplo Embutidos',
            description='Ou clique em um dos modelos prontos abaixo:'
        )
        page.add(group_presets)

        presets = [
            ('Menu Gradiente', 'custom-menu.svg', 'Design moderno com gradiente Ubuntu'),
            ('Foguete', 'rocket.svg', 'Símbolo estilizado de foguete'),
            ('Estrela', 'star.svg', 'Símbolo dourado de estrela'),
        ]

        for name, filename, desc in presets:
            icon_file = os.path.join(BASE_DIR, 'icons', filename)
            row = Adw.ActionRow(title=name, subtitle=desc)
            
            img = Gtk.Image(file=icon_file, pixel_size=32, margin_end=8)
            row.add_prefix(img)

            btn_use = Gtk.Button(label='Usar Este', valign=Gtk.Align.CENTER)
            btn_use.connect('clicked', lambda b, p=icon_file: (
                self.settings.set_string('icon-path', p),
                update_ui(),
                print(f"Preset aplicado: {p}")
            ))
            row.add_suffix(btn_use)
            group_presets.add(row)

        update_ui()
        win.present()

if __name__ == '__main__':
    app = ConfigApp()
    sys.exit(app.run(sys.argv))
