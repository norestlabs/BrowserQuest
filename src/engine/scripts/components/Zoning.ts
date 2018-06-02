import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import {Position2D} from "@common/position";
import GameTypes from "@common/gametypes";

export default class Zoning implements Component {
    static c_name : string = "Zoning";
	static c_id : Bitfield;
    enabled = false;

    queue : Position2D[] = [];
    orientation : GameTypes.Orientations = GameTypes.Orientations.Up;

    elapsedTime : number = 0;
    speed : number = 500;
}