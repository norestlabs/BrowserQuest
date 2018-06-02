import * as _ from "underscore";

interface StorageData {
    hasAlreadyPlayed: boolean,
    player: {
        name: string,
        weapon: string,
        armor: string,
        image: string
    },
    achievements: {
        unlocked: number[],
        ratCount: number,
        skeletonCount: number,
        totalKills: number,
        totalDmg: number,
        totalRevives: number
    }
}

export let data : StorageData;

export let resetData = function () : void {
    data = {
        hasAlreadyPlayed: false,
        player: {
            name: "",
            weapon: "",
            armor: "",
            image: ""
        },
        achievements: {
            unlocked: [],
            ratCount: 0,
            skeletonCount: 0,
            totalKills: 0,
            totalDmg: 0,
            totalRevives: 0
        }
    };
}

export let setData = function (d : StorageData) : void {
    data = d;
}

export let initPlayer = function (name : string) : void {
    data.hasAlreadyPlayed = true;
    setPlayerName(name);
}

export let setPlayerName = function (name : string) : void {
    data.player.name = name;
    save();
}

export let setPlayerImage = function (img : string) : void {
    data.player.image = img;
    save();
}

export let setPlayerArmor = function (armor : string) : void {
    data.player.armor = armor;
    save();
}

export let setPlayerWeapon = function (weapon : string) : void {
    data.player.weapon = weapon;
    save();
}

let save = function () : void {
    if (hasLocalStorage()) {
        localStorage.data = JSON.stringify(data);
    }
}

export let incrementRevives = function () {
    if(data.achievements.totalRevives < 5) {
        data.achievements.totalRevives++;
        save();
    }
}

export let savePlayer = function (img : string, armor : string, weapon : string) : void {
    setPlayerImage(img);
    setPlayerArmor(armor);
    setPlayerWeapon(weapon);
}

// Achievements

export let unlockAchievement = function (id : number) : void {
    data.achievements.unlocked.push(id);
    save();
}

export let incrementRatCount = function () : void {
    if(data.achievements.ratCount < 10) {
        data.achievements.ratCount++;
        save();
    }
}

export let incrementSkeletonCount = function () : void {
    if(data.achievements.skeletonCount < 10) {
        data.achievements.skeletonCount++;
        save();
    }
}

export let addDamage = function (damage : number) : void {
    if(data.achievements.totalDmg < 5000) {
        data.achievements.totalDmg += damage;
        save();
    }
}

export let incrementTotalKills = function () : void {
    if(data.achievements.totalKills < 50) {
        data.achievements.totalKills++;
        save();
    }
}

export let clear = function () : void {
    if (hasLocalStorage()) {
        localStorage.data = "";
        resetData();
    }
}

export let hasLocalStorage = function () : boolean {
    return Modernizr.localstorage;
}

export let hasAlreadyPlayed = function () : boolean {
    return data.hasAlreadyPlayed;
}

export let hasUnlockedAchievement = function (id : number) : boolean {
    return _.include(data.achievements.unlocked, id);
}

export let getAchievementCount = function () : number {
    return _.size(data.achievements.unlocked);
}

export let getRatCount = function () : number {
    return data.achievements.ratCount;
}

export let getSkeletonCount = function () : number {
    return data.achievements.skeletonCount;
}

export let getTotalDamageTaken = function () : number {
    return data.achievements.totalDmg;
}

export let getTotalKills = function () : number {
    return data.achievements.totalKills;
}

export let getTotalRevives = function () : number {
    return data.achievements.totalRevives;
}