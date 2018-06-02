import * as _ from "underscore";

import {ConfigData,log} from "./main";
let MemCache = require("memcache");

export default class Metrics {

    config : ConfigData;
    client : any;
    isReady : boolean;

    ready_callback : () => void;
    
    constructor (config : ConfigData) {
        let self = this;
        
        this.config = config;
        this.client = new MemCache.Client(config.memcached_port, config.memcached_host);
        this.client.connect();
        
        this.isReady = false;
        
        this.client.on('connect', function() {
            log.info("Metrics enabled: memcached client connected to " + config.memcached_host + ":" + config.memcached_port);
            self.isReady = true;
            if (self.ready_callback) {
                self.ready_callback();
            }
        });
    }
    
    ready (callback : () => void) : void {
        this.ready_callback = callback;
    }
    
    updatePlayerCounters (worlds : any, updatedCallback : any) : void {
        let self = this, config = this.config, numServers = _.size(config.game_servers);
        let playerCount = _.reduce(worlds, function(sum, world : any) { return sum + world.playerCount; }, 0);
        
        if (this.isReady) {
            // Set the number of players on this server
            this.client.set('player_count_' + config.server_name, playerCount, function() {
                let total_players = 0;
                
                // Recalculate the total number of players and set it
                _.each(config.game_servers, function(server : any) {
                    self.client.get('player_count_' + server.name, function(error : any, result : any) {
                        let count = result ? parseInt(result) : 0;

                        total_players += count;
                        numServers -= 1;
                        if (numServers === 0) {
                            self.client.set('total_players', total_players, function() {
                                if (updatedCallback) {
                                    updatedCallback(total_players);
                                }
                            });
                        }
                    });
                });
            });
        } else {
            log.error("Memcached client not connected");
        }
    }
    
    updateWorldDistribution (worlds : any) : void {
        this.client.set('world_distribution_' + this.config.server_name, worlds);
    }
    
    getOpenWorldCount (callback : any) : void {
        this.client.get('world_count_' + this.config.server_name, function(error : any, result : any) {
            callback(result);
        });
    }
    
    getTotalPlayers (callback : any) : void {
        this.client.get('total_players', function(error : any, result : any) {
            callback(result);
        });
    }
}
