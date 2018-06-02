import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import {Position2D} from "@common/position";

export default class MouseInput implements Component {
    static c_name : string = "MouseInput";
	static c_id : Bitfield;
    enabled = true;

    mouseGridPosition : Position2D = new Position2D(0, 0);
    mousePosition : Position2D = new Position2D(0, 0);
    previousClickPosition : Position2D = new Position2D(-1, -1);
}