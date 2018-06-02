import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class TileAnimationRenderable implements Component {
    static c_name : string = "TileAnimationRenderable";
	static c_id : Bitfield;
    enabled = true;

    startId : number;
    length : number;
    speed : number;
    lastTime : number = 0;
}