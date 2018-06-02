import * as sanitizer from "sanitizer";
import Types from "@common/gametypes";

export function sanitize (string : string) : string {
    // Strip unsafe tags, then escape as html entities.
    return sanitizer.escape(sanitizer.sanitize(string));
};

export function random (range : number) : number {
    return Math.floor(Math.random() * range);
};

export function randomRange (min : number, max : number) : number {
    return min + (Math.random() * (max - min));
};

export function randomInt (min : number, max : number) : number {
    return min + Math.floor(Math.random() * (max - min + 1));
};

export function clamp (min : number, max : number, value : number) : number {
    if (value < min) {
        return min;
    }
    else if (value > max) {
        return max;
    }
    else {
        return value;
    }
};

export function randomOrientation () : Types.Orientations {
    let o, r = random(4);
    
    if (r === 0)
        o = Types.Orientations.Left;
    if (r === 1)
        o = Types.Orientations.Right;
    if (r === 2)
        o = Types.Orientations.Up;
    if (r === 3)
        o = Types.Orientations.Down;
    
    return o;
};

export function distanceTo (x : number, y : number, x2 : number, y2 : number) : number {
    let distX = Math.abs(x - x2);
    let distY = Math.abs(y - y2);

    return (distX > distY) ? distX : distY;
};