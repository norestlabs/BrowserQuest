import { System, registerSystem} from "@engine/System";
import EntityManager from "@engine/EntityManager";
import { InfoRenderable, Transform } from "@components/Components";
import * as Time from "@lib/Time";
import Entity from "@engine/Entity";
import * as Graphics from "@lib/Graphics";
import { GameEvents, isEvent} from "@lib/GameEvents";
import { ComponentNode, ComponentType, NodeType } from "@engine/Component";

interface InfoRenderableNode extends ComponentNode {
    InfoRenderable : ComponentType<InfoRenderable>,
    Transform : ComponentType<Transform>
}

export default class InfoSystem implements System {

    s_name = "InfoSystem";
    enabled = true;

    public update () : void {
        EntityManager.forEachEntityWithComponentNode(InfoRenderable, this.updateEntity, Transform);
    }

    private updateEntity = (entity : Entity, node : NodeType<InfoRenderableNode>) : void => {
        if (node.InfoRenderable.enabled) {
            node.InfoRenderable.currentTime += Time.deltaTime;
            if (node.InfoRenderable.currentTime >= 100) {
                // Reset
                node.InfoRenderable.currentTime = 0;
                // Lower
                node.Transform.Position.y -= 1;
                // Fade
                node.InfoRenderable.text.alpha -= 0.07;
            }
            if (node.InfoRenderable.text.alpha <= 0) {
                // When it's over, disable it, so that some other info can use it
                node.InfoRenderable.enabled = false;
            }
        }
    }

    private create (transform : Transform, value : string, type : string) : void {
        // Check for any available info
        let infos = EntityManager.getEntityWithTag("Infos");
        let children = infos.getChildren();
        for (let i = 0, len = children.length; i < len; ++i) {
            let infoRenderable = children[i].getComponent(InfoRenderable);
            // If it isn't being used
            if (!infoRenderable.enabled) {
                infoRenderable.start(value, type);
                infoRenderable.text.fontSize = Graphics.scale == 1 ? undefined : Graphics.scale == 2 ? 20 : 30;
                children[i].getComponent(Transform).Position = transform.Position.clone();
                return;
            }
        }

        // If there's none available, create a new one
        let newInfo = EntityManager.createEntityFromLoadedPrefab("DamageInfo", infos);

        let infoRenderable = newInfo.getComponent(InfoRenderable);
        infoRenderable.start(value, type);
        infoRenderable.text.fontSize = Graphics.scale == 1 ? undefined : Graphics.scale == 2 ? 20 : 30;
        newInfo.getComponent(Transform).Position = transform.Position.clone();
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Client_HealthChanged)) {
            let transform = params.player.getComponent(Transform);
            if (params.isHurt) {
                this.create(transform, params.diff.toString(), "received");
            }
            else if (!params.isRegen){
                this.create(transform, params.diff.toString(), "healed");
            }
        }
        else if (isEvent(params, GameEvents.Client_ReceiveDamage)) {
            let transform = params.mob.getComponent(Transform);
            this.create(transform, params.dmg.toString(), "inflicted");
        }
    }
}

registerSystem(InfoSystem);