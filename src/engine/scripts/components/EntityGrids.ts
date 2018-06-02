import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import {Position2D, Dimensions, Area} from "@common/position";
import GameTypes from "@common/gametypes";

export default class EntityGrids implements Component {
    static c_name : string = "EntityGrids";
	static c_id : Bitfield;
    enabled = true;

    /**
     * Grid of ids that are in certain position.
     * 
     * @type {{ [index : number] : boolean[][] }}
     * @memberof EntityGrids
     */
    private entityGrid : { [id : string] : GameTypes.Entities }[][] = [];
    deathpositions : { [index : string] : Position2D } = {};

    public initEntityGrid (dimensions : Dimensions) : void {
        this.entityGrid = [];
        for (let i = 0; i < dimensions.height; i += 1) {
            this.entityGrid[i] = [];
            for (let j = 0; j < dimensions.width; j += 1) {
                this.entityGrid[i][j] = {};
            }
        }
    }

    public addToEntityGrid (id : number, kind : GameTypes.Entities, pos : {x : number, y : number}) : void {
        this.entityGrid[pos.y][pos.x][id] = kind;
    }

    public removeFromEntityGrid(id : number, pos : {x : number, y : number}) : void {
        if (id in this.entityGrid[pos.y][pos.x]) {
            delete this.entityGrid[pos.y][pos.x][id];
        }
    }

    public getEntitiesAt (x : number, y : number) : { [id: string]: GameTypes.Entities } | null {
        if (!this.positionExists(x, y)) return null;
        else return this.entityGrid[y][x];
    }

    public positionExists (x : number, y : number) : boolean {
        if (this.entityGrid == null || x < 0 || y < 0) {
            return false;
        }
        else if (this.entityGrid.length <= y || this.entityGrid[y].length <= x) {
            return false;
        }
        return true;
    }

    public getEntityIdAt (x : number, y : number, kind : GameTypes.EntityType) : string | null {
        let entities = this.getEntitiesAt(x, y);
        if (entities === null) return null;

        for (let id in entities) {
            let k = entities[id];

            if (GameTypes.IsKindOfEntityType(k, kind)) {
                return id;
            }
        }

        return null;
    }

    public forEachEntityIdInArea (area : Area, callback : (id : string) => void, extra? : number) : void {
        let self = this;
        area.forEachPosition((x : number, y : number) => {
            let entities = self.getEntitiesAt(x, y);
            if (entities != null) {
                for (let id in entities) {
                    callback(id);
                }
            }
        }, extra);
    }
}