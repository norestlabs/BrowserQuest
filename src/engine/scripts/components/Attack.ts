import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import * as Logger from "@common/logger";

/**
 * Component representing whether an entity can attack enemies or not.
 * 
 * @export
 * @class Attack
 * @implements {Component}
 */
export default class Attack implements Component {
    static c_name : string = "Attack";
	static c_id : Bitfield;
    enabled = false;

    private target : number = -1;
    unconfirmedTarget : number = -1;

    cooldownDuration : number = 800;
    cooldownCurrentTime : number = 0;

    // Target

    public hasTarget () : boolean {
        return this.target !== -1;
    }

    public getTarget () : number {
        return this.target;
    }

    public setAttackRate(rate : number) : void {
        this.cooldownDuration = rate;
    }

    /**
     * Sets this character's attack target. It can only have one target at any time.
     */
    setTarget (targetId : number) : void {
        this.enabled = true;
        if (this.target === -1 || this.target !== targetId) { // If it's not already set as the target
            this.unconfirmedTarget = -1;
            this.target = targetId;
            // Let attack right away
            this.cooldownCurrentTime = this.cooldownDuration;
        }
        else {
            Logger.log(targetId + " is already the target of Entity.", Logger.LogType.Debug);
        }
    }

    /**
     * Removes the current attack target.
     * If the target is a character and is still being attacked by this,
     * removes this as target's attacker.
     */
    removeTarget () : void {
        this.target = -1;
        this.enabled = false;
    }

    /**
     * Marks this character as waiting to attack a target.
     * By sending an "attack" message, the server will later confirm (or not)
     * that this character is allowed to acquire this target.
     *
     * @param {Character} character The target character
     */
    waitToAttack (targetId : number) : void {
        this.unconfirmedTarget = targetId;
    }

    /**
     * Returns true if this character is currently waiting to attack the target character.
     * @param {Character} character The target character.
     * @returns {boolean} Whether this character is waiting to attack.
     */
    isWaitingToAttack (targetId : number) : boolean {
        return (this.unconfirmedTarget !== -1 && this.unconfirmedTarget === targetId);
    }
}