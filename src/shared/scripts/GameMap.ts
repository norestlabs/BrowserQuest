//import * as Logger from "@common/logger";
import { Rect, Coordinate, getRandomPositionInArea, isPositionInArea, forEachPositionInArea } from "@common/position";
import * as Utils from "@common/utils";
import * as _ from "underscore";
import GameTypes from "@common/gametypes";

export interface DoorFileData {
    x : number; y : number; p : number;
    tcx : number; tcy : number;
    to : string; tx : number; ty : number;
}

export interface DoorDestinationData {
    x : number, y : number, orientation: GameTypes.Orientations, cameraX: number, cameraY: number, portal: boolean
}

export interface DoorsData {
    [index : string] : DoorDestinationData
}

export interface MusicArea extends Rect {
    id : string;
}

export interface CheckpointArea extends Rect {
    id : number;
    s : number;
}

interface BaseMapData {
    width : number;
    height : number;
    tilesize : number;
    collisions : number[];
    doors : DoorFileData[];
    checkpoints : { [index : string] : CheckpointArea };
}

export interface ClientMapData extends BaseMapData {
    /**
     * The whole map in IDs. If one grid cell has stacking tiles, it's an array of IDs.
     * 
     * @type {((number | number[])[])}
     */
    data : (number | number[])[];
    musicAreas : MusicArea[];
    blocking : number[];
    plateau : number[];
    high : number[];
    animated : { [index : string] : { [index : string ] : number } };
}

export interface ServerMapData extends BaseMapData {
    roamingAreas : { id : number, x : number, y : number, width : number, height : number, type : string, nb : number }[];
    chestAreas : { x : number, y : number, w : number, h : number, i : number[], tx : number, ty : number }[];
    staticChests : { x : number, y : number, i : number[]}[];
    staticEntities : { [tileIndex : string] : string };
}

export type MapData = ServerMapData & ClientMapData;

export interface ClientMapDataMessage {
    data : ClientMapData;

    grid : number[][];
    plateauGrid : number[][];
}

export interface MapDataMessage {
    data : MapData;

    grid : number[][];
    plateauGrid : number[][];
}

abstract class BaseGameMap <T extends BaseMapData> {
    public mapInfo : T;
    public isLoaded : boolean = false;
    public isMapLoaded : boolean = false;

    public grid : number[][];
    public plateauGrid : number[][];

    public initMap (map : T, readyCallback : (map : BaseGameMap<T>) => void) : void {
        this.mapInfo = map;

        this.initConnectedGroups(map.doors);
        this.initCheckpoints(map.checkpoints);

        this.isMapLoaded = true;

        if (readyCallback) readyCallback(this);
    }

    public abstract initConnectedGroups (doors : DoorFileData[]) : void;
    public abstract initCheckpoints (checkpoints : { [index : string] : CheckpointArea }) : void;

    public tileIndexToGridPosition (tileNum : number, width? : number) : Coordinate {
        let x = 0, y = 0;

        width = width || this.mapInfo.width;

        let getX = function(num : number, w : number) {
            if (num == 0) {
                return 0;
            }
            return (num % w == 0) ? w - 1 : (num % w) - 1;
        }

        tileNum -= 1;
        x = getX(tileNum + 1, width);
        y = Math.floor(tileNum / width);

        return { x: x, y: y };
    }

    public gridPositionToTileIndex (x : number, y : number) : number {
        return (y * this.mapInfo.width) + x + 1;
    }

    public isOutOfBounds (x : number, y : number) : boolean {
        return x < 0 || x >= this.mapInfo.width || y < 0 || y >= this.mapInfo.height;
    }

    public isColliding (x : number, y : number) : boolean {
        if (this.isOutOfBounds(x, y)) {
            return false;
        }
        return this.grid[y][x] === 1;
    }
}

export class ClientMap extends BaseGameMap<ClientMapData> {
    // In the client we want checkpoints to be an array because
    // it's only used (through iteration) to check if player has triggered one
    public checkpoints : CheckpointArea[];
    public doors : DoorsData;

    public setup (data : ClientMapDataMessage, readyCallback : (map : BaseGameMap<ClientMapData>) => void) : void {
        this.grid = data.grid;
        this.plateauGrid = data.plateauGrid;
        this.initMap(data.data, readyCallback);
    }

    public initConnectedGroups (doors: DoorFileData[]) : void {
        this.doors = {};

        for (let i = 0, len = doors.length; i < len; ++i) {
            let door = doors[i];
            let o;

            switch(door.to) {
                case 'u': o = GameTypes.Orientations.Up;
                    break;
                case 'd': o = GameTypes.Orientations.Down;
                    break;
                case 'l': o = GameTypes.Orientations.Left;
                    break;
                case 'r': o = GameTypes.Orientations.Right;
                    break;
                default : o = GameTypes.Orientations.Down;
            }

            this.doors[this.gridPositionToTileIndex(door.x, door.y)] = {
                x: door.tx,
                y: door.ty,
                orientation: o,
                cameraX: door.tcx,
                cameraY: door.tcy,
                portal: door.p === 1,
            };
        }
    }

