import SpriteRenderable from "./SpriteRenderable";
import { Bitfield } from "@common/bitfield";

export default class HurtSpriteRenderable extends SpriteRenderable {
    static c_name : string = "HurtSpriteRenderable";
	static c_id : Bitfield;
    enabled = false;
}