import { Rect, Position2D, Coordinate } from "@common/position";
import Sprite, { Animation } from "@lib/Sprite";
import * as _ from "underscore"
import Assets from "@utils/assets";
import GameTypes from "@common/gametypes";
import * as Logger from "@lib/Logger";
import Text from "@lib/Text";
import { assert } from "@common/assert";
import Detect from "@utils/detect";

/**
 * Sprites is an object which has the field "sprites", which is an array
 * of data (animations, height etc.).
 */
import Sprites from "@resources/sprites/sprites.json";

/**
 * A Sprite Node should have the Image and Position.
 * An Animated Sprite Node should have Image, Position and Animation.
 * The scale of all sprites should be known by Graphics.
 * Create Resource component that stores filepath and the file?
 * Create Image Node which has Resource, Offset and Size?
 * Animation is a component?
 * Resource System loads resources when they should load (they have shouldLoad and isLoaded booleans).
 * A Tiles component should have a list of Images and Positions.
 * An Animated Tiles component should have a list of Image, Position and Animation.
 * Map entity should have Tiles and Animated Tiles components.
 * 
 * Instead, Tileset image is in Graphics, the draw functions for it as well, taking Tile as parameter.
 * Map entity would have a StaticRenderer component with a list of static tiles. Also AnimatedRenderer.
 * A renderer component should give to the RenderSystem exactly what to render. It'll always be images.
 * SpriteRenderer is a component with Sprite, flipX/Y : booleans.
 * Sprite has Image, ImageRect (which part of the image is the sprite), ImageRectOffset. Is just a class, not a component.
 * 
 * Make MobileStaticRenderSystem, MobileAnimatedRenderSystem and Desktop counterparts.
 * 
 * 
 * SpriteSystem will use function getsprite to get the sprite from SpriteRenderer.
 * The get Sprite function will return the name of the sprite only, and SpriteRenderSystem
 * will find the spritein Graphics. Somewhere will find if is hurt and get hurt sprite.
 */

interface AnimationGroupData {
  [name: string]: { length: number, row: number, speed: number };
}

let foregroundCanvas: HTMLCanvasElement = <HTMLCanvasElement>assert(document.getElementById("foreground"), "Document doesn't have foreground canvas.");
let backgroundCanvas: HTMLCanvasElement = <HTMLCanvasElement>assert(document.getElementById("background"), "Document doesn't have background canvas.");
let canvas: HTMLCanvasElement = <HTMLCanvasElement>assert(document.getElementById("entities"), "Document doesn't have entities canvas.");

export let foregroundContext: CanvasRenderingContext2D = assert(foregroundCanvas.getContext("2d"), `Couldn't get foreground canvas' "2d" context.`);
export let backgroundContext: CanvasRenderingContext2D = assert(backgroundCanvas.getContext("2d"), `Couldn't get background canvas' "2d" context.`);
export let context: CanvasRenderingContext2D = assert(canvas.getContext("2d"), `Couldn't get entities canvas' "2d" context.`);

export let upscaledRendering: boolean = false;
export let supportsSilhouettes: boolean = true;
export let scale: number;
export let tilesize: number = 16;

// TODO: change to functions, let these private
export let isTablet: boolean = Detect.isTablet(window.innerWidth);
export let isMobile: boolean = false;
export let isDesktop: boolean = !(isMobile || isTablet);

export let FPS = 50;

let spritesets: { [index: string]: Sprite }[] = [];
spritesets[0] = {};
spritesets[1] = {};
spritesets[2] = {};

export let sprites: { [index: string]: Sprite } = {};
export let hurtSprites: { [index: string]: Sprite } = {};
export let silhouetteSprites: { [index: string]: Sprite } = {};
export let areSilhouetteSpritesLoaded = false;
export let shadowSprites: { [index: string]: Sprite } = {};
export let cursorSprites: { [index: string]: Sprite } = {};
export let areSpritesLoaded: boolean = false;

export enum SpriteType {
  Normal, Hurt, Silhouette, Shadow, Cursor
};

let tilesetCount: number;
let tilesets: (HTMLImageElement | null)[];
export let tilesetsLoaded: boolean = false;
let loadMultiTilesheets: boolean = !upscaledRendering;
let currentTilesetIndex: number;

