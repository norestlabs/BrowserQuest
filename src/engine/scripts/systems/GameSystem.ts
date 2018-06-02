import { System, registerSystem, SystemOrder} from "@engine/System";
import {Position2D} from "@common/position";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import * as Graphics from "@lib/Graphics";
import {
    Identifiable, Equipment, SpriteRenderable, Transform, AnimationRenderable,
    Health, Visible, Loader
} from "@components/Components";
import * as GameState from "@lib/GameState";
import * as StorageManager from "@lib/StorageManager";
import * as Logger from "@lib/Logger";
import { GameEvents, isEvent} from "@lib/GameEvents";
import { BroadcastEvent } from "@engine/ecs";

export default class GameSystem implements System {

    s_name = "GameSystem";
    enabled = true;

    public start () : void {
        GameState.setCurrentStatus(GameState.Status.Loading);
        let game = EntityManager.getEntityWithTag("Game");
        let loader = game.getComponent(Loader);
        loader.enabled = true;
        loader.callback = () => {
            GameState.setCurrentStatus(GameState.Status.Ready);
            BroadcastEvent(GameEvents.Game_Ready.params(game));
        };
    }

    private clearEntities () : void {
        EntityManager.forEachEntityWithComponent(Identifiable, function (entity : Entity) {
            if (entity.tag !== "Player")
                EntityManager.deleteEntity(entity);
        }.bind(this));
    }

    /**
     * Initializes player with storage data.
     * Called before connecting to the server.
     * 
     * @memberof Game
     */
    private initPlayer (username? : string) : void {
        let player = EntityManager.getEntityWithTag("Player");
        // Setup id
        let identifiable = player.getComponent(Identifiable);
        if (!identifiable.name)
            identifiable.name = username;
        identifiable.id = 0;

        // Setup equipment
        let equipment = player.getComponent(Equipment);
        if (StorageManager.hasAlreadyPlayed()) {
            equipment.armorName = StorageManager.data.player.armor;
            equipment.weaponName = StorageManager.data.player.weapon;
        }

        // Setup sprites
        let spriteRenderer = player.getComponent(SpriteRenderable);
        let weaponSpriteRenderer = player.getChild("Weapon").getComponent(SpriteRenderable);
        spriteRenderer.enabled = true;
        weaponSpriteRenderer.enabled = true;
        spriteRenderer.setSprite(Graphics.sprites[equipment.armorName]);
        weaponSpriteRenderer.setSprite(Graphics.sprites[equipment.weaponName]);

        let health = player.getComponent(Health);
        health.setAlive();

        Logger.log("Finished initPlayer", Logger.LogType.Debug);
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Player_Restart)) {
            GameState.setCurrentStatus(GameState.Status.Started);
            this.clearEntities();
            let name = params.player.getComponent(Identifiable).name;
            EntityManager.reloadEntity(params.player);
            this.initPlayer(name);
        }
        else if (isEvent(params, GameEvents.Movement_PathingStop)) {
            if (params.origin.name === "Player") {
                let targetCell = EntityManager.getEntityWithTag("Mouse").getChildByIndex(1);
                targetCell.getComponent(Visible).enabled = false;
                targetCell.getComponent(AnimationRenderable).isAnimating = false;
            }
        }
        else if (isEvent(params, GameEvents.Movement_PathingStart)) {
            if (params.origin.name === "Player") {
                let i = params.path.length - 1, x = params.path[i].x, y = params.path[i].y;
                // Target cursor position
                let targetCell = EntityManager.getEntityWithTag("Mouse").getChildByIndex(1);
                let targetCellTransform = targetCell.getComponent(Transform);
                targetCellTransform.GridPosition = new Position2D(x, y);
                Logger.log(`Player has started pathing to ${targetCellTransform.GridPosition}`, Logger.LogType.Info);
                targetCell.getComponent(Visible).enabled = true;
            }
        }
        else if (isEvent(params, GameEvents.Client_Welcome)) {
            GameState.setHasNeverStarted(false);
            GameState.setCurrentStatus(GameState.Status.Started);
        }
        else if (isEvent(params, GameEvents.Game_Connect)) {
            this.initPlayer(params.username);
        }
    }
}

registerSystem(GameSystem, SystemOrder.Input - 1);