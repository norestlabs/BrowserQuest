import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import {Position2D} from "@common/position";

export default class TileRenderable implements Component {
    static c_name : string = "TileRenderable";
	static c_id : Bitfield;
    enabled = true;

    /**
     * Grid Position of the tile in the map.
     * 
     * @type {Position2D}
     * @memberof TileRenderable
     */
    gridPosition : Position2D;
    /**
     * Number representing the gridPosition in the map.
     * 
     * @type {number}
     * @memberof TileRenderable
     */
    index : number;
    /**
     * Represents the position of the tile in the tileset.
     * 
     * @type {number}
     * @memberof TileRenderable
     */
    id : number;
}