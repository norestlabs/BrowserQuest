import { System, registerSystem, SystemOrder} from "@engine/System";
import {Position2D} from "@common/position";
import GameTypes from "@common/gametypes";
import Entity from "@engine/Entity";
import * as Graphics from "@lib/Graphics";
import { BroadcastEvent } from "@engine/ecs";
import * as Components from "@components/Components";
import config from "@utils/config";
import * as _ from "underscore";
import EntityManager, {EntityFactory} from "@engine/EntityManager";
import {Node} from "@lib/DoublyLinkedList";
import * as GameState from "@lib/GameState";
import * as App from "@lib/App";
import * as Logger from "@lib/Logger";
import * as Messages from "@common/messageTypes";
import { GameEvents, isEvent} from "@lib/GameEvents";

export default class ClientSystem implements System {

    s_name = "ClientSystem";
    enabled = true;

    public awake () : void {
        this.initHandlers();
    }

    private initHandlers () : void {
        let client = EntityManager.getEntityWithTag("Game").getComponent(Components.Client);
        client.handlers[GameTypes.Messages.WELCOME] = this.receiveWelcome;
        client.handlers[GameTypes.Messages.MOVE] = this.receiveMove;
        client.handlers[GameTypes.Messages.LOOTMOVE] = this.receiveLootMove;
        client.handlers[GameTypes.Messages.ATTACK] = this.receiveAttack;
        client.handlers[GameTypes.Messages.SPAWN] = this.receiveSpawn;
        client.handlers[GameTypes.Messages.DESPAWN] = this.receiveDespawn;
        //this.handlers[Types.Messages.SPAWN_BATCH] = this.receiveSpawnBatch;
        client.handlers[GameTypes.Messages.HEALTH] = this.receiveHealth;
        client.handlers[GameTypes.Messages.CHAT] = this.receiveChat;
        client.handlers[GameTypes.Messages.EQUIP] = this.receiveEquipItem;
        client.handlers[GameTypes.Messages.DROP] = this.receiveDrop;
        client.handlers[GameTypes.Messages.TELEPORT] = this.receiveTeleport;
        client.handlers[GameTypes.Messages.DAMAGE] = this.receiveDamage;
        client.handlers[GameTypes.Messages.POPULATION] = this.receivePopulation;
        client.handlers[GameTypes.Messages.LIST] = this.receiveList;
        client.handlers[GameTypes.Messages.DESTROY] = this.receiveDestroy;
        client.handlers[GameTypes.Messages.KILL] = this.receiveKill;
        client.handlers[GameTypes.Messages.HP] = this.receiveHitPoints;
        client.handlers[GameTypes.Messages.BLINK] = this.receiveBlink;
    }

    private getEntityWithIdentifiable (id : number) : Entity | null {
        let entities = EntityManager.getEntitiesWithComponent(Components.Identifiable);
        let current : Node<number> = entities.First;
        while (current != null) {
            let entity = EntityManager.getEntityWithID(current.value);
            if (entity !== null && entity.getComponent(Components.Identifiable).id === id)
                return entity;
            current = current.next;
        }

        return null;
    }

    private receiveMessage (message : (string | Messages.Types | Messages.Types[])) : void {
        if (EntityManager.getEntityWithTag("Game").getComponent(Components.Client).isListening) {
            Logger.log("data: " + message, Logger.LogType.Debug);

            if (message instanceof Array) {
                if (message[0] instanceof Array) {
                    // Multiple actions received
                    this.receiveActionBatch(<Messages.Types[]>message);
                }
                else {
                    // Only one action received
                    this.receiveAction(<Messages.Types>message);
                }
            }
        }
    }

    /**
     * Processes the received action.
     * Action can be:
     * -  [Types.Messages, ...]
     */
    private receiveAction (data : Messages.Types) : void {
        let client = EntityManager.getEntityWithTag("Game").getComponent(Components.Client);
        let action = <number>data[0];
        if (client.handlers[action] && _.isFunction(client.handlers[action])) {
            client.handlers[action].call(this, data);
        }
        else {
            Logger.log("Unknown action : " + action, Logger.LogType.Error);
        }
    }

