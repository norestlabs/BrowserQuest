import { System, registerSystem, SystemOrder} from "@engine/System";
import * as Graphics from "@lib/Graphics";
import {
    NameRenderable, Transform, MouseInput, InfoRenderable, Identifiable
} from "@components/Components";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import { ComponentNode, ComponentType, NodeType } from "@engine/Component";

interface NameRenderableNode extends ComponentNode {
    NameRenderable : ComponentType<NameRenderable>,
    Transform : ComponentType<Transform>
}

export default class UIRenderSystem implements System {

    s_name = "UIRenderSystem";
    enabled = true;

    public start () : void {
        EntityManager.forEachEntityWithComponent(NameRenderable, function (entity, nameRenderable) {
            nameRenderable.Name = entity.getComponent(Identifiable).name;
        });
    }

    public update () : void {
        Graphics.context.save();
        let mouse = EntityManager.getEntityWithTag("Mouse");
        let camera = EntityManager.getEntityWithTag("MainCamera");
        Graphics.SetView(Graphics.Context.Normal, camera.getComponent(Transform).Position);
        EntityManager.forEachEntityWithComponentNode(NameRenderable, this.updateEntity, Transform);
        
        this.drawCombatInfo();
        Graphics.context.restore();

        Graphics.DrawCursor(mouse.getComponent(MouseInput).mousePosition);
    }

    private updateEntity = (entity : Entity, node : NodeType<NameRenderableNode>) : void => {
        if (node.NameRenderable.enabled) {
            if (Graphics.isDesktop) {
                // TODO: do it better
                let p = node.Transform.Position.clone()
                p = p.Sum(node.NameRenderable.offset.x, node.NameRenderable.offset.y);
                Graphics.DrawText(node.NameRenderable.text, p);
            }
        }
    }

    private drawCombatInfo () : void {
        EntityManager.forEachEntityWithComponent(InfoRenderable, function (entity : Entity, infoRenderable : InfoRenderable) {
            if (infoRenderable.enabled) {
                infoRenderable.text.fontSize = Graphics.scale == 1 ? undefined : Graphics.scale == 2 ? 20 : 30;
                let p = entity.getComponent(Transform).Position;
                Graphics.DrawText(infoRenderable.text, { x: p.x + infoRenderable.offset.x, y : p.y + infoRenderable.offset.y });
            }
        }.bind(this));
    }
}

registerSystem(UIRenderSystem, SystemOrder.UIRender);