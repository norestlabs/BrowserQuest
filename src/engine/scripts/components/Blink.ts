import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Blink implements Component {
    static c_name : string = "Blink";
	static c_id : Bitfield;
    enabled = false;

    interval : number = -1;

    /**
     * The amount of time in ms between each visibility toggle.
     * 
     * @type {number}
     * @memberof Blink
     * @default 150
     */
    speed : number = 150;

    count : number | undefined = undefined;
    onEndCount : (() => void) | undefined = undefined;

    shouldStart : boolean = false;

    public start (s : number, c? : number, onEnd? : () => void) {
        if (this.enabled) {
            // Stop blinking
            // Call on end count to force blink end
            if (this.onEndCount)
                this.onEndCount();
            this.stop();
        }
        
        this.shouldStart = true;
        this.enabled = true;
        this.speed = s;
        this.interval = s;
        this.count = c;
        this.onEndCount = onEnd;
    }

    public stop () {
        this.shouldStart = false;
        this.enabled = false;
    }
}