import * as _ from "underscore";

module GameTypes {
    export enum Messages {
        HELLO = 0,
        WELCOME = 1,
        SPAWN = 2,
        DESPAWN = 3,
        MOVE = 4,
        LOOTMOVE = 5,
        AGGRO = 6,
        ATTACK = 7,
        HIT = 8,
        HURT = 9,
        HEALTH = 10,
        CHAT = 11,
        LOOT = 12,
        EQUIP = 13,
        DROP = 14,
        TELEPORT = 15,
        DAMAGE = 16,
        POPULATION = 17,
        KILL = 18,
        LIST = 19,
        WHO = 20,
        ZONE = 21,
        DESTROY = 22,
        HP = 23,
        BLINK = 24,
        OPEN = 25,
        CHECK = 26,
        Count = 27,
        SCROLL_POPUP = 10001,
    }

    export enum Entities {
        None = 0,
        Warrior = 1,
        
        // Mobs
        Rat = 2,
        Skeleton = 3,
        Goblin = 4,
        Ogre = 5,
        Spectre = 6,
        Crab = 7,
        Bat = 8,
        Wizard = 9,
        Eye = 10,
        Snake = 11,
        Skeleton2 = 12,
        Boss = 13,
        DeathKnight = 14,
        
        // Armors
        Firefox = 20,
        ClothArmor = 21,
        LeatherArmor = 22,
        MailArmor = 23,
        PlateArmor = 24,
        RedArmor = 25,
        GoldenArmor = 26,
        
        // Objects
        Flask = 35,
        Burger = 36,
        Chest = 37,
        FirePotion = 38,
        Cake = 39,
        
        // NPCs
        Guard = 40,
        King = 41,
        Octocat = 42,
        VillageGirl = 43,
        Villager = 44,
        Priest = 45,
        Scientist = 46,
        Agent = 47,
        Rick = 48,
        Nyan = 49,
        Sorcerer = 50,
        BeachNPC = 51,
        ForestNPC = 52,
        DesertNPC = 53,
        LavaNPC = 54,
        Coder = 55,
        
        // Weapons
        Sword1 = 60,
        Sword2 = 61,
        RedSword = 62,
        GoldenSword = 63,
        MorningStar = 64,
        Axe = 65,
        BlueSword = 66
    }

    export enum Orientations {
        None = 0,
        Up = 1,
        Down = 2,
        Left = 3,
        Right = 4
    }

    export enum EntityType {
        Player  = 1,
        Mob     = 2,
        Npc     = 4,
        Item    = 8,
        Chest   = 16,

        Character = Player | Mob,
        All = 31
    }

    export let IsKindOfEntityType = function (kind : Entities, type : EntityType) {
        return (type & EntityType.Player && isPlayer(kind)) ||
                (type & EntityType.Mob && isMob(kind)) ||
                (type & EntityType.Item && isItem(kind)) ||
                (type & EntityType.Npc && isNpc(kind)) ||
                (type & EntityType.Chest && isChest(kind));
    }

    export let kinds : { [index: string] : [Entities, string] } = {
        warrior: [Entities.Warrior, "player"],
        
        rat: [Entities.Rat, "mob"],
        skeleton: [Entities.Skeleton , "mob"],
        goblin: [Entities.Goblin, "mob"],
        ogre: [Entities.Ogre, "mob"],
        spectre: [Entities.Spectre, "mob"],
        deathknight: [Entities.DeathKnight, "mob"],
        crab: [Entities.Crab, "mob"],
        snake: [Entities.Snake, "mob"],
        bat: [Entities.Bat, "mob"],
        wizard: [Entities.Wizard, "mob"],
        eye: [Entities.Eye, "mob"],
        skeleton2: [Entities.Skeleton2, "mob"],
        boss: [Entities.Boss, "mob"],

        sword1: [Entities.Sword1, "weapon"],
        sword2: [Entities.Sword2, "weapon"],
        axe: [Entities.Axe, "weapon"],
        redsword: [Entities.RedSword, "weapon"],
        bluesword: [Entities.BlueSword, "weapon"],
        goldensword: [Entities.GoldenSword, "weapon"],
        morningstar: [Entities.MorningStar, "weapon"],
        
        firefox: [Entities.Firefox, "armor"],
        clotharmor: [Entities.ClothArmor, "armor"],
        leatherarmor: [Entities.LeatherArmor, "armor"],
        mailarmor: [Entities.MailArmor, "armor"],
        platearmor: [Entities.PlateArmor, "armor"],
        redarmor: [Entities.RedArmor, "armor"],
        goldenarmor: [Entities.GoldenArmor, "armor"],

        flask: [Entities.Flask, "object"],
        cake: [Entities.Cake, "object"],
        burger: [Entities.Burger, "object"],
        chest: [Entities.Chest, "object"],
        firepotion: [Entities.FirePotion, "object"],

        guard: [Entities.Guard, "npc"],
        villagegirl: [Entities.VillageGirl, "npc"],
        villager: [Entities.Villager, "npc"],
        coder: [Entities.Coder, "npc"],
        scientist: [Entities.Scientist, "npc"],
        priest: [Entities.Priest, "npc"],
        king: [Entities.King, "npc"],
        rick: [Entities.Rick, "npc"],
        nyan: [Entities.Nyan, "npc"],
        sorcerer: [Entities.Sorcerer, "npc"],
        agent: [Entities.Agent, "npc"],
        octocat: [Entities.Octocat, "npc"],
        beachnpc: [Entities.BeachNPC, "npc"],
        forestnpc: [Entities.ForestNPC, "npc"],
        desertnpc: [Entities.DesertNPC, "npc"],
        lavanpc: [Entities.LavaNPC, "npc"]
    };