let currentCursor: Sprite;
export let SetCursor = function (name: string): void {
  if (name in cursorSprites) {
    currentCursor = cursorSprites[name];
    //currentCursorOrientation = orientation;
  }
  else {
    Logger.log("Unknown cursor name :" + name, Logger.LogType.Error);
  }
};
export let GetCurrentTileset = function (): HTMLImageElement {
  return assert(tilesets[currentTilesetIndex], `Tilesets doesn't contain index ${currentTilesetIndex}.`);
};

interface SpriteFileData {
  id: string,
  width: number,
  height: number,
  animations?: { [index: string]: { length: number, row: number, speed: number } };
  offset_x: number,
  offset_y: number
}
let SpritesData = {} as { [index: string]: SpriteFileData };

//
for (let i = 0, len = Sprites.Sprites.length; i < len; i++) {
  let element = Sprites.Sprites[i];
  SpritesData[element.id] = element;
}

(function () {
  let tileset1: HTMLImageElement | null = null;
  let tileset2: HTMLImageElement | null = null;
  let tileset3: HTMLImageElement | null = null;

  let loadTileset = function (filepath: string) {
    let tileset = new Image();
    tileset.src = filepath;

    Logger.addToGroup(`Loading Tileset: ${filepath}`, `Load Tileset`, Logger.LogType.Info);

    tileset.onload = function () {
      if (tileset.width % tilesize > 0) {
        throw Error("Tileset size should be a multiple of " + tilesize);
      }
      Logger.addToGroup(`Map tileset loaded.`, `Load Tileset`, Logger.LogType.Info);

      tilesetCount -= 1;
      if (tilesetCount === 0) {
        Logger.addToGroup(`All map tilesets loaded.`, `Load Tileset`, Logger.LogType.Info);
        Logger.printGroup(`Load Tileset`);

        tilesetsLoaded = true;

        currentTilesetIndex = upscaledRendering ? 0 : scale - 1;
      }
    };

    return tileset;
  }

  if (!loadMultiTilesheets) {
    tilesetCount = 1;
    tileset1 = loadTileset(Assets.PathToTilesetImage("tilesheet", 1));
  }
  else {
    if (isMobile || isTablet) {
      tilesetCount = 1;
      tileset2 = loadTileset(Assets.PathToTilesetImage("tilesheet", 2));
    }
    else {
      tilesetCount = 2;
      tileset2 = loadTileset(Assets.PathToTilesetImage("tilesheet", 2));
      tileset3 = loadTileset(Assets.PathToTilesetImage("tilesheet", 3));
    }
  }

  tilesets = [tileset1, tileset2, tileset3];
})();

export let getWidth = function (): number {
  return canvas.width;
}

export let getHeight = function (): number {
  return canvas.height;
}

export let updateScale = function (): void {
  let w = window.innerWidth, h = window.innerHeight;
  isMobile = false;

  if (w <= 1000) {
    scale = 2;
    isMobile = true;
  }
  else if (w <= 1500 || h <= 870) {
    scale = 2;
  }
  else {
    scale = 3;
  }
}

updateScale();

/**
 * Updates scale and adjusts font and sprites.
 */
export let Resize = function (init: boolean) {
  updateScale();

  context.imageSmoothingEnabled = false;
  backgroundContext.imageSmoothingEnabled = false;
  foregroundContext.imageSmoothingEnabled = false;

  InitFont();
  FPS = 50;

  if (!upscaledRendering) currentTilesetIndex = scale - 1;

  SetSpriteScale(init);
}

/**
 * Updates the sprites letiable to the right scale.
 * Initializes hurt, shadow and cursor sprites if init is true.
 */
export let SetSpriteScale = function (init: boolean) {
  if (upscaledRendering) {
    sprites = spritesets[0];
  }
  else {
    sprites = spritesets[scale - 1];
  }
  if (init) {
    // Reload all hurt, shadow and cursor sprites
    initHurtSprites();
    initShadows();
    initCursors();
    /*if (isDesktop) {
        // TODO: if it's done without workers it hangs the page for some time. If it's done with workers
        // the way it's configured, it doesn't hang but takes too (too) long
        if (!!(<any>window).Worker) {
            initSilhouettesWorker();
        }
    }*/
  }
}

let InitFont = function () {
  let fontsize: number;

  switch (scale) {
    case 2:
      fontsize = Detect.isWindows() ? 10 : 13; break;
    case 3:
      fontsize = 20; break;
    default:
      fontsize = 10; break;
  }

  SetFontSize(fontsize);
}

