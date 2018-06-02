import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import * as _ from "underscore";
import * as Logger from "@common/logger";

/**
 * Component representing whether an entity can be attacked or not.
 * 
 * @export
 * @class Attackable
 * @implements {Component}
 */
export default class Attackable implements Component {
    static c_name : string = "Attackable";
	static c_id : Bitfield;
    enabled = true;

    hurtTimeout : number = 0;
    isHurting : boolean = false;

    stopHurt () {
        this.isHurting = false;
        this.hurtTimeout = 0;
    }

    startHurt () {
        this.isHurting = true;
        this.hurtTimeout = 75;
    }
    
    // TODO: Change to a SparseArray. Create SparseArray as array...or not. Check uses.
    /**
     * List of characters that are attacking this character, by id.
     * 
     * @type {{ [s : string] : boolean }}
     */
    attackers : { [id : string] : boolean } = {};

    /**
     * Returns true if this character is currently attacked by a given character.
     */
    isAttackedBy (id : number | string) : boolean {
        return (id in this.attackers);
    }

    /**
    * Unregisters a character as a current attacker of this one.
    */
    removeAttacker (id : number | string) {
        if (this.isAttackedBy(id)) {
            delete this.attackers[id];
            Logger.log("Attacker removed: " + id, Logger.LogType.Info);
        }
        else {
            Logger.log("Entity is not being attacked by " + id + ", but is trying to remove it.", Logger.LogType.Debug);
        }
    }

    /**
    * Registers a character as a current attacker of this one.
    */
    addAttacker (entityId : number | string) {
        if (!this.isAttackedBy(entityId)) {
            this.attackers[entityId] = true;
            Logger.log("Attacker added: " + entityId, Logger.LogType.Info);
        }
        else {
            Logger.log("Entity is already being attacked by " + entityId, Logger.LogType.Error);
        }
    }

    /**
     * Loops through all the characters currently attacking this one.
     */
    forEachAttacker(callback : (id : string) => void) {
        _.each(this.attackers, function(attacker, i) {
            if (attacker != null) callback(i);
        });
    }

    removeAttackers () : void {
        this.attackers = {};
    }
}