import { CollisionFlags } from "@lib/astar";

let width : number;
let height : number;
export let blankGrid : number[][] = [];
export let pathingGrid : number[][];

export let initPathingGrid = function (sizeX : number, sizeY : number, source : number[][]) : void {
    pathingGrid = [];
    for (let i = 0; i < sizeY; i += 1) {
        pathingGrid[i] = [];
        for (let j = 0; j < sizeX; j += 1) {
            if (source[i][j] === 0)
                pathingGrid[i][j] = 0;
            else pathingGrid[i][j] = CollisionFlags.Obstacles;
        }
    }
}

export let initBlankGrid = function () : void {
    for(let i = 0; i < height; i += 1) {
        blankGrid[i] = [];
        for(let j = 0; j < width; j += 1) {
            blankGrid[i][j] = 0;
        }
    }
}

export let setSize = function (w : number, h : number) : void {
    width = w; height = h;
}

export let addDestiny = function (x : number, y : number) : void {
    pathingGrid[y][x] |= CollisionFlags.Destinations;
}
export let removeDestiny = function (x : number, y : number) : void {
    pathingGrid[y][x] &= ~CollisionFlags.Destinations;
}

export let addCollidable = function (x : number, y : number) : void {
    pathingGrid[y][x] |= CollisionFlags.Collidables;
}
export let removeCollidable = function (x : number, y : number) : void {
    pathingGrid[y][x] &= ~CollisionFlags.Collidables;
}

export let addIgnore = function (x : number, y : number) : void {
    pathingGrid[y][x] |= CollisionFlags.Ignore;
}
export let removeIgnore = function (x : number, y : number) : void {
    pathingGrid[y][x] &= ~CollisionFlags.Ignore;
}

export let has = function (x : number, y : number, flags : CollisionFlags) : boolean {
    return (pathingGrid[y][x] & flags) != 0;
}