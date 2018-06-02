import * as Logger from "@common/Logger";

export let assert = function <T> (p : T | null, m? : string) : T {
    if (p !== null) return p;
    else throw new Error(`Assertion Failed${m ? `\t${m}` : ""}`);
}

export let exists = function <T> (p : T | null, m? : string, logType? : Logger.LogType) : p is T {
    if (p === null) {
        if (m) {
            Logger.log(m, logType || Logger.LogType.Warn);
        }
        return false;
    }
    else return true;
}