import * as _ from "underscore";
import { log } from './main';
import Mob from './mob';
import Npc from './npc';
import Player from './player';
import Item from './item';
import MobArea from './mobarea';
import ChestArea from './chestarea';
import Chest from './chest';
import * as Properties from "./properties";
import Entity from "./entity";
import Character from "./character";
import UEvent from "./uevent";
import * as fs from "fs";

import { socketIOServer } from "./ws";

import * as Messages from "@common/messageTypes";
import Types from "@common/gametypes";
import * as Utils from "@common/utils";
import { getRandomPositionInArea } from "@common/position";
import { ServerMap } from "@common/GameMap";
// import { stardustAPI } from "@common/Stardust/api";
// const StardustAPI = stardustAPI(process.env.GAME_API);

const mintQueue: Array<any> = [];

setInterval(() => {
  if (mintQueue.length === 0) return;
  const top = mintQueue.shift();
  const { mintData, callback } = top;
  mintData.timestamp = Date.now();
  callback();
  // StardustAPI.setters.token.mint(mintData, process.env.WALLET_PRIV)
  //   .then(callback)
  //   .catch(err => console.log(err.message));
}, 1000);

// ======= GAME SERVER ========

export default class World {

  playerCount: number;
  itemCount: number;
  server: socketIOServer;
  map: ServerMap;
  id: string;
  maxPlayers: number;
  ups: number;

  entities: { [index: number]: Entity };

  chestAreas: ChestArea[];
  mobAreas: MobArea[];

  players: { [index: number]: Player };
  mobs: { [index: number]: Mob };
  //attackers = {};
  items: { [index: number]: Item };
  //equipping = {};
  //hurt = {};
  npcs: { [index: number]: Npc };
  outgoingQueues: { [index: number]: Messages.Types[] };

  zoneGroupsReady: boolean;


  groups: { [pos: string]: { entities: { [entityId: number]: Entity }, players: number[], incoming: Entity[] } };

  added_callback: () => void;
  regen_callback: () => void;
  init_callback: () => void; // TODO: Unused
  enter_callback: (p: Player) => void;
  attack_callback: (c: Character) => void;

  /**
   * Raised when a player connects to the server.
   * 
   * @type {UEvent<{(player : Player) : void}>}
   * @memberof World
   */
  ConnectEvent: UEvent<{ (player: Player): void }> = new UEvent();
  /**
   * Raised when a player leaves the game.
   * 
   * @type {UEvent<{() : void}>}
   * @memberof World
   */
  RemovedEvent: UEvent<{ (): void }> = new UEvent();