let SetFontSize = function (size: number): void {
  let font = size + "px GraphicPixel";

  context.font = font;
  backgroundContext.font = font;
}

export let GetFontName = function (size: number) {
  return size + "px GraphicPixel";
}

export enum Context {
  /**
   * Where entities are drawn.
   */
  Normal,
  /**
   * Only used in non-desktop versions, for high tiles.
   */
  Foreground,
  /**
   * Used for terrain.
   */
  Background
}

let GetContext = function (ctx: Context) {
  switch (ctx) {
    case Context.Normal: return context;
    case Context.Background: return backgroundContext;
    case Context.Foreground: return foregroundContext;
    default: return context;
  }
}

let GetCanvas = function (ctx: Context) {
  switch (ctx) {
    case Context.Normal: return canvas;
    case Context.Background: return backgroundCanvas;
    case Context.Foreground: return foregroundCanvas;
    default: return canvas;
  }
}

export let ClearScreen = function (ctx: Context) {
  let ct = GetContext(ctx);
  let ca = GetCanvas(ctx);
  ct.clearRect(0, 0, ca.width, ca.height);
}

export let ClearRect = function (ctx: Context, rect: Rect) {
  let ct = GetContext(ctx);
  ct.clearRect(rect.x, rect.y, rect.width, rect.height);
}

export let GetTilePosition = function (cellid: number, gridW: number) {
  return new Position2D(getX(cellid + 1, gridW) * tilesize, Math.floor(cellid / gridW) * tilesize);
}

/**
 * 
 * @param ct The context in which to draw the tile.
 * @param tileid The position of the tile in the tilesheet.
 * @param setW Total width of tileset, measured in tiles (not pixels).
 * @param gridW Total width of map, measured in tiles.
 * @param cellid Represents the grid position of tile.
 */
export let DrawTile = function (ct: Context, tileid: number, setW: number, gridW: number, cellid: number) {
  let s = upscaledRendering ? 1 : scale;
  if (tileid !== -1) { // -1 when tile is empty in Tiled. Don't attempt to draw it.
    let rect: Rect = {
      x: getX(tileid + 1, (setW / s)) * tilesize,
      y: Math.floor(tileid / (setW / s)) * tilesize,
      width: tilesize,
      height: tilesize,
      left: getX(cellid + 1, gridW) * tilesize,
      bottom: Math.floor(cellid / gridW) * tilesize
    };

    GetContext(ct).drawImage(GetCurrentTileset(),
      rect.x * s,
      rect.y * s,
      rect.width * s,
      rect.height * s,
      rect.left! * scale,
      rect.bottom! * scale,
      rect.width * scale,
      rect.height * scale);
  }
}

export let DrawSprite = function (spriteName: string, position: Position2D, alpha: number,
  flipX?: boolean, flipY?: boolean, hurt?: boolean, silhouette?: boolean, srcPos?: Coordinate) {
  // Get which image from whole sprite should draw
  let os = upscaledRendering ? 1 : scale;
  let ds = upscaledRendering ? scale : 1;
  let sprite = sprites[spriteName];

  let w = sprite.imageRect.width * os,
    h = sprite.imageRect.height * os,
    dx = position.x * scale,    // This + offset is where to draw
    dy = position.y * scale,
    dw = w * ds,
    dh = h * ds,
    offsetX = sprite.imageRect.x * scale,
    offsetY = sprite.imageRect.y * scale;

  context.save();

  context.globalAlpha = alpha;
  if (flipX) {
    context.translate(dx + tilesize * scale, dy);
    context.scale(-1, 1);
  }
  else if (flipY) {
    context.translate(dx, dy + dh);
    context.scale(1, -1);
  }
  else {
    context.translate(dx, dy);
  }

  // Draw the sprite
  let x = srcPos ? srcPos.x * os : 0;
  let y = srcPos ? srcPos.y * os : 0;
  context.drawImage(sprite.image, x, y, w, h, offsetX, offsetY, dw, dh);

  // Draw hurt sprite
  if (hurt) {
    let hurtSprite = GetHurtSprite(sprite);
    if (hurtSprite != null && hurtSprite.isLoaded)
      context.drawImage(hurtSprite.image, x, y, w, h, offsetX, offsetY, dw, dh);
  }
  // Draw silhouette
  if (silhouette && isDesktop) {
    let silhouetteSprite = GetSilhouetteSprite(sprite);
    if (silhouetteSprite != null)
      context.drawImage(silhouetteSprite.image, x, y, w, h, offsetX, offsetY, dw, dh);
  }

  context.restore();
}

