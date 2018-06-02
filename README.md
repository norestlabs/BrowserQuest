# BrowserQuest - Typescript/ECS

BrowserQuest's original project's last update was in 2012. Seeing that several browser game coding learning resources pointed at this project, I decided to change the code to Typescript, and change the architecture to Entity-Component-System. The objective of this project is to then be both a learning tool and a template for making multiplayer browser games in Typescript.

## Getting Started

### Prerequisites

You'll need npm and Node.js (https://nodejs.org/en/). Visual Studio Code is recommended as it was the IDE used in this project. Console Emulator [cmder](http://cmder.net/) was used for all command-line tasks.

### Setting Up

After getting the code and Node/npm, install the packages, by going to the main folder (the one with package.json) and running:

```
npm install
```

### Usage

First setup and run the server:
```
npm run buildserver
node dist\server\scripts\main.js
```

Then the client:
```
npm run buildclient
```

The port to access it can be set in the **configuration** folder.

## Authors

* Original project : [BrowserQuest](https://github.com/mozilla/BrowserQuest)
* **André Miguel** : [WalrusNine](https://github.com/WalrusNine)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
Code is licensed under MPL 2.0. Content is licensed under CC-BY-SA 3.0. See the [LICENSE.md](LICENSE.md) file for details.

# Guide

## Project Organization

* configuration - Has all configuration files.
* resources - Stuff needed on compilation but not on runtime (are added through browserify to the bundle), or used by the server only.
* src - All of the code.
    * @types - Put the custom types for typescript here.
    * client - The code of the game (right now, just an entry point that defines the scene).
    * engine - The code of the engine, with all the systems, components, libs and utils.
    * prefabEditor - The code to manage the Prefab Editor.
    * server - The code of the server.
    * shared - Code that can be used by anyone.
* dist - Compiled code, assets and views.
    * client - Compiled **.js** scripts of the client.
    * engine - Compiled **.js** scripts of the engine.
    * prefabEditor - Compiled **.js** scripts of the prefab editor.
    * public - Everything that the server can give to the clients (including the views/html).
        * assets - Stuff needed on runtime, that the clients can access at anytime by requesting to the server or load with HTMLAudioElement and HTMLImageElement.
        * scripts - The bundles from **browserify**.
        * vendors - Third party stuff linked in the views.
    * server - Compiled **.js** scripts of the server.
    * shared - Compiled **.js** scripts of the shared code.

## Package.json

### Browserify

The "main" field tells which file is the entry point, to indicate where to start.

The "transform" field sets up any transformations in the code that will be applied. The ones used are "babelify", which is the *Babel* transform, used to "compile" the Javascript code to the *es2015* version, with the plugin [transform-class-properties](https://babeljs.io/docs/plugins/transform-class-properties/); and "browserify-shim", used to [expose and shim](https://stackoverflow.com/a/25585778) *jquery*.

### Module Aliases

Used for *pathmapping* by the server, as it works differently in a *node* environment compared to babel/browserify that can apply transforms to the code.

### Scripts

* buildclient - Compiles and browserifies client.
* client-ts - Compiles client.
* client-bundle - Browserifies client.
* buildserver - Compiles server.
* server-ts - Compiles server.
* buildshared - Compiles shared.
* buildPrefabEditor - Compiles and browserifies prefab editor.
* prefabEditor-ts - Compiles prefab editor.
* prefabEditor-bundle - Browserifies prefab editor.

## .vscode/Tasks.json

2 tasks were created to watch for changes and show the errors in the **Problems** tab: Client Watcher and Server Watcher.

## The Prefab Editor

To manage the prefabs more easily, the prefab editor was created. Its functionalities are very basic, but as the files can get pretty big, it can be very useful to manage the components of each prefab, and their children.

## The Game

The code for the game is divided in 2 main parts - the systems and the components. Following the Entity-Component-System architecture, the systems don't store any data, and only have methods to work with the logic of the game. The components have all the data, but no logic. The entities are just a set of components. It's possible to get multiple components of an Entity at once by using the Nodes structure (defined in Component.ts).

# Notes

* The project still needs to be thoroughly tested in mobile platforms and with multiple players.
* There needs to be better settings for build version. As it was only tested locally, in the ClientSystem's clientConnect method the url is set manually.

# TODO

* Use strictNull
* Make both client/engine and server use same module (es6) for compiling (currently the server compiles to commonjs, so when the client compiles to es6, the server can't run anymore until the shared code is compiled again to commonjs)
* Improve path managing through Assets.ts
* Systems should only deal with IDs of entities:
```
let e = EntityManager.GetEntity(id); e.GetComponent(Component);
// Change to:
Something.GetComponent(id, Component);
Something.GetComponents(id, ...);
```
* MovementSystem - When the player runs from a mob there's a performance hit. Running from multiple mobs can make it really slow. And sometimes, when they catch-up, they stack on each other
* Change the way EntityGrids is handled?
* Make it so no system goes for a particular Entity like with DirtySystem getting the entities through EntityGrids directly from the Game entity. Iterate over entities with Dirty components instead
* Error when trying to play audio on mobile:
```
Failed to execute 'play' on 'HTMLMediaElement': API can only be initiated by a user gesture.
playSound @ bundle.js:17209
bundle.js:17209 Uncaught (in promise) DOMException: play() can only be initiated by a user gesture.
```
* Improve Prefab Editor, check prefabs/components when initializes, remove uneded features/properties of prefabs, better page UI
* Create Map Editor page
* Lower coupling. In each system, verify if what it knows should really be known by it. Make them more independent from Game entity (create more manage/load components?)
* Use Controllable instead of getting Player entity for input stuff
* Make GameState a component of Game, don't let it be needed by unrelated systems
* Change Follow/Movable to handle "going near" (instead of going to a specific position) better
* Client - currently it's only used to load a scene with the engine. Ideally, the engine shouldn't have systems handle most of events. Let that to the actual game. Then the game should be about extending the systems and implementing the OnNotify and maybe other stuff.
* Remove npm packages that aren't being used
* Better dist/public folder organization - create js folder with compilation output, and let public alone
* There's a dead tree in the loading screen...
* Make silhouettes work