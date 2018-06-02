import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Loadable implements Component {
    static c_name : string = "Loadable";
	static c_id : Bitfield;
    enabled = true;

    public isLoaded : boolean = false;
}