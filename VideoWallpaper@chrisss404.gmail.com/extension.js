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

const Me = imports.misc.extensionUtils.getCurrentExtension();

const VideoWallpaper = Me.imports.videoWallpaper.VideoWallpaper;


let videoWallpaper = null;
function init() {
    videoWallpaper = new VideoWallpaper();
}


function enable() {
    videoWallpaper.enable();
}


function disable() {
    videoWallpaper.disable();
}
