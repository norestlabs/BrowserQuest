import { System, registerSystem} from "@engine/System";
import EntityManager from "@engine/EntityManager";
import Entity from "@engine/Entity";
import {Talkable, Transform} from "@components/Components";
import * as Graphics from "@lib/Graphics";
import * as Time from "@lib/Time";
import { GameEvents, isEvent} from "@lib/GameEvents";
import { ComponentType, NodeType, ComponentNode } from "@engine/Component";

interface TalkableNode extends ComponentNode {
    Talkable : ComponentType<Talkable>,
    Transform : ComponentType<Transform>
}

export default class BubbleSystem implements System {

    s_name = "BubbleSystem";
    enabled = true;

    /**
     * Container in which bubbles are created and added to.
     * 
     * @type {HTMLElement}
     * @memberof BubbleSystem
     */
    container : HTMLElement;

    public awake () : void {
        this.container = document.getElementById("bubbles");
    }

    public update () : void {
        EntityManager.forEachEntityWithComponentNode(Talkable, this.updateEntity, Transform);
    }

    private updateEntity = (entity : Entity, node : NodeType<TalkableNode>) : void => {
        if (node.Talkable.enabled) {
            node.Talkable.time -= Time.deltaTime;
                if (node.Talkable.time <= 0) {
                    this.stop(entity, node.Talkable);
                }
                // Show above the entity
                else if (node.Talkable.element == null) {
                    node.Talkable.element = this.createElement(entity.id, node.Talkable.message);
                }
        }
    }

    /**
     * Removes all bubbles from the scene.
     */
    public clean () : void {
        EntityManager.forEachEntityWithComponent(Talkable, this.stop);
    }

    public stop = (entity : Entity, talkable : Talkable) : void => {
        if (talkable.enabled) {
            talkable.enabled = false;
            talkable.time = 0;
            this.destroyBubble(talkable);
        }
    }

    private setMessage (id : number | string, tf : Transform, ta : Talkable) : void {
        if (ta.enabled) {
            if (ta.element == null)
                ta.element = this.createElement(id, ta.message);
            else $("#" + id + " p").html(ta.message);
            ta.enabled = true;
        }
        else {
            ta.element = this.createElement(id, ta.message);
            ta.enabled = true;
        }
    }

    /**
     * Creates the element and appends to the container.
     */
    private createElement (id : number | string, message : string) : JQuery<HTMLElement> {
        let el = $("<div id=\"" + id + "\" class=\"bubble\"><p>" + message + "</p><div class=\"thingy\"></div></div>"); //.attr('id', id);
        $(el).appendTo(this.container);
        return el;
    }

    public setPosition (entity : Entity) : void {
        let talkable = entity.getComponent(Talkable);
        let transform = entity.getComponent(Transform);
        if (talkable === null || transform == null || !talkable.enabled) return;
        // TODO: this check shouldn't be needed?
        if (!talkable.element) return;
        let cameraTf = EntityManager.getEntityWithTag("MainCamera").getComponent(Transform);
        let s = Graphics.scale,
            t = 16 * s, // tile size
            x = ((transform.Position.x - cameraTf.Position.x) * s),
            w = parseInt(talkable.element.css('width')) + 24,
            offset = (w / 2) - (t / 2),
            offsetY,
            y;

        /*if(character instanceof Npc) {
            offsetY = 0;
        } else {*/
            if(s === 2) {
                if(Graphics.isMobile) {
                    offsetY = 0;
                } else {
                    offsetY = 15;
                }
            } else {
                offsetY = 12;
            }
        //}

        y = ((transform.Position.y - cameraTf.Position.y) * s) - (t * 2) - offsetY;

        talkable.element.css('left', x - offset + 'px');
        talkable.element.css('top', y + 'px');
    }

    private destroyBubble (talkable : Talkable) : void {
        $(talkable.element).remove();
        talkable.element = null;
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Movement_Moved)) {
            this.setPosition(params.origin);
        }
        else if (isEvent(params, GameEvents.Zoning_Start) || isEvent(params, GameEvents.Zoning_Reset) || isEvent(params, GameEvents.Resize) || isEvent(params, GameEvents.Client_Welcome)) {
            this.clean();
        }
        else if (isEvent(params, GameEvents.NPC_Talk)) {
            let msg = params.message;
            let transform = params.npc.getComponent(Transform);
            let talkable = params.npc.getComponent(Talkable);
            if (msg != null) {
                this.setMessage(params.npc.id, transform, talkable);
                this.setPosition(params.npc);
            }
            else {
                this.stop(params.npc, talkable);
            }
        }
        else if (isEvent(params, GameEvents.Client_Chat)) {
            let talkable = params.character.getComponent(Talkable);
            this.setMessage(params.character.id, params.character.getComponent(Transform), talkable);
            this.setPosition(params.character);
        }
        else if (isEvent(params, GameEvents.Movement_Door)) {
            if (params.origin.name === "Player") {
                if (params.dest.portal && (!Graphics.isMobile || !params.dest.cameraX || !params.dest.cameraY)) {
                    this.setPosition(params.origin);
                }
            }
        }
        else if (isEvent(params, GameEvents.Character_Teleport)) {
            this.setPosition(params.character);
        }
    }
}

registerSystem(BubbleSystem);