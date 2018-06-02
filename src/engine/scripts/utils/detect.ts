module Detect {
    export function supportsWebSocket () {
        return (<any>window).WebSocket || (<any>window).MozWebSocket;
    };

    export function userAgentContains (s : string) {
        return navigator.userAgent.indexOf(s) != -1;
    };

    export function isTablet (screenWidth : number) {
        if (screenWidth > 640) {
            if ((userAgentContains('Android') && userAgentContains('Firefox')) || userAgentContains('Mobile')) {
                return true;
            }
        }
        return false;
    };

    export function isWindows () {
        return userAgentContains("Windows");
    }

    export function isChromeOnWindows () {
        return userAgentContains('Chrome') && userAgentContains('Windows');
    };

    export function canPlayMP3 () {
        return Modernizr.audio.mp3;
    };

    export function isSafari () {
        return userAgentContains('Safari') && !userAgentContains('Chrome');
    };

    export function isOpera () {
        return userAgentContains('Opera');
    };
}

export default Detect;