  constructor(id: string, maxPlayers: number, websocketServer: socketIOServer) {
    let self = this;

    this.id = id;
    this.maxPlayers = maxPlayers;
    this.server = websocketServer;
    this.ups = 50;

    this.map = null;

    this.entities = {};
    this.players = {};
    this.mobs = {};
    //this.attackers = {};
    this.items = {};
    //this.equipping = {};
    //this.hurt = {};
    this.npcs = {};
    this.mobAreas = [];
    this.chestAreas = [];
    this.groups = {};

    this.outgoingQueues = {};

    this.itemCount = 0;
    this.playerCount = 0;

    this.zoneGroupsReady = false;

    this.ConnectEvent.Add(function (player: Player) {
      player.onRequestPosition(function () {
        if (player.lastCheckpoint) {
          return getRandomPositionInArea(player.lastCheckpoint);
        }
        else {
          return self.map.getRandomStartingPosition();
        }
      });
    }, this);

    this.onPlayerEnter(function (player: Player) {
      log.info(player.name + " has joined " + self.id);

      if (!player.hasEnteredGame) {
        self.incrementPlayerCount();
      }

      // Number of players in this world
      // and in the overall server world
      //self.pushToPlayer(player, new Messages.Population(self.playerCount, self.server.connectionsCount()));
      self.updatePopulation();

      self.pushRelevantEntityListTo(player);

      let move_callback = function (x: number, y: number) {
        log.debug(player.name + " is moving to (" + x + ", " + y + ").");

        player.forEachAttacker(function (mob: Mob) {
          let target = self.getEntityById(mob.target);
          if (target) {
            let pos = self.findPositionNextTo(mob, target);
            if (mob.distanceToSpawningPoint(pos.x, pos.y) > 50) {
              mob.clearTarget();
              mob.forgetEveryone();
              player.removeAttacker(mob);
            } else {
              self.moveEntity(mob, pos.x, pos.y);
            }
          }
        });
      };

      player.onMove(move_callback);
      player.onLootMove(move_callback);

      player.onZone(function () {
        let hasChangedGroups = self.handleEntityGroupMembership(player);

        if (hasChangedGroups) {
          self.pushToPreviousGroups(player, [
            Types.Messages.DESTROY,
            player.id
          ]);
          self.pushRelevantEntityListTo(player);
        }
      });

      player.onBroadcast(function (message: Messages.Types, ignoreSelf: boolean) {
        self.pushToAdjacentGroups(player.group, message, ignoreSelf ? player.id : null);
      });

      player.onBroadcastToZone(function (message: Messages.Types, ignoreSelf: boolean) {
        self.pushToGroup(player.group, message, ignoreSelf ? player.id : null);
      });

      player.onExit(function () {
        log.info(player.name + " has left the game.");
        self.removePlayer(player);
        self.decrementPlayerCount();

        self.RemovedEvent.Raise();
      });

      if (self.added_callback) {
        self.added_callback();
      }
    });

    // Called when an entity is attacked by another entity
    this.onEntityAttack(function (attacker: Character) {
      let target = self.getEntityById(attacker.target);
      if (target && attacker.type === "mob") {
        let pos = self.findPositionNextTo(attacker, target);
        self.moveEntity(attacker, pos.x, pos.y);
      }
    });

    this.onRegenTick(function () {
      self.forEachCharacter(function (character: Character) {
        if (!character.hasFullHealth()) {
          character.regenHealthBy(Math.floor(character.maxHitPoints / 15));

          if (character.type === 'player') {
            self.pushToPlayer(<Player>character, character.getRegenMessage());
          }
        }
      });
    });
  }

  run(mapFilePath: string): void {
    let self = this;

    this.map = new ServerMap();
    this.map.filepath = mapFilePath;
    if (fs.lstatSync(mapFilePath).isFile()) {
      fs.readFile(mapFilePath, function (err, file) {
        let json = JSON.parse(file.toString());
        self.map.initMap(json, function (map) {
          self.initZoneGroups();

          // Populate all mob "roaming" areas
          _.each(map.mapInfo.roamingAreas, function (a) {
            let area = new MobArea(a.id, a.nb, a.type, a.x, a.y, a.width, a.height, self);
            area.spawnMobs();
            area.onEmpty(self.handleEmptyMobArea.bind(self, area));

            self.mobAreas.push(area);
          });

          // Create all chest areas
          _.each(map.mapInfo.chestAreas, function (a) {
            // TODO: a doesn't have id for chest area to use. What now?
            let area = new ChestArea(0, a.x, a.y, a.w, a.h, a.tx, a.ty, a.i, self);
            self.chestAreas.push(area);
            area.onEmpty(self.handleEmptyChestArea.bind(self, area));
          });

          // Spawn static chests
          _.each(map.mapInfo.staticChests, function (chest) {
            let c = self.createChest(chest.x, chest.y, chest.i);
            self.addStaticItem(c);
          });

          // Spawn static entities
          self.spawnStaticEntities();

          // Set maximum number of entities contained in each chest area
          _.each(self.chestAreas, function (area) {
            area.setNumberOfEntities(area.entities.length);
          });
        });
      });
    }
    else {
      log.alert(mapFilePath + " doesn't exist.");
    }

    let regenCount = this.ups * 2;
    let updateCount = 0;
    setInterval(function () {
      self.processGroups();
      self.processQueues();

      if (updateCount < regenCount) {
        updateCount += 1;
      }
      else {
        if (self.regen_callback) {
          self.regen_callback();
        }
        updateCount = 0;
      }
    }, 1000 / this.ups);

    log.info(`${this.id} created (capacity: ${this.maxPlayers} players).`);
  }

