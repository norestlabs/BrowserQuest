import { System, registerSystem, SystemOrder} from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import {
    Movable, Identifiable, Transform, Collidable, EntityGrids
} from "@components/Components";
import {BroadcastEvent} from "@engine/ecs";
import {Position2D, Coordinate} from "@common/position";
import GameTypes from "@common/gametypes";
import AStar, {CollisionFlags} from "@lib/astar";
import * as Time from "@lib/Time";
import * as Logger from "@lib/Logger";
import * as _ from "underscore";
import { GameEvents, isEvent} from "@lib/GameEvents";
import * as Pathfinder from "@lib/Pathfinder";
import { ClientMap } from "@common/GameMap";
import { ComponentType, ComponentNode, NodeType } from "@engine/Component";
import { DestinationType } from "@components/Movable";

interface MovableNode extends ComponentNode {
    Movable : ComponentType<Movable>,
    Transform : ComponentType<Transform>
}

export default class MovementSystem implements System {

    s_name = "MovementSystem";
    enabled = true;

    public update () : void {
        EntityManager.forEachEntityWithComponentNode(Movable, this.updateEntity, Transform);
    }

    private updateEntity = (entity : Entity, node : NodeType<MovableNode>) : void => {
        // Check if needs to start moving
        if (node.Movable.enabled && node.Movable.destination != null) {
            if (!node.Transform.Position.equals(node.Movable.getDestination())) {
                // Check movement
                if (!node.Movable.isMoving()) {
                    // Should start moving
                    this.moveTo(entity, node);
                }
            }
            else {
                // Is already at destination
                node.Movable.removeDestination();
            }
            this.updateMovement(entity, node);
        }
    }

    private moveTo(entity : Entity, node : NodeType<MovableNode>) : void {
        let path = this.findPath(entity, node, node.Movable.getDestination());
    
        this.followPath(path, entity, node);
    }

    private followPath (path : Coordinate[], entity : Entity, node : NodeType<MovableNode>) : void {
        if (path.length > 1) { // Length of 1 means the player has clicked on himself
            node.Movable.destination = new Position2D(path[path.length - 1].x, path[path.length - 1].y);

            node.Movable.path = path;
            node.Movable.currentStep = 0;
        
            BroadcastEvent(GameEvents.Movement_PathingStart.params(entity, path));
            
            Pathfinder.addDestiny(node.Movable.destination.x, node.Movable.destination.y);
            
            this.nextStep(entity, node);
        }
    }

    private onBeforeStep (entity : Entity, node : NodeType<MovableNode>) : Entity | null {
        this.unregisterEntityPosition(entity);

        /*if (node.Movable.nextGridPosition.x != -1) {
            let blockingEntityId = EntityManager.GetEntityWithTag("Game").GetComponent(EntityGrids).getEntityIdAt(node.Movable.nextGridPosition.x, node.Movable.nextGridPosition.y,
                Types.EntityType.Mob | Types.EntityType.Npc | Types.EntityType.Chest | Types.EntityType.Player);
            if (blockingEntityId === null) return null;
            let blockingEntity = EntityManager.GetEntityWithID(blockingEntityId);
            if (blockingEntity != null) {
                Logger.log(entity.toString() + " is Blocked by " + blockingEntity.toString(), Logger.LogType.Debug);
                return blockingEntity;
            }
        }*/
        return null;
    }

    private recalculatePath (entity : Entity, node : NodeType<MovableNode>) : boolean {
        Pathfinder.removeDestiny(node.Movable.destination.x, node.Movable.destination.y);
        let path = this.findPath(entity, node, node.Movable.newDestination);

        node.Movable.destination = node.Movable.newDestination.clone();
        node.Movable.newDestination = null;
        if (path.length < 2) {
            node.Movable.nextGridPosition.x = -1;
            node.Movable.nextGridPosition.y = -1;
            return true;
        }
        else {
            node.Movable.nextGridPosition.x = path[1].x;
            node.Movable.nextGridPosition.y = path[1].y;
            this.followPath(path, entity, node);
            return false;
        }
    }

