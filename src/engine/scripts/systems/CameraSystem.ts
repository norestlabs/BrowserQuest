import { System, registerSystem, SystemOrder} from "@engine/System";
import {Position2D} from "@common/position";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import {BroadcastEvent} from "@engine/ecs";
import {Transform, CameraView} from "@components/Components";
import * as Graphics from "@lib/Graphics";
import * as Logger from "@lib/Logger";
import { GameEvents, isEvent} from "@lib/GameEvents";


export default class CameraSystem implements System {

    s_name = "CameraSystem";
    enabled = true;

    public start () : void {
        this.createCamera();
    }

    /**
     * Sets the scale properties and logs them.
     * 
     * @memberof Camera
     */
    private rescale (camera : Entity, f : number) : void {
        let view = camera.getComponent(CameraView);
        view.area.width = 15 * f;
        view.area.height = 7 * f;

        Logger.addToGroup(`Factor: ${f}.`, `Rescale`, Logger.LogType.Debug);
        Logger.addToGroup(`W: ${view.area.width} H: ${view.area.height}`, `Rescale`, Logger.LogType.Debug);
        Logger.printGroup(`Rescale`);
    }

    private createCamera () : void {
        let camera : Entity = EntityManager.getEntityWithTag("MainCamera");

        this.rescale(camera, Graphics.isMobile ? 1 : 2);
        let view = camera.getComponent(CameraView);

        Graphics.setDimensions(view.area.width, view.area.height);
    }

    private focusEntity (entity : Entity) : void {
        let transform = entity.getComponent(Transform);
        let cam = EntityManager.getEntityWithTag("MainCamera");
        let view = cam.getComponent(CameraView);
        let w = view.area.width - 2,
            h = view.area.height - 2,
            x = Math.floor((transform.GridPosition.x - 1) / w) * w,
            y = Math.floor((transform.GridPosition.y - 1) / h) * h;

        cam.getComponent(Transform).GridPosition = new Position2D(x, y);
        view.area.x = x;
        view.area.y = y;
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Resize)) {
            let camera = EntityManager.getEntityWithTag("MainCamera").getComponent(Transform);
            let pos = camera.Position;
            this.createCamera();
            camera.Position = pos;
        }
        else if (isEvent(params, GameEvents.Client_Welcome)) {
            this.focusEntity(params.player);
        }
        else if (isEvent(params, GameEvents.Movement_Door)) {
            if (params.origin.name === "Player") {
                if (Graphics.isMobile && params.dest.cameraX && params.dest.cameraY) {
                    let camera = EntityManager.getEntityWithTag("MainCamera");
                    camera.getComponent(Transform).GridPosition = new Position2D(params.dest.cameraX, params.dest.cameraY);
                    let view = camera.getComponent(CameraView);
                    view.area.x = params.dest.cameraX;
                    view.area.y = params.dest.cameraY;
                    BroadcastEvent(GameEvents.Zoning_Reset.params());
                }
                else if (!params.dest.portal) {
                    this.focusEntity(params.origin);
                    BroadcastEvent(GameEvents.Zoning_Reset.params());
                }
            }
        }
    }
}

registerSystem(CameraSystem, SystemOrder.Movement + 1);