  setUpdatesPerSecond(ups: number): void {
    this.ups = ups;
  }

  onInit(callback: () => void): void {
    this.init_callback = callback;
  }

  onPlayerEnter(callback: (p: Player) => void): void {
    this.enter_callback = callback;
  }

  onPlayerAdded(callback: () => void): void {
    this.added_callback = callback;
  }

  onRegenTick(callback: () => void): void {
    this.regen_callback = callback;
  }

  pushRelevantEntityListTo(player: Player): void {
    let entities: string[];

    if (player && (player.group in this.groups)) {
      entities = _.keys(this.groups[player.group].entities);
      let entitiesIds = _.map(entities, function (id) { return parseInt(id); });
      entitiesIds = _.reject(entitiesIds, function (id) { return id == player.id; });
      if (entities) {
        this.pushToPlayer(player, [Types.Messages.LIST, entitiesIds]);
      }
    }
  }

  pushSpawnsToPlayer(player: Player, ids: number[]): void {
    let self = this;

    _.each(ids, function (id) {
      let entity = self.getEntityById(id);
      if (entity) {
        self.pushToPlayer(player, entity.getSpawnMessage());
      }
    });

    log.debug(`Pushed ${_.size(ids)} new spawns to ${player.id}`);
  }

  pushToPlayer(player: Player, message: Messages.Types): void {
    if (player && player.id in this.outgoingQueues) {
      this.outgoingQueues[player.id].push(message);
    }
    else {
      log.error("pushToPlayer: player was undefined");
    }
  }

  pushToGroup(groupId: string, message: Messages.Types, ignoredPlayer?: number) {
    let self = this,
      group = this.groups[groupId];

    if (group) {
      _.each(group.players, function (playerId) {
        if (playerId != ignoredPlayer) {
          self.pushToPlayer(<Player>self.getEntityById(playerId), message);
        }
      });
    } else {
      log.error("groupId: " + groupId + " is not a valid group");
    }
  }

  pushToAdjacentGroups(groupId: string, message: Messages.Types, ignoredPlayer?: number) {
    let self = this;
    self.map.forEachAdjacentGroup(groupId, function (id) {
      self.pushToGroup(id, message, ignoredPlayer);
    });
  }

  pushToPreviousGroups(player: Player, message: Messages.Types) {
    let self = this;

    // Push this message to all groups which are not going to be updated anymore,
    // since the player left them.
    _.each(player.recentlyLeftGroups, function (id) {
      self.pushToGroup(id, message);
    });
    player.recentlyLeftGroups = [];
  }

  pushBroadcast(message: Messages.Types, ignoredPlayer?: string) {
    for (let id in this.outgoingQueues) {
      if (id != ignoredPlayer) {
        this.outgoingQueues[id].push(message);
      }
    }
  }

  processQueues() {
    let connection;

    for (let id in this.outgoingQueues) {
      if (this.outgoingQueues[id].length > 0) {
        connection = this.server.getConnection(id);
        connection.send(this.outgoingQueues[id]);
        this.outgoingQueues[id] = [];
      }
    }
  }

  addEntity(entity: Entity) {
    this.entities[entity.id] = entity;
    this.handleEntityGroupMembership(entity);
  }

  removeEntity(entity: Entity) {
    if (entity.id in this.entities) {
      delete this.entities[entity.id];
    }
    if (entity.id in this.mobs) {
      delete this.mobs[entity.id];
    }
    if (entity.id in this.items) {
      delete this.items[entity.id];
    }

    if (entity.type === "mob") {
      this.clearMobAggroLink(<Mob>entity);
      this.clearMobHateLinks(<Mob>entity);
    }

    entity.destroy();
    this.removeFromGroups(entity);
    log.debug("Removed " + Types.getKindAsString(entity.kind) + " : " + entity.id);
  }

