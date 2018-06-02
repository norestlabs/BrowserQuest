import * as Utils from "@common/utils";

export let isInt = function (n : number) {
    return (n % 1) === 0;
};

export let TRANSITIONEND = 'transitionend webkitTransitionEnd oTransitionEnd';

Function.prototype.bind = function (bind) {
    let self = this;
    return function () {
        let args = Array.prototype.slice.call(arguments);
        return self.apply(bind || null, args);
    };
};

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimationFrame = (function(){
return  window.requestAnimationFrame       || 
        window.webkitRequestAnimationFrame || 
        (<any>window).mozRequestAnimationFrame    || 
        (<any>window).oRequestAnimationFrame      || 
        (<any>window).msRequestAnimationFrame     || 
        function (/* function */ callback : Function){
            window.setTimeout(callback, 1000 / 60);
        };
})();

export function createWorker (fn : (event : MessageEvent) => void) : Worker {
    var blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    
    return new Worker(url);
}

export function getUrl () : string {
    return `${document.location.protocol}//${document.location.host}`;
}

export { Utils };