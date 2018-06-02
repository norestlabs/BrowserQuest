import { System, registerSystem } from "@engine/System";

//import * as App from "@lib/App";
import * as Graphics from "@lib/Graphics";

import { BroadcastEvent } from "@engine/ecs";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import { GameEvents, isEvent } from "@lib/GameEvents";

import { Transform, Attack, EntityGrids, CheckpointTriggerable, Loadable, Loader, TiledMap } from "@components/Components";

import * as Logger from "@lib/Logger";
import * as Utils from "@utils/utils";
import { ClientMapDataMessage } from "@common/GameMap";

export default class MapSystem implements System {

    s_name = "MapSystem";
    enabled = true;

    public awake () : void {
        let map = EntityManager.getEntityWithTag("Map");
        let loadable = map.getComponent(Loadable);
        loadable.enabled = true;
        loadable.isLoaded = false;
        EntityManager.getEntityWithID(map.getParent()).getComponent(Loader).addLoadable(map.id);
        this.checkReady(loadable);

        $.get(Utils.getUrl() + "/map", function (data) {
            let message = data as ClientMapDataMessage;
            EntityManager.getFirstComponent(TiledMap).setup(message, null);
        }, 'json');
    }

    private checkReady (loadable : Loadable) : void {
        let map = EntityManager.getFirstComponent(TiledMap);
        let interval = window.setInterval(() => {
            if (Graphics.tilesetsLoaded && map.isMapLoaded) {
                map.isLoaded = true;
                loadable.isLoaded = true;
                Logger.log("Map loaded.", Logger.LogType.Info);
                window.clearInterval(interval);
                BroadcastEvent(GameEvents.Map_Loaded.params(map));
            }
        }, 1000);
    }

    private initEntityGrid () : void {
        let game = EntityManager.getEntityWithTag("Game"), grids = game.getComponent(EntityGrids);
        let map = EntityManager.getFirstComponent(TiledMap);
        grids.initEntityGrid({ width : map.mapInfo.width, height : map.mapInfo.height });
        Logger.log("Initialized the entity grid.", Logger.LogType.Info);
    }

    private updatePlayerCheckpoint (player : Entity) : void {
        let checkpoint = EntityManager.getFirstComponent(TiledMap).getCurrentCheckpoint(player.getComponent(Transform).GridPosition);

        if (checkpoint) {
            let checkpointTriggerable = player.getComponent(CheckpointTriggerable);
            let lastCheckpoint = checkpointTriggerable.lastCheckpoint;
            if (!lastCheckpoint || (lastCheckpoint && lastCheckpoint.id !== checkpoint.id)) {
                checkpointTriggerable.lastCheckpoint = checkpoint;
                BroadcastEvent(GameEvents.Player_Checkpoint.params(player, checkpoint));
            }
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Game_Ready)) {
            this.initEntityGrid();
        }
        else if (isEvent(params, GameEvents.Player_Restart)) {
            this.initEntityGrid();
        }
        else if (isEvent(params, GameEvents.Movement_Step)) {
            if (params.origin.name === "Player") {
                this.updatePlayerCheckpoint(params.origin);
            }
        }
        else if (isEvent(params, GameEvents.Movement_PathingStop)) {
            if (params.origin.name === "Warrior" || params.origin.name === "Player") {
                let transform = params.origin.getComponent(Transform);
                let pos = transform.GridPosition;
                let gridX = pos.x, gridY = pos.y;
                let attack = params.origin.getComponent(Attack);

                if (!attack.hasTarget() && EntityManager.getFirstComponent(TiledMap).isDoor(gridX, gridY)) {
                    let dest = EntityManager.getFirstComponent(TiledMap).getDoorDestination(gridX, gridY);
                    BroadcastEvent(GameEvents.Movement_Door.params(params.origin, dest));
                }
            }
        }
    }
}

registerSystem(MapSystem);