    private getOrientation (from : Coordinate, to : Coordinate) : GameTypes.Orientations {
        if (from.x < to.x) {
            return GameTypes.Orientations.Right;
        }
        else if (from.x > to.x) {
            return GameTypes.Orientations.Left;
        }
        else if (from.y > to.y) {
            return GameTypes.Orientations.Up;
        }
        else {
            return GameTypes.Orientations.Down;
        }
    }
    
    private nextStep (entity : Entity, node : NodeType<MovableNode>) : void {
        let stop = false;
    
        if (node.Movable.isMoving()) {
            this.onBeforeStep(entity, node);

            node.Transform.GridPosition = new Position2D(node.Movable.path[node.Movable.currentStep].x, node.Movable.path[node.Movable.currentStep].y);
            
            // if Character.stop() has been called
            if (node.Movable.interrupted) {
                stop = true;
                node.Movable.interrupted = false;
            }
            else {
                let hasNextStep = node.Movable.hasNextStep();
                if (hasNextStep) {
                    node.Movable.nextGridPosition.x = node.Movable.path[node.Movable.currentStep + 1].x;
                    node.Movable.nextGridPosition.y = node.Movable.path[node.Movable.currentStep + 1].y;
                }

                if (node.Movable.enabled) {
                    // If Movable got disabled while moving, don't broadcast new step
                    BroadcastEvent(GameEvents.Movement_Step.params(entity, hasNextStep ? node.Movable.nextGridPosition : undefined));
                }
            
                if (node.Movable.hasChangedItsPath()) {
                    stop = this.recalculatePath(entity, node) || stop;
                }
                else if (hasNextStep) {
                    // Register current and next positions
                    // If does it before checking for path change, next position will be set and left in the grid
                    this.registerEntityDualPosition(entity);
                    node.Movable.currentStep += 1;
                    let previousPos = node.Movable.path[node.Movable.currentStep - 1];
                    node.Transform.Orientation = this.getOrientation(previousPos, node.Movable.path[node.Movable.currentStep]);
                    BroadcastEvent(GameEvents.Movement_Update.params(entity));
                }
                else {
                    stop = true;
                }
            }
        
            if (stop) { // Path is complete or has been interrupted
                Pathfinder.removeDestiny(node.Movable.destination.x, node.Movable.destination.y);
                node.Movable.path = null;
                node.Movable.destination = null;

                if (node.Movable.enabled) {
                    // If Movable got disabled while moving, don't broadcast pathing stop
                    // nor register new position
                    BroadcastEvent(GameEvents.Movement_PathingStop.params(entity));
            
                    this.unregisterEntityPosition(entity);
                    this.registerEntityPosition(entity);
                }
            }
        }
    }

    /**
     * Registers the entity at two adjacent positions on the grid at the same time.
     * This situation is temporary and should only occur when the entity is moving.
     * This is useful for the hit testing algorithm used when hovering entities with the mouse cursor.
     */
    private registerEntityDualPosition (entity : Entity) : void {
        let transform = entity.getComponent(Transform);
        let movable = entity.getComponent(Movable);
        let identifiable = entity.getComponent(Identifiable);
        let game = EntityManager.getEntityWithTag("Game");
        game.getComponent(EntityGrids).addToEntityGrid(entity.id, identifiable.kind, transform.GridPosition);

        if (movable && movable.nextGridPosition.x >= 0 && movable.nextGridPosition.y >= 0) {
            let collidable = entity.getComponent(Collidable);
            game.getComponent(EntityGrids).addToEntityGrid(entity.id, identifiable.kind, movable.nextGridPosition);
            if (collidable != null && collidable.enabled) {
                Pathfinder.addCollidable(movable.nextGridPosition.x, movable.nextGridPosition.y);
            }
        }
    }

