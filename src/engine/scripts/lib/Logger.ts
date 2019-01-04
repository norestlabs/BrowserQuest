import * as Logger from "@common/Logger";

let groups : { [name : string] : { message : string, type : Logger.LogType }[] } = {};
let currentGroup : string | null = null;

export function printGroup (gname : string) {
    if (console) {
        if (gname in groups && groups[gname].length > 0) {
            console.groupCollapsed(gname);
            for (let i = 0, len = groups[gname].length; i < len; ++i) {
                let g = groups[gname][i];
                Logger.LogTypeMethod[g.type][1](g.message);
            }
            console.groupEnd();
            delete groups[gname];
        }
    }
}

export function addToGroup (m : string, gname : string, type : Logger.LogType) {
    if (console) {
        if (!(gname in groups)) groups[gname] = [];
        groups[gname].push({ message : `[${new Date().toLocaleTimeString()}]\t${Logger.LogTypeMethod[type][0]}\t${m}`, type });
    }
}

export function startGroup (gname : string) {
    if (console) {
        groups[gname] = [];
        currentGroup = gname;
    }
}

export function endCurrentGroup () {
    if (currentGroup !== null) {
        printGroup(currentGroup);
        currentGroup = null;
    }
}

export function log (m: string, type : Logger.LogType) {
    if (currentGroup === null) {
        let d = new Date();
        Logger.LogTypeMethod[type][1](`[${d.toLocaleTimeString()}]\t${Logger.LogTypeMethod[type][0]}\t${m}`);
    }
    else {
        addToGroup(m, currentGroup, type);
    }
}

export let LogType = Logger.LogType;