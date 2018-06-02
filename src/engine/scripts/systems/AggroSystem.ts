import { System, registerSystem } from "@engine/System";
import Entity from "@engine/Entity";
import { Aggro, Aggroable, Transform } from "@components/Components";
import EntityManager from "@engine/EntityManager";
import {BroadcastEvent} from "@engine/ecs";
import * as Time from "@lib/Time";
import { GameEvents, isEvent} from "@lib/GameEvents";
import { ComponentType, ComponentNode, NodeType } from "@engine/Component";

interface AggroNode extends ComponentNode {
    Aggro : ComponentType<Aggro>,
    Transform : ComponentType<Transform>
}

interface AggroableNode extends ComponentNode {
    Aggroable : ComponentType<Aggroable>,
    Transform : ComponentType<Transform>
}


export default class AggroSystem implements System {

    s_name = "AggroSystem";
    enabled = true;

    public update () : void {
        EntityManager.forEachEntityWithComponentNode(Aggro, this.updateEntity, Transform);
    }

    private updateEntity = (entity : Entity, node : NodeType<AggroNode>) : void => {
        if (node.Aggro.enabled) {
            node.Aggro.currentTime += Time.deltaTime;
            if (node.Aggro.currentTime >= node.Aggro.duration) {
                this.checkAggro(entity, node.Transform);
                node.Aggro.currentTime = 0;
            }
        }
    }

    private checkAggro (player : Entity, transform : Transform) : void {
        EntityManager.forEachEntityWithComponentNode(Aggroable, function (entity : Entity, node : NodeType<AggroableNode>) {
            if (node.Aggroable.enabled && node.Aggroable.aggroedBy != player.id && 
                transform.isNear(node.Transform, node.Aggroable.range)) {
                node.Aggroable.aggroedBy = player.id;
                BroadcastEvent(GameEvents.Player_OnAggro.params(player, entity));
            }
        }, Transform);
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Movement_Step)) {
            // If entity has Aggro, check it
            let aggro = params.origin.getComponent(Aggro);
            if (aggro !== null && aggro.enabled) {
                this.checkAggro(params.origin, params.origin.getComponent(Transform));
            }
        }
        else if (isEvent(params, GameEvents.Attack_SetTarget)) {
            // Disable aggro when starts attacking
            let aggro = params.attacker.getComponent(Aggro);
            if (aggro != null) {
                aggro.enabled = false;
            }
            let aggroable = params.attacker.getComponent(Aggroable);
            if (aggroable != null) {
                aggroable.enabled = false;
            }
        }
        else if (isEvent(params, GameEvents.Attack_RemoveTarget)) {
            // Re-enable aggro when stops attacking
            let aggro = params.attacker.getComponent(Aggro);
            if (aggro != null) {
                aggro.enabled = true;
            }
            let aggroable = params.attacker.getComponent(Aggroable);
            if (aggroable != null) {
                aggroable.enabled = true;
                aggroable.aggroedBy = -1;
            }
        }
        else if (isEvent(params, GameEvents.Character_Death)) {
            let aggroable = params.character.getComponent(Aggroable);
            if (aggroable != null) {
                aggroable.enabled = false;
                aggroable.aggroedBy = -1;
            }
        }
    }
}

registerSystem(AggroSystem);