    private receiveActionBatch (actions : Messages.Types[]) : void {
        for (let i = 0, len = actions.length; i < len; ++i) {
            let action = actions[i];
            this.receiveAction(action);
        }
    }

    private receiveWelcome (data : Messages.Welcome) : void {
        let id = data[1], name = data[2], x = data[3], y = data[4], hp = data[5];

        this.onWelcome(id, name, x, y, hp);
    }

    private receiveMove (data : Messages.Move) : void {
        let id = data[1], x = data[2], y = data[3];
            
        let entity = null;

        if (id !== EntityManager.getEntityWithTag("Game").getComponent(Components.Client).playerId) {
            entity = this.getEntityWithIdentifiable(id);
            if (entity) {
                BroadcastEvent(GameEvents.Client_Moved.params(entity, { x, y }));
            }
        }
    }

    private receiveLootMove (data : Messages.LootMove) : void {
        let id = data[1], itemId = data[2];
        
        let player : Entity, item : Entity;

        if (id !== EntityManager.getEntityWithTag("Game").getComponent(Components.Client).playerId) {
            player = this.getEntityWithIdentifiable(id);
            item = this.getEntityWithIdentifiable(itemId);

            if (player && item) {
                BroadcastEvent(GameEvents.Client_LootMove.params(player, item));
            }
        }
    }

    private receiveAttack (data : Messages.Attack) : void {
        let attacker = data[1], target = data[2];

        BroadcastEvent(GameEvents.Client_Attack.params(this.getEntityWithIdentifiable(attacker), this.getEntityWithIdentifiable(target)));
    }

    private receiveSpawn (data : Messages.Spawn) : void {
        let id = data[1], kind = data[2], x = data[3], y = data[4];

        // Check if id already exists
        let entities = EntityManager.getEntitiesWithComponent(Components.Identifiable), identifiable : Components.Identifiable;
        let current : Node<number> = entities.First;
        while (current != null) {
            let entity = EntityManager.getEntityWithID(current.value);
            if (entity !== null) {
                identifiable = entity.getComponent(Components.Identifiable);
                if (identifiable.id === id) {
                    // log
                    Logger.log("This entity already exists : " + identifiable.id + " (" + identifiable.kind + ")", Logger.LogType.Debug);
                    return;
                }
            }
            current = current.next;
        }
    
        if (GameTypes.isItem(kind)) {
            let item = EntityManager.createEntityFromLoadedPrefab(GameTypes.getEntityKindAsString(kind), null, kind, id);
            Logger.log("Spawned " + GameTypes.getKindAsString(kind) + " (" + id + ") at " + x + ", " + y, Logger.LogType.Info);
            this.addItem(item, x, y);
        }
        else if (GameTypes.isChest(kind)) {
            let chest = EntityManager.createEntityFromLoadedPrefab("Chest", null, kind, id);

            Logger.log("Spawned chest (" + chest.getComponent(Components.Identifiable).id + ") at " + x + ", " + y, Logger.LogType.Info);
            chest.getComponent(Components.SpriteRenderable).setSprite(Graphics.sprites["chest"]);
            chest.getComponent(Components.Transform).GridPosition = new Position2D(x, y);
            BroadcastEvent(GameEvents.Entity_Added.params(chest, null));
        }
        else {
            let name : string, orientation : GameTypes.Orientations;
            let target : number, weapon : number, armor : number;
        
            if (Messages.isPlayerSpawn(data)) {
                let d = data[5];
                orientation = d[0];
                target = d[1];
                name = d[2];
                armor = d[3];
                weapon = d[4];
            }
            else if (Messages.isMobSpawn(data)) {
                let d = data[5];
                orientation = d[0];
                target = d[1];
            }

            let character = EntityManager.createEntityFromLoadedPrefab(GameTypes.getEntityKindAsString(kind), null, kind, id, name);
        
            if (GameTypes.isPlayer(kind)) {
                let equipment = character.getComponent(Components.Equipment);
                equipment.weaponName = GameTypes.getKindAsString(weapon);
                equipment.armorName = GameTypes.getKindAsString(armor);
            }

            this.onSpawnedCharacter(character, x, y, orientation, target);
        }
    }

