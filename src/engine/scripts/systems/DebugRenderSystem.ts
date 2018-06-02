import { System, registerSystem, SystemOrder} from "@engine/System";
import * as Graphics from "@lib/Graphics";
import {
    Transform, CameraView, DebugSettings, EntityGrids
} from "@components/Components";
import {Position2D} from "@common/position";
import * as GameState from "@lib/GameState";
import EntityManager from "@engine/EntityManager";
import * as Time from "@lib/Time";
import { GameEvents, isEvent } from "@lib/GameEvents";
import { Key } from "@utils/Key";

export default class DebugRenderSystem implements System {

    s_name = "DebugRenderSystem";
    enabled = true;

    public update () : void {
        let game = EntityManager.getEntityWithTag("Game");
        if (GameState.currentStatus == GameState.Status.Started) {
            if (game.getComponent(DebugSettings).entityGrid) {
                Graphics.context.save();
                    Graphics.SetView(Graphics.Context.Normal, EntityManager.getEntityWithTag("MainCamera").getComponent(Transform).Position);
                    this.drawOccupiedCells();
                Graphics.context.restore();
            }

            // Debug Info
            Graphics.DrawString("FPS: " + Time.realFPS, new Position2D(20, 20));
            this.drawCornersPositions();
        }
    }

    private drawCornersPositions () : void {
        let camera = EntityManager.getEntityWithTag("MainCamera");
        let p0 = camera.getComponent(Transform).Position.clone();
        Graphics.DrawString(p0.x + "," + p0.y, new Position2D(8, 8));

        let view = camera.getComponent(CameraView);
        let p1 = new Position2D(p0.x + view.area.width * 16, p0.y + view.area.height * 16);
        Graphics.DrawString(p1.x + "," + p1.y, new Position2D(view.area.width * 15 - 8, view.area.height * 15));
    }

    private drawOccupiedCells () : void {
        let area = EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView).area;
        area.forEachPosition(this.drawOccupiedCell);
    }

    private drawOccupiedCell (x : number, y : number) : void {
        let entities = EntityManager.getEntityWithTag("Game").getComponent(EntityGrids).getEntitiesAt(x, y);
        if (entities != null && Object.keys(entities).length > 0) {
            Graphics.DrawCellHighlight(new Position2D(x, y), "rgba(50, 50, 255, 0.5)");
        }
    }

    public onNotify (params : any) {
        if (isEvent(params, GameEvents.KeyInput)) {
            if (params.key === Key.F) {
                this.enabled = !this.enabled;
            }
        }
    }
}

registerSystem(DebugRenderSystem, SystemOrder.UIRender);