    /**
     * Clears the position(s) of this entity in the entity grid.
     */
    private unregisterEntityPosition (entity : Entity) : void {
        let transform = entity.getComponent(Transform);
        let movable = entity.getComponent(Movable);
        let collidable = entity.getComponent(Collidable);

        let game = EntityManager.getEntityWithTag("Game");
        let grids = game.getComponent(EntityGrids);

        grids.removeFromEntityGrid(entity.id, transform.GridPosition);
        if (collidable != null && collidable.enabled) {
            Pathfinder.removeCollidable(transform.GridPosition.x, transform.GridPosition.y);
        }

        if (movable != null && movable.nextGridPosition && movable.nextGridPosition.x >= 0 && movable.nextGridPosition.y >= 0) {
            grids.removeFromEntityGrid(entity.id, movable.nextGridPosition);
            if (collidable != null && collidable.enabled) {
                Pathfinder.removeCollidable(movable.nextGridPosition.x, movable.nextGridPosition.y);
            }
        }
    }

    private registerEntityPosition (entity : Entity) : void {
        if (entity) {
            let identifiable = entity.getComponent(Identifiable);
            
            if (identifiable != null) {
                let game = EntityManager.getEntityWithTag("Game");
                let transform = entity.getComponent(Transform);
                let collidable = entity.getComponent(Collidable);
                let x = transform.GridPosition.x, y = transform.GridPosition.y;
                game.getComponent(EntityGrids).addToEntityGrid(entity.id, identifiable.kind, transform.GridPosition);
                if (collidable != null && collidable.enabled) {
                    Pathfinder.addCollidable(x, y);
                }
            }
        }
    }

    private transitionUpdate (entity : Entity, node : NodeType<MovableNode>) : void {
        let diff = (16 / node.Movable.speed) * Time.deltaTime;

        switch (node.Transform.Orientation) {
            case GameTypes.Orientations.Left:
                node.Transform.Position.x -= diff; break;
            case GameTypes.Orientations.Right:
                node.Transform.Position.x += diff; break;
            case GameTypes.Orientations.Up:
                node.Transform.Position.y -= diff; break;
            case GameTypes.Orientations.Down:
                node.Transform.Position.y += diff; break;
        }
        this.onHasMoved(entity, node);
    }

    private transitionStop (entity : Entity, node : NodeType<MovableNode>) : void {
        switch (node.Transform.Orientation) {
            case GameTypes.Orientations.Left:
                node.Transform.Position.x = (node.Transform.GridPosition.x - 1) * 16; break;
            case GameTypes.Orientations.Right:
                node.Transform.Position.x = (node.Transform.GridPosition.x + 1) * 16; break;
            case GameTypes.Orientations.Up:
                node.Transform.Position.y = (node.Transform.GridPosition.y - 1) * 16; break;
            case GameTypes.Orientations.Down:
                node.Transform.Position.y = (node.Transform.GridPosition.y + 1) * 16; break;
        }
        this.onHasMoved(entity, node);
        this.nextStep(entity, node);
    }

    private updateMovement (entity : Entity, node : NodeType<MovableNode>) : void {
        if (node.Movable.isMoving() && !node.Movable.wait) {
            if (!node.Movable.isInTransition) {
                // Initialize transition
                node.Movable.isInTransition = true;
                node.Movable.elapsedTransitionTime = 0;
            }
            
            this.transitionUpdate(entity, node);
            node.Movable.elapsedTransitionTime += Time.deltaTime;
            if (node.Movable.elapsedTransitionTime >= node.Movable.speed) {
                node.Movable.isInTransition = false;
                this.transitionStop(entity, node);
            }
        }
    }

    private onHasMoved (entity : Entity, node : NodeType<MovableNode>) : void {
        BroadcastEvent(GameEvents.Movement_Moved.params(entity));
    }

    private initPathingGrid(map : ClientMap) : void {
        Pathfinder.initPathingGrid(map.mapInfo.width, map.mapInfo.height, map.grid);
        Logger.log("Initialized the pathing grid with static colliding cells.", Logger.LogType.Info);
    }

