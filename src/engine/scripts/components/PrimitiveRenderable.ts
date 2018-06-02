import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export enum PrimitiveType {
    Rect
}

export default class PrimitiveRenderable implements Component {
    static c_name : string = "PrimitiveRenderable";
	static c_id : Bitfield;
    enabled = true;
    color : string = "";
    format : PrimitiveType = PrimitiveType.Rect;
}