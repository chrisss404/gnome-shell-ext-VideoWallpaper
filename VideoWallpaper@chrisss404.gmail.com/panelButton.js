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


const Lang = imports.lang;

const St = imports.gi.St;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Util = imports.misc.util;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;

const _ = imports.gettext.domain(Me.uuid).gettext;

const VideoWallpaperButton = new Lang.Class({
    Name: "VideoWallpaperButton",
    Extends: PanelMenu.Button,
    
    _init: function(videoWallpaper) {
        this.parent(0.0, "VideoWallpaper");
        this._videoWallpaper = videoWallpaper;

        let icon = new St.Icon({style_class: "system-status-icon", 
                                icon_name: "preferences-desktop-wallpaper-symbolic"});
        let hbox = new St.BoxLayout({ style_class: "panel-status-menu-box" });
        hbox.add_child(icon);

        this.actor.add_child(hbox);
        this.actor.add_style_class_name("panel-status-button");
        this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPressEvent));


        this._volume = new PopupMenu.PopupBaseMenuItem({ activate: false });
        this._volumeSlider = new Slider.Slider(0);
        
        this._volumeIcon = new St.Icon({ style_class: 'popup-menu-icon', icon_name: 'audio-speakers-symbolic' });
        this._volume.actor.add(this._volumeIcon);
        this._volume.actor.add(this._volumeSlider.actor, { expand: true });
        
        this._volumeSlider.connect('value-changed', Lang.bind(this, this._onVolumeChanged));
        
        
        this._available_videos = new PopupMenu.PopupSubMenuMenuItem(_("Videos"));
        
        this._playbackSwitch = new PopupMenu.PopupSwitchMenuItem(_("Playback"));
        this._playbackSwitch.connect("toggled", Lang.bind(this, this._onPlaybackChanged));
        
        this._loopSwitch = new PopupMenu.PopupSwitchMenuItem(_("Loop Video"));
        this._loopSwitch.connect("toggled", Lang.bind(this, this._onLoopChanged));
        
        this._panelButtonSwitch = new PopupMenu.PopupSwitchMenuItem(_("Panel Button"));
        this._panelButtonSwitch.connect("toggled", Lang.bind(this, this._onPanelButtonChanged));
        
        this._settings = new PopupMenu.PopupMenuItem(_("Video Wallpaper Settings"));
		this._settings.connect('activate', Lang.bind(this, this._onSettingsActivated));
        
        
        this.menu.addMenuItem(this._volume);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._available_videos);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._playbackSwitch);
        this.menu.addMenuItem(this._loopSwitch);
        this.menu.addMenuItem(this._panelButtonSwitch);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._settings);
    },
    
    _createVideoSubMenuItems: function() {
        this._available_videos.menu.removeAll();
        for(let i in this._videoWallpaper.video_store) {
            let item = new PopupMenu.PopupMenuItem(this._videoWallpaper.video_store[i][0]);
            item.connect("activate", Lang.bind(this, this._onSelectedVideoChanged, i));
            
            if(i == this._videoWallpaper.selected_video) {
                item.setOrnament(true);
            }
            
            this._available_videos.menu.addMenuItem(item);
        }
    },
    
    _onSelectedVideoChanged: function(menuItem, event, index) {
        this._videoWallpaper.selected_video = index;
    },

    _onVolumeChanged: function(slider, value, property) {
        this._videoWallpaper.volume = (value * 100);
    },
    
    _onPlaybackChanged: function(actor) {
        this._videoWallpaper.playback = actor.state;
    },
    
    _onLoopChanged: function(actor) {
        this._videoWallpaper.loop = actor.state;
    },
    
    _onPanelButtonChanged: function(actor) {
        this._videoWallpaper.panelButton = actor.state;
    },
    
    _onSettingsActivated: function() {
        Util.spawn(["gnome-shell-extension-prefs", Me.metadata["uuid"]]);
    },
    
    _onButtonPressEvent: function() {
        this._createVideoSubMenuItems();
        this._volumeSlider.setValue(this._videoWallpaper.volume / 100);
        this._playbackSwitch.setToggleState(this._videoWallpaper.playback);
        this._loopSwitch.setToggleState(this._videoWallpaper.loop);
        this._panelButtonSwitch.setToggleState(this._videoWallpaper.panelButton);
    }
});
