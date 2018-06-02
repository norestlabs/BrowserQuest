import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import {Rect} from "@common/position";

/**
 * Used only in non-desktop versions, for performance.
 * In the desktop version, every frame clears the whole screen, and re-draws whatever is on it.
 * In other versions, this clear screen operation is not performed, so the renderer needs to know
 * which Entities are "Dirty", that is, that caused a visual change in the frame, and only update it
 * and the entities around, lowering the number of rendering objects each frame.
 * 
 * @export
 * @class Dirty
 * @implements {Component}
 */
export default class Dirty implements Component {
    static c_name : string = "Dirty";
	static c_id : Bitfield;
    enabled = true;

    /**
     * The current area occupied by the entity. Used to be set to oldRect once has changed.
     * 
     * @type {Rect}
     * @memberof Dirty
     */
    rect : Rect | null = null;
    /**
     * Previous area, that was left "dirty".
     * If the character for example moved, the area it occupied in the previous frame has to be cleared,
     * else a "ghost" image will stay there, leaving a trail.
     * 
     * @type {Rect}
     * @memberof Dirty
     */
    oldRect : Rect | null = null;
}