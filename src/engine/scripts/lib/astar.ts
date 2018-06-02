import {Position2D, Coordinate} from "@common/position";

export enum CollisionFlags {
    Nothing = 0,
    Collidables = 1,
    Destinations = 2,
    Obstacles = 4,
    All = 7,
    Ignore = 8
};

interface Node {
    x: number;
    y: number;
    f: number;
    g: number;
    v: number;
    p?: Node;
}

/**
 * A* (A-Star) algorithm for a path finder
 * @author  Andrea Giammarchi
 * @license Mit Style License
 */

function diagonalSuccessors($N : boolean, $S : boolean, $E : boolean, $W : boolean, 
    N : number, S : number, E : number, W : number,
    grid : number[][], rows : number, cols : number, result : Position2D[], i : number) {
    if ($N) {
        $E && grid[N][E] == 0 && (result[i++] = new Position2D(E, N));
        $W && grid[N][W] == 0 && (result[i++] = new Position2D(W, N));
    }
    if ($S) {
        $E && grid[S][E] == 0 && (result[i++] = new Position2D(E, S));
        $W && grid[S][W] == 0 && (result[i++] = new Position2D(W, S));
    }
    return result;
}

function diagonalSuccessorsFree($N : boolean, $S : boolean, $E : boolean, $W : boolean, 
    N : number, S : number, E : number, W : number,
    grid : number[][], rows : number, cols : number, result : Position2D[], i : number, flags : CollisionFlags) {

    $N = N > -1;
    $S = S < rows;
    $E = E < cols;
    $W = W > -1;
    if ($E) {
        $N && isEmpty(E, N, grid, flags) && (result[i++] = new Position2D(E, N));
        $S && isEmpty(E, S, grid, flags) && (result[i++] = new Position2D(E, S));
    }
    if ($W) {
        $N && isEmpty(W, N, grid, flags) && (result[i++] = new Position2D(W, N));
        $S && isEmpty(W, S, grid, flags) && (result[i++] = new Position2D(W, S));
    }
    return result;
}

function nothingToDo($N : boolean, $S : boolean, $E : boolean, $W : boolean, 
    N : number, S : number, E : number, W : number,
    grid : number[][], rows : number, cols : number, result : Position2D[], i : number) {
    return result;
}

function isEmpty (x : number, y : number, grid : number[][], flags : CollisionFlags) : boolean {
    let value = grid[y][x];
    // If has to ignore, remove collidable bit from value
    if (flags & CollisionFlags.Ignore && value & CollisionFlags.Ignore) {
        value &= ~(CollisionFlags.Collidables | CollisionFlags.Ignore);
    }
    return (value & flags) === 0;
}

function successors (find : any, x : number, y : number, grid : number[][], rows : number, cols : number, flags : CollisionFlags) {
    let N = y - 1, S = y + 1, E = x + 1, W = x - 1;
    let $N = N > -1 && isEmpty(x, N, grid, flags), $S = S < rows && isEmpty(x, S, grid, flags);
    let $E = E < cols && isEmpty(E, y, grid, flags), $W = W > -1 && isEmpty(W, y, grid, flags);
    let result = [], i = 0;

    $N && (result[i++] = { x: x, y: N });
    $E && (result[i++] = { x: E, y: y });
    $S && (result[i++] = { x: x, y: S });
    $W && (result[i++] = { x: W, y: y });

    return find($N, $S, $E, $W, N, S, E, W, grid, rows, cols, result, i);
}

function diagonal(start : Node, end : Node, f1 : (x : number) => number, f2 : (...values: number[]) => number) {
    return f2(f1(start.x - end.x), f1(start.y - end.y));
}

function euclidean(start : Node, end : Node, f1 : (x : number) => number, f2 : (...values: number[]) => number) {
    let x = start.x - end.x,
        y = start.y - end.y;
    return f2(x * x + y * y);
}

function manhattan(start : Node, end : Node, f1 : (x : number) => number, f2 : (...values: number[]) => number) {
    return f1(start.x - end.x) + f1(start.y - end.y);
}

export default function AStar (grid : number[][], start : Position2D, endPos : Position2D, flags : CollisionFlags, ff? : string) : Coordinate[] {
    let cols = grid[0].length, rows = grid.length, limit = cols * rows, f1 = Math.abs, f2 = Math.max;
    let list : { [index : number] : number } = {}, result : Coordinate[] = [], f : number;
    let open : Node[] = [{ x: start.x, y: start.y, f: 0, g: 0, v: start.x + start.y * cols }];
    let length = 1, adj : Node, distance, find, i, j, max : number, min, current : Node | undefined, next : Node[];
    let end : Node = { x: endPos.x, y: endPos.y, v: endPos.x + endPos.y * cols, f : 0, g : 0 };
    switch (ff) {
        case "Diagonal":
            find = diagonalSuccessors;
        case "DiagonalFree":
            distance = diagonal;
            break;
        case "Euclidean":
            find = diagonalSuccessors;
        case "EuclideanFree":
            f2 = Math.sqrt;
            distance = euclidean;
            break;
        default:
            distance = manhattan;
            find = nothingToDo;
            break;
    }
    find || (find = diagonalSuccessorsFree);
    do {
        max = limit;
        min = 0;
        for (i = 0; i < length; ++i) {
            if ((f = open[i].f) < max) {
                max = f;
                min = i;
            }
        };
        current = open.splice(min, 1)[0];
        if (current.v != end.v) {
            --length;
            next = successors(find, current.x, current.y, grid, rows, cols, flags);
            for (i = 0, j = next.length; i < j; ++i) {
                (adj = next[i]).p = current;
                adj.f = adj.g = 0;
                adj.v = adj.x + adj.y * cols;
                if (!(adj.v in list)) {
                    adj.f = (adj.g = current.g + distance(adj, current, f1, f2)) + distance(adj, end, f1, f2);
                    open[length++] = adj;
                    list[adj.v] = 1;
                }
            }
        }
        else {
            i = length = 0;
            do {
                result[i++] = { x : current.x, y : current.y };
            } while (current = current.p);
            result.reverse();
        }
    } while (length);

    return result;
}