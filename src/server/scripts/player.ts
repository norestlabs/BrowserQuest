import {socketIOConnection} from "./ws";
import World from "./worldserver";
import Character from "./character";
import * as Utils from "@common/utils";
import Types from "@common/gametypes";
import * as _ from "underscore";
import {log} from "./main";
import * as Properties from "./properties";
import Item from "./item";
import Mob from "./mob";
import Chest from "./chest";
import * as Formulas from "./formulas";
import * as Messages from "@common/messageTypes";
import { CheckpointArea } from "@common/GameMap";

export default class Player extends Character {

    server : World;
    connection : socketIOConnection;

    hasEnteredGame : boolean;
    isDead : boolean;
    haters : { [index : number] : Mob };
    lastCheckpoint : CheckpointArea;
    disconnectTimeout : NodeJS.Timer;
    firepotionTimeout : NodeJS.Timer;
    name : string;

    zone_callback : () => void;
    move_callback : (x : number, y : number) => void;
    lootmove_callback : (x : number, y : number) => void;
    message_callback : (message : any[]) => void;
    exit_callback : () => void;
    requestpos_callback : () => { x : number, y : number };
    broadcast_callback : (message : Messages.Types, ignoreSelf : boolean) => void;
    broadcastzone_callback : (message : Messages.Types, ignoreSelf : boolean) => void;
    orient_callback : () => void;   // TODO: unused

    weaponLevel : number;
    armorLevel : number;

    armor : Types.Entities;
    weapon : Types.Entities;


