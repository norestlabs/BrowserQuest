import { System, registerSystem } from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import { Attackable, HurtSpriteRenderable } from "@components/Components";
import * as Time from "@lib/Time";
import { ComponentNode, ComponentType, NodeType } from "@engine/Component";

interface HurtSpriteRenderableNode extends ComponentNode {
    HurtSpriteRenderable : ComponentType<HurtSpriteRenderable>,
    Attackable : ComponentType<Attackable>
}

export default class HurtSystem implements System {

    s_name = "HurtSystem";
    enabled = true;

    public update () : void {
        EntityManager.forEachEntityWithComponentNode(HurtSpriteRenderable, this.updateEntity, Attackable);
    }

    private updateEntity = (entity : Entity, node : NodeType<HurtSpriteRenderableNode>) : void => {
        if (node.HurtSpriteRenderable.enabled) {
            node.Attackable.hurtTimeout -= Time.deltaTime;
        
            if (node.Attackable.hurtTimeout <= 0) {
                node.HurtSpriteRenderable.enabled = false;
                node.Attackable.stopHurt();
            }
        }
    }
}

registerSystem(HurtSystem);