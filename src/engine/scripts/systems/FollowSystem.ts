import { System, registerSystem, SystemOrder} from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import {BroadcastEvent} from "@engine/ecs";
import {Follow, Movable, Transform, Identifiable} from "@components/Components";
import { GameEvents, isEvent} from "@lib/GameEvents";
import { ComponentNode, ComponentType, NodeType, createBitfield } from "@engine/Component";
import { DestinationType } from "@components/Movable";

interface FollowNode extends ComponentNode {
    Follow : ComponentType<Follow>,
    Transform : ComponentType<Transform>
}

export default class FollowSystem implements System {

    s_name = "FollowSystem";
    enabled = true;
    
    public update () : void {
        EntityManager.forEachEntityWithComponentNode(Follow, this.updateEntity, Transform);
    }

    private updateEntity = (entity : Entity, node : NodeType<FollowNode>) : void => {
        if (node.Follow.enabled && node.Follow.hasTarget()) {
            let movable = entity.getComponent(Movable);
            // Check movable's path
            let target = EntityManager.getEntityWithID(node.Follow.getTarget());
            let targetTransform = target.getComponent(Transform);
            /*if (movable === null || movable.wait) {
                node.Transform.lookAt(targetTransform.Position);
            }
            else if (movable.isMoving()) {
                // Check if target has moved
                if (!targetTransform.GridPosition.equals(node.Follow.getLastKnowGridPosition())) {
                    node.Follow.setLastKnowGridPosition(targetTransform.GridPosition);
                    movable.setDestination(targetTransform.GridPosition.clone());
                }
            }
            else if (!targetTransform.GridPosition.isAdjacentNonDiagonal(node.Transform.GridPosition)) {
                movable.destination = targetTransform.GridPosition.clone();
            }*/

            // Check if it's moving
            if (!movable.isMoving()) {
                // Start
                movable.setDestination(targetTransform.GridPosition.clone(), DestinationType.Around);
            }
            // Check if target has moved
            if (!targetTransform.GridPosition.equals(node.Follow.getLastKnowGridPosition())) {
                node.Follow.setLastKnowGridPosition(targetTransform.GridPosition);
                movable.setDestination(targetTransform.GridPosition.clone(), DestinationType.Around);
            }
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.MouseClick)) {
            let entities = params.entities;
            let player = EntityManager.getEntityWithTag("Player");
            for (let id in entities) {
                let entity = EntityManager.getEntityWithID(id);
                let identifiable = entity.getComponent(Identifiable);
                if (identifiable.isChest || identifiable.isNpc) {
                    let node = player.getComponentNode<FollowNode>(createBitfield(Follow, Transform));
                    node.Follow.setTarget(entity.id, node.Transform.GridPosition);
                    if (entity.getComponent(Transform).isAdjacentNonDiagonal(node.Transform)) {
                        BroadcastEvent(GameEvents.Follow_ReachedTarget.params(player, entity));
                    }
                }
            }
        }
        else if (isEvent(params, GameEvents.Movement_PathingStop)) {
            if (params.origin.name === "Player") {
                let follow = params.origin.getComponent(Follow);
                let transform = params.origin.getComponent(Transform);
                if (follow.hasTarget()) {
                    let target = EntityManager.getEntityWithID(follow.getTarget());
                    if (transform.isAdjacentNonDiagonal(target.getComponent(Transform))) {
                        BroadcastEvent(GameEvents.Follow_ReachedTarget.params(params.origin, target));
                    }
                    // If stopped pathing without reaching target, stop follow
                    follow.removeTarget();
                }
            }
        }
        else if (isEvent(params, GameEvents.Movement_GoTo)) {
            let follow = params.origin.getComponent(Follow);
            if (follow !== null && follow.enabled) {
                follow.removeTarget();
            }
        }
        else if (isEvent(params, GameEvents.Attack_RemoveTarget)) {
            let follow = params.attacker.getComponent(Follow);
            if (follow !== null && follow.enabled) {
                follow.removeTarget();
            }
        }
        else if (isEvent(params, GameEvents.Attack_SetTarget)) {
            let node = params.attacker.getComponentNode<FollowNode>(createBitfield(Follow, Transform));
            if (node !== null) {
                node.Follow.setTarget(params.target.id, node.Transform.GridPosition);
            }
        }
        else if (isEvent(params, GameEvents.Character_Death)) {
            let follow = params.character.getComponent(Follow);
            if (follow !== null) {
                follow.enabled = false;
            }
        }
    }
}

registerSystem(FollowSystem, SystemOrder.Movement - 1);