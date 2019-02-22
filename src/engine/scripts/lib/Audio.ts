import { Coordinate, isPositionInArea } from "@common/position";
import * as _ from "underscore";

import Assets from "@utils/assets";
import * as Logger from "@lib/Logger";
import Detect from "@utils/detect";
import { MusicArea } from "@common/GameMap";

export interface HTMLAudioElement extends HTMLMediaElement {
    fadingIn : number;
    fadingOut : number;
}

export interface Music {
    sound: HTMLAudioElement;
    name: string
}

let currentExtension : string;
let sounds : { [index : string] : HTMLAudioElement[] } = {};
let currentMusic : Music | null = null;
let areas : MusicArea[] = [];
//let musicNames : string[] = ["village", "beach", "forest", "cave", "desert", "lavaland", "boss"];
let soundNames : string[] = [
    "loot", "hit1", "hit2", "hurt", "heal", "chat", "revive", "death", "firefox",
    "achievement", "kill1", "kill2", "noloot", "teleport", "chest", "npc", "npc-end"
];
let enabled : boolean = true;

export let getSurroundingMusic = function (position : Coordinate) : Music | null {
    for (let i = 0, len = areas.length; i < len; ++i) {
        if (isPositionInArea(position, areas[i])) {
            let sound = getSound(<string>areas[i].id);
            if (sound !== null) {
                return {
                    sound,
                    name: <string>areas[i].id
                };
            }
            else return null;
        }
    }

    return null;
}

export let getSound = function (name : string) : HTMLAudioElement | null {
    if (!sounds[name]) {
        return null;
    }
    let sound = _.detect(sounds[name], function(sound) {
        return sound.ended || sound.paused;
    });
    if (sound && sound.ended) {
        sound.currentTime = 0;
    }
    else {
        sound = sounds[name][0];
    }
    return sound;
}

export let playSound = function (name : string) : void {
    let sound = getSound(name);
    if (sound && enabled) {
        sound.play();
    }
}

export let addArea = function (x : number, y : number, width : number, height : number, musicName : string) : void {
    let area = { x: x, y: y, width: width, height: height, id : musicName };
    areas.push(area);
}

export let setExtension = function (ext : string) : void {
    currentExtension = ext;
}

export let isCurrentMusic = function (music : Music) : boolean {
    return currentMusic && (music.name === currentMusic.name);
}

export let playMusic = function (music : Music) : void {
    if (enabled && music && music.sound) {
        if (music.sound.fadingOut) {
            fadeInMusic(music);
        }
        else {
            music.sound.volume = 1;
            music.sound.play();
        }
        currentMusic = music;
    }
}

export let resetMusic = function (music : Music) : void {
    if (music && music.sound && music.sound.readyState > 0) {
        music.sound.pause();
        music.sound.currentTime = 0;
    }
}

export let fadeOutMusic = function (music : Music, ended_callback : (m : Music) => void) : void {
    if (music && !music.sound.fadingOut) {
        clearFadeIn(music);
        music.sound.fadingOut = window.setInterval(function() {
            let step = 0.02,
                volume = music.sound.volume - step;
        
            if (enabled && volume >= step) {
                music.sound.volume = volume;
            }
            else {
                music.sound.volume = 0;
                clearFadeOut(music);
                ended_callback(music);
            }
        }, 50);
    }
}

export let fadeInMusic = function (music : Music) : void {
    if (music && !music.sound.fadingIn) {
        clearFadeOut(music);
        music.sound.fadingIn = window.setInterval(function() {
            let step = 0.01,
                volume = music.sound.volume + step;

            if (enabled && volume < 1 - step) {
                music.sound.volume = volume;
            }
            else {
                music.sound.volume = 1;
                clearFadeIn(music);
            }
        }, 30);
    }
}

export let clearFadeOut = function (music : Music) : void {
    if (music.sound.fadingOut) {
        clearInterval(music.sound.fadingOut);
        music.sound.fadingOut = null;
    }
}

export let clearFadeIn = function (music : Music) : void {
    if (music.sound.fadingIn) {
        clearInterval(music.sound.fadingIn);
        music.sound.fadingIn = null;
    }
}

export let fadeOutCurrentMusic = function () : void {
    if (currentMusic) {
        fadeOutMusic(currentMusic, function(music) {
            resetMusic(music);
        });
        currentMusic = null;
    }
}

export let updateMusic = function (position : Coordinate) : void {
    if (enabled) {
        let music = getSurroundingMusic(position);

        if (music) {
            if (!isCurrentMusic(music)) {
                if (currentMusic) {
                    fadeOutCurrentMusic();
                }
                playMusic(music);
            }
        }
        else {
            fadeOutCurrentMusic();
        }
    }
}

export let toggle = function () : void {
    if (enabled) {
        enabled = false;
    
        if (currentMusic) {
            resetMusic(currentMusic);
        }
    }
    else {
        enabled = true;
    
        if (currentMusic) {
            currentMusic = null;
        }
    }
}

/**
 * 
 * 
 * @param {string} basePath - Base path of audio file (relative to the .html file).
 * @param {string} name 
 * @param {() => void} loaded_callback 
 * @param {number} channels 
 */
export let load = function (path : string, name : string, loaded_callback : () => void, channels : number) : void {
    let sound = <HTMLAudioElement>document.createElement('audio');
    
    sound.addEventListener('canplaythrough', function canplaythrough (e : Event) {
        sound.removeEventListener('canplaythrough', canplaythrough, false);
        Logger.addToGroup(`${path} is ready to play.`, `AudioLoad`, Logger.LogType.Debug);
        if(loaded_callback) {
            loaded_callback();
        }
    }, false);
    sound.addEventListener('error', function (e : ErrorEvent) {
        Logger.log("Error: "+ path +" could not be loaded. " + e.message, Logger.LogType.Error);
        sounds[name] = null;
    }, false);

    sound.preload = "auto";
    (<any>sound).autobuffer = true;
    sound.src = path;
    sound.load();

    sounds[name] = [sound];
    _.times(channels - 1, function() {
        sounds[name].push(<HTMLAudioElement>sound.cloneNode(true));
    });
}

export let loadSound = function (name : string, handleLoaded : () => void) : void {
    load(Assets.PathToSound(name, currentExtension), name, handleLoaded, 4);
}

let loadSoundFiles = function() {
    let counter = _.size(soundNames);
    Logger.log("Loading sound files...", Logger.LogType.Info);
    _.each(soundNames, function(name) { loadSound(name, function() {
            counter -= 1;
            if(counter === 0) {
                if(!Detect.isSafari()) { // Disable music on Safari - See bug 738008
                    //loadMusicFiles();
                }
                Logger.printGroup(`AudioLoad`);
            }
        });
    });
};

/*
    private loadMusic(name : string, handleLoaded? : () => void) : void {
        load(Assets.PathToMusic(name, extension), name, handleLoaded, 1);
        let music = sounds[name][0];
        music.loop = true;
        music.addEventListener('ended', function() { music.play() }, false);
    }
*/

/*let loadMusicFiles = function() {
    if (!Graphics.isMobile) { // disable music on mobile devices
        Logger.info("Loading music files...");
        // Load the village music first, as players always start here
        loadMusic(musicNames.shift(), function() {
            // Then, load all the other music files
            _.each(musicNames, function(name) {
                loadMusic(name);
            });
        });
    }
};*/

export let loadAll = function () {
    if (!(Detect.isSafari() && Detect.isWindows())) {
        loadSoundFiles();
    }
    else {
        enabled = false; // Disable audio on Safari Windows
    }
}