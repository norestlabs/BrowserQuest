export enum LogType {
    Info, Debug, Error, Warn
}

export let LogTypeMethod : { [index : number] : [ string, any ] } = {};

LogTypeMethod[LogType.Info] = ["INFO", console.info];
LogTypeMethod[LogType.Debug] = ["DEBUG", console.debug];
LogTypeMethod[LogType.Error] = ["ERROR", console.error];
LogTypeMethod[LogType.Warn] = ["WARN", console.warn];

export function log (m: string, type : LogType) {
    let d = new Date();
    LogTypeMethod[type][1](`[${d.toLocaleTimeString()}]\t${LogTypeMethod[type][0]}\t${m}`);
}