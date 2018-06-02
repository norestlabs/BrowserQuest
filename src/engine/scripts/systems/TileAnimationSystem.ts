import { System, registerSystem, SystemOrder} from "@engine/System";
import {Position2D} from "@common/position";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import {BroadcastEvent} from "@engine/ecs";
import {
    Dirty, TileAnimationRenderable, TileRenderable, CameraView, TiledMap
} from "@components/Components";
import * as Time from "@lib/Time";
import { GameEvents, isEvent} from "@lib/GameEvents";

interface TileNode {
    dirty : Dirty,
    tileAnimationRenderable : TileAnimationRenderable,
    tileRenderable : TileRenderable
}

export default class TileAnimationSystem implements System {

    s_name = "TileAnimationSystem";
    enabled = true;

    public update () : void {
        let t = Time.currentTime;

        let animatedTiles = EntityManager.getEntityWithTag("AnimatedTiles").getChildren(), entity : Entity = null;
        for (let i = 0, len = animatedTiles.length; i < len; ++i) {
            entity = animatedTiles[i];
            let tileAnimationRenderable = entity.getComponent(TileAnimationRenderable);
            if (tileAnimationRenderable != null) {
                let node : TileNode = {
                    dirty : entity.getComponent(Dirty),
                    tileAnimationRenderable : tileAnimationRenderable,
                    tileRenderable : entity.getComponent(TileRenderable)
                };
                if (this.animate(node, t)) {
                    BroadcastEvent(GameEvents.Animation_Continued.params(entity));
                }
            }
        }
    }

    private tick (tileNode : TileNode) : void {
        if ((tileNode.tileRenderable.id - tileNode.tileAnimationRenderable.startId) < tileNode.tileAnimationRenderable.length - 1) {
            tileNode.tileRenderable.id += 1;
        }
        else {
            tileNode.tileRenderable.id = tileNode.tileAnimationRenderable.startId;
        }
    }

    private animate (tileNode : TileNode, time : number) : boolean {
        if ((time - tileNode.tileAnimationRenderable.lastTime) > tileNode.tileAnimationRenderable.speed) {
            this.tick(tileNode);
            tileNode.tileAnimationRenderable.lastTime = time;
            return true;
        }
        else {
            return false;
        }
    }

    /**
     *
     */
    private initAnimatedTiles () : void {
        let animatedTiles = EntityManager.getEntityWithTag("AnimatedTiles");
        let animatedTilesChildren = EntityManager.getEntityWithTag("AnimatedTiles").getChildren();
        let map = EntityManager.getFirstComponent(TiledMap);

        let current = 0, last = animatedTilesChildren.length;
        map.forEachVisibleTile(function (id : number, index : number) {
            if (map.isAnimatedTile(id)) {
                let tile : Entity = null;
                if (current >= last) {
                    tile = EntityManager.createEntityFromLoadedPrefab("Tile", animatedTiles);
                    let tileRenderable = tile.getComponent(TileRenderable);
                    tileRenderable.index = index;
                    tileRenderable.id = id;

                    let animation = tile.getComponent(TileAnimationRenderable);
                    animation.length = map.getTileAnimationLength(id);
                    animation.speed = map.getTileAnimationDelay(id);
                    animation.startId = id;
                }
                else {
                    tile = animatedTilesChildren[current];
                    let tileAnimationRenderable = tile.getComponent(TileAnimationRenderable);
                    tileAnimationRenderable.length = map.getTileAnimationLength(id);
                    tileAnimationRenderable.speed = map.getTileAnimationDelay(id);
                    tileAnimationRenderable.startId = id;
                }

                let tileRenderable = tile.getComponent(TileRenderable),
                    pos = map.tileIndexToGridPosition(tileRenderable.index);

                tileRenderable.gridPosition = new Position2D(pos.x, pos.y);

                if (current < last) {
                    tileRenderable.id = id;
                    tileRenderable.index = index;
                }

                current++;
            }
        }, EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView).area, 1);
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Zoning_Reset) || isEvent(params, GameEvents.Resize) || isEvent(params, GameEvents.Client_Welcome) || isEvent(params, GameEvents.Zoning_Update)) {
            this.initAnimatedTiles();
        }
    }
}

registerSystem(TileAnimationSystem, SystemOrder.PreRender);