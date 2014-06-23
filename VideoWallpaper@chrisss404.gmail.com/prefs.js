/**
 * gnome-shell-extension-VideoWallpaper allows to set videos as wallpaper.
 * Copyright (C) 2014  chrisss404
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const _ = imports.gettext.domain(Me.uuid).gettext;

const SETTINGS_VIDEO_STORE = "video-store";
const SETTINGS_SELECTED_VIDEO = "selected-video";
const SETTINGS_VOLUME = "video-volume";
const SETTINGS_PLAYBACK = "video-playback";
const SETTINGS_LOOP = "video-loop";
const SETTINGS_PANEL_BUTTON = "show-panel-button";

let videoStoreArray;
let settings;
let playbackSwitch;
let loopSwitch;
let panelButtonSwitch;
let volumeScale;
let selection;

function init() {
    imports.gettext.bindtextdomain(Me.uuid, Me.path + "/locale");
    const GioSSS = Gio.SettingsSchemaSource;

    let schemaSource = GioSSS.new_from_directory(Me.path + "/schemas", 
            GioSSS.get_default(), false);

    let schemaObj = schemaSource.lookup(Me.metadata["settings-schema"], true);
    if(!schemaObj) {
        throw new Error("Schema " + Me.metadata["settings-schema"] + " could not be found for extension " +
                        Me.uuid + ". Please check your installation.");
    }

    settings = new Gio.Settings({ settings_schema: schemaObj });
    settings.connect("changed", onSettingsChanged);
    videoStoreArray = settings.get_value(SETTINGS_VIDEO_STORE).deep_unpack();
}

function buildPrefsWidget() {
    let frame = new Gtk.Box({
        border_width: 18
    });
    
    
    let table = Gtk.Table.new(2, 1, false);
    let scroll = new Gtk.ScrolledWindow({
        shadow_type: Gtk.ShadowType.IN,
        min_content_width: 200,
        min_content_height: 250
    });
    
    let toolbar = new Gtk.Toolbar({
        toolbar_style: Gtk.ToolbarStyle.ICONS,
        icon_size: 1
    });
    toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);

    let addButton = new Gtk.ToolButton({
        icon_name: "list-add-symbolic",
        use_action_appearance: false
    });
    addButton.connect("clicked", show_add_dialog);	
    toolbar.add(addButton);
    

    let removeButton = new Gtk.ToolButton({
        icon_name: "list-remove-symbolic",
        use_action_appearance: false
    });
    removeButton.connect("clicked", remove_selected_list_entry);	
    toolbar.add(removeButton);
    
    
    let listStore = new Gtk.ListStore();
    listStore.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);
    for(let i in videoStoreArray) {
        listStore.set(listStore.append(), [0, 1], videoStoreArray[i]);
    }
    
    let treeView = new Gtk.TreeView({
        expand: true,
        model: listStore
    });
    
    
    
    let titleColumn = new Gtk.TreeViewColumn({
        title: _("Title")
    });
    let uriColumn = new Gtk.TreeViewColumn({
        title: _("URI")
    });
    
    let cellRenderer = new Gtk.CellRendererText();
    titleColumn.pack_start(cellRenderer, true);
    uriColumn.pack_start(cellRenderer, true);
    
    titleColumn.add_attribute(cellRenderer, "text", 0);
    uriColumn.add_attribute(cellRenderer, "text", 1);
    
    treeView.insert_column(titleColumn, 0);
    treeView.insert_column(uriColumn, 1);
    
    selection = treeView.get_selection();
    selection.select_path(Gtk.TreePath.new_from_string(String(settings.get_int(SETTINGS_SELECTED_VIDEO))));
    selection.connect('changed', onSelectionChanged);
    
    scroll.add(treeView);

    table.attach(scroll, 0, 1, 0, 1,
                Gtk.AttachOptions.FILL,
                Gtk.AttachOptions.FILL,
                0, 0);
    table.attach(toolbar, 0, 1, 1, 2,
                Gtk.AttachOptions.FILL,
                Gtk.AttachOptions.SHRINK,
                0, 0);
    
    frame.add(table);
    
    
    let optionGrid = new Gtk.Grid ({
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.START,
        margin_left: 10
    });
    
    let volumeLabel = new Gtk.Label({
        label: _("Volume"),
        xalign: Gtk.Align.FILL,
        margin: 8
    });

    volumeScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 100, 5);
    volumeScale.set_valign(Gtk.Align.START);
    volumeScale.set_value(settings.get_int(SETTINGS_VOLUME));
    volumeScale.set_digits(0);
    volumeScale.connect("value-changed", function(scale) {
        settings.set_int(SETTINGS_VOLUME, scale.get_value());
    });
    
    optionGrid.attach(volumeLabel, 0, 0, 1, 1);
    optionGrid.attach(volumeScale, 1, 0, 1, 1);

    let playbackLabel = new Gtk.Label({
        label: _("Playback"),
        xalign: Gtk.Align.FILL,
        margin: 8
    });

    playbackSwitch = new Gtk.Switch({
        active: settings.get_boolean(SETTINGS_PLAYBACK),
        margin: 8
    });
    playbackSwitch.connect("notify::active", function(button) {
        settings.set_boolean(SETTINGS_PLAYBACK, button.active);
    });

    optionGrid.attach(playbackLabel, 0, 1, 1, 1);
    optionGrid.attach(playbackSwitch, 1, 1, 1, 1);
    
    
    let loopLabel = new Gtk.Label({
        label: _("Loop Video"),
        xalign: Gtk.Align.FILL,
        margin: 8
    });

    loopSwitch = new Gtk.Switch({
        active: settings.get_boolean(SETTINGS_LOOP),
        margin: 8
    });
    loopSwitch.connect("notify::active", function(button) {
        settings.set_boolean(SETTINGS_LOOP, button.active);
    });

    optionGrid.attach(loopLabel, 0, 2, 1, 1);
    optionGrid.attach(loopSwitch, 1, 2, 1, 1);

    let panelButtonLabel = new Gtk.Label({
        label: _("Panel Button"),
        xalign: Gtk.Align.FILL,
        margin: 8
    });

    panelButtonSwitch = new Gtk.Switch({
        active: settings.get_boolean(SETTINGS_PANEL_BUTTON),
        margin: 8
    });
    panelButtonSwitch.connect("notify::active", function(button) {
        settings.set_boolean(SETTINGS_PANEL_BUTTON, button.active);
    });

    optionGrid.attach(panelButtonLabel, 0, 3, 1, 1);
    optionGrid.attach(panelButtonSwitch, 1, 3, 1, 1);


    frame.add(optionGrid);

    frame.show_all();
    return frame;
}

function onSettingsChanged() {
    selection.select_path(Gtk.TreePath.new_from_string(String(settings.get_int(SETTINGS_SELECTED_VIDEO))));
    volumeScale.set_value(settings.get_int(SETTINGS_VOLUME));
    playbackSwitch.set_active(settings.get_boolean(SETTINGS_PLAYBACK));
    loopSwitch.set_active(settings.get_boolean(SETTINGS_LOOP));
    panelButtonSwitch.set_active(settings.get_boolean(SETTINGS_PANEL_BUTTON));
}


function show_add_dialog() {
    let dialog = new Gtk.Dialog({title : "Add Video"});
    let titleLabel = new Gtk.Label({label : "Title:"});
    let uriLabel = new Gtk.Label({label : "URI:"});

    let grid = new Gtk.Grid ({
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        row_spacing: 8,
        column_spacing: 8,
        border_width: 8
    });
    
    dialog.titleEntry = new Gtk.Entry();
    dialog.uriEntry = new Gtk.Entry();

	dialog.set_modal(1);
	dialog.set_resizable(0);


    let dialog_area = dialog.get_content_area();
    dialog_area.pack_start(grid, true, true, 0);

    grid.attach(titleLabel, 0, 0, 1, 1);
    grid.attach(dialog.titleEntry, 1, 0, 1, 1);
    grid.attach(uriLabel, 0, 1, 1, 1);
    grid.attach(dialog.uriEntry, 1, 1, 1, 1);

    dialog.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
    dialog.add_button(Gtk.STOCK_ADD, Gtk.ResponseType.OK);
    
    dialog.connect('response', on_add_dialog_response);
    dialog.show_all();
}

function on_add_dialog_response(dialog, response_id) {
    switch(response_id) {
        case Gtk.ResponseType.OK:
            let title = dialog.titleEntry.get_text();
            let uri = dialog.uriEntry.get_text();

            if(uri.length > 0) {
                if(title.length == 0) {
                    title = uri;
                }
                
                let [isSelected, model, iter] = selection.get_selected();
                iter = model.insert_with_valuesv(-1, [0, 1], [title, uri]);
                
                videoStoreArray.push([title, uri]);
                settings.set_value(SETTINGS_VIDEO_STORE, new GLib.Variant('a(ss)', videoStoreArray));
                selection.select_iter(iter);
            }
            break;
    }
    dialog.destroy();
}

function remove_selected_list_entry() {
    if(videoStoreArray.length == 1) {
        return;
    }
    
    let [isSelected, model, iter] = selection.get_selected();
    let key = parseInt(model.get_string_from_iter(iter));
    
    videoStoreArray.splice(key, 1);
    settings.set_value(SETTINGS_VIDEO_STORE, new GLib.Variant('a(ss)', videoStoreArray));
    selection.select_path(Gtk.TreePath.new_from_string(String(Math.min(key, videoStoreArray.length - 1))));

    model.remove(iter);
}


function onSelectionChanged() {
    let [isSelected, model, iter] = selection.get_selected();
    settings.set_int(SETTINGS_SELECTED_VIDEO, parseInt(model.get_string_from_iter(iter)));
}