    export let getType = function (kind : Entities) : string | null {
        let sKind = getKindAsString(kind);
        if (sKind !== null)
            return kinds[sKind][1];
        else return null;
    }

    let rankedWeapons = [
        Entities.Sword1,
        Entities.Sword2,
        Entities.Axe,
        Entities.MorningStar,
        Entities.BlueSword,
        Entities.RedSword,
        Entities.GoldenSword
    ];

    let rankedArmors = [
        Entities.ClothArmor,
        Entities.LeatherArmor,
        Entities.MailArmor,
        Entities.PlateArmor,
        Entities.RedArmor,
        Entities.GoldenArmor
    ];

    export let getWeaponRank = function(weaponKind : Entities) : number {
        return _.indexOf(rankedWeapons, weaponKind);
    };

    export let getArmorRank = function(armorKind : Entities) : number {
        return _.indexOf(rankedArmors, armorKind);
    };

    export let isPlayer = function(kind : Entities) : boolean {
        return getType(kind) === "player";
    };

    export let isMob = function(kind : Entities) : boolean {
        return getType(kind) === "mob";
    };

    export let isNpc = function(kind : Entities) : boolean {
        return getType(kind) === "npc";
    };

    export let isCharacter = function(kind : Entities) : boolean {
        return isMob(kind) || isNpc(kind) || isPlayer(kind);
    };

    export let isArmor = function(kind : Entities) : boolean {
        return getType(kind) === "armor";
    };

    export let isWeapon = function(kind : Entities) : boolean {
        return getType(kind) === "weapon";
    };

    export let isObject = function(kind : Entities) : boolean {
        return getType(kind) === "object";
    };

    export let isChest = function(kind : Entities) : boolean {
        return kind === Entities.Chest;
    };

    export let isItem = function(kind : Entities) : boolean {
        return isWeapon(kind) 
            || isArmor(kind) 
            || (isObject(kind) && !isChest(kind));
    };

    export let isHealingItem = function(kind : Entities) : boolean {
        return kind === Entities.Flask 
            || kind === Entities.Burger;
    };

    export let isExpendableItem = function(kind : Entities) : boolean {
        return isHealingItem(kind)
            || kind === Entities.FirePotion
            || kind === Entities.Cake;
    };

    export let getKindFromString = function (kind : string) : Entities | null {
        if (kind in kinds) {
            return kinds[kind][0];
        }
        else return null;
    };

    export let getEntityKindAsString = function (kind : Entities) : string | null {
        for (let k in Entities) if (<any>Entities[k] == kind) return k;
        return null;
    }

    export let getKindAsString = function(kind : Entities) : string | null {
        for (let k in kinds) {
            if (kinds[k][0] === kind) {
                return k;
            }
        }
        return null;
    };

    export let forEachKind = function(callback : (e: Entities, s: string) => void) {
        for (let k in kinds) {
            callback(kinds[k][0], k);
        }
    };

    export let forEachArmor = function(callback : (e : Entities, s : string) => void) : void {
        forEachKind(function(kind, kindName) {
            if(isArmor(kind)) {
                callback(kind, kindName);
            }
        });
    };

    export let forEachMobOrNpcKind = function(callback : (e : Entities, s : string) => void) {
        forEachKind(function(kind, kindName) {
            if(isMob(kind) || isNpc(kind)) {
                callback(kind, kindName);
            }
        });
    };

    export let forEachArmorKind = function(callback : (e : Entities, s : string) => void) {
        forEachKind(function(kind, kindName) {
            if(isArmor(kind)) {
                callback(kind, kindName);
            }
        });
    };

    export let getOrientationAsString = function (orientation : Orientations) {
        switch (orientation) {
            case Orientations.Left: return "left";
            case Orientations.Right: return "right";
            case Orientations.Up: return "up";
            case Orientations.Down: return "down";
            case Orientations.None: return "";
        }
    };

    export let getRandomItemKind = function() : Entities {
        let all : Entities[] = _.union(rankedWeapons, rankedArmors),
            forbidden : Entities[] = [Entities.Sword1, Entities.ClothArmor],
            itemKinds : Entities[] = _.difference(all, forbidden),
            i = Math.floor(Math.random() * _.size(itemKinds));
        
        return itemKinds[i];
    };

    export let getMessageTypeAsString = function(type : Messages) : string {
        return Messages[type];
    };
}

export default GameTypes;