  addPlayer(player: Player) {
    this.addEntity(player);
    this.players[player.id] = player;
    this.outgoingQueues[player.id] = [];

    //log.info("Added player : " + player.id);
  }

  removePlayer(player: Player) {
    player.broadcast(player.getDespawnMessage());
    this.removeEntity(player);
    delete this.players[player.id];
    delete this.outgoingQueues[player.id];
  }

  addMob(mob: Mob) {
    this.addEntity(mob);
    this.mobs[mob.id] = mob;
  }

  addNpc(kind: Types.Entities, x: number, y: number) {
    let npc = new Npc('8' + x + '' + y, kind, x, y);
    this.addEntity(npc);
    this.npcs[npc.id] = npc;

    return npc;
  }

  addItem(item: Item) {
    this.addEntity(item);
    this.items[item.id] = item;

    return item;
  }

  createItem(kind: Types.Entities, x: number, y: number) {
    let id = '9' + this.itemCount++,
      item = null;

    if (kind === Types.Entities.Chest) {
      item = new Chest(id, x, y);
    }
    else {
      item = new Item(id, kind, x, y);
    }
    return item;
  }

  createChest(x: number, y: number, items: number[]) {
    let chest = <Chest>this.createItem(Types.Entities.Chest, x, y);
    chest.setItems(items);
    return chest;
  }

  addStaticItem(item: Item) {
    item.isStatic = true;
    item.onRespawn(this.addStaticItem.bind(this, item));
    if (
      (item.kind >= 20 && item.kind <= 26)
      || (item.kind >= 60 && item.kind <= 66)
    ) {
      const mintData = {
        gameAddr: process.env.gameAddr,
        tokenId: item.kind < 30 ? (item.kind - 20) : (item.kind - 60 + 7),
        to: process.env.WALLET_ADDR,
        amount: 1,
        timestamp: Date.now()
      };
      const self = this;
      item.isMint = false;
      mintQueue.push({
        mintData, callback: () => {
          item.isMint = true;
          self.addItem(item);
        }
      });
    }

    return;
  }

  addItemFromChest(kind: Types.Entities, x: number, y: number) {
    let item = this.createItem(kind, x, y);
    item.isFromChest = true;

    return this.addItem(item);
  }

  /**
   * The mob will no longer be registered as an attacker of its current target.
   */
  clearMobAggroLink(mob: Mob) {
    let player = null;
    if (mob.target) {
      player = this.getEntityById(mob.target);
      if (player) {
        (<Player>player).removeAttacker(mob);
      }
    }
  }

  clearMobHateLinks(mob: Mob) {
    let self = this;
    if (mob) {
      _.each(mob.hatelist, function (obj) {
        let player = self.getEntityById(obj.id);
        if (player) {
          (<Player>player).removeHater(mob);
        }
      });
    }
  }

  forEachEntity(callback: (e: Entity) => void) {
    for (let id in this.entities) {
      callback(this.entities[id]);
    }
  }

  forEachPlayer(callback: (p: Player) => void) {
    for (let id in this.players) {
      callback(this.players[id]);
    }
  }

  forEachMob(callback: (m: Mob) => void) {
    for (let id in this.mobs) {
      callback(this.mobs[id]);
    }
  }

  forEachCharacter(callback: (e: Entity) => void) {
    this.forEachPlayer(callback);
    this.forEachMob(callback);
  }

  handleMobHate(mobId: number, playerId: number, hatePoints: number) {
    let mob = <Mob>this.getEntityById(mobId);
    let player = <Player>this.getEntityById(playerId);

    if (player && mob) {
      mob.increaseHateFor(playerId, hatePoints);
      player.addHater(mob);

      if (mob.hitPoints > 0) { // only choose a target if still alive
        this.chooseMobTarget(mob);
      }
    }
  }

