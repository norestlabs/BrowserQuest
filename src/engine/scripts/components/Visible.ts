import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Visible implements Component {
    static c_name : string = "Visible";
	static c_id : Bitfield;
    enabled = true;

    public toggle () {
        this.enabled = !this.enabled;
    }
}