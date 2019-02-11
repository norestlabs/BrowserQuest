import { System, registerSystem, SystemOrder } from "@engine/System";
import EntityManager from "@engine/EntityManager";
import { BroadcastEvent } from "@engine/ecs";
import * as Graphics from "@lib/Graphics";
import { Health, Lootable, Equipment } from "@components/Components";
import * as GameState from "@lib/GameState";
import * as Utils from "@utils/utils";
import * as App from "@lib/App";
import Assets from "@utils/assets";
import * as StorageManager from "@lib/StorageManager";
import * as Logger from "@lib/Logger";
import { GameEvents, isEvent } from "@lib/GameEvents";
import { Key } from "@utils/Key";
import * as Achievements from "@lib/Achievements";
import Detect from "@utils/detect";

export default class AppSystem implements System {

  s_name = "AppSystem";
  enabled = true;

  private onPlayButtonClick(event: JQuery.EventHandler<HTMLElement>): void {
    let name = App.GetInputName();
    if (name.length === 0) name = App.GetPlayerName();
    if (name.length > 0) {
      let addr = App.GetInputAddr();
      if (addr.length === 0) addr = App.GetPlayerAddr();
      if (addr.length > 0) {
        this.tryStartingGame(name, addr);
      }
    }
  }

  public awake(): void {
    $('#chatbox').attr('value', '');

    if (Graphics.isTablet) {
      $('body').addClass('tablet');
    }

    let self = this;
    App.setToggleButtonInterval();

    App.OnPlayButtonClick(this.onPlayButtonClick.bind(this));

    $('#nameinput').keypress(function (event) {
      if (event.keyCode === 13) {
        let name = App.GetInputName();
        let addr = App.GetInputAddr();
        if (name !== '' && addr !== '') {
          self.tryStartingGame(name, addr);
        }
        return false;
      }
      return true;
    });

    $('#addrinput-reset').click(e => self.getUserAddress());

    $('#resize-check').bind("transitionend", this.resizeUi.bind(this));
    $('#resize-check').bind("webkitTransitionEnd", this.resizeUi.bind(this));
    $('#resize-check').bind("oTransitionEnd", this.resizeUi.bind(this));


    if (Detect.isWindows()) {
      // Workaround for graphical glitches on text
      $('body').addClass('windows');
    }

    if (Detect.isOpera()) {
      // Fix for no pointer events
      $('body').addClass('opera');
    }

    $('.barbutton').click(function () {
      $(this).toggleClass('active');
    });

    $('#chatbutton').click(function () {
      if (GameState.currentStatus === GameState.Status.Started) {
        if ($('#chatbutton').hasClass('active')) {
          App.showChat();
        }
        else {
          App.hideChat();
        }
      }

    });

    $('#helpbutton').click(function () {
      App.toggleAbout(GameState.currentStatus === GameState.Status.Started, Graphics.isMobile, Graphics.isTablet);
    });

    $('#achievementsbutton').click(function () {
      $('#achievements').removeClass('scroll-popup');
      App.toggleAchievements();
      App.stopAchievementButtonBlink();
      $(this).removeClass('blink');
    });

    $('#instructions').click(function () {
      App.hideWindows();
    });

    $('#playercount').click(function () {
      App.togglePopulationInfo();
    });

    $('#population').click(function () {
      App.togglePopulationInfo();
    });

    $('.clickable').click(function (event) {
      event.stopPropagation();
    });

    $('#toggle-credits').click(function () {
      App.toggleCredits(GameState.currentStatus === GameState.Status.Started, Graphics.isMobile, Graphics.isTablet);
    });

    $('#create-new span').click(function () {
      App.animateParchment('loadcharacter', 'confirmation', Graphics.isMobile, Graphics.isTablet);
    });

    $('.delete').click(function () {
      BroadcastEvent(GameEvents.Player_Delete.params());
      App.animateParchment('confirmation', 'createcharacter', Graphics.isMobile, Graphics.isTablet);
      $('#playeraddr').css('opacity', 0);
      $('.addrinput').css('opacity', 0);
      $('#addrinput-reset').click();
    });

    $('#cancel span').click(function () {
      App.animateParchment('confirmation', 'loadcharacter', Graphics.isMobile, Graphics.isTablet);
    });

    $('.ribbon').click(function () {
      App.toggleAbout(GameState.currentStatus === GameState.Status.Started, Graphics.isMobile, Graphics.isTablet);
    });

    $('#nameinput').bind("keyup", function () {
      App.toggleButton();
    });

    $('#previous').click(function () {
      App.previousAchievementsPage();
    });

    $('#next').click(function () {
      App.nextAchievementsPage();
    });

    $('#notifications div').bind(Utils.TRANSITIONEND, App.resetMessagesPosition);

    $('.close').click(function () {
      App.hideWindows();
    });

    $('.twitter').click(function () {
      let url = $(this).attr('href');

      App.openPopup('twitter', url);
      return false;
    });

    $('.facebook').click(function () {
      let url = $(this).attr('href');

      App.openPopup('facebook', url);
      return false;
    });

    document.addEventListener("touchstart", function () { }, false);

    App.Center();

    // If has already played, show player's name and avatar
    let data = StorageManager.data;
    if (StorageManager.hasAlreadyPlayed()) {
      if (data.player.name && data.player.name !== "") {
        $('#playername').html(data.player.name);
        $('#playeraddr').html(data.player.addr);
        $('#playerimage').attr('src', data.player.image);
        $.get(`/user_tokens/${data.player.addr}`, ({ data }) => {
          const { armorName, weaponName } = data;
          const checkSpritesTimer = setInterval(function () {
            const image = Graphics.GetPlayerImage(armorName, weaponName);
            if (image) {
              StorageManager.savePlayer(
                image,
                armorName,
                weaponName
              );
              $('#playerimage').attr('src', StorageManager.data.player.image);
              $('#playerimage').css('opacity', 1.0);
              clearInterval(checkSpritesTimer);
            }
          }, 1000);
        });
        $('#playerimage').css('opacity', 0.6);
      }
    }

    Logger.log("App initialized.", Logger.LogType.Info);

    let addr = App.GetInputAddr();
    if (addr.length === 0) addr = App.GetPlayerAddr();
    if (addr.length === 0) this.getUserAddress();
  }

