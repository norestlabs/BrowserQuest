import GameTypes from "@common/gametypes";
import * as Utils from "@common/utils";

export interface Coordinate {
    x : number;
    y : number;
}

export function isCoordinate (o : any) : o is Coordinate {
    return "x" in o && "y" in o;
}

export class Position2D implements Coordinate {
    public x : number;
    public y : number;

    constructor (xx : number, yy : number) {
        this.x = xx; this.y = yy;
    }
    
    /**
     * Creates a new position based on this.
     * 
     * @returns {Position2D} The cloned position.
     * @memberof Position2D
     */
    clone () : Position2D {
        return new Position2D(this.x, this.y);
    }

    /**
     * Copies the given position's values into this.
     * 
     * @param {Position2D} pos 
     * @memberof Position2D
     */
    copy (pos : Position2D) {
        this.x = pos.x; this.y = pos.y;
    }

    Multiply (factor1 : number, factor2? : number) {
        if (!factor2) factor2 = factor1;
        this.x *= factor1;
        this.y *= factor2;
        return this;
    }

    Divide (factor1 : number, factor2? : number) {
        if (!factor2) factor2 = factor1;
        this.x /= factor1;
        this.y /= factor2;
        return this;
    }

    Sum (factor1 : number, factor2? : number) {
        if (!factor2) factor2 = factor1;
        this.x += factor1;
        this.y += factor2;
        return this;
    }

    Set (xx : number, yy : number) {
        this.x = xx; this.y = yy;
    }

    public IsInArea (x1? : number, x2? : number, y1? : number, y2? : number) {
        x1 = x1 || this.x; x2 = x2 || this.x; y1 = y1 || this.y; y2 = y2 || this.y;
        return this.x >= x1 && this.x <= x2 && this.y >= y1 && this.y <= y2;
    }

    public toString () {
        return "(" + this.x + ", " + this.y + ")";
    }

    public equals (pos : Coordinate) {
        // TODO: change
        if (pos == null) return false;
        return pos.x == this.x && pos.y == this.y;
    }

    isAdjacentNonDiagonal(gridPos : Coordinate) {
        let result = false;

        if(this.isAdjacent(gridPos) && 
            !(this.x !== gridPos.x && this.y !== gridPos.y)) {
            result = true;
        }
    
        return result;
    }
    
    isDiagonallyAdjacent(gridPos : Position2D) {
        return this.isAdjacent(gridPos) && !this.isAdjacentNonDiagonal(gridPos);
    }

    /**
     * Returns true if the entity is adjacent to the given one.
     * @returns {Boolean} Whether these two entities are adjacent.
     */
    isAdjacent(gridPos : Coordinate) {
        let adjacent = false;
    
        if(gridPos) {
            adjacent = this.getDistanceToPosition(gridPos) > 1 ? false : true;
        }
        return adjacent;
    }

    getDistanceToPosition(gridPos : Coordinate) {
        let distX = Math.abs(gridPos.x - this.x);
        let distY = Math.abs(gridPos.y - this.y);

        return (distX > distY) ? distX : distY;
    }

    public getOrientationTo (pos : Coordinate) : GameTypes.Orientations {
        if (this.x < pos.x) {
            return GameTypes.Orientations.Right;
        }
        else if (this.x > pos.x) {
            return GameTypes.Orientations.Left;
        }
        else if (this.y > pos.y) {
            return GameTypes.Orientations.Up;
        }
        else {
            return GameTypes.Orientations.Down;
        }
    }
}

export interface Rect extends Coordinate {
    x : number; y : number;
    width : number; height : number;
    left? : number; right? : number;
    top? : number; bottom? : number;
}

export interface Dimensions {
    width : number;
    height : number;
}

export class Area implements Rect {
    x : number;
    y : number;
    width : number; height : number;

    constructor (r : Rect) {
        this.x = r.x;
        this.y = r.y;
        this.width = r.width;
        this.height = r.height;
    }

    contains (pos : Coordinate) {
        return pos.x >= this.x &&
            pos.y >= this.y &&
            pos.x < this.x + this.width &&
            pos.y < this.y + this.height;
    }

    public static Intersects (rect1 : Rect, rect2 : Rect) : boolean {
        return !((rect2.left > rect2.right) ||
                    (rect2.right < rect1.left) ||
                    (rect2.top > rect1.bottom) ||
                    (rect2.bottom < rect1.top));
    }

    public static Contains (srcPos : Position2D, srcDimensions : Position2D, pos : Position2D) {
        return pos.x >= srcPos.x && pos.y >= srcPos.y &&
            pos.x < srcPos.x + srcDimensions.x && pos.y < srcPos.y + srcDimensions.y;
    }

    public forEachPosition (callback : (x : number, y : number) => void, extra? : number) : void {
        let e = extra || 0;
        for(let y = this.y - e, maxY = this.y + this.height + (e * 2); y < maxY; y += 1) {
            for(let x = this.x - e, maxX = this.x + this.width + (e * 2); x < maxX; x += 1) {
                callback(x, y);
            }
        }
    }
}

export let getRandomPositionInArea = function (area : Rect) : Coordinate {
    return {
        x : area.x + Utils.randomInt(0, area.width - 1),
        y : area.y + Utils.randomInt(0, area.height - 1)
    }
}

export let isPositionInArea = function (pos : Coordinate, area : Rect) : boolean {
    return pos.x >= area.x &&
        pos.y >= area.y &&
        pos.x < area.x + area.width &&
        pos.y < area.y + area.height;
}

export let forEachPositionInArea = function (area : Rect, callback : (x : number, y : number) => void, extra? : number) : void {
    let e = extra || 0;
    for (let y = area.y - e, maxY = area.y + area.height + (e * 2); y < maxY; y += 1) {
        for (let x = area.x - e, maxX = area.x + area.width + (e * 2); x < maxX; x += 1) {
            callback(x, y);
        }
    }
}