    /**
     * Called when an item is dropped/spawned in the world.
     * @param item Created item.
     * @param x Position's x value.
     * @param y Position's y value.
     */
    private addItem (item : Entity, x : number, y : number) : void {
        let identifiable = item.getComponent(Components.Identifiable);
        let transform = item.getComponent(Components.Transform);
        let spriteRenderer = item.getComponent(Components.SpriteRenderable);

        spriteRenderer.setSprite(Graphics.sprites[identifiable.defaultSpriteName]);
        transform.GridPosition = new Position2D(x, y);
        transform.Orientation = GameTypes.Orientations.None;

        BroadcastEvent(GameEvents.Entity_Added.params(item, null));
    }

    private receiveDespawn (data : Messages.Despawn) : void {
        let id = data[1];

        let entity = this.getEntityWithIdentifiable(id);

        if (entity) {
            let identifiable = entity.getComponent(Components.Identifiable);
            let transform = entity.getComponent(Components.Transform);
            Logger.log("Despawning " + GameTypes.getKindAsString(identifiable.kind) + " (" + identifiable.id+ ")", Logger.LogType.Info);

            let mouseInput = EntityManager.getEntityWithTag("Mouse").getComponent(Components.MouseInput);
            if (transform.GridPosition.equals(mouseInput.previousClickPosition)) {
                mouseInput.previousClickPosition = new Position2D(undefined, undefined);
            }

            if (identifiable.isCharacter) {
                let health = entity.getComponent(Components.Health);
                health.die();
                BroadcastEvent(GameEvents.Character_Death.params(entity));
            }
            else if (identifiable.isChest) {
                BroadcastEvent(GameEvents.Client_ChestOpened.params(entity));
            }

            this.cleanEntity(entity);

            BroadcastEvent(GameEvents.Client_OnDespawn.params(entity));
        }
    }

    private cleanEntity (e : Entity) : void {
        let blink = e.getComponent(Components.Blink);
        if (blink) {
            blink.stop();
        }
        let visible = e.getComponent(Components.Visible);
        if (visible) {
            visible.enabled = true;
        }
    }

    private receiveHealth (data : Messages.Health) : void {
        let points = data[1], isRegen = data[2];

        let player = EntityManager.getEntityWithTag("Player"), diff = 0, isHurt = false;
        let health = player.getComponent(Components.Health);
        let invincible = player.getComponent(Components.Invincible);
        let canBeHurt = !health.isDead && !invincible.enabled;

        if (canBeHurt) {
            isHurt = points <= health.hp;
            diff = points - health.hp;
        }

        BroadcastEvent(GameEvents.Client_HealthChanged.params(player, points, isRegen, isHurt, diff, canBeHurt));
        
        if (canBeHurt) {
            health.hp = points;

            if (health.hp <= 0) {
                health.die();
                BroadcastEvent(GameEvents.Character_Death.params(player));
            }
            if (isHurt) {
                player.getComponent(Components.Attackable).startHurt();
                player.getComponent(Components.HurtSpriteRenderable).enabled = true;
            }
        }
    }

    private receiveChat (data : Messages.Chat) : void {
        let id = data[1], text = data[2];

        let character = this.getEntityWithIdentifiable(id);
        let talkable = character.getComponent(Components.Talkable);
        talkable.message = text;
        talkable.time = 5000;
        BroadcastEvent(GameEvents.Client_Chat.params(character, text));
    }

    /**
     * When the player loots an armor or weapon item, it isn't instantly switched.
     * Instead, a "Loot" message is sent to the server.
     * Then, the server replies with "EquipItem" message.
     * 
     * @param {((number | string)[])} data 
     * @memberof GameClient
     */
    private receiveEquipItem (data : Messages.EquipItem) : void {
        let id = data[1], itemKind = data[2];
    
        let player = this.getEntityWithIdentifiable(id),
        itemName = GameTypes.getKindAsString(itemKind);

        if (player) {
            if (GameTypes.isArmor(itemKind)) {
                player.getComponent(Components.Equipment).setArmor(itemName);
                player.getComponent(Components.SpriteRenderable).setSprite(Graphics.sprites[itemName]);
            } else if (GameTypes.isWeapon(itemKind)) {
                player.getComponent(Components.Equipment).setWeapon(itemName);
                player.getChild("Weapon").getComponent(Components.SpriteRenderable).setSprite(Graphics.sprites[itemName]);
            }
            BroadcastEvent(GameEvents.Client_Equip.params(player, itemKind));
        }
    }

