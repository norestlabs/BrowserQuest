import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Controllable implements Component {
    static c_name : string = "Controllable";
	static c_id : Bitfield;
    enabled = true;
}