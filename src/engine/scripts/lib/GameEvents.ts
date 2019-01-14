/**
 * Attempting to make event parameters typed.
 */

import { Coordinate, Position2D } from "@common/position";
import GameTypes from "@common/gametypes";
import { Achievement } from "@lib/Achievements";
import Entity from "@engine/Entity";
import { LootException } from "@utils/exceptions";
import { CheckpointArea, ClientMap } from "@common/GameMap";
import { Key } from "@utils/Key";

export enum GameEvent {
    Movement_PathingStart,
    Movement_PathingStop,
    /**
     * Origin is character. Param is nextGridPosition.
     */
    Movement_Step,
    Movement_GoTo,
    Movement_Update,
    Movement_Door,
    /**
     * Raised when the movable entity has moved, but not necessarily took a whole step yet.
     */
    Movement_Moved,
    /**
     * Raised when the player clicks somewhere. The origin is mouse Entity.
     * The param is:
     * * entities: the set of clickable entities in the grid position of the click
     * * position: the grid position of the click
     */
    MouseClick,
    KeyInput,
    ChatInput,
    Resize,
    Zoning_Start, Zoning_Reset, Zoning_Update,
    Dirty_Set,
    /**
     * Raised before things begin to load, as it was requested to start. Origin is Game.
     */
    Game_Run,
    /**
     * Raised once everything is loaded. Origin is Game.
     */
    Game_Ready,
    /**
     * Raised once the game starts connection procedures.
     */
    Game_Connect,
    Achievement_Unlock,
    Client_Welcome,
    Client_OnDroppedItem,
    /**
     * Raised when server sends Kill message. Origin is null and param is the killed entity's kind.
     */
    Client_CharacterKilled,
    /**
     * Raised when receives Health message from Server.
     * Param contains points, isRegen, isHurt and diff.
     */
    Client_HealthChanged,
    Client_Moved,
    Client_Chat,
    Client_ReceiveMessage,
    /**
     * Raised when receives Damage message from Server.
     * Param is the damage value.
     */
    Client_ReceiveDamage,
    Client_Attack,
    Client_Disconnect,
    Client_PopulationChanged,
    Client_ChestOpened,
    Client_HitPoints,
    Client_Destroy,
    Client_OnObsolete,
    Client_OnDespawn,
    Client_LootMove,
    /**
     * Raised once the server has acknowledged player's equip request. Param is item kind.
     */
    Client_Equip,
    Client_Teleport,
    /**
     * Raised when the player loots an item. Origin is the item, param is player.
     */
    Player_Loot,
    /**
     * Raised when the loot has failed. Origin is the loot. Param is LootException.
     */
    Loot_Fail,
    Player_Delete,
    /**
     * Raised when player clicks on restart button. Origin is Player, param is Game entity.
     */
    Player_Restart,
    Player_CreateAttackLink,
    /**
     * Raised when the player has switched the equipment (like looting or becoming invincible)
     */
    Player_SwitchEquipment,
    /**
     * Raised when the player starts or stops invincibility.
     * 
     * The param is a boolean that indicates whether it has started or stopped.
     */
    Player_OnInvincible,
    Player_LootMove,
    Player_Say,
    Player_Checkpoint,
    Player_OnAggro,
    /**
     * Raised when the entity reaches its follow target.
     * 
     * The param is the target Entity.
     */
    Follow_ReachedTarget,
    NPC_Talk,
    Character_Death,
    Character_Remove,
    Character_Attack,
    Character_Teleport,
    /**
     * Raised when a new entity is spawned. Param is target entity, if any.
     */
    Entity_Added,
    Entity_Deleted,
    Animation_Continued,
    Animation_Ended,
    Attack_SetTarget,
    Attack_RemoveTarget,
    Map_Loaded
}