    constructor (connection : socketIOConnection, worldServer : World) {

        super(connection.id, "player", Types.Entities.Warrior, 0, 0);

        let self = this;
        
        this.server = worldServer;
        this.connection = connection;

        this.hasEnteredGame = false;
        this.isDead = false;
        this.haters = {};
        this.lastCheckpoint = null;
        this.disconnectTimeout = null;
        
        this.connection.listen(function(message : Messages.Types) {
            let action = message[0];
            
            log.debug("Received: " + message);
            if (!self.hasEnteredGame && action !== Types.Messages.HELLO) { // HELLO must be the first message
                self.connection.close("Invalid handshake message: " + message);
                return;
            }
            if (self.hasEnteredGame && !self.isDead && action === Types.Messages.HELLO) { // HELLO can be sent only once
                self.connection.close("Cannot initiate handshake twice: " + message);
                return;
            }
            
            self.resetTimeout();
            
            if (action === Types.Messages.HELLO) {
                let m = <Messages.ClientHello>message;

                let name = Utils.sanitize(m[1]);
                
                // If name was cleared by the sanitizer, give a default name.
                // Always ensure that the name is not longer than a maximum length.
                // (also enforced by the maxlength attribute of the name input element).
                self.name = (name === "") ? "lorem ipsum" : name.substr(0, 15);
                
                self.kind = Types.Entities.Warrior;
                self.equipArmor(m[2]);
                self.equipWeapon(m[3]);
                self.orientation = Utils.randomOrientation();
                self.updateHitPoints();
                self.updatePosition();
                
                self.server.addPlayer(self);
                self.server.enter_callback(self);

                self.send([Types.Messages.WELCOME, self.id, self.name, self.x, self.y, self.hitPoints]);
                self.hasEnteredGame = true;
                self.isDead = false;
            }
            else if (action === Types.Messages.WHO) {
                let m = <Messages.ClientWho>message;
                self.server.pushSpawnsToPlayer(self, m[1]);
            }
            else if (action === Types.Messages.ZONE) {
                self.zone_callback();
            }
            else if (action === Types.Messages.CHAT) {
                let m = <Messages.ClientChat>message;
                let msg = Utils.sanitize(m[1]);
                
                // Sanitized messages may become empty. No need to broadcast empty chat messages.
                if (msg && msg !== "") {
                    msg = msg.substr(0, 60); // Enforce maxlength of chat input
                    self.broadcastToZone([
                        Types.Messages.CHAT,
                        self.id,
                        msg
                    ], false);
                }
            }
            else if (action === Types.Messages.MOVE) {
                let m = <Messages.ClientMove>message;
                if (self.move_callback) {
                    let x = m[1],
                        y = m[2];
                    
                    if (self.server.isValidPosition(x, y)) {
                        self.setPosition(x, y);
                        self.clearTarget();
                        
                        self.broadcast([
                            Types.Messages.MOVE,
                            self.id,
                            self.x,
                            self.y
                        ]);
                        self.move_callback(self.x, self.y);
                    }
                }
            }
            else if (action === Types.Messages.LOOTMOVE) {
                let m = <Messages.ClientLootMove>message;
                if (self.lootmove_callback) {
                    self.setPosition(m[1], m[2]);
                    
                    let item = <Item>self.server.getEntityById(m[3]);
                    if (item) {
                        self.clearTarget();

                        self.broadcast([
                            Types.Messages.LOOTMOVE,
                            self.id,
                            item.id
                        ]);
                        self.lootmove_callback(self.x, self.y);
                    }
                }
            }
            else if (action === Types.Messages.AGGRO) {
                let m = <Messages.ClientAggro>message;
                if (self.move_callback) {
                    self.server.handleMobHate(m[1], self.id, 5);
                }
            }
            else if (action === Types.Messages.ATTACK) {
                let m = <Messages.ClientAttack>message;
                let mob = self.server.getEntityById(m[1]);
                
                if (mob) {
                    self.setTarget(mob);
                    self.server.broadcastAttacker(self);
                }
            }
            else if (action === Types.Messages.HIT) {
                let m = <Messages.ClientHit>message;
                let mob = self.server.getEntityById(m[1]);

                if (mob) {
                    let dmg = Formulas.dmg(self.weaponLevel, (<Mob>mob).armorLevel);
                    
                    if (dmg > 0) {
                        (<Mob>mob).receiveDamage(dmg, self.id);
                        self.server.handleMobHate(mob.id, self.id, dmg);
                        self.server.handleHurtEntity(mob, self, dmg);
                    }
                }
            }
            else if (action === Types.Messages.HURT) {
                let m = <Messages.ClientHurt>message;
                // Player was hurt by a mob
                let mob = self.server.getEntityById(m[1]);
                if (mob && self.hitPoints > 0) {
                    self.hitPoints -= Formulas.dmg((<Mob>mob).weaponLevel, self.armorLevel);
                    self.server.handleHurtEntity(self, <Mob>mob);
                    
                    if (self.hitPoints <= 0) {
                        self.isDead = true;
                        if (self.firepotionTimeout) {
                            clearTimeout(self.firepotionTimeout);
                        }
                    }
                }
            }
            else if (action === Types.Messages.LOOT) {
                let m = <Messages.ClientLoot>message;
                let item = <Item>self.server.getEntityById(m[1]);
                
                if (item) {
                    let kind = item.kind;
                    
                    if (Types.isItem(kind)) {
                        self.broadcast(item.getDespawnMessage());
                        self.server.removeEntity(item);
                        
                        if (kind === Types.Entities.FirePotion) {
                            self.updateHitPoints();
                            self.broadcast(self.getEquipMessage(Types.Entities.Firefox));
                            self.firepotionTimeout = setTimeout(function() {
                                self.broadcast(self.getEquipMessage(self.armor)); // return to normal after 15 sec
                                self.firepotionTimeout = null;
                            }, 15000);
                            self.send([Types.Messages.HP, self.maxHitPoints]);
                        }
                        else if (Types.isHealingItem(kind)) {
                            let amount;
                            
                            switch (kind) {
                                case Types.Entities.Flask: 
                                    amount = 40;
                                    break;
                                case Types.Entities.Burger: 
                                    amount = 100;
                                    break;
                            }
                            
                            if (!self.hasFullHealth()) {
                                self.regenHealthBy(amount);
                                self.server.pushToPlayer(self, self.getHealthMessage());
                            }
                        }
                        else if (Types.isArmor(kind) || Types.isWeapon(kind)) {
                            self.equipItem(item);
                            self.broadcast(self.getEquipMessage(kind));
                        }
                    }
                }
            }
            else if (action === Types.Messages.TELEPORT) {
                let m = <Messages.ClientTeleport>message;
                let x = m[1], y = m[2];
                
                if (self.server.isValidPosition(x, y)) {
                    self.setPosition(x, y);
                    self.clearTarget();
                    
                    self.broadcast([
                        Types.Messages.TELEPORT,
                        self.id,
                        self.x,
                        self.y
                    ]);
                    
                    self.server.handlePlayerVanish(self);
                    self.server.pushRelevantEntityListTo(self);
                }
            }
            else if (action === Types.Messages.OPEN) {
                let m = <Messages.ClientOpen>message;
                let chest = self.server.getEntityById(m[1]);
                if (chest && chest instanceof Chest) {
                    self.server.handleOpenedChest(chest, self);
                }
            }
            else if (action === Types.Messages.CHECK) {
                let m = <Messages.ClientCheck>message;
                let checkpoint = self.server.map.getCheckpoint(m[1]);
                if (checkpoint) {
                    self.lastCheckpoint = checkpoint;
                }
            }
            else {
                if (self.message_callback) {
                    self.message_callback(message);
                }
            }
        });
        
        this.connection.onClose(function() {
            if(self.firepotionTimeout) {
                clearTimeout(self.firepotionTimeout);
            }
            clearTimeout(self.disconnectTimeout);
            if(self.exit_callback) {
                self.exit_callback();
            }
        });
        
        this.connection.sendUTF8("go"); // Notify client that the HELLO/WELCOME handshake can start
    }
    
