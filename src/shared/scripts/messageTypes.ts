import GameTypes from "@common/gametypes";

/**
 * Message used for the client to know it's been connected to the server
 * and has received the player's information.
 * 
 * * [0] - The action identifier.
 * * [1] - The player's id.
 * * [2] - The player's username.
 * * [3] - The player's x position.
 * * [4] - The player's y position.
 * * [5] - The player's HP.
 */
export type Welcome = [GameTypes.Messages, number, string, number, number, number];

/**
 * Message used for the client to know the relevant entities.
 * 
 * * [0] - The action identifier.
 * * [1] - The ids of the relevant entities.
 */
export type List = [GameTypes.Messages, number[]];

/**
 * Message used for the client to know it's been connected to the server
 * and has received the player's information.
 * 
 * * [0] - The action identifier.
 * * [1] - The amount of players in the current world.
 * * [2] - The amount of players in all worlds.
 */
export type Population = [GameTypes.Messages, number, number];

/**
 * Message used for the client to know an entity has moved.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the entity that moved.
 * * [2] - The destination's x position.
 * * [3] - The destination's y position.
 */
export type Move = [GameTypes.Messages, number, number, number];

/**
 * Message used for the client to know an entity has moved to a
 * lootable item.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the entity that moved.
 * * [2] - The item's id.
 */
export type LootMove = [GameTypes.Messages, number, number];

/**
 * Message used for the client to know an entity has attacked
 * another entity.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the attacker entity.
 * * [2] - The id of the target entity.
 */
export type Attack = [GameTypes.Messages, number, number];

/**
 * Message used for the client to know an entity has spawned.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the spawning entity.
 * * [2] - The kind of the entity.
 * * [3] - The x position.
 * * [4] - The y position.
 * * [5] - The orientation, if is player or mob.
 * * [6] - The target, if any, if is player or mob.
 * * [7] - The name of the entity, if is player.
 * * [8] - The kind of armor, if is player.
 * * [9] - The kind of weapon, if is player.
 */
export type Spawn = [
    GameTypes.Messages, number, GameTypes.Entities, number, number,
    [GameTypes.Orientations, number | undefined, string, GameTypes.Entities, GameTypes.Entities] |
    [GameTypes.Orientations, number | undefined] | undefined
];

/**
 * Type guard to check if message is about a player.
 * @param s The spawn message.
 */
export function isPlayerSpawn (s : Spawn) : s is [
    GameTypes.Messages, number, GameTypes.Entities, number, number,
    [GameTypes.Orientations, number | undefined, string, GameTypes.Entities, GameTypes.Entities]] {
        return GameTypes.isPlayer(s[2]);
}

/**
 * Type guard to check if message is about a mob.
 * @param s The spawn message.
 */
export function isMobSpawn (s : Spawn) : s is [
    GameTypes.Messages, number, GameTypes.Entities, number, number,
    [GameTypes.Orientations, number | undefined]] {
        return GameTypes.isMob(s[2]);
}

/**
 * Message used for the client to know an entity has despawned.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the despawning entity.
 */
export type Despawn = [GameTypes.Messages, number];

/**
 * Message used for the client to know an entity has changed its
 * amount of health.
 * 
 * * [0] - The action identifier.
 * * [1] - The updated hit points of the entity.
 * * [2] - Whether it was regen or not.
 */
export type Health = [GameTypes.Messages, number, boolean];

/**
 * Message used for the client to know an entity has spawned.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the chatting entity.
 * * [2] - The chat message.
 */
export type Chat = [GameTypes.Messages, number, string];

/**
 * Message used for the client to know an entity has successfully
 * looted an item so it can be equipped.
 * 
 * When a player loots an armor or weapon item, it isn't instantly
 * switched. Instead, the Loot Message is sent to the server, and
 * this is the reply.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the entity.
 * * [2] - The kind of the item.
 */
export type EquipItem = [GameTypes.Messages, number, GameTypes.Entities];

/**
 * Message used for the client to know an item was dropped by an
 * entity.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the mob that dropped the item.
 * * [2] - The id of the item.
 * * [3] - The kind of the item.
 * * [4] - The ids of the players involved in the drop.
 */
export type Drop = [GameTypes.Messages, number, number, GameTypes.Entities, number[]];

/**
 * Message used for the client to know an entity has teleported.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the entity.
 * * [2] - The destination position's x.
 * * [3] - The destination position's y.
 */