  private getUserAddress(): void {
    if (!$('#addrinput-reset').hasClass('loading'))
      $('#addrinput-reset').addClass('loading');
    // $.get('/user_tokens/0x057e31bFc9EabAdFAf175901895f8b1222f07B10', this.setUserAddress);
    $.get('/generate_address', this.setUserAddress);
  }

  private setUserAddress({ userAddr }): void {
    // $('#addrinput').val('0x057e31bFc9EabAdFAf175901895f8b1222f07B10');
    $('#addrinput').val(userAddr);
    $('#addrinput-reset').removeClass('loading');
  }

  /**
   * Tries to resize the game. Broadcasts Resize event if game has already started.
   * 
   * @memberof AppSystem
   */
  private resizeUi(): void {
    let game = EntityManager.getEntityWithTag("Game");
    if (game != null) {
      if (GameState.currentStatus === GameState.Status.Started) {
        Graphics.Resize(true);
        BroadcastEvent(GameEvents.Resize.params(game));
      }
      else {
        Graphics.Resize(false);
      }
    }
  }

  public start(): void {
    App.initAchievementList(Achievements.list);

    if (StorageManager.hasAlreadyPlayed()) {
      this.initUnlockedAchievements(StorageManager.data.achievements.unlocked);
    }
  }

  private initEquipmentIcons(): void {
    let scale = Graphics.scale;
    let equipment = EntityManager.getEntityWithTag("Player").getComponent(Equipment);
    let getIconPath = function (spriteName: string) {
      return Assets.PathToItemImage(spriteName, scale);
    },
      weapon = equipment.weaponName,
      armor = equipment.armorName,
      weaponPath = getIconPath(weapon),
      armorPath = getIconPath(armor);

    $('#weapon').css('background-image', 'url("' + weaponPath + '")');
    if (armor !== 'firefox') {
      $('#armor').css('background-image', 'url("' + armorPath + '")');
    }
  }

