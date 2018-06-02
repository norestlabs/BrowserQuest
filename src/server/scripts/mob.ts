import Character from "./character";
import Types from "@common/gametypes";
import * as Messages from "@common/messageTypes";
import * as _ from "underscore";
import * as Properties from "./properties";
import * as Utils from "@common/utils";
import Item from "./item";
import Area from "./area";
import ChestArea from "./chestarea";
import MobArea from "./mobarea";

export default class Mob extends Character {

    spawningX : number;
    spawningY : number;
    armorLevel : number;
    weaponLevel : number;
    hatelist : { id: number, hate: number }[];
    respawnTimeout : NodeJS.Timer;
    returnTimeout : NodeJS.Timer;
    isDead : boolean;
    area : Area;
    
    respawn_callback : () => void;
    move_callback : (m : Mob) => void;

    constructor (id : string, kind : Types.Entities, x : number, y : number) {
        super(id, "mob", kind, x, y);
        
        this.updateHitPoints();
        this.spawningX = x;
        this.spawningY = y;
        this.armorLevel = Properties.getArmorLevel(this.kind);
        this.weaponLevel = Properties.getWeaponLevel(this.kind);
        this.hatelist = [];
        this.respawnTimeout = null;
        this.returnTimeout = null;
        this.isDead = false;
    }
    
    destroy () : void {
        this.isDead = true;
        this.hatelist = [];
        this.clearTarget();
        this.updateHitPoints();
        this.resetPosition();
        
        this.handleRespawn();
    }
    
    receiveDamage (points : number, playerId : number) : void {
        this.hitPoints -= points;
    }
    
    hates (playerId : number) : boolean {
        return _.any(this.hatelist, function(obj) { 
            return obj.id === playerId; 
        });
    }
    
    increaseHateFor (playerId : number, points : number) : void {
        if (this.hates(playerId)) {
            _.detect(this.hatelist, function(obj) {
                return obj.id === playerId;
            }).hate += points;
        }
        else {
            this.hatelist.push({ id: playerId, hate: points });
        }

        /*
        log.debug("Hatelist : "+this.id);
        _.each(this.hatelist, function(obj) {
            log.debug(obj.id + " -> " + obj.hate);
        });*/
        
        if (this.returnTimeout) {
            // Prevent the mob from returning to its spawning position
            // since it has aggroed a new player
            clearTimeout(this.returnTimeout);
            this.returnTimeout = null;
        }
    }
    
    getHatedPlayerId (hateRank? : number) : number {
        let i : number, playerId : number | null = null;
        let sorted = _.sortBy(this.hatelist, function(obj) { return obj.hate; })
        let size = _.size(this.hatelist);
        
        if (hateRank && hateRank <= size) {
            i = size - hateRank;
        }
        else {
            i = size - 1;
        }

        if (sorted && sorted[i]) {
            playerId = sorted[i].id;
        }
        
        return playerId;
    }
    
    forgetPlayer (playerId : number, duration? : number) : void {
        this.hatelist = _.reject(this.hatelist, function(obj) { return obj.id === playerId; });
        
        if (this.hatelist.length === 0) {
            this.returnToSpawningPosition(duration);
        }
    }
    
    forgetEveryone () : void {
        this.hatelist = [];
        this.returnToSpawningPosition(1);
    }
    
    getDropMessage (item : Item) : Messages.Drop {
        if (item) {
            return [Types.Messages.DROP,
                     this.id,
                     item.id,
                     item.kind,
                     _.pluck(this.hatelist, "id")];
        }
        else return null;
    }
    
    handleRespawn () : void {
        let delay = 30 * 1000, self = this;
        
        if (this.area && this.area instanceof MobArea) {
            // Respawn inside the area if part of a MobArea
            this.area.respawnMob(this, delay);
        }
        else {
            if (this.area && this.area instanceof ChestArea) {
                this.area.removeFromArea(this);
            }
            
            setTimeout(function() {
                if (self.respawn_callback) {
                    self.respawn_callback();
                }
            }, delay);
        }
    }
    
    onRespawn (callback : () => void) : void {
        this.respawn_callback = callback;
    }
    
    resetPosition () : void {
        this.setPosition(this.spawningX, this.spawningY);
    }
    
    returnToSpawningPosition (waitDuration? : number) : void {
        let self = this, delay = waitDuration || 4000;
        
        this.clearTarget();
        
        this.returnTimeout = setTimeout(function() {
            self.resetPosition();
            self.move(self.x, self.y);
        }, delay);
    }
    
    onMove (callback : (m : Mob) => void) : void {
        this.move_callback = callback;
    }
    
    move (x : number, y : number) : void {
        this.setPosition(x, y);
        if (this.move_callback) {
            this.move_callback(this);
        }
    }
    
    updateHitPoints () : void {
        this.resetHitPoints(Properties.getHitPoints(this.kind));
    }
    
    distanceToSpawningPoint (x : number, y : number) : number {
        return Utils.distanceTo(x, y, this.spawningX, this.spawningY);
    }
}
