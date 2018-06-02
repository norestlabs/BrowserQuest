import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Clickable implements Component {
    static c_name : string = "Clickable";
	static c_id : Bitfield;
    enabled = true;
}