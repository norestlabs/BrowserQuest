import { System, registerSystem, SystemOrder} from "@engine/System";
import * as Graphics from "@lib/Graphics";
import {
    Visible, Dirty, SpriteRenderable, PrimitiveRenderable, Transform, AnimationRenderable, MouseInput, CameraView,
    DebugSettings
} from "@components/Components";
import {Position2D} from "@common/position";
import * as GameState from "@lib/GameState";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import { pathingGrid } from "@lib/Pathfinder";

export default class CellRenderSystem implements System {

    s_name = "CellRenderSystem";
    enabled = true;

    public update () : void {
        let game = EntityManager.getEntityWithTag("Game");
        if (GameState.currentStatus === GameState.Status.Started) {            
            Graphics.context.save();
                Graphics.SetView(Graphics.Context.Normal, EntityManager.getEntityWithTag("MainCamera").getComponent(Transform).Position);
                let mouse = EntityManager.getEntityWithTag("Mouse");
                this.drawTargetCell(mouse);
                this.drawSelectedCell(mouse);

                this.drawPathingCells(game);
            Graphics.context.restore();
        }
    }

    private drawTargetCell (mouse : Entity) : void {
        let targetCell = mouse.getChildByIndex(1);
        if (targetCell.getComponent(Visible).enabled) {
            if (!Graphics.isDesktop) {
                let dirty = targetCell.getComponent(Dirty);
                if (dirty.enabled) {
                    let pos = targetCell.getComponent(Transform).GridPosition;
                    let color = targetCell.getComponent(PrimitiveRenderable).color = "rgb(51, 255, 0)";

                    Graphics.DrawCellHighlight(pos, color);
                }
            }
            else {
                let spriteRenderer = targetCell.getComponent(SpriteRenderable);
                let animationRenderer = targetCell.getComponent(AnimationRenderable);
                Graphics.DrawSprite(spriteRenderer.sprite, targetCell.getComponent(Transform).Position, spriteRenderer.alpha,
                    false, false, false, false, animationRenderer.GetSpritePosition(Graphics.sprites[spriteRenderer.sprite]));
            }
        }
    }

    /**
     * Draws a faint white square in the cell where the mouse is currently on.
     * 
     * @memberof CellRenderSystem
     */
    private drawSelectedCell (mouse : Entity) : void {
        // TODO: Add transform to mouse? Create CellRenderable component?
        let mousePos = mouse.getComponent(MouseInput).mouseGridPosition;

        let selectedPosition = mouse.getChildByIndex(0);
        if (selectedPosition.getComponent(Visible).enabled && 
            !mouse.getChildByIndex(1).getComponent(Transform).GridPosition.equals(mousePos)) {
            Graphics.DrawCellHighlight(mousePos, selectedPosition.getComponent(PrimitiveRenderable).color);
        }
    }

    private drawPathingCells (game : Entity) : void {
        if (pathingGrid && game.getComponent(DebugSettings).debugPathing) {
            let cameraViewArea = EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView).area;
            let tempPos = new Position2D(0, 0);
            for (let y = 0; y < pathingGrid.length; y += 1) {
                for (let x = 0; x < pathingGrid[y].length; x += 1) {
                    tempPos.Set(x, y);
                    if (pathingGrid[y][x] === 1 && cameraViewArea.contains(tempPos)) {
                        Graphics.DrawCellHighlight(new Position2D(x, y), "rgba(50, 50, 255, 0.5)");
                    }
                }
            }
        }
    }
}

registerSystem(CellRenderSystem, SystemOrder.Render + 1);