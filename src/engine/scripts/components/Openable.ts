import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Openable implements Component {
    static c_name : string = "Openable";
	static c_id : Bitfield;
    enabled = true;
}