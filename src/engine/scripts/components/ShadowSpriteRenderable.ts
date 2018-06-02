import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class ShadowSpriteRenderable extends Component {
    static c_name : string = "ShadowSpriteRenderable";
	static c_id : Bitfield;
    enabled : boolean = true;

    /**
     * The Y offset of the shadow.
     * 
     * @type {number}
     * @memberof ShadowSpriteRenderable
     * @default 0
     */
    offset : number = 0;
}