export type Teleport = [GameTypes.Messages, number, number, number];

/**
 * Message used for the client to know an entity has taken
 * damage.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the entity that was damaged.
 * * [2] - The damage received.
 */
export type Damage = [GameTypes.Messages, number, number];

/**
 * Message used for the client to know the player has killed an
 * entity.
 * 
 * * [0] - The action identifier.
 * * [1] - The kind of the killed entity.
 */
export type Kill = [GameTypes.Messages, GameTypes.Entities];

/**
 * Message used for the client to know an entity was destroyed.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the entity that was destroyed.
 */
export type Destroy = [GameTypes.Messages, number];

/**
 * Message used for the client to know its player's max health.
 * 
 * * [0] - The action identifier.
 * * [1] - The updated amount of max health of the player.
 */
export type HitPoints = [GameTypes.Messages, number];

/**
 * Message used for the client to know an item has 
 * started blinking.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the item.
 */
export type Blink = [GameTypes.Messages, number];

/**
 * Message used for the server to know the user has requested
 * the start of the game with given information.
 * 
 * * [0] - The action identifier.
 * * [1] - The player's username.
 * * [2] - The kind of the player's current armor.
 * * [3] - The kind of the player's current weapon.
 */
export type ClientHello = [GameTypes.Messages, string, GameTypes.Entities, GameTypes.Entities];

/**
 * Message used for the server to know the user has moved to a
 * destination.
 * 
 * * [0] - The action identifier.
 * * [1] - The destination position's x.
 * * [2] - The destination position's y.
 */
export type ClientMove = [GameTypes.Messages, number, number];

/**
 * Message used for the server to know the user has moved to a
 * lootable item.
 * 
 * * [0] - The action identifier.
 * * [1] - The destination position's x.
 * * [2] - The destination position's y.
 * * [3] - The id of the item.
 */
export type ClientLootMove = [GameTypes.Messages, number, number, number];

/**
 * Message used for the server to know the player has aggroed
 * an enemy.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the enemy.
 */
export type ClientAggro = [GameTypes.Messages, number];

/**
 * Message used for the server to know the user has created
 * an attack link with a mob.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the mob being attacked.
 */
export type ClientAttack = [GameTypes.Messages, number];

/**
 * Message used for the server to know the user has requested
 * the start of the game with given information.
 * 
 * * [0] - The action identifier.
 * * [1] - The player's target's id.
 */
export type ClientHit = [GameTypes.Messages, number];

/**
 * Message used for the server to know an entity (mob) was hurt.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the entity.
 */
export type ClientHurt = [GameTypes.Messages, number];

/**
 * Message used for the server to know the player has used the
 * chat to say something.
 * 
 * * [0] - The action identifier.
 * * [1] - The chat's message.
 */
export type ClientChat = [GameTypes.Messages, string];

/**
 * Message used for the server to know the player has looted
 * an item.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the item.
 */
export type ClientLoot = [GameTypes.Messages, number];

/**
 * Message used for the server to know the player has used a
 * teleporter.
 * 
 * * [0] - The action identifier.
 * * [1] - The destination position's x.
 * * [2] - The destination position's y.
 */
export type ClientTeleport = [GameTypes.Messages, number, number];

/**
 * Message used for the server to send information about
 * given entities.
 * 
 * * [0] - The action identifier.
 * * [1] - The ids of the entities.
 */
export type ClientWho = [GameTypes.Messages, number[]];

/**
 * Message used for the server to know the player has reached a
 * different zone and needs updated information.
 * 
 * * [0] - The action identifier.
 */
export type ClientZone = [GameTypes.Messages];

/**
 * Message used for the server to know the player has requested
 * to open a chest.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the chest.
 */
export type ClientOpen = [GameTypes.Messages, number];

/**
 * Message used for the server to know the player has triggered
 * a checkpoint.
 * 
 * * [0] - The action identifier.
 * * [1] - The id of the checkpoint.
 */
export type ClientCheck = [GameTypes.Messages, number];

export type Types = Welcome | List | Population | Move | LootMove
    | Attack | Spawn | Despawn | Health | Chat | EquipItem | Drop | Teleport | Damage
    | Kill | Destroy | HitPoints | Blink | ClientHello | ClientMove | ClientLootMove
    | ClientAggro | ClientAttack | ClientHit | ClientHurt | ClientChat | ClientLoot
    | ClientTeleport | ClientWho | ClientZone | ClientOpen | ClientCheck;
























