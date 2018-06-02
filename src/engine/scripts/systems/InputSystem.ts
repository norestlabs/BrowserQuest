import { System, registerSystem, SystemOrder} from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import {BroadcastEvent} from "@engine/ecs";
import * as Graphics from "@lib/Graphics";
import GameTypes from "@common/gametypes";
import {
    MouseInput, MouseHover, Visible, Identifiable, PrimitiveRenderable, SilhouetteSpriteRenderable,
    Transform, CameraView, Clickable, EntityGrids, Controllable, TiledMap
} from "@components/Components";
import * as GameState from "@lib/GameState";
import * as App from "@lib/App";
import * as Logger from "@lib/Logger";
import * as _ from "underscore";
import { GameEvents, isEvent } from "@lib/GameEvents";

export default class InputSystem implements System {

    s_name = "InputSystem";
    enabled = true;

    public awake () : void {
        let self = this;
        // Movement
        $(document).mousemove(function(event) {
            if (GameState.currentStatus === GameState.Status.Started) {
                self.updateMousePosition(event);
                self.updateMouseHover();
            }
        });
        
        // Normal click
        if (Graphics.isMobile || Graphics.isTablet) {
            $('#foreground').bind('touchstart', function(event) {
                App.Center();
                App.hideWindows();
                if (GameState.currentStatus === GameState.Status.Started) {
                    self.mouseClick(event);
                }
            });
        }
        else {
            $('#foreground').click(function(event) {
                App.Center();
                App.hideWindows();
                if (GameState.currentStatus === GameState.Status.Started) {
                    self.mouseClick(event);
                }
            });
        }
        
        // Click on parchment
        $('body').click(function(event) {
            if ($('#parchment').hasClass('credits')) {
                if (GameState.currentStatus === GameState.Status.Started) {
                    App.closeInGameCredits();
                }
                else {
                    App.toggleCredits(false, Graphics.isMobile, Graphics.isTablet);
                }
            }
            
            if ($('#parchment').hasClass('about')) {
                if (GameState.currentStatus === GameState.Status.Started) {
                    App.closeInGameAbout();
                }
                else {
                    App.toggleAbout(false, Graphics.isMobile, Graphics.isTablet);
                }
            }
        });
        
        // Key input
        $(document).keydown(function(e) {
            let key = e.which;
            if (GameState.currentStatus === GameState.Status.Started) {
                if (App.chatHasFocus()) {
                    BroadcastEvent(GameEvents.ChatInput.params(key, e));
                }
                else BroadcastEvent(GameEvents.KeyInput.params(key, e));

                return !e.isDefaultPrevented();
            }

            return true;
        });
        
        // Click on respawn button
        $('#respawn').click(function(event) {
            Logger.log("Beginning restart", Logger.LogType.Debug);
            let player = EntityManager.getEntityWithTag("Player");
            BroadcastEvent(GameEvents.Player_Restart.params(player, EntityManager.getEntityWithTag("Game")));
            Logger.log("Finished restart", Logger.LogType.Debug);
            event.preventDefault();
            return false;
        });
    }

    public update () : void {
        if (GameState.currentStatus === GameState.Status.Started)
            this.updateCursorLogic(EntityManager.getEntityWithTag("Mouse"));
    }

    /**
     * Updates mouse's position and grid position based on a given event.
     * 
     * @private
     * @param {((JQuery.Event<HTMLElement, null> | Touch))} event The input event.
     * @memberof InputSystem
     */
    private updateMousePosition (event : (JQuery.Event<HTMLElement, null> | Touch)) : void {
        let gamePos = $('#container').offset(), scale = Graphics.scale;
        let width = Graphics.getWidth(), height = Graphics.getHeight();
        let input = EntityManager.getEntityWithTag("Mouse").getComponent(MouseInput);

        input.mousePosition.Set(event.pageX - gamePos.left - (Graphics.isMobile ? 0 : 5 * scale),
                event.pageY - gamePos.top - (Graphics.isMobile ? 0 : 7 * scale));

        if (input.mousePosition.x <= 0) {
            input.mousePosition.x = 0;
        }
        else if (input.mousePosition.x >= width) {
            input.mousePosition.x = width - 1;
        }

        if (input.mousePosition.y <= 0) {
            input.mousePosition.y = 0;
        }
        else if (input.mousePosition.y >= height) {
            input.mousePosition.y = height - 1;
        }

        let mx = input.mousePosition.x, my = input.mousePosition.y;
        let c = EntityManager.getEntityWithTag("MainCamera").getComponent(Transform);
        let s = Graphics.scale, ts = Graphics.tilesize, offsetX = mx % (ts * s), offsetY = my % (ts * s);
        let x = ((mx - offsetX) / (ts * s)) + c.GridPosition.x, y = ((my - offsetY) / (ts * s)) + c.GridPosition.y;

        input.mouseGridPosition.Set(x, y);
    }

