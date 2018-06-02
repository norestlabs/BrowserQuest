import { System, registerSystem, SystemOrder} from "@engine/System";
import {Rect, Area, Position2D} from "@common/position";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import * as Graphics from "@lib/Graphics";
import {
    Dirty, SpriteRenderable, TileRenderable, Transform, Visible, CameraView,
    TileAnimationRenderable, Equipment, EntityGrids
} from "@components/Components";
import { GameEvents, isEvent} from "@lib/GameEvents";


export default class DirtySystem implements System {

    s_name = "DirtySystem";
    enabled = true;

    public awake () : void {
        if (Graphics.isDesktop) {
            this.enabled = false;
        }
    }

    public update () : void {
        let game = EntityManager.getEntityWithTag("Game");
        game.getComponent(EntityGrids).forEachEntityIdInArea(EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView).area, (id : string) => {
            let entity = EntityManager.getEntityWithID(id);
            let dirty = entity.getComponent(Dirty);
            if (dirty.enabled) {
                let spriteRenderer = entity.getComponent(SpriteRenderable);
                if (spriteRenderer != null) spriteRenderer.enabled = false;
                dirty.enabled = false;
                dirty.oldRect = dirty.rect;
                dirty.rect = null;
            }
        }, Graphics.isMobile ? 0 : 2);

        let animatedTiles = EntityManager.getEntityWithTag("AnimatedTiles").getChildren(), entity : Entity = null;
        for (let i = 0, len = animatedTiles.length; i < len; ++i) {
            entity = animatedTiles[i];
            if (entity.getComponent(TileAnimationRenderable) != null) {
                let dirty = entity.getComponent(Dirty);
                if (dirty.enabled) {
                    let tileRenderer = entity.getComponent(TileRenderable);
                    if (tileRenderer != null) tileRenderer.enabled = false;
                    dirty.enabled = false;
                    dirty.oldRect = dirty.rect;
                    dirty.rect = null;
                }
            }
        }

