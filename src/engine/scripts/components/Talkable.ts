import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Talkable implements Component {
    static c_name : string = "Talkable";
	static c_id : Bitfield;
    /**
     * If enabled, the bubble shows, event if doesn't have any message.
     * 
     * @memberof Talkable
     */
    enabled = false;

    element : JQuery<HTMLElement> | null = null;

    /**
     * The message that is displayed.
     * 
     * @type {string}
     * @memberof Talkable
     */
    message : string = "";

    /**
     * The time in ms the message will stay up.
     * 
     * @type {number}
     * @memberof Talkable
     */
    time : number = 0;
}