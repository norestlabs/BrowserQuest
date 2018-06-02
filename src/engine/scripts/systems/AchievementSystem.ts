import { System, registerSystem, SystemOrder } from "@engine/System";
import GameTypes from "@common/gametypes";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import { Identifiable, Transform, Attackable, Lootable } from "@components/Components";
import { BroadcastEvent } from "@engine/ecs";
import * as _ from "underscore";
import * as Logger from "@lib/Logger";
import { GameEvents, isEvent } from "@lib/GameEvents";
import { getSurroundingMusic } from "@lib/Audio";
import * as Achievements from "@lib/Achievements";


/**
 * Listens to events, checking if any achievements can be unlocked with them.
 * 
 * @class AchievementSystem
 * @implements {System}
 */
export default class AchievementSystem implements System {

    s_name = "AchievementSystem";
    enabled = true;

    public awake () : void {
        Achievements.initAchievements();
    }

    /**
     * Tries to unlock an achievement. If successful, broadcasts "Achievement_Unlock" event.
     * 
     * @private
     * @param {string} name 
     * @memberof AchievementSystem
     */
    private tryUnlockingAchievement (name : string) : void {
        let achievement = Achievements.tryUnlockingAchievement(name);
        if (achievement !== null) {
            BroadcastEvent(GameEvents.Achievement_Unlock.params(achievement));
        }
    }

    /**
     * Uses the "cave" music area to check if player is underground.
     * 
     * @private
     * @param {Entity} player 
     * @memberof AchievementSystem
     */
    private checkUndergroundAchievement (player : Entity) : void {
        let transform = player.getComponent(Transform);
        if (transform !== null) {
            let music = getSurroundingMusic(transform.Position);
    
            // If the current music is "cave", is underground
            if (music != null && music.name === "cave") {
                this.tryUnlockingAchievement("UNDERGROUND");
            }
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Client_CharacterKilled)) {
            this.tryUnlockingAchievement("HUNTER");
            if (params != null) {
                let kind = params.mobKind;

                if (kind === GameTypes.Entities.Rat) {
                    this.tryUnlockingAchievement("ANGRY_RATS");
                }

                if (kind === GameTypes.Entities.Skeleton || kind === GameTypes.Entities.Skeleton2) {
                    this.tryUnlockingAchievement("SKULL_COLLECTOR");
                }

                if (kind === GameTypes.Entities.Boss) {
                    this.tryUnlockingAchievement("HERO");
                }
            }
        }
        else if (isEvent(params, GameEvents.NPC_Talk)) {
            this.tryUnlockingAchievement("SMALL_TALK");

            let identifiable = params.npc.getComponent(Identifiable);
            if (identifiable !== null && identifiable.kind === GameTypes.Entities.Rick) {
                this.tryUnlockingAchievement("RICKROLLD");
            }
        }
        else if (isEvent(params, GameEvents.Client_Welcome)) {
            let self = this;
            window.setTimeout(function() {
                self.tryUnlockingAchievement("STILL_ALIVE");
            }, 1500);
        }
        else if (isEvent(params, GameEvents.Client_HealthChanged)) {
            this.tryUnlockingAchievement("MEATSHIELD");
        }
        else if (isEvent(params, GameEvents.Movement_Step)) {
            if (params.origin.name !== "Player") return;
            let transform = params.origin.getComponent(Transform);
            if (transform === null) return;
            if ((transform.GridPosition.x <= 85 && transform.GridPosition.y <= 179 && transform.GridPosition.y > 178) || (transform.GridPosition.x <= 85 && transform.GridPosition.y <= 266 && transform.GridPosition.y > 265)) {
                this.tryUnlockingAchievement("INTO_THE_WILD");
            }

            if (transform.GridPosition.x <= 85 && transform.GridPosition.y <= 293 && transform.GridPosition.y > 292) {
                this.tryUnlockingAchievement("AT_WORLDS_END");
            }

            if (transform.GridPosition.x <= 85 && transform.GridPosition.y <= 100 && transform.GridPosition.y > 99) {
                this.tryUnlockingAchievement("NO_MANS_LAND");
            }

            if (transform.GridPosition.x <= 85 && transform.GridPosition.y <= 51 && transform.GridPosition.y > 50) {
                this.tryUnlockingAchievement("HOT_SPOT");
            }

            if (transform.GridPosition.x <= 27 && transform.GridPosition.y <= 123 && transform.GridPosition.y > 112) {
                this.tryUnlockingAchievement("TOMB_RAIDER");
            }
        }
        else if (isEvent(params, GameEvents.Movement_Door)) {
            if (params.origin.tag === "Player") {
                let attackable = params.origin.getComponent(Attackable);
                if (attackable === null) return;
                if (_.size(attackable.attackers) > 0) {
                    let self = this;
                    window.setTimeout(function() {
                        self.tryUnlockingAchievement("COWARD");
                    }, 500);
                }
                this.checkUndergroundAchievement(params.origin);
            }
        }
        else if (isEvent(params, GameEvents.Player_Loot)) {
            let identifiable = params.item.getComponent(Identifiable);
            let lootable = params.item.getComponent(Lootable);
            if (identifiable === null) {
                Logger.log(`Loot doesn't have Identifiable component.`, Logger.LogType.Warn);
                return;
            }
            if (lootable === null) {
                Logger.log(`Loot doesn't have Lootable component ${identifiable.toString()}.`, Logger.LogType.Warn);
                return;
            }
            if (GameTypes.getType(identifiable.kind) === "armor") {
                this.tryUnlockingAchievement("FAT_LOOT");
            }

            if (GameTypes.getType(identifiable.kind) === "weapon") {
                this.tryUnlockingAchievement("A_TRUE_WARRIOR");
            }

            if (identifiable.kind === GameTypes.Entities.Cake) {
                this.tryUnlockingAchievement("FOR_SCIENCE");
            }

            if (identifiable.kind === GameTypes.Entities.FirePotion) {
                this.tryUnlockingAchievement("FOXY");
            }
    
            let player = params.player;
            if (player !== null) {
                let playerIdentifiable = player.getComponent(Identifiable);
                if (playerIdentifiable !== null) {
                    if (lootable.wasDropped && !(_.contains(lootable.playersInvolved, playerIdentifiable.id))) {
                        this.tryUnlockingAchievement("NINJA_LOOT");
                    }
                }
            }
        }
        else if (isEvent(params, GameEvents.Client_Moved)) {
            // If it is a mob that was attacking the player, player managed to run away from it
            let identifiable = params.entity.getComponent(Identifiable);
            let player = EntityManager.getEntityWithTag("Player");
            if (identifiable === null || player === null)
                return;
            let attackable = player.getComponent(Attackable);
            if (identifiable.isCharacter && attackable !== null && attackable.isAttackedBy(params.entity.id)) {
                this.tryUnlockingAchievement("COWARD");
            }
        }
    }
}

// Run after storage system, to use latest storage informations
registerSystem(AchievementSystem, SystemOrder.Normal + 1);