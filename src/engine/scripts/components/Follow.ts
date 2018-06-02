import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import { Coordinate } from "@common/position";

/**
 * Component that manages following aspects
 * 
 * @export
 * @class Follow
 * @implements {Component}
 */
export default class Follow implements Component {
    static c_name : string = "Follow";
	static c_id : Bitfield;
    enabled = false;

    private target : number = -1;
    private lastKnownGridPosition : Coordinate = { x: -1, y : -1 };

    public hasTarget () : boolean {
        return this.target !== -1;
    }
    public getTarget () : number {
        return this.target;
    }

    public getLastKnowGridPosition () : Coordinate {
        return this.lastKnownGridPosition;
    }
    public setLastKnowGridPosition (pos : Coordinate) : void {
        this.lastKnownGridPosition = pos;
    }

    public setTarget (e : number, gridPosition : Coordinate) : void {
        this.enabled = true;
        this.target = e;
        this.lastKnownGridPosition = gridPosition;
    }

    public removeTarget () : void {
        this.enabled = false;
        this.target = -1;
        this.lastKnownGridPosition = { x: -1, y : -1 };
    }
}