  chooseMobTarget(mob: Mob, hateRank?: number) {
    let player = <Player>this.getEntityById(mob.getHatedPlayerId(hateRank));

    // If the mob is not already attacking the player, create an attack link between them.
    if (player && !(mob.id in player.attackers)) {
      this.clearMobAggroLink(mob);

      player.addAttacker(mob);
      mob.setTarget(player);

      this.broadcastAttacker(mob);
      log.debug(mob.id + " is now attacking " + player.id);
    }
  }

  onEntityAttack(callback: (c: Character) => void) {
    this.attack_callback = callback;
  }

  getEntityById(id: number): Entity {
    if (id in this.entities) {
      return this.entities[id];
    }
    else {
      log.error("Unknown entity : " + id);
      return null
    }
  }

  getPlayerCount() {
    let count = 0;
    for (let p in this.players) {
      if (this.players.hasOwnProperty(p)) {
        count += 1;
      }
    }
    return count;
  }

  broadcastAttacker(character: Character) {
    if (character) {
      this.pushToAdjacentGroups(character.group, character.getAttackMessage(), character.id);
    }
    if (this.attack_callback) {
      this.attack_callback(character);
    }
  }

  /**
   * 
   * 
   * @param {Entity} entity - The hurt entity.
   * @param {Character} attacker - The attacking entity
   */
  handleHurtEntity(entity: Entity, attacker: Character, damage?: number) {
    if (entity.type === 'player') {
      // A player is only aware of his own hitpoints
      this.pushToPlayer(<Player>entity, (<Player>entity).getHealthMessage());
    }

    if (entity.type === 'mob') {
      // Let the mob's attacker (player) know how much damage was inflicted
      this.pushToPlayer(<Player>attacker, [
        Types.Messages.DAMAGE,
        entity.id,
        damage
      ]);
    }

    // If the entity is about to die
    if (entity.hitPoints <= 0) {
      if (entity.type === "mob") {
        let mob = <Mob>entity, item = this.getDroppedItem(mob);

        this.pushToPlayer(<Player>attacker, [
          Types.Messages.KILL,
          mob.kind
        ]);
        this.pushToAdjacentGroups(mob.group, mob.getDespawnMessage()); // Despawn must be enqueued before the item drop
        if (item) {
          this.pushToAdjacentGroups(mob.group, mob.getDropMessage(item));
          this.handleItemDespawn(item);
        }
      }

      if (entity.type === "player") {
        this.handlePlayerVanish(<Player>entity);
        this.pushToAdjacentGroups(entity.group, entity.getDespawnMessage());
      }

      this.removeEntity(entity);
    }
  }

  despawn(entity: Entity) {
    this.pushToAdjacentGroups(entity.group, entity.getDespawnMessage());

    if (entity.id in this.entities) {
      this.removeEntity(entity);
    }
  }

  spawnStaticEntities() {
    let self = this,
      count = 0;

    for (let tid in this.map.mapInfo.staticEntities) {
      let kindName = this.map.mapInfo.staticEntities[tid];
      let kind = Types.getKindFromString(kindName),
        pos = self.map.tileIndexToGridPosition(parseInt(tid));

      if (Types.isNpc(kind)) {
        self.addNpc(kind, pos.x + 1, pos.y);
      }
      if (Types.isMob(kind)) {
        let mob = new Mob('7' + kind + count++, kind, pos.x + 1, pos.y);
        mob.onRespawn(function () {
          mob.isDead = false;
          self.addMob(mob);
          if (mob.area && mob.area instanceof ChestArea) {
            mob.area.addToArea(mob);
          }
        });
        mob.onMove(self.onMobMoveCallback.bind(self));
        self.addMob(mob);
        self.tryAddingMobToChestArea(mob);
      }
      if (Types.isItem(kind)) {
        self.addStaticItem(self.createItem(kind, pos.x + 1, pos.y));
      }
    }
  }

