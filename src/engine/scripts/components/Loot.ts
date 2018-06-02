import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import Entity from "@engine/Entity";

// TODO: Change to LootGettable?
export default class Loot implements Component {
    static c_name : string = "Loot";
	static c_id : Bitfield;
    enabled = false;
    
    target : Entity;

    public setTarget (target : Entity) : void {
        if (target) {
            this.target = target;
            this.enabled = true;
        }
    }
}