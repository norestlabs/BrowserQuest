import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import * as Messages from "@common/messageTypes";

export default class Client implements Component {
    static c_name : string = "Client";
	static c_id : Bitfield;
    enabled = true;
    
    connection : SocketIOClient.Socket | null = null;
    host : string = "";
    port : number = 27000;
    username : string;
    addr : string;
    playerId : number;

    public setServerOptions(host : string, port : number, username : string, addr : string) : void {
        this.host = host;
        this.port = port;
        this.username = username;
        this.addr = addr;
    }

    isListening : boolean = true;
    isTimeout : boolean = false;

    handlers : { [i : number] : (data : Messages.Types) => void } = [];

    obsoleteEntities : number[] = [];
}