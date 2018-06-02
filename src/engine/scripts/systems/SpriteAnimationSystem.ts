import { System, registerSystem } from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import * as Graphics from "@lib/Graphics";
import { BroadcastEvent } from "@engine/ecs";
import { SpriteRenderable, AnimationRenderable, Transform } from "@components/Components";
import * as Time from "@lib/Time";
import GameTypes from "@common/gametypes";
import * as _ from "underscore";
import * as Logger from "@lib/Logger";
import { Animation } from "@lib/Sprite";
import { GameEvents, isEvent } from "@lib/GameEvents";
import { ComponentType, ComponentNode, NodeType } from "@engine/Component";

interface AnimationRenderableNode extends ComponentNode {
    AnimationRenderable : ComponentType<AnimationRenderable>,
    SpriteRenderable : ComponentType<SpriteRenderable>
}

export default class SpriteAnimationSystem implements System {

    s_name = "SpriteAnimationSystem";
    enabled = true;

    public update () : void {
        let sparks = EntityManager.getEntityWithTag("Game").getChild("Sparks");

        EntityManager.forEachEntityWithComponentNode(AnimationRenderable, this.updateEntity, SpriteRenderable);
    
        this.updateAnimation(sparks, sparks.getComponent(SpriteRenderable), sparks.getComponent(AnimationRenderable));
        let targetCell = EntityManager.getEntityWithTag("Mouse").getChildByIndex(1);
        this.updateAnimation(targetCell, targetCell.getComponent(SpriteRenderable), targetCell.getComponent(AnimationRenderable));
    }

    private updateEntity = (entity : Entity, node : NodeType<AnimationRenderableNode>) : void => {
        if (node.AnimationRenderable.enabled &&
            this.updateAnimation(entity, node.SpriteRenderable, node.AnimationRenderable)) {
                BroadcastEvent(GameEvents.Animation_Continued.params(entity));
        }
    }

    private updateAnimation (entity : Entity, spriteRenderer : SpriteRenderable, animation : AnimationRenderable) : boolean {
        if (!animation.isAnimating) return false;
        let currentAnimation = Graphics.sprites[spriteRenderer.sprite].animations[animation.currentAnimationName];
        
        if (Time.currentTime - animation.lastAnimationTime > currentAnimation.speed) {
            animation.lastAnimationTime = Time.currentTime;
            this.tick(entity, spriteRenderer, animation);
            return true;
        }
        else {
            return false;
        }
    }
    
    private tick (entity : Entity, spriteRenderer : SpriteRenderable, animation : AnimationRenderable) : void {
        let i = animation.currentAnimationIndexCount;
        let currentAnimation = Graphics.sprites[spriteRenderer.sprite].animations[animation.currentAnimationName];
        animation.frame.x = i;
        animation.frame.y = currentAnimation.row;
        animation.currentAnimationIndexCount = i + 1;

        if (i >= currentAnimation.length) {
            if (!animation.loop) {
                // Stop animating
                let n = animation.currentAnimationName;
                animation.OnAnimationEnded();
                BroadcastEvent(GameEvents.Animation_Ended.params(entity, n));
                if (n.startsWith("atk")) {
                    if (spriteRenderer.sprite !== "death")
                        this.idle(animation, entity.getComponent(Transform), spriteRenderer);
                }
            }
            else {
                animation.frame.x = 0;
                animation.currentAnimationIndexCount = 1;
            }
        }
    }

    /**
     * Updates the animation of the current movement
     */
    private updateMovement (entity : Entity, animationRenderable : AnimationRenderable) : void {
        this.animate(animationRenderable, "walk", entity.getComponent(SpriteRenderable), true, entity.getComponent(Transform).Orientation);
    }