    public initCheckpoints (checkpoints : { [index : string] : CheckpointArea }) : void {
        this.checkpoints = [];
        let self = this;
        _.each(checkpoints, function(cp : CheckpointArea) {
            self.checkpoints.push(cp);
        });
    }

    public isPlateau (pos : Coordinate) : boolean {
        if (this.isOutOfBounds(pos.x, pos.y) || !this.plateauGrid) {
            return false;
        }
        return (this.plateauGrid[pos.y][pos.x] === 1);
    }

    public forEachTileIndexInArea (area : Rect, callback : (index : number) => void, extra? : number) : void {
        let self = this;
        forEachPositionInArea(area, function(x, y) {
            if (!self.isOutOfBounds(x, y)) {
                callback(self.gridPositionToTileIndex(x, y) - 1);
            }
        }, extra);
    }

    /**
     * Iterates over the visible tiles' indexes.
     * 
     * @param {function} callback 
     * @param {number} extra 
     */
    public forEachVisibleTile (callback : (id : number, index : number) => void, area : Rect, extra? : number) {
        if (this.isLoaded) {
            let self = this;
            this.forEachTileIndexInArea(area, function (tileIndex : number) {
                if (_.isArray(self.mapInfo.data[tileIndex])) {
                    _.each(<number[]>self.mapInfo.data[tileIndex], function (id : number) {
                        callback(id - 1, tileIndex);
                    });
                }
                else {
                    if (_.isNaN(<number>self.mapInfo.data[tileIndex] - 1)) {
                        //throw Error("Tile number for index:"+tileIndex+" is NaN");
                    }
                    else {
                        callback(<number>self.mapInfo.data[tileIndex] - 1, tileIndex);
                    }
                }
            }, extra);
        }
    }
    
    /**
     * Returns true if the given tile id is "high", i.e. above all entities.
     * Used by the renderer to know which tiles to draw after all the entities
     * have been drawn.
     */
    public isHighTile (id : number) : boolean {
        return _.indexOf(this.mapInfo.high, id+1) >= 0;
    }
    
    /**
     * Returns true if the tile is animated. Used by the renderer.
     */
    public isAnimatedTile (id : number) : boolean {
        return (id + 1) in this.mapInfo.animated;
    }
    
    /**
     *
     */
    public getTileAnimationLength (id : number) : number {
        return this.mapInfo.animated[id + 1].l;
    }
    
    /**
     *
     */
    public getTileAnimationDelay (id : number) : number {
        let animProperties = this.mapInfo.animated[id + 1];
        if (animProperties.d) {
            return animProperties.d;
        }
        else {
            return 100;
        }
    }

    public getCurrentCheckpoint (position : Coordinate) : CheckpointArea | null {
        for (let i = 0, len = this.checkpoints.length; i < len; ++i) {
            let checkpoint = this.checkpoints[i];
            if (isPositionInArea(position, checkpoint)) return checkpoint;
        }
        return null;
    }

    public isDoor (x : number, y : number) : boolean {
        return this.doors[this.gridPositionToTileIndex(x, y)] !== undefined;
    }
    
    public getDoorDestination (x : number, y : number) : DoorDestinationData {
        return this.doors[this.gridPositionToTileIndex(x, y)];
    }

    private getX (id : number) : number {
        if (id == 0) {
            return 0;
        }
        return (id % this.mapInfo.width == 0) ? this.mapInfo.width - 1 : (id % this.mapInfo.width) - 1;
    }

    public tileIndexToGridPosition (tileNum : number) {
        let x = 0, y = 0;
    
        tileNum -= 1;
        x = this.getX(tileNum + 1);
        y = Math.floor(tileNum / this.mapInfo.width);
    
        return { x: x, y: y };
    }

}

export class ServerMap extends BaseGameMap<MapData> {
    // Zone groups
    public zoneWidth : number = 28;
    public zoneHeight : number = 12;
    public groupWidth : number;
    public groupHeight : number

    // In the server we want checkpoints to be an object because
    // it's only used to get the one triggered by a player, directly
    public checkpoints : { [id : string] : CheckpointArea };
    public startingAreas : CheckpointArea[];

    public connectedGroups : { [index : string] : Coordinate[] };

    public filepath : string;

    private clientMapDataMessage : ClientMapDataMessage = null;
    private mapDataMessage : MapDataMessage = null;

    public getClientMapDataMessage () : ClientMapDataMessage {
        if (this.clientMapDataMessage === null) {
            this.clientMapDataMessage = {
                data : this.mapInfo,
                grid : this.grid,
                plateauGrid : this.plateauGrid
            };
        }
        return this.clientMapDataMessage;
    }

    public getMapDataMessage () : MapDataMessage {
        if (this.mapDataMessage === null) {
            this.mapDataMessage = {
                data : this.mapInfo,
                grid : this.grid,
                plateauGrid : this.plateauGrid
            };
        }
        return this.mapDataMessage;
    }
    
    public initMap (map : MapData, readyCallback : (map : BaseGameMap<MapData>) => void) : void {
        // Zone groups
    	this.groupWidth = Math.floor(map.width / this.zoneWidth);
        this.groupHeight = Math.floor(map.height / this.zoneHeight);

        this.generateCollisionGrid(map);
        this.generatePlateauGrid(map);

        super.initMap(map, readyCallback);
    }

