import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class DebugSettings implements Component {
    static c_name : string = "DebugSettings";
	static c_id : Bitfield;
    enabled = true;

    debugPathing : boolean = false;

    entityGrid : boolean = true;
}