export let DrawShadow = function (position: Position2D, offset: number) {
  let os = upscaledRendering ? 1 : scale;
  let ds = upscaledRendering ? scale : 1;
  let sprite = sprites["shadow16"];
  let x = sprite.imageRect.x * os,
    y = sprite.imageRect.y * os,
    w = sprite.imageRect.width * os,
    h = sprite.imageRect.height * os,
    dx = position.x * scale,    // This + offset is where to draw
    dy = position.y * scale,
    dw = w * ds,
    dh = h * ds;

  context.save();

  context.translate(dx, dy);

  context.drawImage(sprite.image, x, y, w, h, 0, offset, dw, dh);

  context.restore();
}

export let DrawText = function (text: Text, position: Coordinate): void {
  context.save();
  if (text.centered) {
    context.textAlign = "center";
  }
  if (text.fontSize) SetFontSize(text.fontSize);
  context.globalAlpha = text.alpha;
  context.strokeStyle = text.strokeColor || "#373737";
  context.lineWidth = text.strokeSize || (scale == 3 ? 5 : 3);
  context.strokeText(text.text, position.x * scale, position.y * scale);
  context.fillStyle = text.fillStyle || "white";
  context.fillText(text.text, position.x * scale, position.y * scale);
  context.restore();
}

export let DrawString = function (s: string, pos: Coordinate): void {
  DrawText(new Text(s, false), pos);
}

export let GetHurtSprite = function (original: Sprite): Sprite {
  if (!(original.name in hurtSprites)) {
    console.log("Creating hurt sprite: " + original.name);
    hurtSprites[original.name] = CreateHurtSprite(original);
  }
  return hurtSprites[original.name];
}

export let GetSilhouetteSprite = function (original: Sprite): Sprite {
  /*if (!(original.name in silhouetteSprites)) {
      console.log("Creating silhouette sprite: " + original.name);
      silhouetteSprites[original.name] = CreateSilhouetteSprite(original);
  }
  return silhouetteSprites[original.name];*/
  return null;
}

let CreateHurtSprite = function (original: Sprite): Sprite {
  let c = document.createElement('canvas'),
    ctx = assert(c.getContext('2d'), `Couldn't get "2d" context to create hurt sprite for ${original.name}`),
    width = original.image.width,
    height = original.image.height,
    spriteData: ImageData, data;

  c.width = width;
  c.height = height;
  ctx.drawImage(original.image, 0, 0, width, height);
  spriteData = ctx.getImageData(0, 0, width === 0 ? 1 : width, height === 0 ? 1 : height);

  data = spriteData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = data[i + 2] = 75;
  }

  let finalData = new ImageData(data, spriteData.width, spriteData.height);

  ctx.putImageData(finalData, 0, 0);

  let image = new Image(width, height);
  let name = original.name + "_white";
  image.id = original.name;
  let newSprite = new Sprite(name, image, original.imageRect);
  newSprite.image.src = c.toDataURL();
  newSprite.image.onload = function () {
    newSprite.isLoaded = true;
  };

  return newSprite;
}