    private getDeadMobPosition (mobId : number) : Position2D {
        let position : Position2D;

        let grids = EntityManager.getEntityWithTag("Game").getComponent(Components.EntityGrids);
        if (mobId in grids.deathpositions) {
            position = grids.deathpositions[mobId];
            delete grids.deathpositions[mobId];
        }

        return position;
    }

    private receiveDrop (data : Messages.Drop) : void {
        let mobId = data[1], id = data[2], kind = data[3];
    
        let item = EntityManager.createEntityFromLoadedPrefab(GameTypes.getEntityKindAsString(kind), null, kind, id);
        let lootable = item.getComponent(Components.Lootable);
        lootable.wasDropped = true;
        lootable.playersInvolved = data[4];

        let pos = this.getDeadMobPosition(mobId);

        if (pos) {
            this.addItem(item, pos.x, pos.y);
            BroadcastEvent(GameEvents.Client_OnDroppedItem.params(item, mobId));
        }
    }

    private receiveTeleport (data : Messages.Teleport) : void {
        let id = data[1], x = data[2], y = data[3];

        let entity : Entity = null;
        let game = EntityManager.getEntityWithTag("Game");

        if (id !== game.getComponent(Components.Client).playerId) {
            entity = this.getEntityWithIdentifiable(id);

            if (entity != null) {
                BroadcastEvent(GameEvents.Character_Teleport.params(entity, { x, y }));
            }
        }
    }

    private receiveDamage (data : Messages.Damage) : void {
        let id = data[1], dmg = data[2];
    
        let mob = this.getEntityWithIdentifiable(id);
        if (mob != null && dmg) {
            BroadcastEvent(GameEvents.Client_ReceiveDamage.params(mob, dmg));
            // Doesn't happen in original
            //mob.GetComponent(Components.HurtSpriteRenderable).enabled = true;
            //mob.GetComponent(Components.Attackable).startHurt();
        }
    }

    private receivePopulation (data : Messages.Population) : void {
        let worldPlayers = data[1], totalPlayers = data[2];
        BroadcastEvent(GameEvents.Client_PopulationChanged.params(worldPlayers, totalPlayers));
    }

    private receiveKill (data : Messages.Kill) : void {
        let mobKind = data[1];

        let mobName = GameTypes.getKindAsString(mobKind);

        if (mobName === 'skeleton2') {
            mobName = 'greater skeleton';
        }

        if (mobName === 'eye') {
            mobName = 'evil eye';
        }

        if (mobName === 'deathknight') {
            mobName = 'death knight';
        }

        if (mobName === 'boss') {
            App.showMessage("You killed the skeleton king");
        }
        else {
            if (_.include(['a', 'e', 'i', 'o', 'u'], mobName[0])) {
                App.showMessage("You killed an " + mobName);
            }
            else {
                App.showMessage("You killed a " + mobName);
            }
        }

        BroadcastEvent(GameEvents.Client_CharacterKilled.params(mobKind));
    }

