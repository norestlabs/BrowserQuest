import { System, registerSystem} from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import {BroadcastEvent} from "@engine/ecs";
import * as Graphics from "@lib/Graphics";
import * as Components from "@components/Components";
import * as Time from "@lib/Time";
import { GameEvents } from "@lib/GameEvents";


export default class InvincibleSystem implements System {

    s_name = "InvincibleSystem";
    enabled = true;

    public update () : void {
        let player = EntityManager.getEntityWithTag("Player");
        let invincible = player.getComponent(Components.Invincible);
        if (invincible.enabled) {
            if (invincible.shouldStart) {
                this.startInvincibility(player);
            }
            else {
                invincible.timeout -= Time.deltaTime;
                if (invincible.timeout <= 0) {
                    this.stopInvincibility(invincible, player.getComponent(Components.SpriteRenderable), player.getComponent(Components.Equipment));
                }
            }
        }
    }

    private startInvincibility(entity : Entity) : void {    
        let invincible = entity.getComponent(Components.Invincible);
        let spriteRenderer = entity.getComponent(Components.SpriteRenderable);
        let blink = entity.getComponent(Components.Blink);
        let visible = entity.getComponent(Components.Visible);
        spriteRenderer.setSprite(Graphics.sprites["firefox"]);
        BroadcastEvent(GameEvents.Player_OnInvincible.params(entity, true));
        invincible.shouldStart = false;
        if (blink.enabled) {
            // Stop blinking
            blink.enabled = false;
            visible.enabled = true;
        }
        blink.start(90, 14, () => {
            BroadcastEvent(GameEvents.Player_SwitchEquipment.params(entity));
        });

        invincible.timeout = 15000;
    }

    private stopInvincibility(invincible : Components.Invincible, spriteRenderer : Components.SpriteRenderable, equipment : Components.Equipment) : void {
        invincible.stop();
        let player = EntityManager.getEntityWithTag("Player");
        BroadcastEvent(GameEvents.Player_OnInvincible.params(player, false));
        spriteRenderer.setSprite(Graphics.sprites[equipment.armorName]);
        BroadcastEvent(GameEvents.Player_SwitchEquipment.params(player));
    }
}

registerSystem(InvincibleSystem);