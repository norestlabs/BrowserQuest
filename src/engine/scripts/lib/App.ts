import * as Utils from "@utils/utils";

export let supportsWorkers = !!(<any>window).Worker;

let inputName = $('#nameinput');
let inputAddr = $('#nameinput');
inputName.val('');
inputAddr.val('');
export let GetInputName = function () : string {
    let input = inputName.val();
    if (input != null) return input.toString();
    else return '';
}
export let GetInputAddr = function () : string {
    let input = inputAddr.val();
    if (input != null) return input.toString();
    else return '';
}
/**
 * Used to hide keyboard in mobile version.
 */
export let BlurInputName = function () : void {
    inputName.blur();
}

let playerName = $('#playername');
export let GetPlayerName = function () : string {
    return playerName.html().toString();
}

let playerAddr = $('#playeraddr');
export let GetPlayerAddr = function () : string {
    return playerAddr.html().toString();
}

let createCharacterPlayButton = $('#createcharacter .play');
export let GetCreateCharacterPlayButton = function () {
    return createCharacterPlayButton;
}

let defaultCharacter = $('#character');
export let GetDefaultCharacter = function () {
    return defaultCharacter;
}

let playButton = $('.play div');
export let OnPlayButtonClick = function (callback : (event : JQuery.Event<HTMLElement>) => void) {
    if (callback == null) playButton.unbind("click");
    else playButton.click(callback);
}

export let OnMuteButtonClick = function (callback : () => void) : void {
    $('#mutebutton').click(callback);
}

export let Center = function () {
    window.scrollTo(0, 1);
}

export let isChatOpen = function () {
    return $('#chatbox').hasClass('active');
}
export let chatHasFocus = function () {
    return $(document.activeElement).is($("#chatinput"));
}
export let focusChat = function () {
    $('#chatinput').focus();
}
export let showChat = function () {
    $('#chatbox').addClass('active');
    $('#chatinput').focus();
    $('#chatbutton').addClass('active');
}

export let hideChat = function () {
    $('#chatbox').removeClass('active');
    $('#chatinput').blur();
    $('#chatinput').val("");
    $('#chatbutton').removeClass('active');
    $('#foreground').focus();
}

export let getChatText = function () : string {
    return $('#chatinput').val().toString();
}

export let toggleInstructions = function () {
    if($('#achievements').hasClass('active')) {
        toggleAchievements();
        $('#achievementsbutton').removeClass('active');
    }
    $('#instructions').toggleClass('active');
}

export let toggleAchievements = function () {
    if($('#instructions').hasClass('active')) {
        toggleInstructions();
        $('#helpbutton').removeClass('active');
    }
    resetPage();
    $('#achievements').toggleClass('active');
}

export let currentPage = 1;
export let resetPage = function () {
    let $achievements = $('#achievements');

    if ($achievements.hasClass('active')) {
        $achievements.bind(Utils.TRANSITIONEND, function() {
            $achievements.removeClass('page' + currentPage).addClass('page1');
            currentPage = 1;
            $achievements.unbind(Utils.TRANSITIONEND);
        });
    }
}
export let previousAchievementsPage = function () {
    let $achievements = $('#achievements');

    if (currentPage === 1) {
        return false;
    }
    else {
        currentPage -= 1;
        $achievements.removeClass().addClass('active page' + currentPage);
        return true;
    }
}

export let nextAchievementsPage = function () {
    let $achievements = $('#achievements'), $lists = $('#lists');
    let nbPages = $lists.children('ul').length;

    if (currentPage === nbPages) {
        return false;
    }
    else {
        currentPage += 1;
        $achievements.removeClass().addClass('active page' + currentPage);
        return true;
    }
}

export let hideWindows = function () {
    if ($('#achievements').hasClass('active')) {
        toggleAchievements();
        $('#achievementsbutton').removeClass('active');
    }
    if ($('#instructions').hasClass('active')) {
        toggleInstructions();
        $('#helpbutton').removeClass('active');
    }
    if ($('body').hasClass('credits')) {
        closeInGameCredits();
    }
    if ($('body').hasClass('about')) {
        closeInGameAbout();
    }
}

