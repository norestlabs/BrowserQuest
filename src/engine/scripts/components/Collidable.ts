import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Collidable implements Component {
    static c_name : string = "Collidable";
	static c_id : Bitfield;
    enabled = true;
}