    private receiveList (data : Messages.List) : void {
        let game = EntityManager.getEntityWithTag("Game");
        if (GameState.currentStatus >= GameState.Status.Connecting) {
            let receivedIds = data[1];
            let knownIds = [], newIds;

            let entities = EntityManager.getEntitiesWithComponent(Components.Identifiable);
            let current : Node<number> = entities.First;
            while (current != null) {
                let entity = EntityManager.getEntityWithID(current.value);
                let identifiable = entity.getComponent(Components.Identifiable);
                if (_.contains(receivedIds, identifiable.id)) {
                    knownIds.push(identifiable.id);
                }
                current = current.next;
            }

            //knownIds = _.intersection(entityIds, data), newIds = _.difference(data, knownIds);
            newIds = _.difference(receivedIds, knownIds);
            let client = game.getComponent(Components.Client);
            client.obsoleteEntities = [];
            current = entities.First;
            while (current != null) {
                // If it's known or player, isn't obsolete
                let entity = EntityManager.getEntityWithID(current.value);
                let identifiable = entity.getComponent(Components.Identifiable);
                if (entity.name !== "Player" && !_.include(knownIds, identifiable.id)) {
                    client.obsoleteEntities.push(entity.id);
                }
                current = current.next;
            }

            // Destroy entities outside of the player's zone group
            this.removeObsoleteEntities();

            // Ask the server for spawn logrmation about unknown entities
            if (_.size(newIds) > 0) {
                this.sendWho(<number[]>newIds);
            }
        }
    }

    private removeObsoleteEntities () : void {
        let client = EntityManager.getEntityWithTag("Game").getComponent(Components.Client);
        let nb = _.size(client.obsoleteEntities);

        if (nb > 0) {
            _.each(client.obsoleteEntities, function(id) {
                let entity = EntityManager.getEntityWithID(id);
                if (entity.name != "Player") { // never remove yourself
                    BroadcastEvent(GameEvents.Client_OnObsolete.params(entity));
                }
            });

            Logger.log("Removed " + nb + " obsolete entities.", Logger.LogType.Debug);
            client.obsoleteEntities = null;
        }
    }

    private receiveDestroy (data : Messages.Destroy) : void {
        let id = data[1];

        let entity = this.getEntityWithIdentifiable(id);
        if (entity != null) {
            BroadcastEvent(GameEvents.Client_Destroy.params(entity));
            Logger.log("Entity was destroyed: " + id, Logger.LogType.Debug);
        }
    }

    private receiveHitPoints (data : Messages.HitPoints) : void {
        let player = EntityManager.getEntityWithTag("Player");
        if (player !== null) {
            let maxHp = data[1];
            let health = player.getComponent(Components.Health);
            BroadcastEvent(GameEvents.Client_HitPoints.params(player, maxHp));
            health.setmaxHitPoints(maxHp);
        }
        else {
            //Logger.log
        }
    }

    private receiveBlink (data : Messages.Blink) : void {
        let id = data[1];
        
        let item = this.getEntityWithIdentifiable(id);

        if (item) {
            // As the server will handle the destruction of this item,
            // we don't need to set the count of the blink
            let blink = item.getComponent(Components.Blink);
            if (blink !== null)
                blink.start(150);
            else Logger.log(`${item.toString()} received blink from server, but doesn't have Blink component.`, Logger.LogType.Error);
        }
    }

    private sendMessage (json : any[]) : void {
        let client = EntityManager.getEntityWithTag("Game").getComponent(Components.Client);
        if (client.connection.connected) {
            client.connection.emit("message", json);
        }
    }

    private sendHello (player : Entity) : void {
        let equipment = player.getComponent(Components.Equipment);
        let message : Messages.ClientHello = [
            GameTypes.Messages.HELLO,
            player.getComponent(Components.Identifiable).name,
            player.getComponent(Components.Identifiable).addr,
            GameTypes.getKindFromString(equipment.armorName),
            GameTypes.getKindFromString(equipment.weaponName)
        ];
        this.sendMessage(message);
    }

    private sendMove (x : number, y : number) : void {
        let message : Messages.ClientMove = [GameTypes.Messages.MOVE, x, y];
        this.sendMessage(message);
    }

    private sendLootMove (item : Entity, x : number, y : number) : void {
        let message : Messages.ClientLootMove = [
            GameTypes.Messages.LOOTMOVE, x, y,
            item.getComponent(Components.Identifiable).id
        ];
        this.sendMessage(message);
    }

    private sendAggro (mob : Entity) : void {
        let message : Messages.ClientAggro = [
            GameTypes.Messages.AGGRO,
            mob.getComponent(Components.Identifiable).id
        ];
        this.sendMessage(message);
    }

    private sendAttack (mob : Entity) : void {
        let message : Messages.ClientAttack = [
            GameTypes.Messages.ATTACK,
            mob.getComponent(Components.Identifiable).id
        ];
        this.sendMessage(message);
    }

