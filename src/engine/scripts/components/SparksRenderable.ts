import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class SparksRenderable implements Component {
    static c_name : string = "SparksRenderable";
	static c_id : Bitfield;
    enabled = true;
}