        let targetCell = EntityManager.getEntityWithTag("Mouse").getChildByIndex(1);
        let dirtyCell = targetCell.getComponent(Dirty);
        if (dirtyCell.enabled) {
            dirtyCell.enabled = false;
            dirtyCell.oldRect = dirtyCell.rect;
            dirtyCell.rect = null;
        }
    }

    private checkOtherEntityDirtyRects (r1 : Rect, source : Entity, x : number, y : number) : void {
        let game = EntityManager.getEntityWithTag("Game"), grids = game.getComponent(EntityGrids), entities = null;

        // For each entity around
        for (let i = x - 2, max_i = x + 2; i <= max_i; i += 1) {
            for (let j = y - 2, max_j = y + 2; j <= max_j; j += 1) {
                entities = grids.getEntitiesAt(i, j);
                if (entities === null) continue;
                for (let id in entities) {
                    let entity = EntityManager.getEntityWithID(id);
                    if (source != null && entity.id === source.id) {
                        continue;
                    }
                    let dirty = entity.getComponent(Dirty);
                    if (!dirty.enabled) {
                        let r2 = this.getBoundingRect(entity);
                        if(Area.Intersects(r1, r2)) {
                            this.setDirty(entity);
                        }
                    }
                }
            }
        }

        if (source != null) {
            let animatedTiles = EntityManager.getEntityWithTag("AnimatedTiles").getChildren(), entity : Entity = null;
            for (let i = 0, len = animatedTiles.length; i < len; ++i) {
                entity = animatedTiles[i];
                if (entity.getComponent(TileAnimationRenderable) != null) {
                    let dirty = entity.getComponent(Dirty);
                    if (!dirty.enabled) {
                        let r2 = this.getBoundingRect(entity);
                        if (Area.Intersects(r1, r2)) {
                            dirty.enabled = true;
                        }
                    }
                }
            }
        }

        // If selected cell is active and intersects with dirty entity, has to re-draw it
        let targetCell = EntityManager.getEntityWithTag("Mouse").getChildByIndex(1);
        let dirtyCell = targetCell.getComponent(Dirty);
        if (!dirtyCell.enabled && targetCell.getComponent(Visible).enabled) {
            let targetRect = this.getBoundingRect(targetCell);
            if(Area.Intersects(r1, targetRect)) {
                this.setDirty(targetCell);
            }
        }
    }

    private getBoundingRect (entity : Entity, x? : number, y? : number) : Rect {
        let rect : Rect = null, s = Graphics.scale;
        // Is Entity an animated tile?
        let tileRenderable = entity.getComponent(TileRenderable);
        let cameraTransform = EntityManager.getEntityWithTag("MainCamera").getComponent(Transform);
        if (tileRenderable != null) {
            let ts = Graphics.tilesize, pos = tileRenderable.gridPosition;
            let x = (((pos.x + 1) * ts) - cameraTransform.Position.x) * s,
            y = ((pos.y * ts) - cameraTransform.Position.y) * s,
            w = ts * s,
            h = ts * s;
            rect = {
                x: x, y: y, width: w, height: h,
                left: x, right: x + w, top: y, bottom: y + h
            };
            return rect;
        }
        // Is Entity a character or cell?
        let spriteRenderer = entity.getComponent(SpriteRenderable);
        if (spriteRenderer != null) {
            let sprite;
            // Has weapon?
            let equipment = entity.getComponent(Equipment);
            if (equipment != null && equipment.weaponName) {
                sprite = Graphics.sprites[equipment.weaponName];
            }
            else {
                sprite = Graphics.sprites[spriteRenderer.sprite];
            }

            let transform = entity.getComponent(Transform);
            let position = x ? new Position2D(x, y) : transform ? transform.Position : new Position2D(0, 0);
            if (sprite != null) {
                let x = (position.x + sprite.imageRect.x - cameraTransform.Position.x) * s;
                let y = (position.y + sprite.imageRect.y - cameraTransform.Position.y) * s;
                let w = sprite.imageRect.width * s;
                let h = sprite.imageRect.height * s;
                rect = {
                    x: x, y: y, width: w, height: h,
                    left: x, right: x + w, top: y, bottom: y + h
                };
                return rect;
            }
        }
        return rect;
    }

    private setDirty (entity : Entity) : void {
        let dirty = entity.getComponent(Dirty);
        if (dirty == null) return;

        let transform = entity.getComponent(Transform);
        let cameraViewArea = EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView).area;
        if (cameraViewArea.contains(transform.GridPosition)) {
            dirty.enabled = true;
            dirty.rect = this.getBoundingRect(entity);

            this.checkOtherEntityDirtyRects(dirty.rect, entity, transform.GridPosition.x, transform.GridPosition.y);
            let spriteRenderer = entity.getComponent(SpriteRenderable);
            if (spriteRenderer != null) spriteRenderer.enabled = true;
        }
    }

    public onNotify (params : any) : void {
        if (!this.enabled) return;
        if (isEvent(params, GameEvents.Movement_Moved)) {
            this.setDirty(params.origin);
        }
        else if (isEvent(params, GameEvents.Entity_Added)) {
            if (params.entity.name === "Player") {
                params.entity.getComponent(Dirty).rect = this.getBoundingRect(params.entity);
            }
        }
        else if (isEvent(params, GameEvents.Movement_Door)) {
            if (params.origin.name === "Player") {
                if (!Graphics.isDesktop) {
                    // When rendering with dirty rects, clear the whole screen when entering a door.
                    Graphics.ClearScreen(Graphics.Context.Normal);
                }
            }
        }
        else if (isEvent(params, GameEvents.Movement_PathingStart)) {
            if (params.origin.name === "Player") {
                // Target cursor position
                let targetCell = EntityManager.getEntityWithTag("Mouse").getChildByIndex(1);

                if (!Graphics.isDesktop) {
                    this.setDirty(targetCell);
                }
            }
        }
        else if (isEvent(params, GameEvents.Player_Restart)) {
            if (!Graphics.isDesktop) {
                Graphics.ClearScreen(Graphics.Context.Normal);
            }
        }
        else if (isEvent(params, GameEvents.Zoning_Start)) {
            let self = this;
            EntityManager.getEntityWithTag("Game").getComponent(EntityGrids).forEachEntityIdInArea(EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView).area, (id : string) => {
                let entity = EntityManager.getEntityWithID(id);
                self.setDirty(entity);
            }, Graphics.isMobile ? 0 : 2);
        }
        else if (isEvent(params, GameEvents.Animation_Continued)) {
            this.setDirty(params.origin);
        }
    }
}

// Run after spriteRenderSystem, so that it disables sprite after.
registerSystem(DirtySystem, SystemOrder.Late);