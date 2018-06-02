import { System, registerSystem} from "@engine/System";
import EntityManager from "@engine/EntityManager";
import GameTypes from "@common/gametypes";
import * as _ from "underscore";
import {Transform, Identifiable, CameraView} from "@components/Components";
import * as App from "@lib/App";
import { GameEvents, isEvent} from "@lib/GameEvents";
import * as Audio from "@lib/Audio";
import Detect from "@utils/detect";
import { MusicArea } from "@common/GameMap";

export default class AudioSystem implements System {

    s_name = "AudioSystem";
    enabled = true;

    public awake () : void {
        App.OnMuteButtonClick(Audio.toggle);
        Audio.setExtension(Detect.canPlayMP3() ? "mp3" : "ogg");
        Audio.loadAll();
    }

    private initMusicAreas (areas : MusicArea[]) : void {
        _.each(areas, function(area) {
            Audio.addArea(area.x, area.y, area.width, area.height, area.id);
        });
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Map_Loaded)) {
            this.initMusicAreas(params.map.mapInfo.musicAreas);
        }
        else if (isEvent(params, GameEvents.NPC_Talk)) {
            if (params != null) {
                Audio.playSound("npc");
            }
            else {
                Audio.playSound("npc-end");
            }
        }
        else if (isEvent(params, GameEvents.Client_Welcome)) {
            Audio.updateMusic(params.player.getComponent(Transform).Position);
        }
        else if (isEvent(params, GameEvents.Client_HealthChanged)) {
            if (params.isHurt) {
                Audio.playSound("hurt");
            }
        }
        else if (isEvent(params, GameEvents.Client_Chat)) {
            Audio.playSound("chat");
        }
        else if (isEvent(params, GameEvents.Movement_Door)) {
            if (params.origin.name === "Player") {
                if (params.dest.portal) {
                    Audio.playSound("teleport");
                }
                Audio.updateMusic(params.origin.getComponent(Transform).Position);
            }
        }
        else if (isEvent(params, GameEvents.Player_Restart)) {
            Audio.playSound("revive");
        }
        else if (isEvent(params, GameEvents.Character_Death)) {
            // If is visible
            if (params.character.name === "Player") {
                Audio.fadeOutCurrentMusic();
                Audio.playSound("death");
            }
            else if (EntityManager.getFirstComponent(CameraView).area.contains(params.character.getComponent(Transform).GridPosition)) {
                Audio.playSound("kill" + Math.floor(Math.random() * 2 + 1));
            }
        }
        else if (isEvent(params, GameEvents.Movement_Step)) {
            if (params.origin.name !== "Player") return;
            Audio.updateMusic(params.origin.getComponent(Transform).Position);
        }
        else if (isEvent(params, GameEvents.Achievement_Unlock)) {
            Audio.playSound("achievement");
        }
        else if (isEvent(params, GameEvents.Player_Loot)) {
            let identifiable = params.item.getComponent(Identifiable);
            if (identifiable.kind === GameTypes.Entities.FirePotion) {
                Audio.playSound("firefox");
            }

            if (GameTypes.isHealingItem(identifiable.kind)) {
                Audio.playSound("heal");
            }
            else {
                Audio.playSound("loot");
            }
        }
        else if (isEvent(params, GameEvents.Character_Attack)) {
            // If is visible
            let identifiable = params.character.getComponent(Identifiable);
            if (identifiable.isPlayer && 
                EntityManager.getFirstComponent(CameraView).isVisible(params.character.getComponent(Transform).GridPosition)) {
                Audio.playSound("hit" + Math.floor(Math.random()*2+1));
            }
        }
        else if (isEvent(params, GameEvents.Follow_ReachedTarget)) {
            let target = params.target;
            if (target.getComponent(Identifiable).isChest) {
                Audio.playSound("chest");
            }
        }
        else if (isEvent(params, GameEvents.Loot_Fail)) {
            Audio.playSound("noloot");
        }
    }
}

registerSystem(AudioSystem);