    /**
     * Called when there's a click. Checks if the click can be broadcasted and if it can, does it.
     * 
     * @private
     * @param {((JQuery.Event<HTMLElement, null> | Touch))} event 
     * @returns {void} 
     * @memberof InputSystem
     */
    private mouseClick (event : (JQuery.Event<HTMLElement, null> | Touch)) : void {
        this.updateMousePosition(event);
        let mouse = EntityManager.getEntityWithTag("Mouse");
        let mouseInput = mouse.getComponent(MouseInput);
        let pos = mouseInput.mouseGridPosition;

        // If clicked on the same position, there's no need do anything
        if (pos.equals(mouseInput.previousClickPosition)) {
            return;
        }
        else {
            mouseInput.previousClickPosition.copy(pos);
        }

        // The click is only valid when:
        //  - Isn't zoning
        //  - Next moving step isn't a zoning tile
        //  - Isn't dead
        //  - Identifiable's ID different than 0 (it's 0 soon after reviving but before renewing ID from the server)
        //  - Isn't hovering a colliding tile
        //  - Isn't hovering a plateau tile
        if (EntityManager.getFirstComponent(Controllable).enabled && mouseInput.enabled) {
            let game = EntityManager.getEntityWithTag("Game");
            // Give only clickable entities
            let filtered = _.pick(game.getComponent(EntityGrids).getEntitiesAt(pos.x, pos.y), function (kind : GameTypes.Entities, id : number) {
                let entity = EntityManager.getEntityWithID(id);
                if (entity !== null) {
                    let c = entity.getComponent(Clickable);
                    if (c !== null) {
                        return c.enabled;
                    }
                    else return false;
                }
                return false;
            });
            BroadcastEvent(GameEvents.MouseClick.params(mouse, filtered, pos));
        }
    }

    /**
     * Updates the current cursor sprite based on the hovering entity, and the selected position's marker based on whether
     * it's a colliding tile or not.
     * 
     * @param {Entity} mouse The mouse entity.
     * @param {GameStatus} state The current state of the game.
     * @memberof InputSystem
     */
    private updateCursorLogic (mouse : Entity) : void {
        let hoverMouse = mouse.getComponent(MouseHover);
        let selectedPosition = mouse.getChildByIndex(0);

        if (hoverMouse.hoveringCollidingTile && GameState.currentStatus === GameState.Status.Started) {
            // When is hovering a colliding tile, can't go, so target cell is marked with red square
            selectedPosition.getComponent(PrimitiveRenderable).color = "rgba(255, 50, 50, 0.5)";
        }
        else {
            // If it's a cell the player can go to, it's marked with a grey-ish color (semi-transparent)
            selectedPosition.getComponent(PrimitiveRenderable).color = "rgba(255, 255, 255, 0.5)";
        }
        // If is currently hovering an entity
        if (hoverMouse.hoveringEntity != null) {
            let clickable = hoverMouse.hoveringEntity.getComponent(Clickable);
            // If it isn't clickable, just set the normal cursor
            if (clickable == null || !clickable.enabled) {
                Graphics.SetCursor("hand");
                selectedPosition.getComponent(Visible).enabled = true;
                return;
            }
            let kind = hoverMouse.hoveringEntity.getComponent(Identifiable).kind;
            // If it's a mob, set the sword cursor, and disable selectedPosition
            if (GameTypes.isMob(kind) && GameState.currentStatus === GameState.Status.Started) {
                Graphics.SetCursor("sword");
                selectedPosition.getComponent(Visible).enabled = false;
            }
            // If it's a npc, set the talk cursor, and disable selectedPosition
            else if (GameTypes.isNpc(kind) && GameState.currentStatus === GameState.Status.Started) {
                Graphics.SetCursor("talk");
                selectedPosition.getComponent(Visible).enabled = false;
            }
            // If it's an item or a chest, set the loot cursor, and enable selectedPosition
            else if ((GameTypes.isItem(kind) || GameTypes.isChest(kind)) && GameState.currentStatus === GameState.Status.Started) {
                Graphics.SetCursor("loot");
                selectedPosition.getComponent(Visible).enabled = true;
            }
        }
        // Else, if isn't hovering any entity, just set the normal cursor
        else {
            Graphics.SetCursor("hand");
            selectedPosition.getComponent(Visible).enabled = true;
        }
    }

    private isPlayerOnPlateau (map : TiledMap) : boolean {
        return map.isPlateau(EntityManager.getEntityWithTag("Player").getComponent(Transform).GridPosition);
    }

