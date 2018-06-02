import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Invincible implements Component {
    static c_name : string = "Invincible";
	static c_id : Bitfield;
    enabled = false;

    timeout : number = -1;

    shouldStart : boolean = false;

    public start () {
        if (this.enabled) {
            this.timeout = 15000;
        }
        else {
            this.shouldStart = true;
            this.enabled = true;
        }
    }

    public stop () {
        this.shouldStart = false;
        this.enabled = false;
        this.timeout = 0;
    }
}