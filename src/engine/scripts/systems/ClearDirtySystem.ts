import { System, registerSystem, SystemOrder} from "@engine/System";
import EntityManager from "@engine/EntityManager";
import * as Graphics from "@lib/Graphics";
import {Dirty, TileAnimationRenderable, CameraView, EntityGrids} from "@components/Components";

export default class ClearDirtySystem implements System {

    s_name = "ClearDirtySystem";
    enabled = true;

    public awake () : void {
        if (Graphics.isDesktop) {
            this.enabled = false;
        }
    }

    public update () : void {
        this.clearDirtyRects();
    }

    private clearDirtyRects() : void {
        let count = 0;
        let game = EntityManager.getEntityWithTag("Game");

        game.getComponent(EntityGrids).forEachEntityIdInArea(EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView).area, (id : string) => {
            let entity = EntityManager.getEntityWithID(id);
            let dirty = entity.getComponent(Dirty);
            if (dirty.enabled && dirty.oldRect != null) {
                Graphics.ClearRect(Graphics.Context.Normal, dirty.oldRect);
                count += 1;
            }
        }, Graphics.isMobile ? 0 : 2);

        let animatedTiles = EntityManager.getEntityWithTag("AnimatedTiles").getChildren();
        for (let i = 0, len = animatedTiles.length; i < len; ++i) {
            if (animatedTiles[i].getComponent(TileAnimationRenderable) != null) {
                let dirty = animatedTiles[i].getComponent(Dirty);
                if (dirty.enabled) {
                    Graphics.ClearRect(Graphics.Context.Normal, dirty.rect);
                    count += 1;
                }
            }
        }

        let targetCell = EntityManager.getEntityWithTag("Mouse").getChildByIndex(1);
        let dirtyCell = targetCell.getComponent(Dirty);
        if (dirtyCell.enabled && dirtyCell.oldRect != null) {
            Graphics.ClearRect(Graphics.Context.Normal, dirtyCell.oldRect);
            count += 1;
        }

        if (count > 0) {
            //log.debug("count:"+count);
        }
    }
}

// Run after spriteRenderSystem, so that it disables sprite after.
registerSystem(ClearDirtySystem, SystemOrder.PreRender);