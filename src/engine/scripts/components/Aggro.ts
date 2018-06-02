import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Aggro implements Component {
    static c_name : string = "Aggro";
	static c_id : Bitfield;
    enabled = true;

    duration : number = 1000;
    currentTime : number = 0;
}