  /**
   * Method called when the player presses Start button
   * or Enter on keyboard.
   * Tries to start the game, by checking the username,
   * and waiting for the app to be ready to start.
   * 
   * @param {string} username - The name currently in the name field.
   * @param {Function} [starting_callback] - Callback to dispose of mobile's virtual keyboard.
   * @memberof App
   */
  private tryStartingGame(username: string, addr: string): void {
    if (username !== '') {
      let self = this, $play = $('.play');
      App.OnPlayButtonClick(null);
      if (GameState.currentStatus !== GameState.Status.Ready) {
        if (!Graphics.isMobile) {
          // on desktop and tablets, add a spinner to the play button
          $play.addClass('loading');
        }
        let watchCanStart = window.setInterval(function () {
          Logger.log("waiting...", Logger.LogType.Debug);
          if (GameState.currentStatus === GameState.Status.Ready) {
            window.setTimeout(function () {
              if (!Graphics.isMobile) {
                $play.removeClass('loading');
              }
            }, 1500);
            clearInterval(watchCanStart);
            self.startGame(username, addr);
          }
        }, 100);
      }
      else {
        this.startGame(username, addr);
      }
    }
  }

  /**
   * Hides the intro and waits a bit to actually start.
   * 
   * @param {string} username 
   * @param {any} starting_callback 
   * @memberof App
   */
  private startGame(username: string, addr: string): void {
    let self = this;
    // Un-focus keyboard if mobile
    App.BlurInputName();
    // Hide the intro and after some time, start
    App.hideIntro(function () {
      self.startApp(username, addr);
    });
  }

  /**
   * Sets the server options with the config, and runs the game.
   * 
   * @param {string} username 
   * @memberof App
   */
  private startApp(username: string, addr: string): void {
    App.Center();
    BroadcastEvent(GameEvents.Game_Connect.params(EntityManager.getEntityWithTag("Game"), username, addr));
  }

  private onPopulationChanged(worldPlayers: number, totalPlayers: number): void {
    if (GameState.currentStatus < GameState.Status.Connecting) return;

    let setWorldPlayersString = function (string: string) {
      $("#instance-population").find("span:nth-child(2)").text(string);
      $("#playercount").find("span:nth-child(2)").text(string);
    },
      setTotalPlayersString = function (string: string) {
        $("#world-population").find("span:nth-child(2)").text(string);
      };

    $("#playercount").find("span.count").text(worldPlayers);

    $("#instance-population").find("span").text(worldPlayers);
    if (worldPlayers == 1) {
      setWorldPlayersString("player");
    } else {
      setWorldPlayersString("players");
    }

    $("#world-population").find("span").text(totalPlayers);
    if (totalPlayers == 1) {
      setTotalPlayersString("player");
    } else {
      setTotalPlayersString("players");
    }
  }

  /**
   * Changes HTML to reflect on game started, and if is first time playing, show instructions.
   */
  private onGameStarted(): void {
    $('body').addClass('started');
    let firstTimePlaying = !StorageManager.hasAlreadyPlayed();
    if (firstTimePlaying) {
      App.toggleInstructions();
    }
  }

  private blinkHealthBar(): void {
    let $hitpoints = $('#hitpoints');

    $hitpoints.addClass('white');
    window.setTimeout(function () {
      $hitpoints.removeClass('white');
    }, 500)
  }

  private onHPChanged(hp: number, maxHp: number): void {
    let scale = Graphics.scale,
      healthMaxWidth = $("#healthbar").width() - (12 * scale);
    let barWidth = Math.round((healthMaxWidth / maxHp) * (hp > 0 ? hp : 0));
    $("#hitpoints").css('width', barWidth + "px");
  }