    private sendHit (id : number) : void {
        let message : Messages.ClientHit = [GameTypes.Messages.HIT, id];
        this.sendMessage(message);
    }

    private sendHurt (mob : Entity) : void {
        let message : Messages.ClientHurt = [
            GameTypes.Messages.HURT,
            mob.getComponent(Components.Identifiable).id
        ];
        this.sendMessage(message);
    }

    private sendChat (text : string) : void {
        let message : Messages.ClientChat = [
            GameTypes.Messages.CHAT, text
        ];
        this.sendMessage(message);
    }

    private sendLoot (item : Entity) : void {
        let message : Messages.ClientLoot = [
            GameTypes.Messages.LOOT,
            item.getComponent(Components.Identifiable).id
        ];
        this.sendMessage(message);
    }

    private sendTeleport (x : number, y : number) : void {
        let message : Messages.ClientTeleport = [
            GameTypes.Messages.TELEPORT, x, y
        ];
        this.sendMessage(message);
    }

    private sendWho (ids : number[]) : void {
        let message : Messages.ClientWho = [
            GameTypes.Messages.WHO, ids
        ]
        this.sendMessage(message);
    }

    private sendZone () : void {
        let message : Messages.ClientZone = [GameTypes.Messages.ZONE];
        this.sendMessage(message);
    }

    private sendOpen (chest : Entity) : void {
        let message : Messages.ClientOpen = [
            GameTypes.Messages.OPEN,
            chest.getComponent(Components.Identifiable).id
        ];
        this.sendMessage(message);
    }

    private sendCheck (id : number) : void {
        let message : Messages.ClientCheck = [
            GameTypes.Messages.CHECK, id
        ];
        this.sendMessage(message);
    }

    /**
     * Connects to the server, setting up all required
     * callbacks of the client and the player.
     * 
     * @memberof Game
     */
    private connect (username : string, addr : string) : void {
        let connecting = false; // always in dispatcher mode in the build version
        GameState.setCurrentStatus(GameState.Status.Connecting);

        let client = EntityManager.getFirstComponent(Components.Client);
        let optionsSet = false;

        // Set server options 
        //>>includeStart("devHost", pragmas.devHost);
        if (config.local) {
            Logger.log("Starting game with local dev config.", Logger.LogType.Debug);
            client.setServerOptions(config.local.host, config.local.port, username, addr);
        }
        else {
            Logger.log("Starting game with default dev config.", Logger.LogType.Debug);
            client.setServerOptions(config.dev.host, config.dev.port, username, addr);
        }
        optionsSet = true;
        //>>includeEnd("devHost");
        
        //>>includeStart("prodHost", pragmas.prodHost);
        if (!optionsSet) {
            Logger.log("Starting game with build config.", Logger.LogType.Debug);
            client.setServerOptions(config.build.host, config.build.port, username, addr);
        }
        //>>includeEnd("prodHost");

        //>>excludeStart("prodHost", pragmas.prodHost);
        let cconfig = config.local || config.dev;
        if (cconfig) {
            this.clientConnect(client, username, addr, cconfig.dispatcher); // false if the client connects directly to a game server
            connecting = true;
        }
        //>>excludeEnd("prodHost");

        //>>includeStart("prodHost", pragmas.prodHost);
        if (!connecting) {
            this.clientConnect(client, username, addr, true); // always use the dispatcher in production
        }
        //>>includeEnd("prodHost");
    }
    
