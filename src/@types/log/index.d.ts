//import {EventEmitter} from "events";

interface Log {
    read () : void;
    log (levelStr : string, args : Array<any>) : void;

    emergency(msg : string) : void;
    alert(msg : string) : void;
    critical(msg : string) : void;
    error(msg : string) : void;
    warning(msg : string) : void;
    notice(msg : string) : void;
    info(msg : string) : void;
    debug(msg : string) : void;
}

declare let Log : {
    new (level : number | string, stream? : NodeJS.Socket) : Log;
    EMERGENCY : number;
    ALERT : number;
    CRITICAL : number;
    ERROR : number;
    WARNING : number;
    NOTICE : number;
    INFO : number;
    DEBUG : number;
}

declare module "log" {
    export = Log;
}