  isValidPosition(x: number, y: number) {
    if (this.map && _.isNumber(x) && _.isNumber(y) && !this.map.isOutOfBounds(x, y) && !this.map.isColliding(x, y)) {
      return true;
    }
    return false;
  }

  handlePlayerVanish(player: Player) {
    let self = this, previousAttackers: Character[] = [];

    // When a player dies or teleports, all of his attackers go and attack their second most hated player.
    player.forEachAttacker(function (mob) {
      previousAttackers.push(mob);
      self.chooseMobTarget(<Mob>mob, 2);
    });

    _.each(previousAttackers, function (mob) {
      player.removeAttacker(mob);
      mob.clearTarget();
      (<Mob>mob).forgetPlayer(player.id, 1000);
    });

    this.handleEntityGroupMembership(player);
  }

  setPlayerCount(count: number) {
    this.playerCount = count;
  }

  incrementPlayerCount() {
    this.setPlayerCount(this.playerCount + 1);
  }

  decrementPlayerCount() {
    if (this.playerCount > 0) {
      this.setPlayerCount(this.playerCount - 1);
    }
  }

  getDroppedItem(mob: Mob) {
    let drops = Properties.getDrops(mob.kind),
      v = Utils.random(100),
      p = 0,
      item = null;

    for (let itemName in drops) {
      let percentage = drops[itemName];

      p += percentage;
      if (v <= p) {
        item = this.addItem(this.createItem(Types.getKindFromString(itemName), mob.x, mob.y));
        break;
      }
    }

    return item;
  }

  onMobMoveCallback(mob: Mob) {
    this.pushToAdjacentGroups(mob.group, [
      Types.Messages.MOVE,
      mob.id,
      mob.x,
      mob.y
    ]);
    this.handleEntityGroupMembership(mob);
  }

  findPositionNextTo(entity: Entity, target: Entity) {
    let valid = false,
      pos;

    while (!valid) {
      pos = entity.getPositionNextTo(target);
      valid = this.isValidPosition(pos.x, pos.y);
    }
    return pos;
  }

  initZoneGroups() {
    let self = this;

    this.map.forEachGroup(function (id) {
      self.groups[id] = {
        entities: {},
        players: [],
        incoming: []
      };
    });
    this.zoneGroupsReady = true;
  }

  removeFromGroups(entity: Entity) {
    let self = this, oldGroups: string[] = [];

    if (entity != null && entity.group) {
      let group = this.groups[entity.group];
      if (entity instanceof Player) {
        group.players = _.reject(group.players, function (id) {
          return id === entity.id;
        });
      }

      this.map.forEachAdjacentGroup(entity.group, function (id) {
        if (entity.id in self.groups[id].entities) {
          delete self.groups[id].entities[entity.id];
          oldGroups.push(id);
        }
      });
      entity.group = null;
    }
    return oldGroups;
  }

  /**
   * Registers an entity as "incoming" into several groups, meaning that it just entered them.
   * All players inside these groups will receive a Spawn message when WorldServer.processGroups is called.
   */
  addAsIncomingToGroup(entity: Entity, groupId: string) {
    let self = this,
      isChest = entity && entity instanceof Chest,
      isItem = entity && entity instanceof Item,
      isDroppedItem = entity && isItem && !(<Item>entity).isStatic && !(<Item>entity).isFromChest;

    if (entity && groupId) {
      this.map.forEachAdjacentGroup(groupId, function (id) {
        let group = self.groups[id];

        if (group) {
          if (!_.include(group.entities, entity.id)
            //  Items dropped off of mobs are handled differently via DROP messages. See handleHurtEntity.
            && (!isItem || isChest || (isItem && !isDroppedItem))) {
            group.incoming.push(entity);
          }
        }
      });
    }
  }

