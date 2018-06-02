

import Entity from "./entity";
import Types from "@common/gametypes";
import * as Utils from "@common/utils";
import {log} from "./main";
import * as Messages from "@common/messageTypes";

export default class Character extends Entity {

    orientation : Types.Orientations;
    attackers : { [index : number] : Character };
    target : number;
    maxHitPoints : number;
    hitPoints : number;

    constructor (id : string, type : string, kind : Types.Entities, x : number, y : number) {
        super(id, type, kind, x, y);
        
        this.orientation = Utils.randomOrientation();
        this.attackers = {};
        this.target = null;
    }
    
    getState () : [number, Types.Entities, number, number,
        [Types.Orientations, number | undefined, string, Types.Entities, Types.Entities] |
        [Types.Orientations, number | undefined] | undefined] {
        let basestate = this._getBaseState(),
            state = [];
        
        state.push(this.orientation);
        if(this.target) {
            state.push(this.target);
        }

        let s : [number, Types.Entities, number, number,
                [Types.Orientations, number | undefined]]
            = [basestate[0], basestate[1], basestate[2], basestate[3],[this.orientation, this.target ? this.target : undefined]];
        
        return s;
    }
    
    resetHitPoints (maxHitPoints : number) : void {
        this.maxHitPoints = maxHitPoints;
        this.hitPoints = this.maxHitPoints;
    }
    
    regenHealthBy (value : number) : void {
        let hp = this.hitPoints, max = this.maxHitPoints;
            
        if (hp < max) {
            if (hp + value <= max) {
                this.hitPoints += value;
            }
            else {
                this.hitPoints = max;
            }
        }
    }
    
    hasFullHealth () : boolean {
        return this.hitPoints === this.maxHitPoints;
    }
    
    setTarget (entity : Entity) : void {
        this.target = entity.id;
    }
    
    clearTarget () : void {
        this.target = null;
    }
    
    hasTarget () : boolean {
        return this.target !== null;
    }
    
    getAttackMessage () : Messages.Types {
        return [Types.Messages.ATTACK,
            this.id,
            this.target];
    }
    
    getHealthMessage () : Messages.Types {
        return [Types.Messages.HEALTH,
            this.hitPoints, false];
    }
    
    getRegenMessage () : Messages.Types {
        return [Types.Messages.HEALTH,
                    this.hitPoints, true];
    }
    
    addAttacker (entity : Character) : void {
        if (entity) {
            this.attackers[entity.id] = entity;
        }
    }
    
    removeAttacker (entity : Character) : void {
        if (entity && entity.id in this.attackers) {
            delete this.attackers[entity.id];
            log.debug(this.id +" REMOVED ATTACKER "+ entity.id);
        }
    }
    
    forEachAttacker (callback : (e : Character) => void) : void {
        for (let id in this.attackers) {
            callback(this.attackers[id]);
        }
    }
}