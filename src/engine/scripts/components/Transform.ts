import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import {Position2D, Coordinate, isCoordinate} from "@common/position";
import GameTypes from "@common/gametypes";

export default class Transform implements Component {
    private position : Position2D = new Position2D(0, 0);
    private gridPosition : Position2D = new Position2D(0, 0);
    private orientation : GameTypes.Orientations = GameTypes.Orientations.Down;
    public static c_name : string = "Transform";
	public static c_id : Bitfield;
    public enabled = true;

    set GridPosition (p : Position2D) {
        this.gridPosition = p;
        this.position = new Position2D(p.x * 16, p.y * 16);
    }

    set Position (p : Position2D) {
        this.position = p;
        this.gridPosition = new Position2D(Math.floor(p.x / 16), Math.floor(p.y / 16));
    }

    get Position () {
        return this.position;
    }

    get GridPosition () {
        return this.gridPosition;
    }

    public updateGridPosition () {
        this.gridPosition = new Position2D(Math.floor(this.position.x / 16), Math.floor(this.position.y / 16));
    }

    set Orientation (o : GameTypes.Orientations) {
        if (o != null) this.orientation = o;
    }

    get Orientation () {
        return this.orientation;
    }

    public lookAt (target : Transform | Coordinate) : void {
        this.orientation = this.getOrientationTo(target);
    }
    
    /**
     * Gets the right orientation to face a target character from the current position.
     * Note:
     * In order to work properly, this method should be used in the following
     * situation :
     *    S
     *  S T S
     *    S
     * (where S is self, T is target character)
     */
    getOrientationTo (target : Coordinate | Transform) : GameTypes.Orientations {
        let pos = isCoordinate(target) ? target : target.Position;
        if (this.Position.x < pos.x) {
            return GameTypes.Orientations.Right;
        }
        else if (this.Position.x > pos.x) {
            return GameTypes.Orientations.Left;
        }
        else if (this.Position.y > pos.y) {
            return GameTypes.Orientations.Up;
        }
        else {
            return GameTypes.Orientations.Down;
        }
    }

    getDistanceToEntity(tr : Transform) {
        let distX = Math.abs(tr.GridPosition.x - this.GridPosition.x);
        let distY = Math.abs(tr.GridPosition.y - this.GridPosition.y);

        return (distX > distY) ? distX : distY;
    }

    isCloseTo(tr : Transform) {
        let dx, dy, close = false;
        if (tr) {
            dx = Math.abs(tr.GridPosition.x - this.GridPosition.x);
            dy = Math.abs(tr.GridPosition.y - this.GridPosition.y);
        
            if (dx < 30 && dy < 14) {
                close = true;
            }
        }
        return close;
    }

    /**
     * Returns true if the entity is adjacent to the given one.
     * @returns {boolean} Whether these two entities are adjacent.
     */
    isAdjacent(tr : Transform) : boolean {
        let adjacent = false;
    
        if(tr) {
            adjacent = this.getDistanceToEntity(tr) > 1 ? false : true;
        }
        return adjacent;
    }

    /**
     * 
     */
    isAdjacentNonDiagonal(tr : Transform) {
        let result = false;

        if(this.isAdjacent(tr) && 
            !(this.GridPosition.x !== tr.GridPosition.x && this.GridPosition.y !== tr.GridPosition.y)) {
            result = true;
        }
    
        return result;
    }
    
    isDiagonallyAdjacent(tr : Transform) {
        return this.isAdjacent(tr) && !this.isAdjacentNonDiagonal(tr);
    }

    isNear(other : Transform, distance : number) {
        let dx, dy, near = false;
    
        dx = Math.abs(this.GridPosition.x - other.GridPosition.x);
        dy = Math.abs(this.GridPosition.y - other.GridPosition.y);
    
        if(dx <= distance && dy <= distance) {
            near = true;
        }
        return near;
    }
}