    /**
     * Updates the logic behind hovering, checking which entity and kind of tile is being hovered.
     * Also updates the silhouette component of involved entities.
     * 
     * @private
     * @memberof InputSystem
     */
    private updateMouseHover () : void {
        let game = EntityManager.getEntityWithTag("Game"), mouse = EntityManager.getEntityWithTag("Mouse");
        let mousePos = mouse.getComponent(MouseInput).mouseGridPosition;

        if (Graphics.isDesktop) {
            let hoverMouse = mouse.getComponent(MouseHover);
            let entityGrids = game.getComponent(EntityGrids);
            let map = game.getChild("Map").getComponent(TiledMap);

            // Update hoveringTile
            hoverMouse.hoveringCollidingTile = map.isColliding(mousePos.x, mousePos.y);
            hoverMouse.hoveringPlateauTile = this.isPlayerOnPlateau(map) ? !map.isPlateau(mousePos) : map.isPlateau(mousePos);

            if (hoverMouse.hoveringCollidingTile || hoverMouse.hoveringPlateauTile) {
                EntityManager.getFirstComponent(Controllable).enabled = false;
            }
            else {
                EntityManager.getFirstComponent(Controllable).enabled = true;
            }
            
            // Get all entities in the grid position
            let stackedEntities = entityGrids.getEntitiesAt(mousePos.x, mousePos.y);
            let entity = null;
            for (let id in stackedEntities) {
                let e = EntityManager.getEntityWithID(id);
                let clickable = e.getComponent(Clickable);
                // Check if the entity is clickable
                if (clickable != null && clickable.enabled) {
                    entity = e;
                    break;
                }
            }

            // Update hoveringEntity
            let kind = entity == null ? undefined : entity.getComponent(Identifiable).kind;
            if (entity == null) hoverMouse.hoveringEntity = null;

            // Process the silhouette components
            if (kind && (GameTypes.isMob(kind) || GameTypes.isNpc(kind) || GameTypes.isChest(kind))) {
                hoverMouse.hoveringEntity = entity;
                // Get the silhouette of this entity
                let silhouetteRenderer = hoverMouse.hoveringEntity.getComponent(SilhouetteSpriteRenderable);

                // Check if there was a lastHovered entity
                if (hoverMouse.lastHovered != null) {
                    // Remove the silhouette of that
                    hoverMouse.lastHovered.getComponent(SilhouetteSpriteRenderable).enabled = false;
                }
                // If the currently hovered entity doesn't already have a silhouette
                if (!silhouetteRenderer.enabled && Graphics.supportsSilhouettes) {
                    // Setup last hovered, and put silhouette
                    hoverMouse.lastHovered = hoverMouse.hoveringEntity;
                    silhouetteRenderer.enabled = true;
                }
            }
            // If isn't hovering an entity but lastHovered exists
            else if (hoverMouse.lastHovered != null) {
                // Cancel lastHovered
                hoverMouse.lastHovered.getComponent(SilhouetteSpriteRenderable).enabled = false;
                hoverMouse.lastHovered = null;
            }
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Client_OnDroppedItem)) {
            this.updateMouseHover();
        }
        else if (isEvent(params, GameEvents.Character_Death)) {
            let clickable = params.character.getComponent(Clickable);
            if (clickable != null) {
                params.character.getComponent(Clickable).enabled = false;
            }
            this.updateMouseHover();

            let controllable = params.character.getComponent(Controllable);
            if (controllable != null) {
                controllable.enabled = false;
            }
        }
        else if (isEvent(params, GameEvents.Client_ChestOpened)) {
            let clickable = params.chest.getComponent(Clickable);
            if (clickable != null) {
                params.chest.getComponent(Clickable).enabled = false;
            }
            this.updateMouseHover();
        }
        else if (isEvent(params, GameEvents.Player_Loot)) {
            let clickable = params.item.getComponent(Clickable);
            if (clickable != null) clickable.enabled = false;
            this.updateMouseHover();
        }
        else if (isEvent(params, GameEvents.Zoning_Start)) {
            let input = EntityManager.getFirstComponent(MouseInput);
            if (input != null) {
                input.enabled = false;
            }
            this.enabled = false;
            EntityManager.getEntityWithTag("SelectedPosition").getComponent(Visible).enabled = false;
        }
        else if (isEvent(params, GameEvents.Zoning_Reset)) {
            let input = EntityManager.getFirstComponent(MouseInput);
            if (input != null) {
                input.enabled = true;
            }
            this.enabled = true;
            EntityManager.getEntityWithTag("SelectedPosition").getComponent(Visible).enabled = true;
        }
        else if (isEvent(params, GameEvents.Client_Welcome)) {
            let controllable = params.player.getComponent(Controllable);
            if (controllable != null) {
                controllable.enabled = true;
            }
        }
        else if (isEvent(params, GameEvents.Movement_Step)) {
            let input = params.origin.getComponent(MouseInput);
            if (input != null) {
                if (params != null) {
                    let cameraView = EntityManager.getEntityWithTag("MainCamera").getComponent(CameraView);
                    if (cameraView.isZoningTile(params.nextGridPosition.x, params.nextGridPosition.y)) {
                        input.enabled = false;
                    }
                }
            }
        }
    }
}

// Run after spriteRenderSystem, so that it disables sprite after.
registerSystem(InputSystem, SystemOrder.Input);