import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import Entity from "@engine/Entity";

/**
 * Represents the ability to hover through the game's objects.
 * Should only be enabled once the game is actually running.
 * 
 * @export
 * @class MouseHover
 * @implements {Component}
 */
export default class MouseHover implements Component {
    static c_name : string = "MouseHover";
	static c_id : Bitfield;
    enabled = true;

    /**
     * The entity that is currently being hovered by the cursor.
     * 
     * @type {Entity}
     * @memberof MouseHover
     */
    hoveringEntity : Entity | null = null;
    lastHovered : Entity | null = null;
    hoveringPlateauTile : boolean = false;
    hoveringCollidingTile : boolean = false;
}