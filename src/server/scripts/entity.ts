import * as Utils from "@common/utils";
import Types from "@common/gametypes";
import * as Messages from "@common/messageTypes";
import { Coordinate } from "@common/position";

export default class Entity {

    id : number;
    type : string;
    kind : Types.Entities;
    x : number;
    y : number;

    group : string;
    recentlyLeftGroups : string[];
    hitPoints : number;

    constructor (id : string, type : string, kind : Types.Entities, x : number, y : number) {
        this.id = parseInt(id);
        this.type = type;
        this.kind = kind;
        this.x = x;
        this.y = y;
    }
    
    destroy () : void { }
    
    _getBaseState () : [number, Types.Entities, number, number] {
        return [
            this.id,
            this.kind,
            this.x,
            this.y
        ];
    }
    
    getState () : [number, Types.Entities, number, number,
        [Types.Orientations, number | undefined, string, Types.Entities, Types.Entities] |
        [Types.Orientations, number | undefined] | undefined] {
            let base = this._getBaseState();
        return [base[0], base[1], base[2], base[3], undefined];
    }
    
    getSpawnMessage () : Messages.Spawn {
        let info = this.getState();
        return [Types.Messages.SPAWN, info[0], info[1], info[2], info[3], info[4]];
    }
    
    getDespawnMessage () : Messages.Despawn {
        return [Types.Messages.DESPAWN, this.id];
    }
    
    setPosition (x : number, y : number) : void {
        this.x = x;
        this.y = y;
    }
    
    getPositionNextTo (entity : Entity) : Coordinate | null {
        if (entity) {
            let pos = {} as { x : number, y : number };
            // This is a quick & dirty way to give mobs a random position
            // close to another entity.
            let r = Utils.random(4);
            
            pos.x = entity.x;
            pos.y = entity.y;
            if(r === 0)
                pos.y -= 1;
            if(r === 1)
                pos.y += 1;
            if(r === 2)
                pos.x -= 1;
            if(r === 3)
                pos.x += 1;

            return pos;
        }
        else return null;
    }
}