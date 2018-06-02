import { System, registerSystem} from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import {Blink, Visible} from "@components/Components";
import * as Time from "@lib/Time";
import { GameEvents, isEvent} from "@lib/GameEvents";
import { ComponentType, NodeType, ComponentNode } from "@engine/Component";

interface BlinkNode extends ComponentNode {
    Blink : ComponentType<Blink>,
    Visible : ComponentType<Visible>
}

export default class BlinkSystem implements System {

    s_name = "BlinkSystem";
    enabled = true;

    public update () : void {
        EntityManager.forEachEntityWithComponentNode(Blink, this.updateEntity, Visible);
    }

    private updateEntity = (entity : Entity, node : NodeType<BlinkNode>) : void => {
        // We know that this entity has Blink
        if (node.Blink.enabled) {
            if (node.Blink.shouldStart) {
                node.Blink.shouldStart = false;
                node.Blink.interval = node.Blink.speed;
            }
            else {
                node.Blink.interval -= Time.deltaTime;
                if (node.Blink.interval <= 0) {
                    node.Visible.toggle();
                    if (node.Blink.count) {
                        --node.Blink.count;
                        if (node.Blink.count <= 0) {
                            this.stopBlinking(node.Blink, node.Visible);
                            if (node.Blink.onEndCount)
                                node.Blink.onEndCount();
                        }
                    }
                    node.Blink.interval = node.Blink.speed;
                }
            }
        }
    }

    private stopBlinking (blink : Blink, visible : Visible) : void {
        blink.stop();
        visible.enabled = true;
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Character_Death)) {
            if (params.character.name === "Player") {
                // Stop blinking
                let blink = params.character.getComponent(Blink);
                let visible = params.character.getComponent(Visible);
                if (blink !== null) blink.stop();
                if (visible !== null) visible.enabled = true;
            }
            
        }
    }
}

registerSystem(BlinkSystem);