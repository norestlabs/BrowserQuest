import { System, registerSystem, SystemOrder} from "@engine/System";
import * as Graphics from "@lib/Graphics";
import EntityManager from "@engine/EntityManager";
import {
    AnimationRenderable, SpriteRenderable, Transform, Visible, HurtSpriteRenderable, 
    SilhouetteSpriteRenderable, SparksRenderable, ShadowSpriteRenderable, CameraView,
    EntityGrids, Loadable, Loader
} from "@components/Components";
import { Coordinate } from "@common/position";
import Entity from "@engine/Entity";
import * as Logger from "@lib/Logger";
import { GameEvents, isEvent} from "@lib/GameEvents";


export default class SpriteRenderSystem implements System {

    s_name = "SpriteRenderSystem";
    enabled = true;

    public awake () : void {
        Graphics.LoadSprites();
        let spriteRendererEntity = EntityManager.getEntityWithTag("SpriteRenderer");
        let loadable = spriteRendererEntity.getComponent(Loadable);
        loadable.enabled = true;
        loadable.isLoaded = false;

        EntityManager.getEntityWithID(spriteRendererEntity.getParent()).getComponent(Loader).addLoadable(spriteRendererEntity.id);

        let wait = window.setInterval(function() {
            if (Graphics.areSpritesLoaded) {
                Logger.log('All sprites loaded.', Logger.LogType.Debug);
                clearInterval(wait);
                loadable.isLoaded = true;
            }
        }, 200);
    }

    public update () : void {
        let self = this, camera = EntityManager.getEntityWithTag("MainCamera");
        Graphics.context.save();
        Graphics.SetView(Graphics.Context.Normal, camera.getComponent(Transform).Position);
        this.forEachVisibleEntityByDepth(camera, (entity : Entity) => {
            self.drawEntity(entity);
            let child = entity.getChildren()[0];
            if (child != null) self.drawEntity(child);
        });
        Graphics.context.restore();
    }

    /**
     * Loops through all entities visible by the camera and sorted by depth :
     * Lower 'y' value means higher depth.
     * Note: This is used by the Renderer to know in which order to render entities.
     */
    private forEachVisibleEntityByDepth(camera : Entity, callback : (e : Entity) => void) : void {
        let game = EntityManager.getEntityWithTag("Game"), view = camera.getComponent(CameraView);
        let grids = game.getComponent(EntityGrids), entities = null;

        view.area.forEachPosition(function(x, y) {
            entities = grids.getEntitiesAt(x, y);
            if (entities != null) {
                for (let id in entities) {
                    let entity = EntityManager.getEntityWithID(id);
                    if (entity == null) {
                        Logger.log(`Entity with ID ${id} at (${x}, ${y}) doesn't exist, can't render it.`, Logger.LogType.Error);
                    }
                    else callback(entity);
                }
            }
        }, Graphics.isMobile ? 0 : 2);
    }

    private drawEntity (entity : Entity) : void {
        let visible = entity.getComponent(Visible);
        if (visible != null && !visible.enabled) return;

        // Position
        let transform = entity.getComponent(Transform);
        if (transform == null) {
            Logger.log("Can't draw entity " + entity + " because it doesn't have a transform component.", Logger.LogType.Error);
            return;
        }
        // Sprite
        let spriteRenderer = entity.getComponent(SpriteRenderable);

        if (spriteRenderer != null && spriteRenderer.enabled && spriteRenderer.sprite != null) {
            // Get which image from whole sprite should draw
            let srcPos : Coordinate = undefined;
            let animationRenderer = entity.getComponent(AnimationRenderable);

            if (animationRenderer == null && entity.hasParent()) {
                let parent = EntityManager.getEntityWithID(entity.getParent());
                if (parent != null) {
                    animationRenderer = parent.getComponent(AnimationRenderable);
                }
            }
            if (animationRenderer != null && animationRenderer.enabled) {
                srcPos = animationRenderer.GetSpritePosition(Graphics.sprites[spriteRenderer.sprite]);
            }

            // Hurt
            let hurt = entity.getComponent(HurtSpriteRenderable);
            // Silhouette
            let silhouette = entity.getComponent(SilhouetteSpriteRenderable);
        
            let worldPosition = transform.Position.clone();
            let parent = entity;
            while (parent.hasParent()) {
                parent = EntityManager.getEntityWithID(parent.getParent());
                if (parent === null) break;

                let pTransform = parent.getComponent(Transform);
                if (pTransform != null) {
                    worldPosition.Sum(pTransform.Position.x, pTransform.Position.y);
                }
            }

            // Shadow should be drawn first
            let shadow = entity.getComponent(ShadowSpriteRenderable);
            if (shadow != null && shadow.enabled) {
                Graphics.DrawShadow(worldPosition, shadow.offset);
            }

            let flipX = animationRenderer == null ? false : animationRenderer.flipX;
            let flipY = animationRenderer == null ? false : animationRenderer.flipY;
            Graphics.DrawSprite(spriteRenderer.sprite, worldPosition, spriteRenderer.alpha, flipX, flipY, hurt == null ? false : hurt.enabled,
                silhouette == null ? false : silhouette.enabled, srcPos);
            
            let sparks = entity.getComponent(SparksRenderable);
            if (sparks != null && sparks.enabled) {
                let s = EntityManager.getEntityWithTag("Sparks");
                let sparksSpriteRenderer = s.getComponent(SpriteRenderable);
                Graphics.DrawSprite(sparksSpriteRenderer.sprite, transform.Position, sparksSpriteRenderer.alpha, false, false, false, false, 
                    s.getComponent(AnimationRenderable).GetSpritePosition(Graphics.sprites[sparksSpriteRenderer.sprite]));
            }
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Game_Ready)) {
            Graphics.SetSpriteScale(true);
            Graphics.SetCursor("hand");
        }
        else if (isEvent(params, GameEvents.Character_Remove)) {
            let s = params.character.getComponent(SpriteRenderable);
            if (s != null) s.enabled = false;
        }
        else if (isEvent(params, GameEvents.Character_Death)) {
            let weapon = params.character.getChild("Weapon");
            if (weapon != null) {
                let s = weapon.getComponent(SpriteRenderable);
                if (s != null) s.enabled = false;
            }
        }
    }
}

registerSystem(SpriteRenderSystem, SystemOrder.Render + 2);