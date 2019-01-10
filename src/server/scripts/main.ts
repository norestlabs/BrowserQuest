/**
 * main.ts
 * Server's entry point.
 */

require('module-alias/register');
require('dotenv').config();
import * as fs from "fs";
import Metrics from "./metrics";
import * as ws from "./ws";
import World from "./worldserver";
import * as Log from "log";
import * as _ from "underscore";
import Player from "./player";
import * as express from "express";
import * as http from "http";
import * as io from "socket.io";
import * as glob from "glob";
import * as bodyParser from "body-parser";
import * as path from "path";
import Prefab from "@common/prefab";
import { stardustAPI } from "@common/Stardust/api";

export let log: Log;

export interface ConfigData {
  host: string;
  port: number;
  debug_level: string;
  nb_players_per_world: number;
  nb_worlds: number;
  map_filepath: string;
  metrics_enabled: boolean;
  memcached_port?: number;
  memcached_host?: string;
  server_name?: string;
  game_servers?: any[];
}

/*interface Prefab {
    [ component : string ] : { [ attribute : string ] : string };
}*/

function main(config: ConfigData): void {
  console.log(process.env.gameData);
  // Create express server
  let app = express();
  // We need both http and websocket server working together
  let _http = http.createServer(app);
  let _io = io(_http);
  // Allow cross-origin resource sharing
  _io.origins("*:*");

  // Setup access to files (everything under "public" folder)
  app.use(express.static(__dirname + "/../../public"));

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))

  // parse application/json
  app.use(bodyParser.json());

  // Setup routes for http requests (in this case, the game will be accessible through site/test)
  app.get("/game", function (req, res, next) {
    res.sendFile("/public/game.html", { 'root': __dirname + '/../../' });
  });
  app.get("/prefabeditor", function (req, res, next) {
    res.sendFile("/public/prefabEditor.html", { 'root': __dirname + '/../../' });
  });
  app.get("/mapeditor", function (req, res, next) {
    res.sendFile("/public/mapEditor.html", { 'root': __dirname + '/../../' });
  });
  app.get("/prefabs", function (req, res, next) {
    glob(__dirname + "/../../public/assets/prefabs/**/*", { nodir: true }, (err, matches) => {
      let prefabs: { [name: string]: string } = {};
      for (let i = 0, len = matches.length; i < len; ++i) {
        let file = matches[i];
        // nodir option isn't working
        if (!file.endsWith(".json")) continue;
        let contents = fs.readFileSync(file, "utf8");
        prefabs[file.slice(file.lastIndexOf("/") + 1, file.length - 5)] = JSON.parse(contents);
      }
      res.json(prefabs);
    });
  });

  app.post("/prefabs", function (req, res) {
    let data: Prefab = req.body;
    if (data.name === "") res.send("Prefab's name wasn't supplied.");
    else {
      let dirname = path.join(__dirname, "/../../public/assets/prefabs/", data.dir);
      let filename = path.join(dirname, data.name + ".json");

      let direxists = fs.existsSync(dirname);
      if (!direxists) fs.mkdirSync(dirname);

      fs.writeFile(filename, JSON.stringify(data, null, "\t"), function (err: Error) {
        if (err) {
          console.log(err.message);
        }
        res.send(data);
      });
    }
  });

  app.get("/scene", function (req, res, next) {
    let filename = `${__dirname}/../../public/assets/scenes/${req.query.scene}.json`;
    if (fs.existsSync(filename)) {
      let scene = JSON.parse(fs.readFileSync(filename, "utf8"));
      res.json(scene);
    }
  });

  let server = new ws.socketIOServer(config.host, config.port, _io);
  let metrics = config.metrics_enabled ? new Metrics(config) : null;
  let worlds: World[] = [];
  let lastTotalPlayers = 0;
  // If metrics is enabled, every second, check the world population
  if (metrics != null) {
    setInterval(function () {
      if (metrics.isReady) {
        metrics.getTotalPlayers(function (totalPlayers: number) {
          if (totalPlayers !== lastTotalPlayers) {
            lastTotalPlayers = totalPlayers;
            _.each(worlds, function (world: World) {
              world.updatePopulation(totalPlayers);
            });
          }
        });
      }
    }, 1000);
  }

  switch (config.debug_level) {
    case "error":
      log = new Log(Log.ERROR); break;
    case "debug":
      log = new Log(Log.DEBUG); break;
    case "info":
      log = new Log(Log.INFO); break;
  };

  log.info("Starting BrowserQuest game server...");

  // When a new player connects, find a world to put it in
  server.onConnect(function (connection: ws.socketIOConnection) {
    let world: World; // The one in which the player will be spawned

    if (metrics != null) {
      metrics.getOpenWorldCount(function (open_world_count: number) {
        // Choose the least populated world among open worlds
        world = _.min(_.first(worlds, open_world_count), function (w) { return w.playerCount; });
        if (world != null) {
          world.ConnectEvent.Raise(new Player(connection, world));
        }
      });
    }
    else {
      // Simply fill each world sequentially until they are full
      world = _.detect(worlds, function (world: World) {
        return world.playerCount < config.nb_players_per_world;
      });
      if (world != null) {
        world.updatePopulation();
        world.ConnectEvent.Raise(new Player(connection, world));
      }
    }
  });

  server.onError(function () {
    log.error(Array.prototype.join.call(arguments, ", "));
  });

  let onPopulationChange = function () {
    metrics.updatePlayerCounters(worlds, function (totalPlayers: number) {
      _.each(worlds, function (world) {
        world.updatePopulation(totalPlayers);
      });
    });
    metrics.updateWorldDistribution(getWorldDistribution(worlds));
  };

  // Create all the worlds and run them
  for (let i = 0; i < config.nb_worlds; ++i) {
    let world = new World('world' + (i + 1), config.nb_players_per_world, server);
    world.run(config.map_filepath);
    worlds.push(world);
    if (metrics != null) {
      world.onPlayerAdded(onPopulationChange);
      world.RemovedEvent.Add(onPopulationChange, null);
    }
  }

  app.get("/map", function (req, res) {
    // TODO: improve, how to get the requesting player's map?
    let edit = req.body;
    if (edit === "edit") {
      res.json(worlds[0].map.getMapDataMessage())
    }
    else {
      // Send map to client
      res.json(worlds[0].map.getClientMapDataMessage());
    }
  });

  server.onRequestStatus(function () {
    return JSON.stringify(getWorldDistribution(worlds));
  });

  if (config.metrics_enabled) {
    metrics.ready(function () {
      onPopulationChange(); // initialize all counters to 0 when the server starts
    });
  }

  process.on('uncaughtException', function (err) {
    log.error(`Caught exception: ${err}\n\t${err.stack}`);
  });

  // Make the server listen to connections
  _http.listen(config.port, function () {
    log.info('listening on *:' + config.port);
  });
}

