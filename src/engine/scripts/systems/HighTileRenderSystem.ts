import { System, registerSystem, SystemOrder} from "@engine/System";
import * as Graphics from "@lib/Graphics";
import {
    Transform, CameraView, TiledMap
} from "@components/Components";
import EntityManager from "@engine/EntityManager";

export default class HighTileRenderSystem implements System {

    s_name = "HighTileRenderSystem";
    enabled = true;

    public awake () : void {
        if (!Graphics.isDesktop) this.enabled = false;
    }

    public update () : void {
        const tileset = Graphics.GetCurrentTileset();
        const tilesetwidth = (tileset ? tileset.width : 1) / Graphics.tilesize;
        let camera = EntityManager.getEntityWithTag("MainCamera");
        let camView = camera.getComponent(CameraView);
        let map = EntityManager.getFirstComponent(TiledMap);
        
        Graphics.context.save();
            Graphics.SetView(Graphics.Context.Normal, camera.getComponent(Transform).Position);

            map.forEachVisibleTile(function (id : number, index : number) {
                if (map.isHighTile(id)) {
                    Graphics.DrawTile(Graphics.Context.Normal, id, tilesetwidth, map.mapInfo.width, index);
                }
            }, camView.area, 1);
        Graphics.context.restore();
    }
}

registerSystem(HighTileRenderSystem, SystemOrder.Render + 3);