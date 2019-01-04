import { System, registerSystem, SystemOrder} from "@engine/System";
import * as Graphics from "@lib/Graphics";
import {
    TileRenderable, Transform, TiledMap
} from "@components/Components";
import EntityManager from "@engine/EntityManager";

export default class TileRenderSystem implements System {

    s_name = "TileRenderSystem";
    enabled = true;

    public update () : void {
        const tileset = Graphics.GetCurrentTileset();
        const tilesetwidth = (tileset ? tileset.width : 1) / Graphics.tilesize;
        if (Graphics.isDesktop) {
            Graphics.ClearScreen(Graphics.Context.Normal);
        }
        let map = EntityManager.getFirstComponent(TiledMap);
        
        Graphics.context.save();
            Graphics.SetView(Graphics.Context.Normal, EntityManager.getEntityWithTag("MainCamera").getComponent(Transform).Position);

            let animatedTiles = EntityManager.getEntityWithTag("AnimatedTiles").getChildren();
            for (let i = 0, len = animatedTiles.length; i < len; ++i) {
                let tileRenderable = animatedTiles[i].getComponent(TileRenderable);
                if (tileRenderable != null) {
                    Graphics.DrawTile(Graphics.Context.Normal, tileRenderable.id, tilesetwidth, map.mapInfo.width, tileRenderable.index);
                }
            }
        Graphics.context.restore();
    }
}

registerSystem(TileRenderSystem, SystemOrder.Render);