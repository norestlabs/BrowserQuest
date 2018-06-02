import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import { MusicArea, ClientMap } from "@common/GameMap";

export default class TiledMap extends ClientMap implements Component {
    static c_name : string = "TiledMap";
	static c_id : Bitfield;
    enabled = true;
    
    data: (number | number[])[];
    musicAreas: MusicArea[];
    blocking: number[];
    plateau: number[];
    high: number[];
    animated: { [index: string]: { [index: string]: number } };
    width: number;
    height: number;
    tilesize: number;
    collisions: number[];
}