export let GameEvents = {
    Movement_PathingStart : {
        params : (origin : Entity, path : Coordinate[]) => ({ ev : GameEvent.Movement_PathingStart, origin, path }),
        event : GameEvent.Movement_PathingStart
    },
    
    Movement_PathingStop : {
        params : (origin : Entity) => ({ ev : GameEvent.Movement_PathingStop, origin }),
        event : GameEvent.Movement_PathingStop
    },
    
    Movement_Step : {
        params : (origin : Entity, nextGridPosition : Position2D) => ({ ev : GameEvent.Movement_Step, origin, nextGridPosition }),
        event : GameEvent.Movement_Step
    },
    Movement_GoTo : {
        params : (origin : Entity, destination : Position2D) => ({ ev : GameEvent.Movement_GoTo, origin, destination }),
        event : GameEvent.Movement_GoTo
    },
    Movement_Update : {
        params : (origin : Entity) => ({ ev : GameEvent.Movement_Update, origin }),
        event : GameEvent.Movement_Update
    },
    Movement_Door : {
        params : (origin : Entity, dest : {x : number, y : number, orientation: GameTypes.Orientations,
            cameraX: number, cameraY: number, portal: boolean}) => ({ ev : GameEvent.Movement_Door, origin, dest }),
        event : GameEvent.Movement_Door
    },
    /**
     * Raised when the movable entity has moved, but not necessarily took a whole step yet.
     */
    Movement_Moved : {
        params : (origin : Entity) => ({ ev : GameEvent.Movement_Moved, origin }),
        event : GameEvent.Movement_Moved
    },
    /**
     * Raised when the player clicks somewhere. The origin is mouse Entity.
     * The param is:
     * * entities: the set of clickable entities in the grid position of the click
     * * position: the grid position of the click
     */
    MouseClick : {
        params : (mouse : Entity, entities : { [id : string] : GameTypes.Entities }, position : Position2D) => ({ ev : GameEvent.MouseClick, mouse, entities, position }),
        event : GameEvent.MouseClick
    },
    KeyInput : {
        params : (key : Key, event : JQuery.Event<HTMLElement, null>) => ({ ev : GameEvent.KeyInput, key, event }),
        event : GameEvent.KeyInput
    },
    ChatInput : {
        params : (key : Key, event : JQuery.Event<HTMLElement, null>) => ({ ev : GameEvent.ChatInput, key, event }),
        event : GameEvent.ChatInput
    },
    Resize : {
        params : (game : Entity) => ({ ev : GameEvent.Resize, game }),
        event : GameEvent.Resize
    },
    Zoning_Start : {
        params : () => ({ ev : GameEvent.Zoning_Start }),
        event : GameEvent.Zoning_Start
    },
    Zoning_Reset : {
        params : () => ({ ev : GameEvent.Zoning_Reset }),
        event : GameEvent.Zoning_Reset
    },
    Zoning_Update : {
        params : () => ({ ev : GameEvent.Zoning_Update }),
        event : GameEvent.Zoning_Update
    },
    Dirty_Set : {
        params : (origin : Entity) => ({ ev : GameEvent.Dirty_Set, origin }),
        event : GameEvent.Dirty_Set
    },
    /**
     * Raised once everything is loaded. Origin is Game.
     */
    Game_Ready : {
        params : (game : Entity) => ({ ev : GameEvent.Game_Ready, game }),
        event : GameEvent.Game_Ready
    },
    Game_Connect : {
        params : (game : Entity, username : string, addr : string) => ({ ev : GameEvent.Game_Connect, game, username, addr }),
        event : GameEvent.Game_Connect
    },
    Achievement_Unlock : {
        params : (achievement : Achievement) => ({ ev : GameEvent.Achievement_Unlock, achievement }),
        event : GameEvent.Achievement_Unlock
    },
    Client_Welcome : {
        params : (player : Entity) => ({ ev : GameEvent.Client_Welcome, player }),
        event : GameEvent.Client_Welcome
    },
    Client_OnDroppedItem : {
        params : (item : Entity, mobId : number) => ({ ev : GameEvent.Client_OnDroppedItem, item, mobId }),
        event : GameEvent.Client_OnDroppedItem
    },
    /**
     * Raised when server sends Kill message. Origin is null and param is the killed entity's kind.
     */
    Client_CharacterKilled : {
        params : (mobKind : GameTypes.Entities) => ({ ev : GameEvent.Client_CharacterKilled, mobKind }),
        event : GameEvent.Client_CharacterKilled
    },
    /**
     * Raised when receives Health message from Server.
     * Param contains points, isRegen, isHurt and diff.
     */
    Client_HealthChanged : {
        params : (player : Entity, points : number, isRegen : boolean, isHurt : boolean, diff : number, canBeHurt : boolean) => ({ ev : GameEvent.Client_HealthChanged, player, points, isRegen, isHurt, diff, canBeHurt }),
        event : GameEvent.Client_HealthChanged
    },
    Client_Moved : {
        params : (entity : Entity, destination : Coordinate) => ({ ev : GameEvent.Client_Moved, entity, destination }),
        event : GameEvent.Client_Moved
    },
    Client_Chat : {
        params : (character : Entity, text : string) => ({ ev : GameEvent.Client_Chat, character, text }),
        event : GameEvent.Client_Chat
    },
    Client_ReceiveMessage : {
        params : () => ({ ev : GameEvent.Client_ReceiveMessage }),
        event : GameEvent.Client_ReceiveMessage
    },
    /**
     * Raised when receives Damage message from Server.
     * Param is the damage value.
     */
    Client_ReceiveDamage : {
        params : (mob : Entity, dmg : number) => ({ ev : GameEvent.Client_ReceiveDamage, mob, dmg }),
        event : GameEvent.Client_ReceiveDamage
    },
    Client_Attack : {
        params : (attacker : Entity, target : Entity) => ({ ev : GameEvent.Client_Attack, attacker, target }),
        event : GameEvent.Client_Attack
    },
    Client_Disconnect : {
        params : (message : string) => ({ ev : GameEvent.Client_Disconnect, message }),
        event : GameEvent.Client_Disconnect
    },
    Client_PopulationChanged : {
        params : (worldPlayers : number, totalPlayers : number) => ({ ev : GameEvent.Client_PopulationChanged, worldPlayers, totalPlayers }),
        event : GameEvent.Client_PopulationChanged
    },
    Client_ChestOpened : {
        params : (chest : Entity) => ({ ev : GameEvent.Client_ChestOpened, chest }),
        event : GameEvent.Client_ChestOpened
    },
    Client_HitPoints : {
        params : (player : Entity, maxHP : number) => ({ ev : GameEvent.Client_HitPoints, player, maxHP }),
        event : GameEvent.Client_HitPoints
    },
    Client_Destroy : {
        params : (entity : Entity) => ({ ev : GameEvent.Client_Destroy, entity }),
        event : GameEvent.Client_Destroy
    },
    Client_OnObsolete : {
        params : (entity : Entity) => ({ ev : GameEvent.Client_OnObsolete, entity }),
        event : GameEvent.Client_OnObsolete
    },
    Client_OnDespawn : {
        params : (entity : Entity) => ({ ev : GameEvent.Client_OnDespawn, entity }),
        event : GameEvent.Client_OnDespawn
    },
    Client_LootMove : {
        params : (warrior : Entity, item : Entity) => ({ ev : GameEvent.Client_LootMove, warrior, item }),
        event : GameEvent.Client_LootMove
    },
    /**
     * Raised once the server has acknowledged player's equip request. Param is item kind.
     */
    Client_Equip : {
        params : (warrior : Entity, itemKind : GameTypes.Entities) => ({ ev : GameEvent.Client_Equip, warrior, itemKind }),
        event : GameEvent.Client_Equip
    },
    Client_Teleport : {
        params : (entity : Entity) => ({ ev : GameEvent.Client_Teleport, entity }),
        event : GameEvent.Client_Teleport
    },
    /**
     * Raised when the player loots an item. Origin is the item, param is player.
     */
    Player_Loot : {
        params : (item : Entity, player : Entity) => ({ ev : GameEvent.Player_Loot, item, player }),
        event : GameEvent.Player_Loot
    },
    /**
     * Raised when the loot has failed. Origin is the loot. Param is LootException.
     */
    Loot_Fail : {
        params : (item : Entity, exception : LootException) => ({ ev : GameEvent.Loot_Fail, item, exception }),
        event : GameEvent.Loot_Fail
    },
    Player_Delete : {
        params : () => ({ ev : GameEvent.Player_Delete }),
        event : GameEvent.Player_Delete
    },
    /**
     * Raised when player clicks on restart button. Origin is Player, param is Game entity.
     */
    Player_Restart : {
        params : (player : Entity, game : Entity) => ({ ev : GameEvent.Player_Restart, player, game }),
        event : GameEvent.Player_Restart
    },
    Player_CreateAttackLink : {
        params : (player : Entity, mob : Entity) => ({ ev : GameEvent.Player_CreateAttackLink, player, mob }),
        event : GameEvent.Player_CreateAttackLink
    },
    /**
     * Raised when the player has switched the equipment (like looting or becoming invincible)
     */
    Player_SwitchEquipment : {
        params : (player : Entity) => ({ ev : GameEvent.Player_SwitchEquipment, player }),
        event : GameEvent.Player_SwitchEquipment
    },
    /**
     * Raised when the player starts or stops invincibility.
     * 
     * The param is a boolean that indicates whether it has started or stopped.
     */
    Player_OnInvincible : {
        params : (player : Entity, started : boolean) => ({ ev : GameEvent.Player_OnInvincible, player, started }),
        event : GameEvent.Player_OnInvincible
    },
    Player_LootMove : {
        params : (player : Entity, item : Entity) => ({ ev : GameEvent.Player_LootMove, player, item }),
        event : GameEvent.Player_LootMove
    },
    Player_Say : {
        params : (player : Entity, message : string) => ({ ev : GameEvent.Player_Say, player, message }),
        event : GameEvent.Player_Say
    },
    Player_Checkpoint : {
        params : (player : Entity, checkpoint : CheckpointArea) => ({ ev : GameEvent.Player_Checkpoint, player, checkpoint }),
        event : GameEvent.Player_Checkpoint
    },
    Player_OnAggro : {
        params : (player : Entity, aggroedMob : Entity) => ({ ev : GameEvent.Player_OnAggro, player, aggroedMob }),
        event : GameEvent.Player_OnAggro
    },
    /**
     * Raised when the entity reaches its follow target.
     * 
     * The param is the target Entity.
     */
    Follow_ReachedTarget : {
        params : (origin : Entity, target : Entity) => ({ ev : GameEvent.Follow_ReachedTarget, origin, target }),
        event : GameEvent.Follow_ReachedTarget
    },
    NPC_Talk : {
        params : (npc : Entity, message : string) => ({ ev : GameEvent.NPC_Talk, npc, message }),
        event : GameEvent.NPC_Talk
    },
    Character_Death : {
        params : (character : Entity) => ({ ev : GameEvent.Character_Death, character }),
        event : GameEvent.Character_Death
    },
    Character_Remove : {
        params : (character : Entity) => ({ ev : GameEvent.Character_Remove, character }),
        event : GameEvent.Character_Remove
    },
    Character_Attack : {
        params : (character : Entity, target : Entity) => ({ ev : GameEvent.Character_Attack, character, target }),
        event : GameEvent.Character_Attack
    },
    Character_Teleport : {
        params : (character : Entity, position : Coordinate) => ({ ev : GameEvent.Character_Teleport, character, position }),
        event : GameEvent.Character_Teleport
    },
    /**
     * Raised when a new entity is spawned. Param is target entity, if any.
     */
    Entity_Added : {
        params : (entity : Entity, target : Entity | null) => ({ ev : GameEvent.Entity_Added, entity, target }),
        event : GameEvent.Entity_Added
    },
    Entity_Deleted : {
        params : (entity : Entity) => ({ ev : GameEvent.Entity_Deleted, entity }),
        event : GameEvent.Entity_Deleted
    },
    Animation_Continued : {
        params : (origin : Entity) => ({ ev : GameEvent.Animation_Continued, origin }),
        event : GameEvent.Animation_Continued
    },
    Animation_Ended : {
        params : (origin : Entity, animationName : string) => ({ ev : GameEvent.Animation_Ended, origin, animationName }),
        event : GameEvent.Animation_Ended
    },
    Attack_SetTarget : {
        params : (attacker : Entity, target : Entity) => ({ ev : GameEvent.Attack_SetTarget, attacker, target }),
        event : GameEvent.Attack_SetTarget
    },
    Attack_RemoveTarget : {
        params : (attacker : Entity, target : Entity) => ({ ev : GameEvent.Attack_RemoveTarget, attacker, target }),
        event : GameEvent.Attack_RemoveTarget
    },
    Map_Loaded : {
        params : (map : ClientMap) => ({ ev : GameEvent.Map_Loaded, map }),
        event : GameEvent.Map_Loaded
    }
}

type GameEventsType = typeof GameEvents[keyof typeof GameEvents];
type GameEventsParamsType = GameEventsType["params"];
export type GameEventsReturnType = ReturnType<GameEventsParamsType>;

export let isEvent = function<U extends GameEventsType> (params : GameEventsReturnType, t : U) : params is ReturnType<U["params"]> {
    return params.ev === t.event;
}