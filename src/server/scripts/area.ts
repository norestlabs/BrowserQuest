import * as Utils from "@common/utils";
import * as _ from "underscore";
import World from "./worldserver";
import Entity from "./entity";
import Mob from "./mob";
import { Coordinate } from "@common/position";

export default class Area {

	id : number;
	x : number;
	y : number;
	width : number;
	height : number;
	world : World;
	entities : Mob[];
	hasCompletelyRespawned : boolean;
	nbEntities : number;
	empty_callback : () => void;

	constructor(id : number, x : number, y : number, width : number, height : number, world : World) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.world = world;
		this.entities = [];
		this.hasCompletelyRespawned = true;
	}

	_getRandomPositionInsideArea () : Coordinate {
		let pos = {} as Coordinate, valid = false;

		while (!valid) {
			pos.x = this.x + Utils.random(this.width + 1);
			pos.y = this.y + Utils.random(this.height + 1);
			valid = this.world.isValidPosition(pos.x, pos.y);
		}
		return pos;
	}

	removeFromArea (entity : Entity) : void {
		let i = _.indexOf(_.pluck(this.entities, 'id'), entity.id);
		this.entities.splice(i, 1);

		if (this.isEmpty() && this.hasCompletelyRespawned && this.empty_callback) {
			this.hasCompletelyRespawned = false;
			this.empty_callback();
		}
	}

	addToArea (entity : Mob) : void {
		if (entity) {
			this.entities.push(entity);
			entity.area = this;
			if (entity instanceof Mob) {
				this.world.addMob(entity);
			}
		}

		if (this.isFull()) {
			this.hasCompletelyRespawned = true;
		}
	}

	setNumberOfEntities (nb : number) : void {
		this.nbEntities = nb;
	}

	isEmpty () : boolean {
		for (let i = 0, len = this.entities.length; i < len; ++i) {
			let entity = this.entities[i];
			if (!entity.isDead) return false;
		}
		return true;
	}

	isFull () : boolean {
		return !this.isEmpty() && (this.nbEntities === _.size(this.entities));
	}

	onEmpty (callback : () => void) : void {
		this.empty_callback = callback;
	}
}
