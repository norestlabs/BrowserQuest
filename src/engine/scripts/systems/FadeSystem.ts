import { System, registerSystem} from "@engine/System";
import Entity from "@engine/Entity";
import * as Graphics from "@lib/Graphics";
import EntityManager from "@engine/EntityManager";
import {SpriteRenderable, Fadable, Lootable} from "@components/Components";
import * as Time from "@lib/Time";
import { GameEvents, isEvent} from "@lib/GameEvents";
import { ComponentNode, ComponentType, NodeType } from "@engine/Component";

interface FadableNode extends ComponentNode {
    Fadable : ComponentType<Fadable>,
    SpriteRenderable : ComponentType<SpriteRenderable>
}

export default class FadeSystem implements System {

    s_name = "FadeSystem";
    enabled = true;

    public update () : void {
        EntityManager.forEachEntityWithComponentNode(Fadable, this.updateEntity, SpriteRenderable);
    }

    private updateEntity  = (entity : Entity, node : NodeType<FadableNode>) : void => {
        if (node.SpriteRenderable.isLoaded) {
            if (node.Fadable.enabled) {
                node.Fadable.currentTime += Time.deltaTime;
            
                if (node.Fadable.currentTime > node.Fadable.duration) {
                    node.SpriteRenderable.alpha = 1;
                    node.Fadable.enabled = false;
                }
                else {
                    node.SpriteRenderable.alpha = node.Fadable.currentTime / node.Fadable.duration;
                }
            }
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Entity_Added)) {
            let lootable = params.entity.getComponent(Lootable);
            let fadable = params.entity.getComponent(Fadable);
            if (!(lootable && lootable.wasDropped) && Graphics.isDesktop) {
                fadable.start(1000);
            }
        }
    }
}

registerSystem(FadeSystem);