    private animate (animationRenderable : AnimationRenderable, animation : string, spriteRenderer : SpriteRenderable, loop : boolean, orientation : GameTypes.Orientations) : void {
        let oriented = ['atk', 'walk', 'idle'];
        
        // don't change animation if the character is dying
        if (animationRenderable.currentAnimationName !== "death") {
            animationRenderable.flipX = false;
            animationRenderable.flipY = false;
    
            if (orientation !== GameTypes.Orientations.None && _.indexOf(oriented, animation) >= 0) {
                animation += "_" + (orientation === GameTypes.Orientations.Left ? "right" : GameTypes.getOrientationAsString(orientation));
                animationRenderable.flipX = (orientation === GameTypes.Orientations.Left) ? true : false;
            }

            this.setAnimation(animationRenderable, Graphics.sprites[spriteRenderer.sprite].animations[animation], spriteRenderer, loop);
        }
    }

    private setAnimation (animationRenderable : AnimationRenderable, animation : Animation, spriteRenderer : SpriteRenderable, loop? : boolean) {
        if (animation != null) {
            if (spriteRenderer.isLoaded) {
                animationRenderable.loop = (loop === undefined) ? false : loop;
                animationRenderable.count = 0;
                if (animationRenderable.isAnimating && animationRenderable.currentAnimationName === animation.name) {
                    return;
                }
                animationRenderable.isAnimating = true;
                // Only reset if is attack
                // Movement and idle animations are kinda synchronized
                if (animation.name.substr(0, 3) === "atk") {
                    animationRenderable.currentAnimationIndexCount = 0;
                }
                animationRenderable.frame.x = 0;
                animationRenderable.currentAnimationName = animation.name;
                animationRenderable.currentAnimation = animation;
                animationRenderable.frame.y = animationRenderable.currentAnimation.row;
                animationRenderable.lastAnimationTime = 0;
            }
            else {
                Logger.log(/*"["+this.identifiable.id+"] " + */"Not ready for animation", Logger.LogType.Error);
            }
        }
        else {
            Logger.log("No animation called " + name + " in sprite " + spriteRenderer.sprite, Logger.LogType.Error);
        }
    }

    private idle (animationRenderer : AnimationRenderable, transform : Transform, spriteRenderer : SpriteRenderable) : void {
        this.animate(animationRenderer, "idle", spriteRenderer, true, transform.Orientation);
    }

    private turnTo (animationRenderer : AnimationRenderable, transform : Transform, spriteRenderer : SpriteRenderable, orientation : GameTypes.Orientations) : void {
        transform.Orientation = orientation;
        this.animate(animationRenderer, "idle", spriteRenderer, true, orientation);
    }

    private hit (animationRenderer : AnimationRenderable, transform : Transform, spriteRenderer : SpriteRenderable) : void {
        this.animate(animationRenderer, "atk", spriteRenderer, false, transform.Orientation);
    }