  addToGroup(entity: Entity, groupId: string) {
    let self = this,
      newGroups: string[] = [];

    if (entity && groupId && (groupId in this.groups)) {
      this.map.forEachAdjacentGroup(groupId, function (id) {
        self.groups[id].entities[entity.id] = entity;
        newGroups.push(id);
      });
      entity.group = groupId;

      if (entity instanceof Player) {
        this.groups[groupId].players.push(entity.id);
      }
    }
    return newGroups;
  }

  logGroupPlayers(groupId: string) {
    log.debug("Players inside group " + groupId + ":");
    let group = this.groups[groupId].players;
    for (let i = 0, len = group.length; i < len; ++i) {
      log.debug("- player " + group[i]);
    }
  }

  handleEntityGroupMembership(entity: Entity) {
    let hasChangedGroups = false;
    if (entity) {
      let groupId = this.map.getGroupIdFromPosition(entity.x, entity.y);
      if (!entity.group || (entity.group && entity.group !== groupId)) {
        hasChangedGroups = true;
        this.addAsIncomingToGroup(entity, groupId);
        let oldGroups = this.removeFromGroups(entity);
        let newGroups = this.addToGroup(entity, groupId);

        if (_.size(oldGroups) > 0) {
          entity.recentlyLeftGroups = _.difference(oldGroups, newGroups);
          log.debug("group diff: " + entity.recentlyLeftGroups);
        }
      }
    }
    return hasChangedGroups;
  }

  processGroups() {
    let self = this;

    if (this.zoneGroupsReady) {
      this.map.forEachGroup(function (id) {
        //let spawns = [];
        if (self.groups[id].incoming.length > 0) {
          //spawns = _.each(self.groups[id].incoming, function(entity) {
          _.each(self.groups[id].incoming, function (entity) {
            if (entity instanceof Player) {
              self.pushToGroup(id, entity.getSpawnMessage(), entity.id);
            }
            else {
              self.pushToGroup(id, entity.getSpawnMessage());
            }
          });
          self.groups[id].incoming = [];
        }
      });
    }
  }

  moveEntity(entity: Entity, x: number, y: number) {
    if (entity) {
      entity.setPosition(x, y);
      this.handleEntityGroupMembership(entity);
    }
  }

  handleItemDespawn(item: Item) {
    let self = this;

    if (item) {
      item.handleDespawn({
        beforeBlinkDelay: 10000,
        blinkCallback: function () {
          self.pushToAdjacentGroups(item.group, [
            Types.Messages.BLINK,
            item.id
          ]);
        },
        blinkingDuration: 4000,
        despawnCallback: function () {
          self.pushToAdjacentGroups(item.group, [
            Types.Messages.DESTROY,
            item.id
          ]);
          self.removeEntity(item);
        }
      });
    }
  }

  handleEmptyMobArea(area: MobArea) {

  }

  handleEmptyChestArea(area: ChestArea) {
    if (area) {
      let chest = this.addItem(this.createChest(area.chestX, area.chestY, area.items));
      this.handleItemDespawn(chest);
    }
  }

  handleOpenedChest(chest: Chest, player: Player) {
    this.pushToAdjacentGroups(chest.group, chest.getDespawnMessage());
    this.removeEntity(chest);

    let kind = chest.getRandomItem();
    if (kind) {
      let item = this.addItemFromChest(kind, chest.x, chest.y);
      this.handleItemDespawn(item);
    }
  }

  tryAddingMobToChestArea(mob: Mob) {
    _.each(this.chestAreas, function (area: ChestArea) {
      if (area.contains(mob)) {
        area.addToArea(mob);
      }
    });
  }

  /**
   * Add population message to the next broadcast.
   * 
   * @param {number} [totalPlayers] 
   * @memberof World
   */
  updatePopulation(totalPlayers?: number) {
    totalPlayers = totalPlayers ? totalPlayers : this.server.connectionsCount();

    log.info("Updating population: " + this.playerCount + " " + totalPlayers)
    this.pushBroadcast([
      Types.Messages.POPULATION,
      this.playerCount,
      totalPlayers
    ]);
  }
}
