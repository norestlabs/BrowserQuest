import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import {Position2D, Area} from "@common/position";

export default class CameraView implements Component {
    static c_name : string = "CameraView";
	static c_id : Bitfield;
    enabled = true;

    area : Area = new Area({ x:0, y:0, width:0, height:0 });

    public isVisible (gridPos : Position2D) : boolean {
        return this.area.contains(gridPos);
    }
    
    /**
     * Whether the given GridPosition is one that requires zoning or not.
     */
    public isZoningTile (x : number, y : number) : boolean {
        x = x - this.area.x;
        y = y - this.area.y;

        if (x === 0 || y === 0 || x === this.area.width - 1 || y === this.area.height - 1) {
            return true;
        }
        return false;
    }
}