function getWorldDistribution(worlds: World[]): number[] {
  let distribution: number[] = [];

  _.each(worlds, function (world) {
    distribution.push(world.playerCount);
  });
  return distribution;
}

function getConfigFile(path: string, callback: (o: ConfigData) => void): void {
  fs.readFile(path, 'utf8', function (err: NodeJS.ErrnoException, json_string: string) {
    if (err) {
      console.error("Could not open config file:", err.path);
      callback(null);
    }
    else {
      callback(JSON.parse(json_string));
    }
  });
}

/**
 * Set the path for the default config file.
 */
let defaultConfigPath = './configuration/server.json';
/**
 * Set the path for the custom (local) config file.
 */
let customConfigPath = './configuration/server.local.json';

/**
 * Check if there was a parameter given when executing this.
 * If so, set it as the custom config file (replaces previously set local config path).
 */
process.argv.forEach(function (val, index, array) {
  if (index === 2) {
    customConfigPath = val;
  }
});

/**
 * Runs the "getConfigFile" function with the default path.
 * If it was successfull at getting the file, "defaultConfig" parameter will have its data, else it will be null.
 * After that, "getConfigFile" will be executed again, but this time to get the custom config.
 * If it was successfull at getting the file, "localConfig" parameter will have its data, else it will be null.
 * Priorizing the custom config, it will then try to run the function "main".
 */
getConfigFile(defaultConfigPath, function (defaultConfig: ConfigData) {
  getConfigFile(customConfigPath, function (localConfig: ConfigData) {
    if (localConfig) {
      gameInit(localConfig);
    }
    else if (defaultConfig) {
      gameInit(defaultConfig);
    }
    else {
      console.error("Server cannot start without any configuration file.");
      process.exit(1);
    }
  });
});

function gameInit(config: any) {
  const gameDataPath = './configuration/game.data.json';
  fs.exists(gameDataPath, (exists: boolean) => {
    if (exists) {
      let gameData: any = fs.readFileSync(gameDataPath);
      gameData = JSON.parse(gameData.toString());
      const { gameAddr } = gameData;
      stardustAPI.getters.game.getAll({ gameAddr }).then(res => {
        process.env.gameData = JSON.stringify(gameData);
        main(config);
      }).catch(err => {
        console.error(`Game at address ${gameAddr} not found.`);
        fs.unlinkSync(gameDataPath);
        process.exit(1);
      })
    } else {
      const deployData = {
        owner: process.env.WALLET_ADDR,
        name: 'BrowserQuest',
        symbol: 'BQG',
        desc: 'HTML5/JavaScript multiplayer game experiment.',
        image: 'BrowserQuest',
        timestamp: Date.now()
      };
      stardustAPI.setters.game.deploy(deployData, process.env.WALLET_PRIV).then(res => {
        fs.writeFileSync(gameDataPath, JSON.stringify(res.data));
        process.env.gameData = JSON.stringify(res.data);
        main(config);
      })
    }
  })
}