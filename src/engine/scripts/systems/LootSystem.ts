import { System, registerSystem} from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import {Loot, Transform, Identifiable, Equipment, Blink, Invincible, SpriteRenderable} from "@components/Components";
import GameTypes from "@common/gametypes";
import {BroadcastEvent} from "@engine/ecs";
import * as Exceptions from "@utils/exceptions";
import * as Graphics from "@lib/Graphics";
import * as Logger from "@lib/Logger";
import { GameEvents, isEvent} from "@lib/GameEvents";


export default class LootSystem implements System {

    s_name = "LootSystem";
    enabled = true;

    public update () : void {
        this.checkForLoot();
    }

    private checkForLoot () : void {
        let player = EntityManager.getFirstEntityWithComponent(Loot);
        let loot = player.getComponent(Loot);
        if (loot.enabled && loot.target && loot.target.getComponent(Transform) && player.getComponent(Transform) && 
            loot.target.getComponent(Transform).GridPosition.equals(player.getComponent(Transform).GridPosition)) {
                try {
                    let item = loot.target;
                    let identifiable = item.getComponent(Identifiable);

                    this.lootItem(loot, identifiable, player.getComponent(Equipment), player.getComponent(Identifiable), player);

                    BroadcastEvent(GameEvents.Player_Loot.params(loot.target, player));
                }
                catch (e) {
                    if (e instanceof Exceptions.LootException) {
                        BroadcastEvent(GameEvents.Loot_Fail.params(loot.target, e));
                    }
                    else {
                        throw e;
                    }
                }
        }
    }

    private lootItem (loot : Loot, identifiable : Identifiable, equipment : Equipment, playerIdentifiable : Identifiable, player : Entity) : void {
        if (loot) {
            loot.enabled = false;
            let rank, currentRank, msg;

            if (GameTypes.getType(identifiable.kind) === "armor") {
                rank = GameTypes.getArmorRank(identifiable.kind);
                currentRank = GameTypes.getArmorRank(GameTypes.getKindFromString(equipment.armorName));
                msg = "You are wearing a better armor";
            }
            else if (GameTypes.getType(identifiable.kind) === "weapon") {
                rank = GameTypes.getWeaponRank(identifiable.kind);
                currentRank = GameTypes.getWeaponRank(GameTypes.getKindFromString(equipment.weaponName));
                msg = "You are wielding a better weapon";
            }

            if(rank && currentRank) {
                if (rank === currentRank) {
                    throw new Exceptions.LootException("You already have this " + GameTypes.getType(identifiable.kind));
                }
                else if (rank <= currentRank) {
                    throw new Exceptions.LootException(msg);
                }
            }
        
            Logger.log('Player ' + playerIdentifiable.id + ' has looted ' + identifiable.id, Logger.LogType.Info);
            this.onLoot(identifiable, equipment, player.getComponent(Blink), player.getComponent(Invincible), player);
        }
    }
    
    private onLoot (identifiable : Identifiable, equipment : Equipment, blink : Blink, invincible : Invincible, player : Entity) : void {
        let itemName = GameTypes.getKindAsString(identifiable.kind);
        if (GameTypes.getType(identifiable.kind) === "weapon") {
            if (itemName !== equipment.weaponName) {
                blink.start(90, 14, () => {
                    equipment.setWeapon(itemName);
                    player.getChild("Weapon").getComponent(SpriteRenderable).setSprite(Graphics.sprites[itemName]);
                    BroadcastEvent(GameEvents.Player_SwitchEquipment.params(player));
                });
            }
        }
        else if (GameTypes.getType(identifiable.kind) === "armor") {
            // If is invincible, stop it
            //if (this.invincible.enabled) {
            //    this.stopInvincibility();
            //}
            // Actually, if is invincible, keep invincible TODO: test if is working
            if(itemName !== equipment.armorName) {
                blink.start(90, 14, () => {
                    equipment.setArmor(itemName);
                    player.getComponent(SpriteRenderable).setSprite(Graphics.sprites[itemName]);
                    BroadcastEvent(GameEvents.Player_SwitchEquipment.params(player));
                });
            }
        }
        else if (identifiable.kind === GameTypes.Entities.FirePotion) {
            invincible.start();
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.MouseClick)) {
            let entities = params.entities;
            let firstItem = null, item = null;
            for (let id in entities) {
                let entity = EntityManager.getEntityWithID(id);
                let identifiable = entity.getComponent(Identifiable);
                if (identifiable.isExpendableItem) {
                    item = entity;
                }
                else if (identifiable.isItem && firstItem == null) {
                    firstItem = entity;
                }
                else if (identifiable.isMob) {
                    // Cancel
                    return;
                }
            }

            let entity = item != null ? item : firstItem;
            if (entity != null) {
                let player = EntityManager.getFirstEntityWithComponent(Loot);
                let playerLoot = player.getComponent(Loot);

                playerLoot.setTarget(entity);
                BroadcastEvent(GameEvents.Player_LootMove.params(player, entity));
            }
        }
    }
}

registerSystem(LootSystem);