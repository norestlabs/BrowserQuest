var Detect;
(function (Detect) {
    function supportsWebSocket() {
        return window.WebSocket || window.MozWebSocket;
    }
    Detect.supportsWebSocket = supportsWebSocket;
    ;
    function userAgentContains(s) {
        return navigator.userAgent.indexOf(s) != -1;
    }
    Detect.userAgentContains = userAgentContains;
    ;
    function isTablet(screenWidth) {
        if (screenWidth > 640) {
            if ((userAgentContains('Android') && userAgentContains('Firefox')) || userAgentContains('Mobile')) {
                return true;
            }
        }
        return false;
    }
    Detect.isTablet = isTablet;
    ;
    function isWindows() {
        return userAgentContains("Windows");
    }
    Detect.isWindows = isWindows;
    function isChromeOnWindows() {
        return userAgentContains('Chrome') && userAgentContains('Windows');
    }
    Detect.isChromeOnWindows = isChromeOnWindows;
    ;
    function canPlayMP3() {
        return Modernizr.audio.mp3;
    }
    Detect.canPlayMP3 = canPlayMP3;
    ;
    function isSafari() {
        return userAgentContains('Safari') && !userAgentContains('Chrome');
    }
    Detect.isSafari = isSafari;
    ;
    function isOpera() {
        return userAgentContains('Opera');
    }
    Detect.isOpera = isOpera;
    ;
})(Detect || (Detect = {}));
