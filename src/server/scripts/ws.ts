import * as Utils from "@common/utils";
import {log} from "./main";
import * as _ from "underscore";

abstract class Server {
    _connections : { [index : string] : socketIOConnection };
    _counter : number;
    port : number;

    connection_callback : (connection : socketIOConnection) => void;
    error_callback : () => void;

    constructor (port : number) {
        this.port = port;
        this._counter = 0;
        this._connections = {};
    }
    
    onConnect (callback : (connection : socketIOConnection) => void) : void {
        this.connection_callback = callback;
    }
    
    onError (callback : () => void) : void {
        this.error_callback = callback;
    }
    
    broadcast (message : any) : void {
        throw "Not implemented";
    }
    
    forEachConnection (callback : (connection : socketIOConnection) => void) : void {
        _.each(this._connections, callback);
    }
    
    addConnection (connection : socketIOConnection) : void {
        this._connections[connection.id] = connection;
    }
    
    removeConnection (id : string) : void {
        delete this._connections[id];
    }
    
    getConnection (id : string) : socketIOConnection {
        return this._connections[id];
    }

    connectionsCount () : number {
        return Object.keys(this._connections).length
    }
}


abstract class Connection {

    _connection : SocketIO.Socket;
    _server : Server;
    id : string;

    close_callback : () => void;
    listen_callback : (message : any[]) => void;

    constructor (id : string, connection : SocketIO.Socket, server : Server) {
        this._connection = connection;
        this._server = server;
        this.id = id;
    }
    
    onClose (callback : () => void) : void {
        this.close_callback = callback;
    }
    
    listen (callback : (message : any[]) => void) : void {
        this.listen_callback = callback;
    }
    
    broadcast (message : any) : void {
        throw "Not implemented";
    }
    
    send (message : any) : void {
        throw "Not implemented";
    }
    
    sendUTF8 (data : string) : void {
        throw "Not implemented";
    }
    
    close (logError : string) : void {
        log.info("Closing connection to " + this._connection.request.connection.remoteAddress + ". Error: " + logError);
        this._connection.disconnect(true);
    }
}

/***************
    SOCKET.IO
    Author: Nenu Adrian
            http://nenuadrian.com
            http://codevolution.com
 ***************/

export class socketIOServer extends Server {

    _io : SocketIO.Server;
    host : string;
    connection_callback : (connection : socketIOConnection) => void;
    error_callback : () => void;
    status_callback : () => string;

    constructor (host : string, port : number, _io : SocketIO.Server) {
        super(port);
        this.host = host;

        this._io = _io;

        let selfServer = this;
        this._io.on('connection', function(connection : SocketIO.Socket) {
            log.info('a user connected');

            let c = new socketIOConnection(selfServer._createId(), connection, selfServer);

            if (selfServer.connection_callback) {
                selfServer.connection_callback(c);
            }
            selfServer.addConnection(c);

        });

        this._io.on('error', function (err : any) { 
            log.error(err.stack); 
            selfServer.error_callback();
         });
    }

    _createId () : string {
        return `5${Utils.random(99)}${this._counter++}`;
    }
    
    
    broadcast(message : any) : void {
        this._io.emit("message", message)
    }

    onRequestStatus(status_callback : () => string) : void {
        this.status_callback = status_callback;
    }
}

export interface DataMessageType {
    dataName : string;
    data : any;
}
export class socketIOConnection extends Connection {
    constructor (id : string, connection : SocketIO.Socket, server : socketIOServer) {
        super(id, connection, server);
        let self = this;

        // HANDLE DISPATCHER IN HERE
        connection.on("dispatch", function (message) {
            console.log("Received dispatch request")
            self._connection.emit("dispatched",  { "status" : "OK", host : server.host, port : server.port } )
        });

        connection.on("message", function (message) {
            log.info("Received: " + message)
            if (self.listen_callback)
                self.listen_callback(message)
        });

        connection.on("disconnect", function () {
            if(self.close_callback) {
                self.close_callback();
            }
            self._server.removeConnection(self.id);
        });

    }
    
    broadcast (message : any) : void {
        throw "Not implemented";
    }
    
    // message is Messages serialized, so array of bunch of stuff.
    send (message : any) : void {
        this._connection.emit("message", message);
    }

    sendData (data : DataMessageType) : void {
        this._connection.emit(data.dataName, data.data);
    }
    
    sendUTF8 (data : string) : void {
        this.send(data);
    }

    close (logError : string) : void {
        log.info(`Closing connection to socket. Error: ${logError}.`);
        this._connection.disconnect();
    }
}