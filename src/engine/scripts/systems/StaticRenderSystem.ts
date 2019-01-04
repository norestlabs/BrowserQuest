import { System, registerSystem, SystemOrder} from "@engine/System";
import * as Graphics from "@lib/Graphics";
import {
    Transform, CameraView, TiledMap
} from "@components/Components";
import EntityManager from "@engine/EntityManager";
import { GameEvents, isEvent} from "@lib/GameEvents";

export default class StaticRenderSystem implements System {

    s_name = "StaticRenderSystem";
    enabled = false;

    public update () : void {
        const tileset = Graphics.GetCurrentTileset();
        const tilesetwidth = (tileset ? tileset.width : 1) / Graphics.tilesize;
        let camera = EntityManager.getEntityWithTag("MainCamera");
        let map = EntityManager.getFirstComponent(TiledMap);

        Graphics.backgroundContext.save();
            Graphics.SetView(Graphics.Context.Background, camera.getComponent(Transform).Position);
            this.drawTerrain(map);
        Graphics.backgroundContext.restore();

        if (!Graphics.isDesktop) {
            Graphics.ClearScreen(Graphics.Context.Foreground);
            Graphics.foregroundContext.save();
                Graphics.SetView(Graphics.Context.Foreground, camera.getComponent(Transform).Position);
                map.forEachVisibleTile(function (id : number, index : number) {
                    if (map.isHighTile(id)) {
                        Graphics.DrawTile(Graphics.Context.Foreground, id, tilesetwidth, map.mapInfo.width, index);
                    }
                }, camera.getComponent(CameraView).area, 1);
            Graphics.foregroundContext.restore();
        }
        this.enabled = false;
    }

    private drawTerrain (map : TiledMap) : void {
        const tileset = Graphics.GetCurrentTileset();
        const tilesetwidth = (tileset ? tileset.width : 1) / Graphics.tilesize;
        let area = EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView).area;
        
        map.forEachVisibleTile(function (id : number, index : number) {
            if (!map.isHighTile(id) && !map.isAnimatedTile(id)) { // Don't draw unnecessary tiles
                Graphics.DrawTile(Graphics.Context.Background, id, tilesetwidth, map.mapInfo.width, index);
            }
        }, area, 1);
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Zoning_Reset) || isEvent(params, GameEvents.Resize) || isEvent(params, GameEvents.Client_Welcome) || isEvent(params, GameEvents.Zoning_Update)) {
            this.enabled = true;
        }
    }
}

registerSystem(StaticRenderSystem, SystemOrder.PreRender - 1);