    destroy () : void {
        let self = this;
        
        this.forEachAttacker(function(mob) {
            mob.clearTarget();
        });
        this.attackers = {};
        
        this.forEachHater(function(mob) {
            mob.forgetPlayer(self.id);
        });
        this.haters = {};
    }
    
    getState () : [number, Types.Entities, number, number,
        [Types.Orientations, number | undefined, string, Types.Entities, Types.Entities] |
        [Types.Orientations, number | undefined] | undefined] {
        let basestate = this._getBaseState(),
            state : [Types.Orientations, number | undefined, string, Types.Entities, Types.Entities] = [
                this.orientation, this.target ? this.target : undefined, this.name, this.armor, this.weapon
            ];

        let s : [number, Types.Entities, number, number,
            [Types.Orientations, number | undefined, string, Types.Entities, Types.Entities]]
        = [basestate[0], basestate[1], basestate[2], basestate[3], state];
        return s;
    }
    
    send (message : Messages.Types) : void {
        this.connection.send(message);
    }
    
    broadcast (message : Messages.Types, ignoreSelf? : boolean) : void {
        if (this.broadcast_callback) {
            this.broadcast_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
        }
    }
    
    broadcastToZone (message : Messages.Types, ignoreSelf? : boolean) : void {
        if (this.broadcastzone_callback) {
            this.broadcastzone_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
        }
    }
    
    onExit (callback : () => void) : void {
        this.exit_callback = callback;
    }
    
    onMove (callback : (x : number, y : number) => void) : void {
        this.move_callback = callback;
    }
    
    onLootMove (callback : (x : number, y : number) => void) : void {
        this.lootmove_callback = callback;
    }
    
    onZone (callback : () => void) : void {
        this.zone_callback = callback;
    }
    
    // TODO: Unused
    onOrient (callback : () => void) : void {
        this.orient_callback = callback;
    }
    
    onMessage (callback : (message : any[]) => void) : void {
        this.message_callback = callback;
    }
    
    onBroadcast (callback : (message : Messages.Types, ignoreSelf : boolean) => void) : void {
        this.broadcast_callback = callback;
    }
    
    onBroadcastToZone (callback : (message : Messages.Types, ignoreSelf : boolean) => void) : void {
        this.broadcastzone_callback = callback;
    }
    
    getEquipMessage (item : Types.Entities) : Messages.EquipItem {
        return [Types.Messages.EQUIP,
                this.id,
                item];
    }
    
    addHater (mob : Mob) : void {
        if (mob) {
            if (!(mob.id in this.haters)) {
                this.haters[mob.id] = mob;
            }
        }
    }
    
    removeHater (mob : Mob) : void {
        if(mob && mob.id in this.haters) {
            delete this.haters[mob.id];
        }
    }
    
    forEachHater (callback : (m : Mob) => void) : void {
        _.each(this.haters, function(mob : Mob) {
            callback(mob);
        });
    }
    
    equipArmor (kind : Types.Entities) : void {
        this.armor = kind;
        this.armorLevel = Properties.getArmorLevel(kind);
    }
    
    equipWeapon (kind : Types.Entities) : void {
        this.weapon = kind;
        this.weaponLevel = Properties.getWeaponLevel(kind);
    }
    
    equipItem (item : Item) : void {
        if (item) {
            log.debug(this.name + " equips " + Types.getKindAsString(item.kind));
            
            if (Types.isArmor(item.kind)) {
                this.equipArmor(item.kind);
                this.updateHitPoints();
                this.send([Types.Messages.HP, this.maxHitPoints]);
            }
            else if (Types.isWeapon(item.kind)) {
                this.equipWeapon(item.kind);
            }
        }
    }
    
    updateHitPoints () : void {
        this.resetHitPoints(Formulas.hp(this.armorLevel));
    }
    
    updatePosition () : void {
        if(this.requestpos_callback) {
            let pos = this.requestpos_callback();
            this.setPosition(pos.x, pos.y);
        }
    }
    
    onRequestPosition (callback : () => { x : number, y : number }) : void {
        this.requestpos_callback = callback;
    }
    
    resetTimeout () : void {
        clearTimeout(this.disconnectTimeout);
        // TODO: change timeout
        this.disconnectTimeout = setTimeout(() => this.timeout.bind(this), 1000 * 60 * 15); // 15 min.
    }
    
    timeout () : void {
        this.connection.sendUTF8("timeout");
        this.connection.close("Player was idle for too long");
    }
}