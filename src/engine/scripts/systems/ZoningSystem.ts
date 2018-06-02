import { System, registerSystem} from "@engine/System";
import GameTypes from "@common/gametypes";
import {Position2D} from "@common/position";
import * as Graphics from "@lib/Graphics";
import Entity from "@engine/Entity";
import {Transform, CameraView, Zoning} from "@components/Components";
import {BroadcastEvent} from "@engine/ecs";
import EntityManager from "@engine/EntityManager";
import * as Time from "@lib/Time";
import { GameEvents, isEvent} from "@lib/GameEvents";


export default class ZoningSystem implements System {

    s_name = "ZoningSystem";
    enabled = true;

    public update () : void {
        let g = EntityManager.getEntityWithTag("Game");
        let c = EntityManager.getEntityWithTag("MainCamera");
        let zoning = g.getComponent(Zoning);
    
        if (zoning.enabled) {
            this.updateZoning(zoning, c);
        }
    }

    private transitionUpdate (zoning : Zoning, camera : Entity) : void {
        let transform = camera.getComponent(Transform);
        let view = camera.getComponent(CameraView);
        let size = (zoning.orientation === GameTypes.Orientations.Left || zoning.orientation === GameTypes.Orientations.Right) ? 
            view.area.width : view.area.height;

        let diff = ((((size - 2) * 16)) / zoning.speed) * Time.deltaTime;

        switch (zoning.orientation) {
            case GameTypes.Orientations.Left:
                transform.Position.x -= diff; break;
            case GameTypes.Orientations.Right:
                transform.Position.x += diff; break;
            case GameTypes.Orientations.Up:
                transform.Position.y -= diff; break;
            case GameTypes.Orientations.Down:
                transform.Position.y += diff; break;
        }
        // TODO: Check
        transform.Position.x = Math.round(transform.Position.x);
        transform.Position.y = Math.round(transform.Position.y);

        // Update view area but don't update grid position yet
        view.area.x = Math.floor(transform.Position.x / 16);
        view.area.y = Math.floor(transform.Position.y / 16);
        BroadcastEvent(GameEvents.Zoning_Update.params());
    }

    private transitionStop (zoning : Zoning, camera : Entity) : void {
        let transform = camera.getComponent(Transform);
        let view = camera.getComponent(CameraView);
        let size = (zoning.orientation === GameTypes.Orientations.Left || zoning.orientation === GameTypes.Orientations.Right) ? 
            view.area.width : view.area.height;

        switch (zoning.orientation) {
            case GameTypes.Orientations.Left:
                transform.Position.x = (transform.GridPosition.x - (size - 2)) * 16; break;
            case GameTypes.Orientations.Right:
                transform.Position.x = (transform.GridPosition.x + (size - 2)) * 16; break;
            case GameTypes.Orientations.Up:
                transform.Position.y = (transform.GridPosition.y - (size - 2)) * 16; break;
            case GameTypes.Orientations.Down:
                transform.Position.y = (transform.GridPosition.y + (size - 2)) * 16; break;
        }
        transform.updateGridPosition();
        view.area.x = transform.GridPosition.x;
        view.area.y = transform.GridPosition.y;

        this.endZoning();
    }

    private updateZoning (zoning : Zoning, camera : Entity) : void {
        this.transitionUpdate(zoning, camera);
        zoning.elapsedTime += Time.deltaTime;
        if (zoning.elapsedTime >= zoning.speed) {
            this.transitionStop(zoning, camera);
        }
    }

    private enqueueZoningFrom (x : number, y : number) : void {
        let zoning = EntityManager.getEntityWithTag("Game").getComponent(Zoning);
        zoning.queue.push(new Position2D(x, y));

        if (zoning.queue.length === 1) {
            this.startZoningFrom(x, y);
        }
    }
    
    /**
     * Gets the orientation of the zoning transition,
     * based on GridPosition.
     */
    private getZoningOrientation(x : number, y : number) : GameTypes.Orientations {
        let orientation : GameTypes.Orientations, c = EntityManager.getEntityWithTag("MainCamera");
        let transform = c.getComponent(Transform);
        let view = c.getComponent(CameraView);

        x = x - transform.GridPosition.x;
        y = y - transform.GridPosition.y;

        if (x === 0) {
            orientation = GameTypes.Orientations.Left;
        }
        else if (y === 0) {
            orientation = GameTypes.Orientations.Up;
        }
        else if (x === view.area.width - 1) {
            orientation = GameTypes.Orientations.Right;
        }
        else if (y === view.area.height - 1) {
            orientation = GameTypes.Orientations.Down;
        }

        return orientation;
    }

    /**
     * Starts the zone transition to a new zone.
     */
    private startZoningFrom(x : number, y : number) : void {
        let zoning = EntityManager.getEntityWithTag("Game").getComponent(Zoning);
        let orientation = this.getZoningOrientation(x, y);

        zoning.orientation = orientation;

        if (!Graphics.isDesktop) {
            let z = zoning.orientation,
                c = EntityManager.getEntityWithTag("MainCamera"),
                transform = c.getComponent(Transform),
                view = c.getComponent(CameraView),
                ts = Graphics.tilesize,
                x = transform.Position.x,
                y = transform.Position.y,
                xoffset = (view.area.width - 2) * ts,
                yoffset = (view.area.height - 2) * ts;

            if (z === GameTypes.Orientations.Left || z === GameTypes.Orientations.Right) {
                x = (z === GameTypes.Orientations.Left) ? x - xoffset : x + xoffset;
            }
            else if (z === GameTypes.Orientations.Up || z === GameTypes.Orientations.Down) {
                y = (z === GameTypes.Orientations.Up) ? y - yoffset : y + yoffset;
            }
            transform.Position = new Position2D(x, y);

            Graphics.ClearScreen(Graphics.Context.Normal);
            this.endZoning();
        }
        else {
            zoning.enabled = true;
            zoning.elapsedTime = 0;
        }
        BroadcastEvent(GameEvents.Zoning_Start.params());
    }

    private endZoning() : void {
        let zoning = EntityManager.getEntityWithTag("Game").getComponent(Zoning);
        zoning.enabled = false;
        BroadcastEvent(GameEvents.Zoning_Reset.params());
        zoning.queue.shift();

        if (zoning.queue.length > 0) {
            let pos = zoning.queue[0];
            this.startZoningFrom(pos.x, pos.y);
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Movement_Step)) {
            if (params.origin.name !== "Player") return;
            let transform = params.origin.getComponent(Transform);
            let view = EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView);
            if(view.isZoningTile(transform.GridPosition.x, transform.GridPosition.y)) {
                this.enqueueZoningFrom(transform.GridPosition.x, transform.GridPosition.y);
            }
        }
    }
}

registerSystem(ZoningSystem);