import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Lootable implements Component {
    static c_name : string = "Lootable";
	static c_id : Bitfield;
    enabled = true;

    playersInvolved : number[];
    wasDropped : boolean = false;
    message : string = "A loot message.";
}