export let CreateSilhouetteSprite = function (original: Sprite) {
  let c = document.createElement('canvas'),
    ctx = assert(c.getContext('2d'), `Couldn't get "2d" context to create silhouette sprite for ${original.name}.`),
    width = original.image.width,
    height = original.image.height,
    data: Uint8ClampedArray,
    fdata: Uint8ClampedArray;

  c.width = width;
  c.height = height;
  ctx.drawImage(original.image, 0, 0, width, height);
  let imageData = ctx.getImageData(0, 0, width === 0 ? 1 : width, height === 0 ? 1 : height);
  data = imageData.data;
  fdata = new Uint8ClampedArray(data.length);

  let getIndex = function (x: number, y: number) {
    return ((width * (y - 1)) + x - 1) * 4;
  };

  let getPosition = function (i: number) {
    let x, y;

    i = (i / 4) + 1;
    x = i % width;
    y = ((i - x) / width) + 1;

    return { x: x, y: y };
  };

  let hasAdjacentPixel = function (i: number) {
    let pos = getPosition(i);

    if (pos.x < width && !isBlankPixel(getIndex(pos.x + 1, pos.y))) {
      return true;
    }
    if (pos.x > 1 && !isBlankPixel(getIndex(pos.x - 1, pos.y))) {
      return true;
    }
    if (pos.y < height && !isBlankPixel(getIndex(pos.x, pos.y + 1))) {
      return true;
    }
    if (pos.y > 1 && !isBlankPixel(getIndex(pos.x, pos.y - 1))) {
      return true;
    }
    return false;
  };

  let isBlankPixel = function (i: number) {
    if (i < 0 || i >= data.length) {
      return true;
    }
    return data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] === 0;
  };

  for (let i = 0; i < data.length; i += 4) {
    if (isBlankPixel(i) && hasAdjacentPixel(i)) {
      fdata[i] = fdata[i + 1] = 255;
      fdata[i + 2] = 150;
      fdata[i + 3] = 150;
    }
  }

  let finalData = new ImageData(fdata, imageData.width, imageData.height);

  ctx.putImageData(finalData, 0, 0);

  let image = new Image(width, height);
  let name = original.name + "_silhouette";
  let newSprite = new Sprite(name, image, original.imageRect);
  newSprite.image.id = name;
  newSprite.image.src = c.toDataURL();

  return newSprite;
}

let CreateAnimations = function (data: AnimationGroupData, sprite: Sprite) {
  for (let name in data) {
    let a = data[name];
    let anim: Animation = {
      length: a.length,
      row: a.row,
      speed: a.speed,
      name
    };
    sprite.animations[name] = anim;
  }
}

export let LoadSprites = function () {
  Logger.log("Loading sprites...", Logger.LogType.Info);
  spritesets = [];
  spritesets[0] = {};
  spritesets[1] = {};
  spritesets[2] = {};

  for (let name in SpritesData) {
    if (name === "impact") continue;
    let sprite = SpritesData[name] as SpriteFileData;
    if (upscaledRendering) {
      let s = LoadSprite(name, 1, sprite);
      spritesets[0][name] = s;
      if (sprite.animations) CreateAnimations(sprite.animations, s);
    }
    else {
      let s = LoadSprite(name, 2, sprite);
      spritesets[1][name] = s;
      if (sprite.animations) CreateAnimations(sprite.animations, s);
      if (!isMobile && !isTablet) {
        let s = LoadSprite(name, 3, sprite);
        spritesets[2][name] = s;
        if (sprite.animations) CreateAnimations(sprite.animations, s);
      }
    }
  }

  let waitForLoad = window.setInterval(() => {
    if (AreAllSpritesLoaded()) {
      if (upscaledRendering) {
        sprites = spritesets[0];
      }
      else {
        sprites = spritesets[scale - 1];
      }
      window.clearInterval(waitForLoad);
      areSpritesLoaded = true;
    }
  }, 1000);
}

let AreAllSpritesLoaded = function (): boolean {
  if (_.any(sprites, function (sprite) { return !sprite.isLoaded; })) {
    return false;
  }
  return true;
}

let LoadSprite = function (name: string, s: number, data: SpriteFileData) {
  let im = new Image();
  let offset = new Position2D(
    (data.offset_x !== undefined) ? data.offset_x : -16,
    (data.offset_y !== undefined) ? data.offset_y : -16
  );
  let imageRect = {
    x: offset.x, y: offset.y, width: data.width, height: data.height
  };
  let sprite: Sprite = new Sprite(name, im, imageRect, 1);
  let filepath = Assets.PathToSpriteImage(name, s);
  sprite.image.src = filepath;
  sprite.image.onload = function () {
    sprite.isLoaded = true;
  };

  return sprite;
}

export let initHurtSprites = function () {
  GameTypes.forEachArmorKind(function (kind, kindName) {
    hurtSprites[kindName] = CreateHurtSprite(sprites[kindName]);
  });
}

/**
 * Initializes the silhouettes. Hangs the page for ~2 seconds.
 */
/*let initSilhouettes = function () {
    GameTypes.forEachMobOrNpcKind(function(kind, kindName) {
        silhouetteSprites[kindName] = CreateSilhouetteSprite(sprites[kindName]);
    });
    silhouetteSprites["chest"] = CreateSilhouetteSprite(sprites["chest"]);
    silhouetteSprites["item-cake"] = CreateSilhouetteSprite(sprites["item-cake"]);
}*/
/**
 * Uses web workers to setup silhouetters, making the game not hang on the intro
 */
