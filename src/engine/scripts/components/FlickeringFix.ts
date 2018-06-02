import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class FlickeringFix implements Component {
    static c_name : string = "FlickeringFix";
	static c_id : Bitfield;
    enabled = true;

    duration : number = 100;
    currentTime : number = 0;
}