    /**
     * Runs A* algorithm and returns the resulting path.
     * @param grid The pathing grid to be used by the algorithm.
     * @param tf The transform of the entity.
     * @param x Destination's x value.
     * @param y Destination's y value
     * @param findIncomplete Whether should try to find an incomplete path or not in case can't find a complete one.
     */
    private getPath (grid : number[][], tf : Transform, x : number, y : number, findIncomplete : boolean) : Coordinate[] {
        let start = new Position2D(tf.GridPosition.x, tf.GridPosition.y), end = new Position2D(x, y);
        let path;

        path = AStar(grid, start, end, CollisionFlags.All | CollisionFlags.Ignore);
    
        if (path.length === 0 && findIncomplete === true) {
            // If no path was found, try and find an incomplete one
            // to at least get closer to destination.
            path = this.findIncompletePath_(start, end);
        }
    
        return path;
    }

    /**
     * Finds a path which leads the closest possible to an unreachable x, y position.
     *
     * Whenever A* returns an empty path, it means that the destination tile is unreachable.
     * We would like the entities to move the closest possible to it though, instead of
     * staying where they are without moving at all. That's why we have this function which
     * returns an incomplete path to the chosen destination.
     *
     * @returns {number[][]} The incomplete path towards the end position
     */
    private findIncompletePath_(start : Position2D, end : Position2D) : Coordinate[] {
        let perfect : Coordinate[], incomplete : Coordinate[] = [];

        perfect = AStar(Pathfinder.blankGrid, start, end, CollisionFlags.All | CollisionFlags.Ignore);
    
        for (let i = perfect.length - 1; i > 0; i -= 1) {
            let x = perfect[i].x;
            let y = perfect[i].y;
        
            if (Pathfinder.pathingGrid[y][x] === 0) {
                incomplete = AStar(Pathfinder.pathingGrid, start, new Position2D(x, y), CollisionFlags.All);
                break;
            }
        }
        return incomplete;
    }

    /**
     * Finds a path to a grid position for the specified character.
     */
    private findPath (entity : Entity, node : NodeType<MovableNode>, pos : Coordinate) : Coordinate[] {
        let path : Coordinate[];

        if (Pathfinder.has(pos.x, pos.y, CollisionFlags.Obstacles)) {
            return [];
        }

        Pathfinder.addIgnore(pos.x, pos.y);
        Pathfinder.addIgnore(node.Transform.GridPosition.x, node.Transform.GridPosition.y);

        if (node.Movable.isMoving()) {
            Pathfinder.addIgnore(node.Movable.nextGridPosition.x, node.Movable.nextGridPosition.y);
        }

        path = this.getPath(Pathfinder.pathingGrid, node.Transform, pos.x, pos.y, false);

        Pathfinder.removeIgnore(pos.x, pos.y);
        Pathfinder.removeIgnore(node.Transform.GridPosition.x, node.Transform.GridPosition.y);

        if (node.Movable.isMoving()) {
            Pathfinder.addIgnore(node.Movable.nextGridPosition.x, node.Movable.nextGridPosition.y);
        }

        // Check if last position is occupied
        if (path.length > 0) {
            let last = path[path.length - 1];
            if (Pathfinder.has(last.x, last.y, CollisionFlags.Collidables)) {
                path.pop();
            }
        }

        return path;
    }