    private clientConnect (client : Components.Client, username : string, addr : string, dispatcherMode? : boolean) : void {
        let self = this, url : string;
        // TODO: CHANGE
        if (Graphics.isMobile) {
            url = "http://" + "192.168.0.2" + ":" + client.port + "/";
        }
        else {
            url = "http://" + client.host + ":" + client.port + "/";
        }
           
        client.connection = io(url, {
            forceNew: true,
            reconnectionDelay: 1000,
            reconnection: true,
            reconnectionAttempts: 10,
            transports: ['websocket'],
            agent: false, // Please don't set this to true
            upgrade: false,
            rejectUnauthorized: false
        });
        client.connection.on('connection', function(socket : SocketIOClient.Socket){
            Logger.log("Connected to server " + url, Logger.LogType.Info);
        });

        /******
            Dispatcher is a system where you could have another server you connect to first
            which then provides an IP and port for the client to connect to the game server
            ******/
        if (dispatcherMode) {
            client.connection.emit("dispatch", true);

            client.connection.on("dispatched", function(reply : { "status" : string, host : string, port : number }) {
                console.log("Dispatched: ");
                console.log(reply);
                if (reply.status === 'OK') {
                    self.dispatch(reply.host, reply.port, username, addr);
                }
                else if (reply.status === 'FULL') {
                    console.log("BrowserQuest is currently at maximum player population. Please retry later.");
                }
                else {
                    console.log("Unknown log while connecting to BrowserQuest.");
                }
            });
        }
        else {
            client.connection.on("message", function(data : string) {
                if (data === "go") {
                    let prefabWait = window.setInterval(() => {
                        if (EntityFactory.arePrefabsLoaded) {
                            window.clearInterval(prefabWait);

                            Logger.log("Starting client/server handshake", Logger.LogType.Info);

                            self.sendHello(EntityManager.getEntityWithTag("Player"));
                        }
                    }, 500);
                }
                else if (data === 'timeout') {
                    client.isTimeout = true;
                }
                else self.receiveMessage(data);
            });

            /*this.connection.onlog = function(e) {
                log.log(e, true);
            };*/

            client.connection.on("disconnect", function() {
                Logger.log("Connection closed", Logger.LogType.Debug);
                $('#container').addClass('log');

                let player = EntityManager.getEntityWithTag("Player");

                if (player) {
                    player.getComponent(Components.Health).die();
                    BroadcastEvent(GameEvents.Character_Death.params(player));
                }

                if (client.isTimeout) {
                    BroadcastEvent(GameEvents.Client_Disconnect.params("You have been disconnected for being inactive for too long"));
                }
                else {
                    BroadcastEvent(GameEvents.Client_Disconnect.params("The connection to BrowserQuest has been lost"));
                }
            });
        }
    }

    private dispatch (host : string, port : number, username : string, addr : string) : void {
        Logger.log("Dispatched to game server " + host + ":" + port, Logger.LogType.Debug);

        this.connect(username, addr); // connect to actual game server
    }

    private onSpawnedCharacter (entity : Entity, x : number, y : number, orientation : GameTypes.Orientations, targetId? : number) : void {
        let identifiable = entity.getComponent(Components.Identifiable);
        try {
            if (entity.name !== "Player") {
                let spriteRenderer = entity.getComponent(Components.SpriteRenderable);
                let transform = entity.getComponent(Components.Transform);
                if (identifiable.isPlayer) {
                    let equipment = entity.getComponent(Components.Equipment)
                    spriteRenderer.setSprite(Graphics.sprites[equipment.armorName]);
                    let weaponSpriteRenderer = entity.getChild("Weapon").getComponent(Components.SpriteRenderable);
                    weaponSpriteRenderer.setSprite(Graphics.sprites[equipment.weaponName]);
                    entity.getComponent(Components.NameRenderable).Name = identifiable.name;
                }
                else {
                    let spriteName = identifiable.defaultSpriteName;
                    spriteRenderer.setSprite(Graphics.sprites[spriteName]);
                }
                transform.GridPosition = new Position2D(x, y);
                transform.Orientation = orientation;

                let target = this.getEntityWithIdentifiable(targetId);
                BroadcastEvent(GameEvents.Entity_Added.params(entity, target));

                if (identifiable.isNpc) {
                    let dialogs = Components.Talk.NpcTalk[GameTypes.getKindAsString(identifiable.kind)];
                    let talk = entity.getComponent(Components.Talk);
                    talk.count = dialogs.length;
                    talk.dialogs = dialogs;
                }

                Logger.log("Spawned " + GameTypes.getKindAsString(identifiable.kind) + " (" + identifiable.id + ") at "+ transform.GridPosition.toString(), Logger.LogType.Debug);
            }
        }
        catch (e) {
            Logger.log(e, Logger.LogType.Error);
        }
    }

