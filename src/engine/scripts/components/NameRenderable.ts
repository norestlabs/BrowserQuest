import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import Text from "@lib/Text";
import {Position2D} from "@common/position";

export default class NameRenderable implements Component {
    static c_name : string = "NameRenderable";
	static c_id : Bitfield;
    enabled = true;
    offset = new Position2D(8, -10);

    text : Text = new Text("", true, undefined, undefined, "white");

    set Name (n : string) {
        this.text.text = n;
    }

    set Color (c : string) {
        this.text.fillStyle = c;
    }
}