/*let initSilhouettesWorker = function () {
    // Create the worker that will iterate over the pixel data to
    // create the silhouette data
    let worker = createWorker(function (event) {
        let getIndex = function(x : number, y : number) {
            return ((event.data.width * (y-1)) + x - 1) * 4;
        };
    
        let getPosition = function(i : number) {
            let x, y;
    
            i = (i / 4) + 1;
            x = i % event.data.width;
            y = ((i - x) / event.data.width) + 1;
    
            return { x: x, y: y };
        };
    
        let hasAdjacentPixel = function(i : number) {
            let pos = getPosition(i);
    
            if (pos.x < event.data.width && !isBlankPixel(getIndex(pos.x + 1, pos.y))) {
                return true;
            }
            if (pos.x > 1 && !isBlankPixel(getIndex(pos.x - 1, pos.y))) {
                return true;
            }
            if (pos.y < event.data.height && !isBlankPixel(getIndex(pos.x, pos.y + 1))) {
                return true;
            }
            if (pos.y > 1 && !isBlankPixel(getIndex(pos.x, pos.y - 1))) {
                return true;
            }
            return false;
        };
    
        let isBlankPixel = function (i : number) {
            if (i < 0 || i >= event.data.data.length) {
                return true;
            }
            return event.data.data[i] === 0 && event.data.data[i+1] === 0 && event.data.data[i+2] === 0 && event.data.data[i+3] === 0;
        };
    
        for (let i = 0; i < event.data.data.length; i += 4) {
            if (isBlankPixel(i) && hasAdjacentPixel(i)) {
                event.data.fdata[i] = event.data.fdata[i+1] = 255;
                event.data.fdata[i+2] = 150;
                event.data.fdata[i+3] = 150;
            }
        }
        // Send back the updated data
        self.postMessage(event.data, undefined);
    });

    // Just to keep information, because they can't be passed to worker
    let dataSets : { [kindName : string] : { ctx : CanvasRenderingContext2D, c : HTMLCanvasElement } } = {};

    let counter = 0;

    // Once a worker has finished, create the sprite itself
    worker.onmessage = function (event) {
        let finalData = new ImageData(event.data.fdata, event.data.width, event.data.height);
        
        dataSets[event.data.kindName].ctx.putImageData(finalData, 0, 0);
        
        let image = new Image(event.data.width, event.data.height);
        let name = event.data.name + "_silhouette";
        let newSprite = new Sprite(name, image, event.data.imageRect);
        newSprite.image.id = name;
        newSprite.image.src = dataSets[event.data.kindName].c.toDataURL();
        
        silhouetteSprites[event.data.kindName] = newSprite;
        counter--;
        if (counter === 0) {
            areSilhouetteSpritesLoaded = true;
        }
    };

    // Calls the worker after setting up the data
    let processEntity = function (kindName : string) {
        let original = sprites[kindName];
        let c = document.createElement('canvas'),
            ctx = assert(c.getContext('2d'), `Couldn't get "2d" context to create silhouette sprite for ${original.name}.`),
            width = original.image.width,
            height = original.image.height,
            data : Uint8ClampedArray,
            fdata : Uint8ClampedArray;
    
        c.width = width;
        c.height = height;
        ctx.drawImage(original.image, 0, 0, width, height);
        let imageData = ctx.getImageData(0, 0, width === 0 ? 1 : width, height === 0 ? 1 : height);
        data = imageData.data;
        fdata = new Uint8ClampedArray(data.length);

        dataSets[kindName] = { ctx, c };

        worker.postMessage({ width, height, data, fdata, name : original.name, imageRect : original.imageRect, kindName });
    }

    // Now do it
    GameTypes.forEachMobOrNpcKind(function(kind, kindName) {
        ++counter;
        processEntity(kindName);
    });
    ++counter;
    processEntity("chest");
    ++counter;
    processEntity("item-cake");
}*/
/*
let initSilhouettesWorker = function () {
    // Create the worker that will iterate over the pixel data to
    // create the silhouette data

    type dataType = {
        widths : number[],
        heights : number[],
        datas : Uint8ClampedArray[],
        fdatas : Uint8ClampedArray[],
        names : string[],
        imageRects : Rect[],
        kindNames : string[]
    }
    let worker = createWorker(function (event) {
        let getIndex = function(x : number, y : number, width : number) {
            return ((width * (y-1)) + x - 1) * 4;
        };
    
        let getPosition = function(i : number, width : number) {
            let x, y;
    
            i = (i / 4) + 1;
            x = i % width;
            y = ((i - x) / width) + 1;
    
            return { x: x, y: y };
        };
    
        let hasAdjacentPixel = function(i : number, data : Uint8ClampedArray, width : number, height : number) {
            let pos = getPosition(i, width);
    
            if (pos.x < width && !isBlankPixel(getIndex(pos.x + 1, pos.y, width), data)) {
                return true;
            }
            if (pos.x > 1 && !isBlankPixel(getIndex(pos.x - 1, pos.y, width), data)) {
                return true;
            }
            if (pos.y < height && !isBlankPixel(getIndex(pos.x, pos.y + 1, width), data)) {
                return true;
            }
            if (pos.y > 1 && !isBlankPixel(getIndex(pos.x, pos.y - 1, width), data)) {
                return true;
            }
            return false;
        };
    
        let isBlankPixel = function (i : number, data : Uint8ClampedArray) {
            if (i < 0 || i >= data.length) {
                return true;
            }
            return data[i] === 0 && data[i+1] === 0 && data[i+2] === 0 && data[i+3] === 0;
        };
        let data : dataType = event.data;
        for (let i = 0, len = data.kindNames.length; i < len; ++i) {
            for (let j = 0; j < data.datas[i].length; j += 4) {
                if (isBlankPixel(j, data.datas[i]) && hasAdjacentPixel(j, data.datas[i], data.widths[i], data.heights[i])) {
                    data.fdatas[i][j] = data.fdatas[i][j+1] = 255;
                    data.fdatas[i][j+2] = 150;
                    data.fdatas[i][j+3] = 150;
                }
            }
            
        }
        // Send back the updated data
        self.postMessage(event.data, undefined);
    });

    // Just to keep information, because they can't be passed to worker
    let dataSets : { [kindName : string] : { ctx : CanvasRenderingContext2D, c : HTMLCanvasElement } } = {};

    let counter = 0;

    let widths : number[] = [];
    let heights : number[] = [];
    let datas : Uint8ClampedArray[] = [];
    let fdatas : Uint8ClampedArray[] = [];
    let names : string[] = [];
    let imageRects : Rect[] = [];
    let kindNames : string[] = [];


    // Once a worker has finished, create the sprite itself
    worker.onmessage = function (event) {
        for (let i = 0, len = event.data.kindNames.length; i < len; ++i) {
            let finalData = new ImageData(event.data.fdatas[i], event.data.widths[i], event.data.heights[i]);
            
            dataSets[event.data.kindNames[i]].ctx.putImageData(finalData, 0, 0);
            
            let image = new Image(event.data.widths[i], event.data.heights[i]);
            let name = event.data.names[i] + "_silhouette";
            let newSprite = new Sprite(name, image, event.data.imageRects[i]);
            newSprite.image.id = name;
            newSprite.image.src = dataSets[event.data.kindNames[i]].c.toDataURL();
            
            silhouetteSprites[event.data.kindNames[i]] = newSprite;
            counter--;
            if (counter === 0) {
                areSilhouetteSpritesLoaded = true;
            }
        }
    };

    // Calls the worker after setting up the data
    let processEntity = function (kindName : string) {
        let original = sprites[kindName];
        let c = document.createElement('canvas'),
            ctx = assert(c.getContext('2d'), `Couldn't get "2d" context to create silhouette sprite for ${original.name}.`),
            width = original.image.width,
            height = original.image.height,
            data : Uint8ClampedArray,
            fdata : Uint8ClampedArray;
    
        c.width = width;
        c.height = height;
        ctx.drawImage(original.image, 0, 0, width, height);
        let imageData = ctx.getImageData(0, 0, width === 0 ? 1 : width, height === 0 ? 1 : height);
        data = imageData.data;
        fdata = new Uint8ClampedArray(data.length);

        dataSets[kindName] = { ctx, c };
        widths.push(width);
        heights.push(height);
        datas.push(data);
        fdatas.push(fdata);
        names.push(original.name);
        imageRects.push(original.imageRect);
        kindNames.push(kindName);
    }

    // Now do it
    GameTypes.forEachMobOrNpcKind(function(kind, kindName) {
        ++counter;
        processEntity(kindName);
    });
    ++counter;
    processEntity("chest");
    ++counter;
    processEntity("item-cake");

    worker.postMessage({ widths, heights, datas, fdatas, names, imageRects, kindNames });
}*/

