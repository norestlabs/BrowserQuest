import { System, registerSystem } from "@engine/System";
import GameTypes from "@common/gametypes";
import { Equipment, Identifiable } from "@components/Components";
import * as Graphics from "@lib/Graphics";
import * as App from "@lib/App";
import * as StorageManager from "@lib/StorageManager";
import { GameEvents, isEvent } from "@lib/GameEvents";


export default class StorageSystem implements System {

  s_name = "StorageSystem";
  enabled = true;

  public awake(): void {
    if (StorageManager.hasLocalStorage() && localStorage.data) {
      StorageManager.setData(JSON.parse(localStorage.data));
    }
    else {
      StorageManager.resetData();
    }
  }

  public onNotify(params: any): void {
    if (isEvent(params, GameEvents.Player_Delete)) {
      StorageManager.clear();
    }
    if (isEvent(params, GameEvents.Player_Restart)) {
      StorageManager.incrementRevives();
    }
    else if (isEvent(params, GameEvents.Client_Welcome)) {
      let equipment = params.player.getComponent(Equipment);
      let name = params.player.getComponent(Identifiable).name;
      let addr = params.player.getComponent(Identifiable).addr;
      if (!StorageManager.hasAlreadyPlayed()) {
        StorageManager.initPlayer(name, addr);
        StorageManager.savePlayer(Graphics.GetPlayerImage(equipment.armorName, equipment.weaponName),
          equipment.armorName,
          equipment.weaponName);
        App.showMessage("Welcome to BrowserQuest!");
      }
      else {
        App.showMessage("Welcome back to BrowserQuest!");
        StorageManager.setPlayerName(name);
        StorageManager.setPlayerAddr(addr);
      }
    }
    else if (isEvent(params, GameEvents.Client_CharacterKilled)) {
      StorageManager.incrementTotalKills();
      let kind = params.mobKind;

      if (kind === GameTypes.Entities.Rat) {
        StorageManager.incrementRatCount();
      }

      if (kind === GameTypes.Entities.Skeleton || kind === GameTypes.Entities.Skeleton2) {
        StorageManager.incrementSkeletonCount();
      }
    }
    else if (isEvent(params, GameEvents.Client_HealthChanged)) {
      StorageManager.addDamage(-params.diff);
    }
    else if (isEvent(params, GameEvents.Achievement_Unlock)) {
      StorageManager.unlockAchievement(params.achievement.id);
    }
    else if (isEvent(params, GameEvents.Player_SwitchEquipment)) {
      let equipment = params.player.getComponent(Equipment);
      StorageManager.savePlayer(Graphics.GetPlayerImage(equipment.armorName, equipment.weaponName), equipment.armorName, equipment.weaponName);
    }
  }
}

// Run after spriteRenderSystem, so that it disables sprite after.
registerSystem(StorageSystem);