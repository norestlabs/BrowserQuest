import * as _ from "underscore";

export default class UEvent<T extends Function> {
    listeners : Array<T>;
    listenersCallers : Array<any>;
    Raise : T;
    RaiseAndClear : T;

    constructor () {
        this.listeners = [];
        this.listenersCallers = [];

        let self = this;
        this.Raise = <any>function (...args : any[]) {
            let returnValue : any = null;
            for (let i = 0; i < self.listeners.length; ++i) {
                returnValue = self.listeners[i].apply(self.listenersCallers[i], args);
            }
            return returnValue;
        }

        this.RaiseAndClear = <any>function (...args : any[]) {
            let returnValue : any = null;

            let tempListeners = self.listeners.slice(0);
            let tempListenersCallers = self.listenersCallers.slice(0);
            self.listeners = [];
            self.listenersCallers = [];

            for (let i = 0; i < tempListeners.length; ++i) {
                returnValue = tempListeners[i].apply(tempListenersCallers[i], args);
            }
            return returnValue;
        }
    }

    public get HasListeners () : boolean {
        return this.listeners.length > 0;
    }

    public Add (method : T, caller : any) : void {
        this.listeners.push(method);
        this.listenersCallers.push(caller);
    }
    public Remove (method : T) : void {
        let index = _.indexOf(this.listeners, method);
        if (index != -1) {
            this.listeners.splice(index, 1);
            this.listenersCallers.splice(index, 1);
        }
    }
    public Clear () : void {
        this.listeners = [];
        this.listenersCallers = [];
    }
}