    public generateCollisionGrid (mapInfo : ClientMapData) : void {
        this.grid = [];

        for (let j, i = 0; i < mapInfo.height; i++) {
            this.grid[i] = [];
            for (j = 0; j < mapInfo.width; j++) {
                this.grid[i][j] = 0;
            }
        }
    
        for (let i = 0; i < mapInfo.collisions.length; ++i) {
            let pos = this.tileIndexToGridPosition(mapInfo.collisions[i] + 1, mapInfo.width);
            this.grid[pos.y][pos.x] = 1;
        }
    
        for (let i = 0; i < mapInfo.blocking.length; ++i) {
            let pos = this.tileIndexToGridPosition(mapInfo.blocking[i] + 1, mapInfo.width);
            if (this.grid[pos.y] !== undefined) {
                this.grid[pos.y][pos.x] = 1;
            }
        }
        //Logger.log("Collision grid generated.", Logger.LogType.Info);
    }

    public generatePlateauGrid (mapInfo : ClientMapData) : void {
        let tileIndex = 0;
    
        this.plateauGrid = [];
        for (let j, i = 0; i < mapInfo.height; i++) {
            this.plateauGrid[i] = [];
            for (j = 0; j < mapInfo.width; j++) {
                if (_.include(mapInfo.plateau, tileIndex)) {
                    this.plateauGrid[i][j] = 1;
                }
                else {
                    this.plateauGrid[i][j] = 0;
                }
                tileIndex += 1;
            }
        }
        //Logger.log("Plateau grid generated.", Logger.LogType.Info);
    }

    public groupIdToGroupPosition (id : string) : Coordinate {
        let posArray = id.split('-');

        return { x: parseInt(posArray[0]), y: parseInt(posArray[1]) };
    }

    public forEachGroup (callback : (pos : string) => void) : void {
        let width = this.groupWidth, height = this.groupHeight;

        for (let x = 0; x < width; x += 1) {
            for (let y = 0; y < height; y += 1) {
                callback(this.getGroupId(x, y));
            }
        }
    }

    public getGroupIdFromPosition (x : number, y : number) : string {
        let w = this.zoneWidth, h = this.zoneHeight;
        return this.getGroupId(Math.floor((x - 1) / w), Math.floor((y - 1) / h));
    }

    public getGroupId (gx : number, gy : number) : string {
        return `${gx}-${gy}`;
    }

    public getAdjacentGroupPositions (id : string) : Coordinate[] {
        let self = this, position = this.groupIdToGroupPosition(id);
        let x = position.x, y = position.y;
        // Get surrounding groups
        let list : Coordinate[] = [
                { x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
                { x: x - 1, y: y }, { x: x, y: y }, { x: x + 1, y: y },
                { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 }
            ]

        // Check the groups connected via doors
        if (id in this.connectedGroups) {
            for (let i = 0, len = this.connectedGroups[id].length; i < len; ++i) {
                let position = this.connectedGroups[id][i];
    
                // Don't add a connected group if it's already part of the surrounding ones.
                if (!_.any(list, function(groupPos) { return groupPos.x == position.x && groupPos.y == position.y; })) {
                    list.push(position);
                }
            }
        }

        // Don't get invalid positions
        return _.reject(list, function(pos) {
            return pos.x < 0 || pos.y < 0 || pos.x >= self.groupWidth || pos.y >= self.groupHeight;
        });
    }

    public forEachAdjacentGroup (groupId : string, callback : (pos : string) => void) : void {
        if (groupId) {
            _.each(this.getAdjacentGroupPositions(groupId), function(pos) {
                callback(pos.x + '-' + pos.y);
            });
        }
    }

    public initConnectedGroups (doors : DoorFileData[]) : void {
        let self = this;

        this.connectedGroups = {};
        _.each(doors, function(door) {
            let groupId = self.getGroupIdFromPosition(door.x, door.y),
                connectedGroupId = self.getGroupIdFromPosition(door.tx, door.ty),
                connectedPosition = self.groupIdToGroupPosition(connectedGroupId);

            if (groupId in self.connectedGroups) {
                self.connectedGroups[groupId].push(connectedPosition);
            }
            else {
                self.connectedGroups[groupId] = [connectedPosition];
            }
        });
    }

    public initCheckpoints (checkpoints : { [index : string] : CheckpointArea }) : void {
        let self = this;

        this.mapInfo.checkpoints = {};
        this.startingAreas = [];

        _.each(checkpoints, function(cp) {
            self.mapInfo.checkpoints[cp.id] = cp;
            if (cp.s === 1) {
                self.startingAreas.push(cp);
            }
        });
    }

    public getCheckpoint (id : number) : CheckpointArea {
        return this.mapInfo.checkpoints[id];
    }

    public getRandomStartingPosition () : Coordinate {
        let nbAreas = _.size(this.startingAreas),
            i = Utils.randomInt(0, nbAreas-1),
            area = this.startingAreas[i];

        return getRandomPositionInArea(area);
    }
}