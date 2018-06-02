import SpriteRenderable from "./SpriteRenderable";
import { Bitfield } from "@common/bitfield";


export default class SilhouetteSpriteRenderable extends SpriteRenderable {
    static c_name : string = "SilhouetteSpriteRenderable";
	static c_id : Bitfield;
    enabled = false;
}