export let initShadows = function () {
  shadowSprites["small"] = sprites["shadow16"];
}

export let initCursors = function () {
  cursorSprites["hand"] = sprites["hand"];
  cursorSprites["sword"] = sprites["sword"];
  cursorSprites["loot"] = sprites["loot"];
  cursorSprites["target"] = sprites["target"];
  cursorSprites["talk"] = sprites["talk"];
}

export let setDimensions = function (width: number, height: number) {
  canvas.width = width * tilesize * scale;
  canvas.height = height * tilesize * scale;

  backgroundCanvas.width = canvas.width;
  backgroundCanvas.height = canvas.height;

  foregroundCanvas.width = canvas.width;
  foregroundCanvas.height = canvas.height;

  Logger.addToGroup(`Entities set to ${canvas.width} x ${canvas.height}`, `Set Canvas Dimensions`, Logger.LogType.Debug);
  Logger.addToGroup(`Background set to ${backgroundCanvas.width} x ${backgroundCanvas.height}`, `Set Canvas Dimensions`, Logger.LogType.Debug);
  Logger.addToGroup(`Foreground set to ${foregroundCanvas.width} x ${foregroundCanvas.height}`, `Set Canvas Dimensions`, Logger.LogType.Debug);
  Logger.printGroup(`Set Canvas Dimensions`);
}