    private onWelcome (id : number, name : string, x : number, y : number, hp : number) : void {
        let game = EntityManager.getEntityWithTag("Game");

        Logger.log("Received player ID from server : "+ id, Logger.LogType.Info);
        let player = EntityManager.getEntityWithTag("Player");
        let identifiable = player.getComponent(Components.Identifiable);
        let nameRenderer = player.getComponent(Components.NameRenderable);
        identifiable.id = id;
        nameRenderer.Color = "#fcda5c";
        game.getComponent(Components.Client).playerId = id;
        // Always accept name received from the server which will
        // sanitize and shorten names exceeding the allowed length.
        identifiable.name = name;
        nameRenderer.Name = name;
        
        let transform = player.getComponent(Components.Transform);
        let health = player.getComponent(Components.Health);
        transform.GridPosition = new Position2D(x, y);
        health.setmaxHitPoints(hp);
        health.setAlive();
        player.getComponent(Components.Attackable).enabled = true;

        BroadcastEvent(GameEvents.Entity_Added.params(player, null));

        BroadcastEvent(GameEvents.Client_Welcome.params(player));
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Game_Connect)) {
            this.connect(params.username, params.addr);
        }
        else if (isEvent(params, GameEvents.Zoning_Start)) {
            this.sendZone();
        }
        else if (isEvent(params, GameEvents.Player_Restart)) {
            params.game.getComponent(Components.Client).isListening = true;
            this.sendHello(params.player);
        }
        else if (isEvent(params, GameEvents.Player_CreateAttackLink)) {
            this.sendAttack(params.mob);
        }
        else if (isEvent(params, GameEvents.Character_Remove)) {
            if (params.character.name === "Player") {
                EntityManager.getEntityWithTag("Game").getComponent(Components.Client).isListening = false;
            }
        }
        else if (isEvent(params, GameEvents.Player_LootMove)) {
            let item = params.item;
            if (item) {
                let transform = item.getComponent(Components.Transform);
                this.sendLootMove(item, transform.GridPosition.x, transform.GridPosition.y);
            }
        }
        else if (isEvent(params, GameEvents.Character_Attack)) {
            // If the entity dies in one hit, server doesn't send attack message for mob,
            // so the client never updates the attack state with this information
            let attack = params.character.getComponent(Components.Attack);
            let attackTarget = EntityManager.getEntityWithID(attack.getTarget());
            if (params.character.name === "Player") {
                this.sendHit(attackTarget.getComponent(Components.Identifiable).id);
            }
            if (attack.hasTarget() && attackTarget.name === "Player" &&
                !attackTarget.getComponent(Components.Invincible).enabled) {
                    this.sendHurt(params.character);
            }
        }
        else if (isEvent(params, GameEvents.Player_Say)) {
            this.sendChat(params.message);
        }
        else if (isEvent(params, GameEvents.Movement_Door)) {
            if (params.origin.name === "Player") {
                this.sendTeleport(params.dest.x, params.dest.y);
            }
        }
        else if (isEvent(params, GameEvents.Follow_ReachedTarget)) {
            let target = params.target;
            if (target.getComponent(Components.Identifiable).isChest) {
                this.sendOpen(target);
            }
        }
        else if (isEvent(params, GameEvents.Player_Checkpoint)) {
            this.sendCheck(params.checkpoint.id);
        }
        else if (isEvent(params, GameEvents.Movement_PathingStart)) {
            if (params.origin.name === "Player") {
                let i = params.path.length - 1, x = params.path[i].x, y = params.path[i].y;

                if (!params.origin.getComponent(Components.Attack).enabled && !params.origin.getComponent(Components.Loot).enabled) {
                    this.sendMove(x, y);
                }
            }
        }
        else if (isEvent(params, GameEvents.Player_OnAggro)) {
            this.sendAggro(params.aggroedMob);
        }
        else if (isEvent(params, GameEvents.Player_Loot)) {
            this.sendLoot(params.item); // Notify the server that this item has been looted
        }
    }
    
}

registerSystem(ClientSystem, SystemOrder.Late);