  private onDeath(): void {
    if ($('body').hasClass('credits')) {
      $('body').removeClass('credits');
    }
    App.addDeathClass();
  }

  private initUnlockedAchievements(ids: number[]): void {
    for (let i = 0, len = ids.length; i < len; ++i) {
      let a = Achievements.getAchievementById(ids[i]);
      App.displayUnlockedAchievement(ids[i], a.name, a.hidden, a.desc);
    }
    $('#unlocked-achievements').text(ids.length);
  }

  public onNotify(params: any): void {
    if (isEvent(params, GameEvents.Client_Disconnect)) {
      $('#death').find('p').html(params.message + "<em>Please reload the page.</em>");
      $('#respawn').hide();
    }
    else if (isEvent(params, GameEvents.Player_SwitchEquipment)) {
      this.initEquipmentIcons();
    }
    else if (isEvent(params, GameEvents.Client_PopulationChanged)) {
      this.onPopulationChanged(params.worldPlayers, params.totalPlayers);
    }
    else if (isEvent(params, GameEvents.Player_OnInvincible)) {
      $('#hitpoints').toggleClass('invincible');
    }
    else if (isEvent(params, GameEvents.Achievement_Unlock)) {
      let a = params.achievement;
      App.unlockAchievement(a.id, a.name, a.hidden, a.desc);
      if (StorageManager.getAchievementCount() === 1) {
        App.startAchievementButtonBlink();
      }
    }
    else if (isEvent(params, GameEvents.Client_HealthChanged)) {
      // Check if was hurt
      if (params.isHurt) this.blinkHealthBar();
      if (params.canBeHurt)
        this.onHPChanged(params.points, params.player.getComponent(Health).maxhp);
    }
    else if (isEvent(params, GameEvents.Client_HitPoints)) {
      this.onHPChanged(params.maxHP, params.maxHP);
    }
    else if (isEvent(params, GameEvents.Client_Welcome)) {
      let maxHp = params.player.getComponent(Health).maxhp;
      this.onHPChanged(maxHp, maxHp);

      this.onGameStarted();
      // TODO: Check, before was being called also on revive
      this.initEquipmentIcons();
    }
    else if (isEvent(params, GameEvents.Resize)) {
      let health = EntityManager.getEntityWithTag("Player").getComponent(Health);
      this.onHPChanged(health.hp, health.maxhp);
    }
    else if (isEvent(params, GameEvents.Character_Remove)) {
      if (params.character.name === "Player") {
        let self = this;
        window.setTimeout(function () {
          self.onDeath();
        }, 1000);
      }
    }
    else if (isEvent(params, GameEvents.Player_Loot)) {
      let lootable = params.item.getComponent(Lootable);
      App.showMessage(lootable.message);
    }
    else if (isEvent(params, GameEvents.Player_Restart)) {
      App.removeDeathClass();
    }
    else if (isEvent(params, GameEvents.Loot_Fail)) {
      App.showMessage(params.exception.message);
    }
    else if (isEvent(params, GameEvents.KeyInput)) {
      let isChatOpen = App.isChatOpen();
      if (params.key === Key.Enter) {
        if (isChatOpen) {
          // Regain focus
          App.focusChat();
        }
        else {
          App.showChat();
        }
        // We prevent default because we don't want Enter to cause any other effect
        params.event.preventDefault();
      }
    }
    else if (isEvent(params, GameEvents.ChatInput)) {
      if (params.key === Key.Enter) {
        let text = App.getChatText();
        if (text.replace(/\s/g, '').length) {
          BroadcastEvent(GameEvents.Player_Say.params(EntityManager.getEntityWithTag("Player"), text));
        }
        App.hideChat();
        // We prevent default because we don't want Enter to cause any other effect
        params.event.preventDefault();
      }

      if (params.key === Key.Escape) {
        App.hideChat();
        params.event.preventDefault();
      }
    }
  }
}

registerSystem(AppSystem, SystemOrder.Normal + 1);