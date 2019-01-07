import { System, registerSystem, SystemOrder } from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import { BroadcastEvent } from "@engine/ecs";
import {
  Attack, Identifiable, Transform, Attackable
} from "@components/Components";
import * as Time from "@lib/Time";
import * as Logger from "@lib/Logger";
import { GameEvents, isEvent } from "@lib/GameEvents";
import { ComponentType, ComponentNode, NodeType } from "@engine/Component";

interface AttackNode extends ComponentNode {
  Attack: ComponentType<Attack>,
  Transform: ComponentType<Transform>
}

export default class AttackSystem implements System {

  s_name = "AttackSystem";
  enabled = true;

  public update(): void {
    EntityManager.forEachEntityWithComponentNode(Attack, this.updateEntity, Transform);
  }

  /**
   * Method responsible for updating the given character.
   * 
   * @param {Character} character - The Character to be updated.
   * @memberof AttackSystem
   */
  private updateEntity = (character: Entity, node: NodeType<AttackNode>): void => {
    if (node.Attack.enabled && node.Attack.hasTarget()) {
      let target = EntityManager.getEntityWithID(node.Attack.getTarget());
      let targetTransform = target.getComponent(Transform);
      node.Attack.cooldownCurrentTime += Time.deltaTime;
      let isAdjacentNonDiagonal = node.Transform.isAdjacentNonDiagonal(targetTransform);
      let canAttack = isAdjacentNonDiagonal && node.Attack.cooldownCurrentTime >= node.Attack.cooldownDuration;
      if (canAttack) {
        BroadcastEvent(GameEvents.Character_Attack.params(character, target));
        node.Attack.cooldownCurrentTime = 0;
      }
    }
  }

  /**
   * Handles the Attack message received from the server.
   * @param attacker 
   * @param target 
   */
  private clientAttack(attacker: Entity, target: Entity): void {
    if (attacker && target) {
      // If it's the player, it was already processed locally
      if (attacker.name !== "Player") {
        let targetAttack = target.getComponent(Attack);
        let attackerTransform = attacker.getComponent(Transform);
        if (targetAttack == null || attackerTransform == null) return;
        Logger.log(`${attacker.toString()} attacks ${target.toString()}`, Logger.LogType.Debug);
        let self = this;
        let targetAttackTarget = targetAttack.hasTarget() ? EntityManager.getEntityWithID(targetAttack.getTarget()) : null;
        let targetAttackTargetTransform = targetAttackTarget !== null ? targetAttackTarget.getComponent(Transform) : null;
        // If the target is a Warrior and attacker is near, delay to prevent other players' attacking mobs
        // from ending up on the same tile as they walk towards each other.
        // TODO: Check if still necessary
        if (target.name === "Warrior" && targetAttack.hasTarget()
          && targetAttackTarget.id === attacker.id && targetAttackTargetTransform != null
          && attackerTransform.getDistanceToEntity(targetAttackTargetTransform) < 3) {
          window.setTimeout(function () {
            self.createAttackLink(attacker, target);
          }, 200);
        }
        else {
          this.createAttackLink(attacker, target);
        }
      }
    }
  }

  /**
   * Links two entities in an attacker<-->target relationship.
   * 
   * This is just a utility method to wrap a set of instructions.
   *
   * @param {Entity} attacker The attacker entity
   * @param {Entity} target The target entity
   */
  private createAttackLink(attacker: Entity, target: Entity): void {
    let targetAttackable = target.getComponent(Attackable);
    if (targetAttackable == null || !targetAttackable.enabled) return;

    // Attacker
    let attack = attacker.getComponent(Attack);
    if (attack === null) return;

    // If already has a target, remove it
    if (attack.hasTarget()) {
      let currentTarget = EntityManager.getEntityWithID(attack.getTarget());
      if (currentTarget !== null) {
        // If it was once a target, we know it's attackable
        currentTarget.getComponent(Attackable)!.removeAttacker(attacker.id);
      }
      attack.removeTarget();
      BroadcastEvent(GameEvents.Attack_RemoveTarget.params(attacker, currentTarget));
    }

    attack.setTarget(target.id);
    targetAttackable.addAttacker(attacker.id);

    BroadcastEvent(GameEvents.Attack_SetTarget.params(attacker, target));
  }