    private die (entity : Entity) {
        let spriteRenderer = entity.getComponent(SpriteRenderable);
        let sprite = Graphics.sprites[spriteRenderer.sprite];
        let animationRenderer = entity.getComponent(AnimationRenderable);
        if (!("death" in sprite.animations)) {
            spriteRenderer.setSprite(Graphics.sprites["death"]);
        }
        animationRenderer.enabled = true;
        this.animate(animationRenderer, "death", spriteRenderer, false, 0);
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Game_Ready)) {
            // Sparks
            let sparks = params.game.getChild("Sparks");
            let s = sparks.getComponent(SpriteRenderable);
            s.setSprite(Graphics.sprites["sparks"]);
            this.animate(sparks.getComponent(AnimationRenderable), "idle", s, true, 0);

            // Target Cell
            let targetCell = EntityManager.getEntityWithTag("Mouse").getChildByIndex(1);
            let tSpriteRenderer = targetCell.getComponent(SpriteRenderable);
            let tAnimationRenderer = targetCell.getComponent(AnimationRenderable);
            tAnimationRenderer.loop = true;
            tSpriteRenderer.setSprite(Graphics.sprites["target"]);
        }
        else if (isEvent(params, GameEvents.Client_Moved)) {
            let animationRenderer = params.entity.getComponent(AnimationRenderable);
            let spriteRenderer = params.entity.getComponent(SpriteRenderable);
            let transform = params.entity.getComponent(Transform);
            this.animate(animationRenderer, "idle", spriteRenderer, true, transform.Orientation);
        }
        else if (isEvent(params, GameEvents.Character_Death)) {
            this.die(params.character);
        }
        else if (isEvent(params, GameEvents.Client_ChestOpened)) {
            this.die(params.chest);
        }
        else if (isEvent(params, GameEvents.Character_Attack)) {
            let transform = params.character.getComponent(Transform);
            let spriteRenderer = params.character.getComponent(SpriteRenderable);
            let animationRenderer = params.character.getComponent(AnimationRenderable);
            let targetTransform = params.target.getComponent(Transform);
            if (transform.getOrientationTo(targetTransform.Position) !== transform.Orientation) {
                this.turnTo(animationRenderer, transform, spriteRenderer, transform.getOrientationTo(targetTransform.Position));
            }
            this.hit(animationRenderer, transform, spriteRenderer);
        }
        else if (isEvent(params, GameEvents.Movement_PathingStop)) {
            let animationRenderer = params.origin.getComponent(AnimationRenderable);
            let transform = params.origin.getComponent(Transform);
            let spriteRenderer = params.origin.getComponent(SpriteRenderable);

            this.idle(animationRenderer, transform, spriteRenderer);
        }
        else if (isEvent(params, GameEvents.Follow_ReachedTarget)) {
            // Once reaches target, look at it
            let animationRenderer = params.origin.getComponent(AnimationRenderable);
            let transform = params.origin.getComponent(Transform);
            let spriteRenderer = params.origin.getComponent(SpriteRenderable);

            let target = params.target;
            this.turnTo(animationRenderer, transform, spriteRenderer, transform.getOrientationTo(target.getComponent(Transform).Position));
        }
        else if (isEvent(params, GameEvents.Movement_Door)) {
            // If the player used a portal, set its orientation to the portal's
            if (params.origin.name === "Player") {
                let spriteRenderer = params.origin.getComponent(SpriteRenderable);
                let animationRenderer = params.origin.getComponent(AnimationRenderable);
                let transform = params.origin.getComponent(Transform);

                this.turnTo(animationRenderer, transform, spriteRenderer, params.dest.orientation);
            }
        }
        else if (isEvent(params, GameEvents.Movement_Update)) {
            // Update animation of movement
            let animationRenderable = params.origin.getComponent(AnimationRenderable);
            if (animationRenderable !== null) {
                this.updateMovement(params.origin, animationRenderable);
            }
        }
        else if (isEvent(params, GameEvents.Entity_Added)) {
            let animationRenderable = params.entity.getComponent(AnimationRenderable);
            if (animationRenderable !== null && animationRenderable.enabled) {
                this.animate(animationRenderable, "idle", params.entity.getComponent(SpriteRenderable), true, params.entity.getComponent(Transform).Orientation);
            }
        }
        else if (isEvent(params, GameEvents.Player_OnInvincible)) {
            if (params.started === false) {
                this.animate(params.player.getComponent(AnimationRenderable), "idle", params.player.getComponent(SpriteRenderable), true, params.player.getComponent(Transform).Orientation);
            }
        }
        else if (isEvent(params, GameEvents.NPC_Talk)) {
            // Once starts talking with NPC, make player look at it
            let player = EntityManager.getEntityWithTag("Player");
            let animationRenderable = player.getComponent(AnimationRenderable);
            let transform = player.getComponent(Transform);
            this.animate(animationRenderable, "idle", player.getComponent(SpriteRenderable), true, transform.getOrientationTo(params.npc.getComponent(Transform).Position));
        }
        else if (isEvent(params, GameEvents.Movement_PathingStart)) {
            if (params.origin.name === "Player") {
                let targetCell = EntityManager.getEntityWithTag("Mouse").getChildByIndex(1);
                this.animate(targetCell.getComponent(AnimationRenderable), "move", targetCell.getComponent(SpriteRenderable), true, 0);
            }
        }
    }
}

registerSystem(SpriteAnimationSystem);