export let getX = function (id: number, w: number) {
  if (id == 0) {
    return 0;
  }
  return (id % w == 0) ? w - 1 : (id % w) - 1;
}

/**
 * Draws a cell rect in the entities canvas' context.
 */
export let DrawCellRect = function (p: { x: number, y: number }, color: string): void {
  context.save();
  context.lineWidth = 2 * scale;
  context.strokeStyle = color;
  context.translate(p.x + 2, p.y + 2);
  context.strokeRect(0, 0, (tilesize * scale) - 4, (tilesize * scale) - 4);
  context.restore();
}

export let DrawCellHighlight = function (p: { x: number, y: number }, color: string): void {
  DrawCellRect({ x: p.x * tilesize * scale, y: p.y * tilesize * scale }, color);
}

/**
 * Draws the cursor in the entities canvas' context.
 */
export let DrawCursor = function (pos: Position2D): void {
  let os = upscaledRendering ? 1 : scale;

  context.save();
  if (currentCursor && currentCursor.isLoaded) {
    context.drawImage(currentCursor.image, 0, 0, 14 * os, 14 * os,
      pos.x, pos.y, 14 * scale, 14 * scale);
  }
  context.restore();
}

export let SetView = function (c: Context, pos: Position2D) {
  GetContext(c).translate(-pos.x * scale, -pos.y * scale);
}

/**
 * Used for saving the player image to show in intro.
 */
export let GetPlayerImage = function (armorName: string, weaponName: string) {
  if (!sprites[armorName] || !sprites[weaponName]) return null;
  let canvas = document.createElement('canvas'),
    ctx = assert(canvas.getContext('2d'), `Couldn't get "2d" context to create player image.`),
    os = upscaledRendering ? 1 : scale,
    sprite = sprites[armorName],
    spriteAnim = sprite.animations["idle_down"],
    // Get the first (x = 0) idle_down sprite (spriteAnim.row)
    row = spriteAnim.row,
    w = sprite.imageRect.width * os,
    h = sprite.imageRect.height * os,
    y = row * h,
    // weapon
    weapon = sprites[weaponName],
    ww = weapon.imageRect.width * os,
    wh = weapon.imageRect.height * os,
    wy = wh * row,
    offsetX = (weapon.imageRect.x - sprite.imageRect.x) * os,
    offsetY = (weapon.imageRect.y - sprite.imageRect.y) * os,
    // shadow
    shadow = shadowSprites["small"],
    sw = shadow.imageRect.width * os,
    sh = shadow.imageRect.height * os,
    ox = -sprite.imageRect.x * os,
    oy = -sprite.imageRect.y * os;

  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(shadow.image, 0, 0, sw, sh, ox, oy, sw, sh);
  ctx.drawImage(sprite.image, 0, y, w, h, 0, 0, w, h);
  ctx.drawImage(weapon.image, 0, wy, ww, wh, offsetX, offsetY, ww, wh);

  return canvas.toDataURL("image/png");
}