import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import { Position2D, Coordinate } from "@common/position";

export enum DestinationType {
    Point,
    Around
}

export default class Movable implements Component {
    static c_name : string = "Movable";
	static c_id : Bitfield;
    enabled = true;

    /**
     * Used to know how much to move per frame.
     * 
     * @type {number}
     * @memberof Movable
     */
    speed : number = 120;

    wait : boolean = false;
    waitTime : number = 0;
    isInTransition : boolean = false;
    elapsedTransitionTime : number = 0;

    /**
     * The current step in the path array.
     * 
     * @type {number}
     * @memberof Movable
     */
    currentStep : number = 0;

    nextGridPosition : Position2D = new Position2D(-1, -1);

    /**
     * Array of positions (x,y).
     * 
     * @type {Position2D[]}
     * @memberof Movable
     */
    path : Coordinate[] | null = null;
    public destination : Position2D | null = null;
    private destinationType : DestinationType = DestinationType.Point;
    public hasDestination () : boolean {
        return this.destination !== null;
    }
    public getDestination () : Position2D | null {
        return this.destination;
    }
    /**
     * Takes into consideration if the entity is moving.
     * If so, the newDestination property is set instead.
     * 
     * @memberof Movable
     */
    public setDestination (pos : Position2D, type : DestinationType) {
        if (this.destination !== null && pos.equals(this.destination)) return;

        if (this.isMoving()) this.newDestination = pos;
        else this.destination = pos;
        this.destinationType = type;
    }

    public removeDestination () {
        this.destination = null;
    }

    public getDestinationType () : DestinationType {
        return this.destinationType;
    }

    newDestination : Position2D | null = null;
    
    interrupted : boolean;

    public isMoving() {
        return this.path !== null;
    }

    hasNextStep() {
        return (this.path !== null && this.path.length - 1 > this.currentStep);
    }

    /**
     * Stops a moving character.
     */
    stop() {
        if (this.isMoving()) {
            this.interrupted = true;
        }
    }

    hasChangedItsPath () {
        return this.newDestination !== null;
    }
}