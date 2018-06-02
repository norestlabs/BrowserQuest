import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import Text from "@lib/Text";
import {Position2D} from "@common/position";

export default class InfoRenderable implements Component {
    static c_name : string = "InfoRenderable";
	static c_id : Bitfield;
    enabled = false;
    offset = new Position2D(8, -15);

    text : Text = new Text("", true, undefined, undefined, "white");
    currentTime : number = 0;

    public start (value : string, type : string) {
        this.text.text = value;
        this.text.strokeColor = InfoRenderable.damageInfoColors[type].stroke;
        this.text.fillStyle = InfoRenderable.damageInfoColors[type].fill;
        this.text.alpha = 1;
        this.enabled = true;
    }

    static damageInfoColors : { [index : string] : { fill : string, stroke : string} } =
    {
        "received": {
            fill: "rgb(255, 50, 50)",
            stroke: "rgb(255, 180, 180)"
        },
        "inflicted": {
            fill: "white",
            stroke: "#373737"
        },
        "healed": {
            fill: "rgb(80, 255, 80)",
            stroke: "rgb(50, 120, 50)"
        }
    };

    
}