const MODULE_ID = "ccc-vagabond";
const SETTING_STATE = "encounter-state";

const ENCOUNTERS = [
  {
    key: "witch",
    name: "The Other Witch",
    actorUuid: "Actor.QKyAjYavO2Fg6vY0",
    outcomes: [
      "A black cat crosses your path. Attempts to lead you to the @UUID[JournalEntry.OGZlLh6RNVBBuhCE.JournalEntryPage.M1n3P5o7R9t2W4q6]{Witch's Kitchen} (p.17).",
      "Sounds of someone sweeping as you enter the next room. An animated broom is sweeping the floor. It falls inert if touched, raising the Stress Level by 1.",
      "Sweeping sounds again, this time an overweight naked old lady stands sweeping the floor. Holds a finger up to shush the party, which douses all the lights in this room.",
      "The black cat appears. Follows the party until another encounter appears, then turns into the witch & attacks."
    ]
  },
  {
    key: "armor",
    name: "The Count's Animated Armor",
    actorUuid: "Actor.3qFNa5TGwK3Oj313",
    outcomes: [
      "A wooden stand meant for a suit of armor rests bare in the room. Metallic clinking can be heard in the distance.",
      "Nails on a chalkboard screech as you enter the room. A thin groove scratched into the floor from something heavy & sharp as a dented crimson helmet adorned with golden angel wings rolls toward you from the darkness, raising the Stress Level by 1.",
      "Metallic footsteps slowly approach you. A suit of crimson animated armor steps into the light holding an oversized greatsword & attacks. Falls apart if struck. The pieces disperse in all directions on their own after a pause.",
      "Slow metallic footsteps increase in intensity. The armor rushes the party in an attempt to fuse itself with a PC. Reflex Save or be fused with the armor, which swings wildly & attempts to break your arm/leg by hyperextending. Endure Save each turn. Fail results in armor also having an action on your turn. Success gets you out of armor. Armor retreats if able. If destroyed, falls apart and can be worn as @UUID[Compendium.vagabond.armor.Item.yvHynLJxGSilvLwM]{Heavy Armor}. At Midnight, the armor reanimates & attempts to snap the neck of its wearer."
    ]
  },
  {
    key: "spider",
    name: "Dorothy, The Spider Queen",
    actorUuid: "Actor.HgNzvHjeUNAIFOeo",
    outcomes: [
      "Dozens of little spiders scurry from the cracks within the walls and beneath the furniture, raising the Stress Level by 1 while in this room.",
      "A strange orb completely made up of webbing in the corner of the room → a corpse that looks like one of your PCs. Will Save by the one opening it or have the Stress Level raise by 1. → Inside is that PC's preferred mundane weapon.",
      "Call for a marching order. Whoever is in the back must make Reflex Save or be lifted off the ground by a strand of thick webbing from the ceiling, followed by a bite (Reflex Save) for the throat. Whether she hits or misses, a thin woman with too many arms scampers away on the ceiling, dropping the PC.",
      "Casts Web on the party, a torrent of spiders crawl from the shadows/cracks biting for 1d4 damage, followed by Dorothy rushing on her four spidery legs. Retreats once a PC is free from web. If killed, turns into a swarm of tiny spiders which scamper to her coffin. Several spiders try to carry away an iron key (p.33)."
    ]
  },
  {
    key: "nun",
    name: "Sister Geraldine, Fallen Nun",
    actorUuid: "Actor.DqMKib6BuoxcVEHU",
    outcomes: [
      "Black pentagram star streaked on the wall/floor, a holy symbol in the center begins to smoke, then alights on fire & falls off the wall, charred.",
      "Various holy symbols pinned to the walls, all of which slowly invert upside-down. Dark blood oozes from the symbols.",
      "Perception check or turn a corner and meet a pale woman dressed in a black robe & habit in a silent stare, eyes black and void. Failure results in Will Save or @UUID[Compendium.vagabond.spells.Item.Hwmj6RwmUigPTFAv]{Hold} Spell as she silently floats away, increasing the Stress Level by 1. Silently floats into the next room regardless.",
      "Portraits of the sitting on an easel/hanging on the walls, +1 portrait per repeat encounter. Lights go out if approached, holy symbols heat and smoke, 1d6 fire unless dropped. Once covered in darkness, she flies out from one of the portraits and bites. Mundane weapons pass right through her unless they are Cleric weapons. Destroying the portraits or attacking her with a spell causes her to flee. If killed, turns into a pillar of salt, which crumbles and drifts towards her coffin. An iron key (p.33) rests in the salt pile."
    ]
  },
  {
    key: "seductress",
    name: "Christina, the Seductress",
    actorUuid: "Actor.gND0vJkWrZhDWnx4",
    outcomes: [
      "Pink waft of mist. Strong scent of flowery perfume, a flirty giggle echoes down the halls.",
      "Sounds of kissing before you enter the room, followed by screaming that is sharply silenced. Inside the next room is a corpse of what appears to be one of you lying on satin covers & plush pillows—face completely blank as if erased off, as well as an open wound near the jugular. Raises the Stress Level by 1.",
      "Call for a marching order. The one in the lead must make a Will Save to notice one of the other PCs (the copy missing their face from the above result) is acting notably different before they sprout fangs & attempt to bite you. The traitor turns into a pale woman, terribly beautiful were it not for the contorting face as she scampers away like an insect. The original PC walks in from where you came.",
      "Appears as @UUID[Actor.umZu1HdbwXyx3uNF]{Matilda} (p.26), even if the real Matilda is with the party. Is lost & looking for someone to rescue her. Very clingy. Very flirtatious. Very touchy until she can easily get a bite. If killed, turns into a pink mist with wilted rose petals that trail to her coffin. Leaves an iron key (p.33) which clangs on the ground."
    ]
  },
  {
    key: "count",
    name: "The Count",
    actorUuid: "Actor.ktK31zX5tpdontdV",
    outcomes: [
      "A sealed note rests under a wine glass filled with blood. Inside is a letter of mock apology as well as a peace offering: drinking the blood in this glass allows you to choose which Vampiric Trait (p.5) to receive.",
      "Lightning strikes, a long shadow of a winged creature flashes in the lights, raising the Stress Level by 1.",
      "Quiet peeps can be heard up ahead. A single bat flutters towards the party, followed by a cacophony of large bats battering the party as they fly past, raising the Stress Level by 1.",
      "The Count appears, taunting the party. Will retaliate if attacked once, then flee as a swarm of bats."
    ]
  }
];

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class EncounterPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ccc-encounter-panel",
    classes: ["ccc-encounter", "ccc-encounter-panel"],
    tag: "section",
    window: {
      title: "CCC.Encounter.PanelTitle",
      icon: "fas fa-dice-d6",
      resizable: true
    },
    position: { width: 640, height: "auto" },
    actions: {
      roll: EncounterPanel._onRoll,
      manualRoll: EncounterPanel._onManualRoll,
      reset: EncounterPanel._onReset,
      resetAll: EncounterPanel._onResetAll,
      openActor: EncounterPanel._onOpenActor
    }
  };

  static PARTS = {
    body: { template: "modules/ccc-vagabond/templates/encounters/panel.hbs" }
  };

  lastResult = null;

  static _enrich(text) {
    const TE = foundry.applications?.ux?.TextEditor?.implementation
      ?? globalThis.TextEditor;
    return TE.enrichHTML(text);
  }

  async _prepareContext() {
    const state = game.settings.get(MODULE_ID, SETTING_STATE) ?? {};

    const rows = await Promise.all(ENCOUNTERS.map(async (enc, i) => {
      const count = state[enc.key]?.count ?? 0;
      const actor = await fromUuid(enc.actorUuid).catch(() => null);
      const linkHtml = await EncounterPanel._enrich(`@UUID[${enc.actorUuid}]{${enc.name}}`);
      return {
        idx: i + 1,
        key: enc.key,
        name: enc.name,
        actorUuid: enc.actorUuid,
        actorImg: actor?.img ?? "icons/svg/mystery-man.svg",
        linkHtml,
        count,
        atMax: count >= 4
      };
    }));

    let result = null;
    if (this.lastResult) {
      const enc = ENCOUNTERS.find(e => e.key === this.lastResult.key);
      if (enc) {
        const actor = await fromUuid(enc.actorUuid).catch(() => null);
        const text = enc.outcomes[this.lastResult.outcome - 1] ?? "";
        const enriched = await EncounterPanel._enrich(text);
        const linkHtml = await EncounterPanel._enrich(`@UUID[${enc.actorUuid}]{${enc.name}}`);
        result = {
          roll: this.lastResult.roll,
          name: enc.name,
          outcome: this.lastResult.outcome,
          actorUuid: enc.actorUuid,
          actorImg: actor?.img ?? "icons/svg/mystery-man.svg",
          linkHtml,
          text: enriched
        };
      }
    }

    return { rows, result };
  }

  static async _applyRoll(app, enc, rollTotal) {
    const state = foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTING_STATE) ?? {});
    const cur = state[enc.key]?.count ?? 0;
    const next = Math.min(cur + 1, 4);
    state[enc.key] = { count: next, ts: Date.now() };
    await game.settings.set(MODULE_ID, SETTING_STATE, state);
    app.lastResult = { key: enc.key, outcome: next, roll: rollTotal };
    app.render();
  }

  static async _onRoll(event, target) {
    const roll = await new Roll("1d6").evaluate();
    const enc = ENCOUNTERS[roll.total - 1];
    await EncounterPanel._applyRoll(this, enc, roll.total);
  }

  static async _onManualRoll(event, target) {
    const key = target.closest("[data-key]")?.dataset.key;
    const enc = ENCOUNTERS.find(e => e.key === key);
    if (!enc) return;
    await EncounterPanel._applyRoll(this, enc, null);
  }

  static async _onReset(event, target) {
    const key = target.closest("[data-key]")?.dataset.key;
    const state = foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTING_STATE) ?? {});
    delete state[key];
    await game.settings.set(MODULE_ID, SETTING_STATE, state);
    if (this.lastResult?.key === key) this.lastResult = null;
    this.render();
  }

  static async _onResetAll(event, target) {
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("CCC.Encounter.ResetAll") },
      content: `<p>${game.i18n.localize("CCC.Encounter.ResetAllConfirm")}</p>`
    });
    if (!ok) return;
    await game.settings.set(MODULE_ID, SETTING_STATE, {});
    this.lastResult = null;
    this.render();
  }

  static async _onOpenActor(event, target) {
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (!uuid) return;
    const doc = await fromUuid(uuid);
    doc?.sheet?.render(true);
  }

  static registerHooks() {
    Hooks.on("getSceneControlButtons", (controls) => {
      if (!game.user.isGM) return;
      const tokens = controls.tokens;
      if (!tokens?.tools) return;
      tokens.tools.cccEncounterPanel = {
        name: "cccEncounterPanel",
        title: "CCC.Encounter.PanelTitle",
        icon: "fas fa-dice-d6",
        button: true,
        onChange: () => new EncounterPanel().render(true)
      };
    });
  }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_STATE, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  foundry.applications.handlebars.loadTemplates([
    "modules/ccc-vagabond/templates/encounters/panel.hbs"
  ]);
});

EncounterPanel.registerHooks();
