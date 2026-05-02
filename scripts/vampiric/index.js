import { registerChatCardHooks } from "./chat-card.js";
import { VampiricPanel } from "./panel.js";
import { MODULE_ID, SETTING_RESISTANCE_DIE, SETTING_TRINKET_DIE } from "./data.js";

const DIE_CHOICES = {
  "1d4": "1d4",
  "1d6": "1d6",
  "1d8": "1d8",
  "1d10": "1d10",
  "1d12": "1d12"
};

Hooks.once("init", () => {
  foundry.applications.handlebars.loadTemplates([
    "modules/ccc-vagabond/templates/vampiric/panel.hbs"
  ]);

  game.settings.register(MODULE_ID, SETTING_RESISTANCE_DIE, {
    name: "CCC.Settings.ResistanceDie.Name",
    hint: "CCC.Settings.ResistanceDie.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: DIE_CHOICES,
    default: "1d8"
  });

  game.settings.register(MODULE_ID, SETTING_TRINKET_DIE, {
    name: "CCC.Settings.TrinketDie.Name",
    hint: "CCC.Settings.TrinketDie.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: DIE_CHOICES,
    default: "1d6"
  });
});

Hooks.once("ready", () => {
  registerChatCardHooks();
});

VampiricPanel.registerHooks();