    /**
     * Moves a character to a given location on the world grid.
     */
    private makeCharacterGoTo (character : Entity, x : number, y : number) : void {
        let entityGrids = EntityManager.getFirstComponent(EntityGrids);
        if (entityGrids.positionExists(x, y)) {
            let movable = character.getComponent(Movable);

            movable.setDestination(new Position2D(x, y), DestinationType.Point);

            BroadcastEvent(GameEvents.Movement_GoTo.params(character, movable.destination));
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Map_Loaded)) {
            Pathfinder.setSize(params.map.mapInfo.width, params.map.mapInfo.height);
            Pathfinder.initBlankGrid();
            this.initPathingGrid(params.map);
        }// TODO: check if removing this affects the game
        /*else if (isEvent(params, GameEvents.Player_Restart)) {
            this.initPathingGrid();
        }*/
        else if (isEvent(params, GameEvents.Client_Moved)) {
            let identifiable = params.entity.getComponent(Identifiable);
            if (identifiable.isCharacter) {
                this.makeCharacterGoTo(params.entity, params.destination.x, params.destination.y);
            }
        }
        else if (isEvent(params, GameEvents.MouseClick)) {
            if (!EntityManager.getEntityWithTag("Player").getComponent(Movable).enabled) return;
            // If there's no entity to interact with, just move to that position
            let entities = params.entities;
            if (entities == null || _.size(entities) == 0) {
                this.makeCharacterGoTo(EntityManager.getEntityWithTag("Player"), params.position.x, params.position.y);
            }
        }
        else if (isEvent(params, GameEvents.Player_LootMove)) {
            let item = params.item;
            if (item) {
                let transform = item.getComponent(Transform);
                this.makeCharacterGoTo(params.player, transform.GridPosition.x, transform.GridPosition.y);
            }
        }
        else if (isEvent(params, GameEvents.Character_Death)) {
            let transform = params.character.getComponent(Transform);
            // Upon death, this entity is removed from both grids, allowing the player
            // to click very fast in order to loot the dropped item and not be blocked.
            // The entity is completely removed only after the death animation has ended.
            Pathfinder.removeCollidable(transform.GridPosition.x, transform.GridPosition.y);
            let movable = params.character.getComponent(Movable);
            if (movable != null) {
                // TODO: simplify
                movable.isInTransition = false;
                movable.wait = false;
                movable.destination = null;
                movable.newDestination = null;
                movable.path = null;
                movable.enabled = false;
            }
        }
        else if (isEvent(params, GameEvents.Movement_Door)) {
            let movable = params.origin.getComponent(Movable);
            let transform = params.origin.getComponent(Transform);

            transform.GridPosition = new Position2D(params.dest.x, params.dest.y);
            movable.nextGridPosition = new Position2D(params.dest.x, params.dest.y);
        }
        else if (isEvent(params, GameEvents.Entity_Added)) {
            this.registerEntityPosition(params.entity);
        }
        else if (isEvent(params, GameEvents.Character_Teleport)) {
            let transform = params.character.getComponent(Transform);
            let grids = EntityManager.getFirstComponent(EntityGrids);
            if (grids.positionExists(params.position.x, params.position.y)) {
                this.unregisterEntityPosition(params.character);
    
                transform.GridPosition = new Position2D(params.position.x, params.position.y);
    
                this.registerEntityPosition(params.character);
            }
            else {
                Logger.log(`Teleport out of bounds: ${params.position.x},${params.position.y}`, Logger.LogType.Debug);
            }
        }
        else if (isEvent(params, GameEvents.Entity_Deleted)) {
            let transform = params.entity.getComponent(Transform);
            let movable = params.entity.getComponent(Movable);
            Logger.log(`Unregistering ${params.entity.toString()} from entity grid. Position: ${transform.GridPosition}. Next position: ${movable != null ? movable.nextGridPosition : ""}`, Logger.LogType.Info);
            this.unregisterEntityPosition(params.entity);
        }
        else if (isEvent(params, GameEvents.Client_LootMove)) {
            let transform = params.item.getComponent(Transform);
            this.makeCharacterGoTo(params.warrior, transform.GridPosition.x, transform.GridPosition.y);
        }
        else if (isEvent(params, GameEvents.Client_Welcome)) {
            let movable = params.player.getComponent(Movable);
            if (movable != null) {
                movable.enabled = true;
            }
        }
    }
}

registerSystem(MovementSystem, SystemOrder.Movement);