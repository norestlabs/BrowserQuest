import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Fadable implements Component {
    static c_name : string = "Fadable";
	static c_id : Bitfield;
    enabled = false;

    /**
     * The time counter, shows for how long it has been fading.
     * 
     * @type {number}
     * @memberof Fadable
     * @default 0
     */
    currentTime : number = 0;

    /**
     * The fade duration in ms.
     * 
     * @memberof Fadable
     * @default 1000
     */
    duration : number = 1000;

    fadeIn : boolean = true;

    public start (duration : number) {
        this.enabled = true;
        this.currentTime = 0;
        this.duration = duration;
    }
}