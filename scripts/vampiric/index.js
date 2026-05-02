import { registerChatCardHooks } from "./chat-card.js";
import { VampiricPanel } from "./panel.js";

Hooks.once("init", () => {
  foundry.applications.handlebars.loadTemplates([
    "modules/ccc-vagabond/templates/vampiric/panel.hbs"
  ]);
});

Hooks.once("ready", () => {
  registerChatCardHooks();
});

VampiricPanel.registerHooks();