let watchNameInputInterval = -1;
export let hideIntro = function (hidden_callback : () => void) : void {
    clearInterval(watchNameInputInterval);
    $('body').removeClass('intro');
    window.setTimeout(function() {
        $('body').addClass('game');
        hidden_callback();
    }, 1000);
}

export let toggleButton = function () {
    let name = GetInputName();
    let addr = GetInputAddr();
    let button = GetCreateCharacterPlayButton();
    if (name.length > 0 && addr.length > 0) {
        button.removeClass('disabled');
        GetDefaultCharacter().removeClass('disabled');
    }
    else {
        button.addClass('disabled');
        GetDefaultCharacter().addClass('disabled');
    }
}

export let setToggleButtonInterval = function () {
    watchNameInputInterval = window.setInterval(toggleButton, 100);
}

let isDeathClassActive = false;
export let addDeathClass = function () {
    isDeathClassActive = true;
    $('body').addClass('death');
}
export let removeDeathClass = function () {
    isDeathClassActive = false;            
    $('body').removeClass('death');
}

export let closeInGameCredits = function () {
    $('body').removeClass('credits');
    $('#parchment').removeClass('credits');
    if (isDeathClassActive) {
        addDeathClass();
    }
}

export let closeInGameAbout = function () {
    $('body').removeClass('about');
    $('#parchment').removeClass('about');
    if(isDeathClassActive) {
        addDeathClass();
    }
    $('#helpbutton').removeClass('active');
}

export let togglePopulationInfo = function () {
    $('#population').toggleClass('visible');
}

export let animateMessages = function () {
    let $messages = $('#notifications div');

    $messages.addClass('top');
}

export let resetMessagesPosition = function () {
    let message = $('#message2').text();

    $('#notifications div').removeClass('top');
    $('#message2').text('');
    $('#message1').text(message);
}

let messageTimer = -1;
export let showMessage = function (message : string) {
    let $wrapper = $('#notifications div'),
        $message = $('#notifications #message2');

    animateMessages();
    $message.text(message);
    if (messageTimer != -1) {
        resetMessageTimer();
    }

    messageTimer = window.setTimeout(function() {
        $wrapper.addClass('top');
    }, 5000);
}

export let resetMessageTimer = function () {
    clearTimeout(messageTimer);
    messageTimer = -1;
}

export let openPopup = function (type : string, url : string) {
    let h = $(window).height(), w = $(window).width();
    let popupHeight, popupWidth, top, left;

    switch (type) {
        case 'twitter':
            popupHeight = 450;
            popupWidth = 550;
            break;
        case 'facebook':
            popupHeight = 400;
            popupWidth = 580;
            break;
    }

    if (h != null && w != null && popupHeight != null && popupWidth != null) {
        top = (h / 2) - (popupHeight / 2);
        left = (w / 2) - (popupWidth / 2);

        let newwindow = window.open(url,'name','height=' + popupHeight + ',width=' + popupWidth + ',top=' + top + ',left=' + left);
        if (newwindow !== null && newwindow.focus) {
            newwindow.focus();
        }
    }
}

export let setAchievementData = function ($el : JQuery<HTMLElement>, name : string, desc : string) {
    $el.find('.achievement-name').html(name);
    $el.find('.achievement-description').html(desc);
}

let blinkInterval = -1;
export let startAchievementButtonBlink = function () : void {
    blinkInterval = window.setInterval(() => $('#achievementsbutton').toggleClass('blink'), 500);
}
export let stopAchievementButtonBlink = function () : void {
    if (blinkInterval != -1) {
        clearInterval(blinkInterval);
        blinkInterval = -1;
    }
}

export let showAchievementNotification = function (id : number, name : string) : void {
    let $notif = $('#achievement-notification'),
        $name = $notif.find('.name'),
        $button = $('#achievementsbutton');

    $notif.removeClass().addClass('active achievement' + id);
    $name.text(name);
    window.setTimeout(function() {
        $notif.removeClass('active');
        $button.removeClass('blink');
    }, 5000);
}

export let displayUnlockedAchievement = function (id : number, name : string, hidden : boolean, desc : string) : void {
    let $achievement = $('#achievements li.achievement' + id);

    if (hidden) {
        setAchievementData($achievement, name, desc);
    }
    $achievement.addClass('unlocked');
}

