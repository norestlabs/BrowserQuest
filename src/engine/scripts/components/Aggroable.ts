import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Aggroable implements Component {
    static c_name : string = "Aggroable";
	static c_id : Bitfield;
    enabled = true;
    
    range : number = 1;

    /**
     * ID of the Entity that aggroed this one.
     */
    aggroedBy : number = -1;
}