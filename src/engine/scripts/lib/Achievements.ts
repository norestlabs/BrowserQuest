import * as StorageManager from "@lib/StorageManager";

export interface Achievement {
    id : number;
    name: string;
    desc: string;

    isCompleted? : () => boolean;
    hidden? : boolean;
}

export let list : { [index : string] : Achievement };

export let getAchievementById = function (id : number) : Achievement | null {
    let achievement;
    for (let index in list) {
        achievement = list[index];
        if (achievement.id === id) {
            return achievement;
        }
    }
    return null;
}

/**
 * Initializes the achievements list.
 */
export let initAchievements = function () : void {
    list = {
        A_TRUE_WARRIOR: {
            id: 1,
            name: "A True Warrior",
            desc: "Find a new weapon"
        },
        INTO_THE_WILD: {
            id: 2,
            name: "Into the Wild",
            desc: "Venture outside the village"
        },
        ANGRY_RATS: {
            id: 3,
            name: "Angry Rats",
            desc: "Kill 10 rats",
            isCompleted() : boolean {
                return StorageManager.getRatCount() >= 10;
            }
        },
        SMALL_TALK: {
            id: 4,
            name: "Small Talk",
            desc: "Talk to a non-player character"
        },
        FAT_LOOT: {
            id: 5,
            name: "Fat Loot",
            desc: "Get a new armor set"
        },
        UNDERGROUND: {
            id: 6,
            name: "Underground",
            desc: "Explore at least one cave"
        },
        AT_WORLDS_END: {
            id: 7,
            name: "At World's End",
            desc: "Reach the south shore"
        },
        COWARD: {
            id: 8,
            name: "Coward",
            desc: "Successfully escape an enemy"
        },
        TOMB_RAIDER: {
            id: 9,
            name: "Tomb Raider",
            desc: "Find the graveyard"
        },
        SKULL_COLLECTOR: {
            id: 10,
            name: "Skull Collector",
            desc: "Kill 10 skeletons",
            isCompleted() : boolean {
                return StorageManager.getSkeletonCount() >= 10;
            }
        },
        NINJA_LOOT: {
            id: 11,
            name: "Ninja Loot",
            desc: "Get hold of an item you didn't fight for"
        },
        NO_MANS_LAND: {
            id: 12,
            name: "No Man's Land",
            desc: "Travel through the desert"
        },
        HUNTER: {
            id: 13,
            name: "Hunter",
            desc: "Kill 50 enemies",
            isCompleted() {
                return StorageManager.getTotalKills() >= 50;
            }
        },
        STILL_ALIVE: {
            id: 14,
            name: "Still Alive",
            desc: "Revive your character five times",
            isCompleted() {
                return StorageManager.getTotalRevives() >= 5;
            }
        },
        MEATSHIELD: {
            id: 15,
            name: "Meatshield",
            desc: "Take 5,000 points of damage",
            isCompleted() {
                return StorageManager.getTotalDamageTaken() >= 5000;
            }
        },
        HOT_SPOT: {
            id: 16,
            name: "Hot Spot",
            desc: "Enter the volcanic mountains"
        },
        HERO: {
            id: 17,
            name: "Hero",
            desc: "Defeat the final boss"
        },
        FOXY: {
            id: 18,
            name: "Foxy",
            desc: "Find the Firefox costume",
            hidden: true
        },
        FOR_SCIENCE: {
            id: 19,
            name: "For Science",
            desc: "Enter into a portal",
            hidden: true
        },
        RICKROLLD: {
            id: 20,
            name: "Rickroll'd",
            desc: "Take some singing lessons",
            hidden: true
        }
    };

    // Set the default values
    for (let id in list) {
        let a = list[id];
        // If doesn't implement "isCompleted", default is to return true
        if (!a.isCompleted) {
            a.isCompleted = function() { return true; }
        }
        // If doesn't implement "hidden", default is false
        if (!a.hidden) {
            a.hidden = false;
        }
    }
}

/**
 * Tries to unlock an achievement. If successful, broadcasts "Achievement_Unlock" event.
 * 
 * @param {string} name 
 */
export let tryUnlockingAchievement = function (name : string) : Achievement | null {
    if (name in list) {
        let achievement = list[name];
        // If can unlock, broadcast it
        if (achievement.isCompleted!() && !StorageManager.hasUnlockedAchievement(achievement.id)) {
            return achievement;
        }
    }
    return null;
}