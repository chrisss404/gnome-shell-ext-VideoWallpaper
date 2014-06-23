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

imports.gi.versions.ClutterGst = '2.0';

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const ClutterGst = imports.gi.ClutterGst;
const Gio = imports.gi.Gio;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const VideoWallpaperButton = Me.imports.panelButton.VideoWallpaperButton;

const BackgroundManager = imports.ui.background.BackgroundManager;
const Main = imports.ui.main;
const Overview = imports.ui.overview.Overview;
const Tweener = imports.ui.tweener;


const PANEL_BUTTON_ID = "videoWallpaperMenu";

const SETTINGS_VIDEO_STORE = "video-store";
const SETTINGS_SELECTED_VIDEO = "selected-video";
const SETTINGS_PLAYBACK = "video-playback";
const SETTINGS_LOOP = "video-loop";
const SETTINGS_VOLUME = "video-volume";
const SETTINGS_PANEL_BUTTON = "show-panel-button";


const SET_BACKGROUND_SCHEMA = "org.gnome.desktop.background";
const SET_BACKGROUND_KEY = "picture-uri";

const SHADE_ANIMATION_TIME = .20;


const VideoWallpaper = new Lang.Class({
    Name: "VideoWallpaper",
    
    _init: function() {
        this._videoWallpaperMenu = null;
        this._video = null;
        this._eosSignal = null;
        this._settings = null;
        this._settingsSignal = null;

        this._stage = null;
        this._video_store = null;
        this._selected_video = null;
        this._volume = 0;
        this._playback = true;
        this._loop = true;
        this._panelButton = true;
    },
    
    enable: function() {
        if(this._video == null) {
            ClutterGst.init(null);
            this._video = new ClutterGst.VideoTexture({ sync_size: false });
            this._video.set_size(1, 1);
            this._video.set_position(-1, -1);
            this._video.set_opacity(0);
            Main.layoutManager.uiGroup.add_actor(this._video);
        }
        
        if(this._settings == null) {
            this._initSettings();
            this._onSettingsChanged();
        }
        
        if(this._videoWallpaperMenu == null && this._panelButton) {
            this._videoWallpaperMenu = new VideoWallpaperButton(this);
            Main.panel.addToStatusArea(PANEL_BUTTON_ID, this._videoWallpaperMenu);
        }

        if(this._eosSignal == null) {
            this._eosSignal = this._video.connect('eos', Lang.bind(this, this._onVideoEos));
        }
        if(this._settingsSignal == null) {
            this._settingsSignal = this._settings.connect("changed", Lang.bind(this, this._onSettingsChanged));
        }


        Overview.prototype._videoWallpaper = this;
        Overview.prototype._unshadeBackgroundsOrig = Overview.prototype._unshadeBackgrounds;
        Overview.prototype._unshadeBackgrounds = function() {
            if(!this._videoWallpaper.playback) {
                this._unshadeBackgroundsOrig();
                return;
            }

            let backgrounds = this._backgroundGroup.get_children();
            for(let i = 0; i < backgrounds.length; i++) {
                let last = backgrounds[i].get_last_child();
                Tweener.addTween(last,
                                    { opacity: 0,
                                      time: SHADE_ANIMATION_TIME,
                                      transition: 'easeOutQuad'
                                    });
            }
            this._unshadeBackgroundsOrig();
        };

        Overview.prototype._shadeBackgroundsOrig = Overview.prototype._shadeBackgrounds;
        Overview.prototype._shadeBackgrounds = function() {
            if(!this._videoWallpaper.playback) {
                this._shadeBackgroundsOrig();
                return;
            }
            
            let backgrounds = this._backgroundGroup.get_children();
            for(let i = 0; i < backgrounds.length; i++) {
                let last = backgrounds[i].get_last_child();
                
                Tweener.addTween(last,
                                    { opacity: 128,
                                      time: SHADE_ANIMATION_TIME,
                                      transition: 'easeOutQuad'
                                    });
            }
            this._shadeBackgroundsOrig();
        };
        
        BackgroundManager.prototype._videoWallpaper = this;
        BackgroundManager.prototype._createBackgroundOrig = BackgroundManager.prototype._createBackground;
        BackgroundManager.prototype._createBackground = function() {
            let background = this._createBackgroundOrig();
            if(!this._videoWallpaper.playback) {
                return background;
            }
            
            let monitor = this._layoutManager.monitors[this._monitorIndex];
            
            let first = background.actor.get_first_child();
            first.set_background_color(new Clutter.Color( {red:0, blue:0, green:0, alpha:128} ));
            first.set_opacity(0);
            
            let clone = new Clutter.Clone();
            clone.set_source(this._videoWallpaper.video);
            clone.set_size(monitor.width, monitor.height);
            
            background.actor.remove_all_children();
            background.actor.add_actor(clone);
            background.actor.add_actor(first);
            
            return background;
        };
        
        
        this._recreateBackgroundActors();
        this._video.set_playing(this._playback);
    },
    
    disable: function() {
        if(typeof Overview.prototype._unshadeBackgroundsOrig === "function") {
            Overview.prototype._unshadeBackgrounds = Overview.prototype._unshadeBackgroundsOrig;
            Overview.prototype._unshadeBackgroundsOrig = undefined;
        }
        if(typeof Overview.prototype._shadeBackgroundsOrig === "function") {
            Overview.prototype._shadeBackgrounds = Overview.prototype._shadeBackgroundsOrig;
            Overview.prototype._shadeBackgroundsOrig = undefined;
        }
        if(typeof BackgroundManager.prototype._createBackgroundOrig === "function") {
            BackgroundManager.prototype._createBackground = BackgroundManager.prototype._createBackgroundOrig;
            BackgroundManager.prototype._createBackgroundOrig = undefined;
        }
        
        this._recreateBackgroundActors();
        this._video.set_playing(false);

        if(this._videoWallpaperMenu != null) {
            this._videoWallpaperMenu.destroy();
            this._videoWallpaperMenu = null;
        }
        if(this._eosSignal != null) {
            this._video.disconnect(this._eosSignal);
            this._eosSignal = null;
        }
        if(this._settingsSignal != null) {
            this._settings.disconnect(this._settingsSignal);
            this._settingsSignal = null;
        }
    },

    
    _initSettings: function() {
        const GioSSS = Gio.SettingsSchemaSource;
        let schemaSource = GioSSS.new_from_directory(Me.path + "/schemas",
                GioSSS.get_default(), false);

        let schemaObj = schemaSource.lookup(Me.metadata["settings-schema"], true);
        if(!schemaObj) {
            throw new Error("Schema " + Me.metadata["settings-schema"] + " could not be found for extension " +
                            Me.uuid + ". Please check your installation.");
        }

        this._settings = new Gio.Settings({ settings_schema: schemaObj });
    },

    _onSettingsChanged: function() {
        let selection = this._selected_video;
        
        this._video_store = this._settings.get_value(SETTINGS_VIDEO_STORE).deep_unpack();
        this._loop = this._settings.get_boolean(SETTINGS_LOOP);
        
        this.selected_video = this._settings.get_int(SETTINGS_SELECTED_VIDEO);
        this.playback = this._settings.get_boolean(SETTINGS_PLAYBACK);
        this.volume = this._settings.get_int(SETTINGS_VOLUME);
        this.panelButton = this._settings.get_boolean(SETTINGS_PANEL_BUTTON);
    },
    
    _onVideoEos: function() {
        if(this._loop) {
            this._video.set_playing(true);    
        } else {
            this.playback = false;
        }
    },
    
    _recreateBackgroundActors: function() {
        let background_schema = new Gio.Settings({ schema: SET_BACKGROUND_SCHEMA });
        background_schema.set_string(SET_BACKGROUND_KEY, background_schema.get_string(SET_BACKGROUND_KEY));
    },


    
    get video() {
        return this._video;
    },
    
    get video_store() {
        return this._video_store;
    },

    
    set selected_video(value) {
        if(value != this._selected_video) {
            this._selected_video = value;
            this._settings.set_int(SETTINGS_SELECTED_VIDEO, value);
            
            let file = Gio.File.new_for_uri(this._video_store[value][1]);
            if(file.get_uri_scheme() == null) {
                file = Gio.File.new_for_path(this._video_store[value][1]);
            }
            
            this._video.set_uri(file.get_uri());
            this._video.set_audio_volume(this._volume / 100);
            this._video.set_playing(this._playback);
        }
    },
    
    get selected_video() {
        return this._selected_video;
    },

    
    set volume(value) {
        if(value != this._volume) {
            this._volume = value;
            this._settings.set_int(SETTINGS_VOLUME, value);
            this._video.set_audio_volume(value / 100);
        }
    },

    get volume() {
        return this._volume;
    },

    
    set playback(value) {
        if(value != this._playback) {
            this._playback = value;
            this._settings.set_boolean(SETTINGS_PLAYBACK, value);
            this._video.set_playing(value);
            this._recreateBackgroundActors();
        }
    },

    get playback() {
        return this._playback;
    },

    
    set loop(value) {
        this._loop = value;
        this._settings.set_boolean(SETTINGS_LOOP, value);
    },
    
    get loop() {
        return this._loop;
    },

    
    set panelButton(value) {
        if(value != this._panelButton) {
            this._panelButton = value;
            this._settings.set_boolean(SETTINGS_PANEL_BUTTON, value);
            
            if(value) {
                if(this._videoWallpaperMenu == null) {
                    this._videoWallpaperMenu = new VideoWallpaperButton(this);
                    Main.panel.addToStatusArea(PANEL_BUTTON_ID, this._videoWallpaperMenu);
                }
            } else {
                if(this._videoWallpaperMenu != null) {
                    this._videoWallpaperMenu.destroy();
                    this._videoWallpaperMenu = null;
                }
            }
        }
    },
    
    get panelButton() {
        return this._panelButton;
    }
});