  private makePlayerAttack(mob: Entity): void {
    let player = EntityManager.getEntityWithTag("Player");
    if (player !== null) {
      this.createAttackLink(player, mob);
      BroadcastEvent(GameEvents.Player_CreateAttackLink.params(player, mob));
    }
  }

  private cleanAttackers(origin: Entity): void {
    let attackable = origin.getComponent(Attackable);
    attackable.forEachAttacker(function (attacker) {
      let entity = EntityManager.getEntityWithID(attacker); // Serious Error - TypeError : Entity is null
      if (!entity) {
        entity.getComponent(Attack).removeTarget();
        BroadcastEvent(GameEvents.Attack_RemoveTarget.params(entity, origin));
        let attackable = entity.getComponent(Attackable);
        if (attackable.isAttackedBy(origin.id)) attackable.removeAttacker(origin.id);
      }
    });
    attackable.removeAttackers();
    let attack = origin.getComponent(Attack);
    if (attack.hasTarget()) {
      let target = EntityManager.getEntityWithID(attack.getTarget());
      attack.removeTarget();
      BroadcastEvent(GameEvents.Attack_RemoveTarget.params(origin, target));
    }
  }

  public onNotify(params: any): void {
    if (isEvent(params, GameEvents.Client_Attack)) {
      this.clientAttack(params.attacker, params.target);
    }
    else if (isEvent(params, GameEvents.MouseClick)) {
      let entities = params.entities;
      // Check if there is a mob
      for (let id in entities) {
        let entity = EntityManager.getEntityWithID(id);
        let identifiable = entity.getComponent(Identifiable);
        if (identifiable != null && identifiable.isMob) {
          this.makePlayerAttack(entity);
        }
      }
    }
    else if (isEvent(params, GameEvents.Character_Death)) {
      this.cleanAttackers(params.character);
      params.character.getComponent(Attackable).enabled = false;
    }
    else if (isEvent(params, GameEvents.Movement_Door)) {
      if (params.origin.name === "Player") {
        this.cleanAttackers(params.origin);
      }
    }
    else if (isEvent(params, GameEvents.Character_Teleport)) {
      let attackable = params.character.getComponent(Attackable);
      attackable.forEachAttacker(function (attacker) {
        let e = EntityManager.getEntityWithID(attacker);
        e.getComponent(Attack).removeTarget();
        BroadcastEvent(GameEvents.Attack_RemoveTarget.params(e, params.character));
        e.getComponent(Attackable).removeAttacker(params.character.id);
      });
      attackable.removeAttackers();
    }
    else if (isEvent(params, GameEvents.Entity_Added)) {
      // If was added with an attacker, create link
      if (params.target !== null && params.entity.getComponent(Identifiable).isMob) {
        this.createAttackLink(params.entity, params.target);
      }
    }
    else if (isEvent(params, GameEvents.Player_OnAggro)) {
      let mob = params.aggroedMob;
      let identifiable = mob.getComponent(Identifiable);
      let attack = mob.getComponent(Attack);
      let id = params.player.getComponent(Identifiable).id;
      Logger.log("[" + id + "] Aggroed by " + identifiable.id + " at " + params.player.getComponent(Transform).GridPosition.toString(), Logger.LogType.Info);
      attack.waitToAttack(params.player.id);
    }
    else if (isEvent(params, GameEvents.Movement_GoTo)) {
      let attack = params.origin.getComponent(Attack);
      if (attack != null && attack.enabled && attack.hasTarget()) {
        let target = EntityManager.getEntityWithID(attack.getTarget());
        // The entity isn't attacking anymore
        attack.removeTarget();
        // And the target isn't being attacked anymore
        target.getComponent(Attackable).removeAttacker(params.origin.id);
        BroadcastEvent(GameEvents.Attack_RemoveTarget.params(params.origin, target));
      }
    }
  }
}

registerSystem(AttackSystem, SystemOrder.Movement + 1);