export let unlockAchievement = function (id : number, name : string, hidden : boolean, desc : string) :void {
    showAchievementNotification(id, name);
    displayUnlockedAchievement(id, name, hidden, desc);

    let nb = parseInt($('#unlocked-achievements').text());
    $('#unlocked-achievements').text(nb + 1);
}

export let initAchievementList = function (achievements : { [index : string] : {name : string, desc : string, hidden? : boolean} }) {
    let $lists = $('#lists'),
        $page = $('#page-tmpl'),
        $achievement = $('#achievement-tmpl'),
        page = 0,
        count = 0,
        $p : JQuery<HTMLElement>;

    for (let id in achievements) {
        let achievement = achievements[id];
        count++;

        let $a = $achievement.clone();
        $a.removeAttr('id');
        $a.addClass('achievement' + count);
        if (!achievement.hidden) {
            setAchievementData($a, achievement.name, achievement.desc);
        }
        $a.find('.twitter').attr('href', 'http://twitter.com/share?url=http%3A%2F%2Fbrowserquest.mozilla.org&text=I%20unlocked%20the%20%27'+ achievement.name +'%27%20achievement%20on%20Mozilla%27s%20%23BrowserQuest%21&related=glecollinet:Creators%20of%20BrowserQuest%2Cwhatthefranck');
        $a.show();
        $a.find('a').click(function() {
            let url = $(this).attr('href');

            if (url != null)
                openPopup('twitter', url);

            return false;
        });

        if ((count - 1) % 4 === 0) {
            page++;
            $p = $page.clone();
            $p.attr('id', 'page'+page);
            $p.show();
            $lists.append($p);
        }
        $p!.append($a);
    }

    $('#total-achievements').text($('#achievements').find('li').length);
}

let isParchmentReady = true;
export let animateParchment = function (origin : string, destination : string, isMobile : boolean, isTablet : boolean) : void {
    let $parchment = $('#parchment'), duration = 1;

    if (isMobile) {
        $parchment.removeClass(origin).addClass(destination);
    }
    else {
        if (isParchmentReady) {
            if (isTablet) {
                duration = 0;
            }
            isParchmentReady = !isParchmentReady;

            $parchment.toggleClass('animate');
            $parchment.removeClass(origin);

            window.setTimeout(function() {
                $('#parchment').toggleClass('animate');
                $parchment.addClass(destination);
            }, duration * 1000);

            window.setTimeout(function() {
                isParchmentReady = !isParchmentReady;
            }, duration * 1000);
        }
    }
}

let previousState : string;
export let toggleCredits = function (gameStarted : boolean, isMobile : boolean, isTablet : boolean) {
    let currentState = $('#parchment').attr('class');

    if (gameStarted) {
        $('#parchment').removeClass().addClass('credits');
        
        $('body').toggleClass('credits');
            
        if (isDeathClassActive) {
            $('body').toggleClass('death');
        }
        if ($('body').hasClass('about')) {
            closeInGameAbout();
            $('#helpbutton').removeClass('active');
        }
    }
    else if (currentState != null) {
        if (currentState !== 'animate') {
            if (currentState === 'credits') {
                animateParchment(currentState, previousState, isMobile, isTablet);
            }
            else {
                animateParchment(currentState, 'credits', isMobile, isTablet);
                previousState = currentState;
            }
        }
    }
}

export let toggleAbout = function (gameStarted : boolean, isMobile : boolean, isTablet : boolean) {
    let currentState = $('#parchment').attr('class');

    if (gameStarted) {
        $('#parchment').removeClass().addClass('about');
        $('body').toggleClass('about');
        if (isDeathClassActive) {
            $('body').toggleClass('death');
        }
        if ($('body').hasClass('credits')) {
            closeInGameCredits();
        }
    }
    else if (currentState != null) {
        if (currentState !== 'animate') {
            if (currentState === 'about') {
                if (localStorage && localStorage.data) {
                    animateParchment(currentState, 'loadcharacter', isMobile, isTablet);
                }
                else {
                    animateParchment(currentState, 'createcharacter', isMobile, isTablet);
                }
            }
            else {
                animateParchment(currentState, 'about', isMobile, isTablet);
                previousState = currentState;
            }
        }
    }
}