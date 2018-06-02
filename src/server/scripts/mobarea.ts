
import Area from "./area";
import * as _ from "underscore";
import Types from "@common/gametypes";
import Mob from "./mob";
import * as Utils from "@common/utils";
import World from "./worldserver";

export default class MobArea extends Area {

    nb : number;
    kind : string;
    //respawns = [];

    constructor(id : number, nb : number, kind : string, x : number, y : number, width : number, height : number, world : World) {
        super(id, x, y, width, height, world);
        this.nb = nb;
        this.kind = kind;
        //this.respawns = [];
        this.setNumberOfEntities(this.nb);
        
        //this.initRoaming();
    }
    
    spawnMobs() {
        for(let i = 0; i < this.nb; i += 1) {
            this.addToArea(this._createMobInsideArea());
        }
    }
    
    _createMobInsideArea() {
        let k = Types.getKindFromString(this.kind),
            pos = this._getRandomPositionInsideArea(),
            mob = new Mob('1' + this.id + ''+ k + ''+ this.entities.length, k, pos.x, pos.y);
        
        mob.onMove(this.world.onMobMoveCallback.bind(this.world));

        return mob;
    }
    
    respawnMob(mob : Mob, delay : number) {
        let self = this;
        
        this.removeFromArea(mob);
        
        setTimeout(function() {
            let pos = self._getRandomPositionInsideArea();
            
            mob.x = pos.x;
            mob.y = pos.y;
            mob.isDead = false;
            self.addToArea(mob);
            self.world.addMob(mob);
        }, delay);
    }

    initRoaming(mob : Mob) {
        let self = this;
        
        setInterval(function() {
            _.each(self.entities, function(mob) {
                let canRoam = (Utils.random(20) === 1),
                    pos;
                
                if(canRoam) {
                    if(!mob.hasTarget() && !mob.isDead) {
                        pos = self._getRandomPositionInsideArea();
                        mob.move(pos.x, pos.y);
                    }
                }
            });
        }, 500);
    }
    
    createReward() {
        let pos = this._getRandomPositionInsideArea();
        
        return { x: pos.x, y: pos.y, kind: Types.Entities.Chest };
    }
}
