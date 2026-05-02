const MODULE_ID = "ccc-vagabond";
const SETTING_STATE = "encounter-state";
const SETTING_CONFIG = "encounter-config";

const DEFAULT_SLOTS = [
  { key: "witch",      label: "The Other Witch",            actorUuid: "Actor.QKyAjYavO2Fg6vY0" },
  { key: "armor",      label: "The Count's Animated Armor", actorUuid: "Actor.3qFNa5TGwK3Oj313" },
  { key: "spider",     label: "Dorothy, The Spider Queen",  actorUuid: "Actor.HgNzvHjeUNAIFOeo" },
  { key: "nun",        label: "Sister Geraldine, Fallen Nun", actorUuid: "Actor.DqMKib6BuoxcVEHU" },
  { key: "seductress", label: "Christina, the Seductress",  actorUuid: "Actor.gND0vJkWrZhDWnx4" },
  { key: "count",      label: "The Count",                  actorUuid: "Actor.ktK31zX5tpdontdV" }
];

const FALLBACK_OUTCOMES = {
  witch: [
    "A black cat crosses your path. Attempts to lead you to the @UUID[JournalEntry.NfeanMMwyVCunWLV.JournalEntryPage.M1n3P5o7R9t2W4q6]{Witch's Kitchen} (p.17).",
    "Sounds of someone sweeping as you enter the next room. An animated broom is sweeping the floor. It falls inert if touched, raising the Stress Level by 1.",
    "Sweeping sounds again, this time an overweight naked old lady stands sweeping the floor. Holds a finger up to shush the party, which douses all the lights in this room.",
    "The black cat appears. Follows the party until another encounter appears, then turns into the witch & attacks."
  ],
  armor: [
    "A wooden stand meant for a suit of armor rests bare in the room. Metallic clinking can be heard in the distance.",
    "Nails on a chalkboard screech as you enter the room. A thin groove scratched into the floor from something heavy & sharp as a dented crimson helmet adorned with golden angel wings rolls toward you from the darkness, raising the Stress Level by 1.",
    "Metallic footsteps slowly approach you. A suit of crimson animated armor steps into the light holding an oversized greatsword & attacks. Falls apart if struck. The pieces disperse in all directions on their own after a pause.",
    "Slow metallic footsteps increase in intensity. The armor rushes the party in an attempt to fuse itself with a PC. Reflex Save or be fused with the armor, which swings wildly & attempts to break your arm/leg by hyperextending. Endure Save each turn. Fail results in armor also having an action on your turn. Success gets you out of armor. Armor retreats if able. If destroyed, falls apart and can be worn as @UUID[Compendium.vagabond.armor.Item.yvHynLJxGSilvLwM]{Heavy Armor}. At Midnight, the armor reanimates & attempts to snap the neck of its wearer."
  ],
  spider: [
    "Dozens of little spiders scurry from the cracks within the walls and beneath the furniture, raising the Stress Level by 1 while in this room.",
    "A strange orb completely made up of webbing in the corner of the room → a corpse that looks like one of your PCs. Will Save by the one opening it or have the Stress Level raise by 1. → Inside is that PC's preferred mundane weapon.",
    "Call for a marching order. Whoever is in the back must make Reflex Save or be lifted off the ground by a strand of thick webbing from the ceiling, followed by a bite (Reflex Save) for the throat. Whether she hits or misses, a thin woman with too many arms scampers away on the ceiling, dropping the PC.",
    "Casts Web on the party, a torrent of spiders crawl from the shadows/cracks biting for 1d4 damage, followed by Dorothy rushing on her four spidery legs. Retreats once a PC is free from web. If killed, turns into a swarm of tiny spiders which scamper to her coffin. Several spiders try to carry away an iron key (p.33)."
  ],
  nun: [
    "Black pentagram star streaked on the wall/floor, a holy symbol in the center begins to smoke, then alights on fire & falls off the wall, charred.",
    "Various holy symbols pinned to the walls, all of which slowly invert upside-down. Dark blood oozes from the symbols.",
    "Perception check or turn a corner and meet a pale woman dressed in a black robe & habit in a silent stare, eyes black and void. Failure results in Will Save or @UUID[Compendium.vagabond.spells.Item.Hwmj6RwmUigPTFAv]{Hold} Spell as she silently floats away, increasing the Stress Level by 1. Silently floats into the next room regardless.",
    "Portraits of the sitting on an easel/hanging on the walls, +1 portrait per repeat encounter. Lights go out if approached, holy symbols heat and smoke, 1d6 fire unless dropped. Once covered in darkness, she flies out from one of the portraits and bites. Mundane weapons pass right through her unless they are Cleric weapons. Destroying the portraits or attacking her with a spell causes her to flee. If killed, turns into a pillar of salt, which crumbles and drifts towards her coffin. An iron key (p.33) rests in the salt pile."
  ],
  seductress: [
    "Pink waft of mist. Strong scent of flowery perfume, a flirty giggle echoes down the halls.",
    "Sounds of kissing before you enter the room, followed by screaming that is sharply silenced. Inside the next room is a corpse of what appears to be one of you lying on satin covers & plush pillows—face completely blank as if erased off, as well as an open wound near the jugular. Raises the Stress Level by 1.",
    "Call for a marching order. The one in the lead must make a Will Save to notice one of the other PCs (the copy missing their face from the above result) is acting notably different before they sprout fangs & attempt to bite you. The traitor turns into a pale woman, terribly beautiful were it not for the contorting face as she scampers away like an insect. The original PC walks in from where you came.",
    "Appears as @UUID[Actor.umZu1HdbwXyx3uNF]{Matilda} (p.26), even if the real Matilda is with the party. Is lost & looking for someone to rescue her. Very clingy. Very flirtatious. Very touchy until she can easily get a bite. If killed, turns into a pink mist with wilted rose petals that trail to her coffin. Leaves an iron key (p.33) which clangs on the ground."
  ],
  count: [
    "A sealed note rests under a wine glass filled with blood. Inside is a letter of mock apology as well as a peace offering: drinking the blood in this glass allows you to choose which Vampiric Trait (p.5) to receive.",
    "Lightning strikes, a long shadow of a winged creature flashes in the lights, raising the Stress Level by 1.",
    "Quiet peeps can be heard up ahead. A single bat flutters towards the party, followed by a cacophony of large bats battering the party as they fly past, raising the Stress Level by 1.",
    "The Count appears, taunting the party. Will retaliate if attacked once, then flee as a swarm of bats."
  ]
};

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function getTextEditor() {
  return foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
}

function enrich(text) {
  return getTextEditor().enrichHTML(text ?? "");
}

const DEFAULT_INTRO = `<p>Each time a new room is explored, the Player Characters make considerable noise, or when the scenario directs, the Gamemaster rolls a [[/r 1d6]].</p>
<p>On a result of a 1 or 2, an Escalating Encounter happens in the current room, taking place alongside any other events happening within the area. The GM rolls the table below to determine which Escalating Encounter takes place.</p>
<p>Each creature on the table has a set event which happens chronologically. Once each event has been used or if the creature rolled has been killed/defeated, use the next highest result.</p>`;

function defaultConfig() {
  return {
    introText: DEFAULT_INTRO,
    slots: DEFAULT_SLOTS.map(s => ({
      key: s.key,
      label: s.label,
      actorUuid: s.actorUuid,
      journalUuid: "",
      sounds: ["", "", "", ""]
    }))
  };
}

function getConfig() {
  const raw = game.settings.get(MODULE_ID, SETTING_CONFIG);
  const merged = defaultConfig();
  if (!raw) return merged;
  if (typeof raw.introText === "string") merged.introText = raw.introText;
  if (!Array.isArray(raw.slots) || raw.slots.length === 0) return merged;
  for (const stored of raw.slots) {
    const target = merged.slots.find(s => s.key === stored.key);
    if (!target) continue;
    if (typeof stored.label === "string" && stored.label.trim()) target.label = stored.label;
    if (typeof stored.actorUuid === "string") target.actorUuid = stored.actorUuid;
    if (typeof stored.journalUuid === "string") target.journalUuid = stored.journalUuid;
    if (Array.isArray(stored.sounds)) {
      for (let i = 0; i < 4; i++) target.sounds[i] = stored.sounds[i] ?? "";
    }
  }
  return merged;
}

async function setConfig(cfg) {
  await game.settings.set(MODULE_ID, SETTING_CONFIG, cfg);
}

async function getOutcomeText(slot, outcome) {
  if (slot.journalUuid) {
    const journal = await fromUuid(slot.journalUuid).catch(() => null);
    if (journal?.pages?.contents?.length) {
      const pages = [...journal.pages.contents].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
      const page = pages[outcome - 1];
      const html = page?.text?.content;
      if (html) return html;
    }
  }
  return FALLBACK_OUTCOMES[slot.key]?.[outcome - 1] ?? "";
}

async function playOutcomeSound(uuid) {
  if (!uuid) return;
  const sound = await fromUuid(uuid).catch(() => null);
  if (!sound) return;
  const src = sound.path ?? sound.src;
  if (!src) return;
  const volume = typeof sound.volume === "number" ? sound.volume : 0.8;
  const helper = foundry.audio?.AudioHelper ?? globalThis.AudioHelper;
  helper.play({ src, volume, autoplay: true, loop: false }, true);
}

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
      openActor: EncounterPanel._onOpenActor,
      openConfig: EncounterPanel._onOpenConfig,
      toggleDefeated: EncounterPanel._onToggleDefeated
    }
  };

  static PARTS = {
    body: { template: "modules/ccc-vagabond/templates/encounters/panel.hbs" }
  };

  lastResult = null;

  async _prepareContext() {
    const config = getConfig();
    const state = game.settings.get(MODULE_ID, SETTING_STATE) ?? {};
    const introHtml = await enrich(config.introText ?? "");

    const rows = await Promise.all(config.slots.map(async (slot, i) => {
      const s = state[slot.key] ?? {};
      const count = s.count ?? 0;
      const defeated = !!s.defeated;
      const actor = slot.actorUuid ? await fromUuid(slot.actorUuid).catch(() => null) : null;
      const linkHtml = slot.actorUuid
        ? await enrich(`@UUID[${slot.actorUuid}]{${slot.label}}`)
        : slot.label;
      return {
        idx: i + 1,
        key: slot.key,
        label: slot.label,
        actorUuid: slot.actorUuid,
        actorImg: actor?.img ?? "icons/svg/mystery-man.svg",
        linkHtml,
        count,
        defeated,
        atMax: count >= 4,
        unavailable: defeated || count >= 4
      };
    }));

    let result = null;
    if (this.lastResult) {
      const slot = config.slots.find(s => s.key === this.lastResult.key);
      if (slot) {
        const actor = slot.actorUuid ? await fromUuid(slot.actorUuid).catch(() => null) : null;
        const raw = await getOutcomeText(slot, this.lastResult.outcome);
        const enriched = await enrich(raw);
        const linkHtml = slot.actorUuid
          ? await enrich(`@UUID[${slot.actorUuid}]{${slot.label}}`)
          : slot.label;
        result = {
          roll: this.lastResult.roll,
          label: slot.label,
          outcome: this.lastResult.outcome,
          actorImg: actor?.img ?? "icons/svg/mystery-man.svg",
          linkHtml,
          text: enriched
        };
      }
    }

    return { introHtml, rows, result };
  }

  static async _applyRoll(app, slot, rollTotal) {
    const state = foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTING_STATE) ?? {});
    const cur = state[slot.key]?.count ?? 0;
    const next = Math.min(cur + 1, 4);
    state[slot.key] = { count: next, ts: Date.now() };
    await game.settings.set(MODULE_ID, SETTING_STATE, state);
    app.lastResult = { key: slot.key, outcome: next, roll: rollTotal };
    const soundUuid = slot.sounds?.[next - 1];
    if (soundUuid) playOutcomeSound(soundUuid);
    app.render();
  }

  static _isAvailable(slot, state) {
    const s = state[slot.key] ?? {};
    return !s.defeated && (s.count ?? 0) < 4;
  }

  static async _onRoll(event, target) {
    const config = getConfig();
    const state = game.settings.get(MODULE_ID, SETTING_STATE) ?? {};
    const n = config.slots.length;
    if (!n) return;
    const anyAvailable = config.slots.some(s => EncounterPanel._isAvailable(s, state));
    if (!anyAvailable) {
      ui.notifications?.warn(game.i18n.localize("CCC.Encounter.AllExhausted"));
      return;
    }
    const roll = await new Roll(`1d${n}`).evaluate();
    const start = roll.total - 1;
    let chosen = null;
    for (let i = 0; i < n; i++) {
      const slot = config.slots[(start + i) % n];
      if (EncounterPanel._isAvailable(slot, state)) { chosen = slot; break; }
    }
    if (!chosen) return;
    await EncounterPanel._applyRoll(this, chosen, roll.total);
  }

  static async _onManualRoll(event, target) {
    const key = target.closest("[data-key]")?.dataset.key;
    const slot = getConfig().slots.find(s => s.key === key);
    if (!slot) return;
    await EncounterPanel._applyRoll(this, slot, null);
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

  static async _onOpenConfig() {
    new EncounterConfigMenu().render(true);
  }

  static async _onToggleDefeated(event, target) {
    const key = target.closest("[data-key]")?.dataset.key;
    if (!key) return;
    const state = foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTING_STATE) ?? {});
    state[key] ??= { count: 0 };
    state[key].defeated = !!target.checked;
    state[key].ts = Date.now();
    await game.settings.set(MODULE_ID, SETTING_STATE, state);
    this.render();
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

class EncounterConfigMenu extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ccc-encounter-config",
    classes: ["ccc-encounter", "ccc-encounter-config"],
    tag: "form",
    window: {
      title: "CCC.Encounter.Config.Title",
      icon: "fas fa-cog",
      resizable: true
    },
    position: { width: 720, height: "auto" },
    form: {
      handler: EncounterConfigMenu._onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    },
    actions: {
      reset: EncounterConfigMenu._onReset,
      clearField: EncounterConfigMenu._onClearField,
      previewSound: EncounterConfigMenu._onPreviewSound
    }
  };

  static PARTS = {
    body: {
      template: "modules/ccc-vagabond/templates/encounters/config.hbs",
      scrollable: [".ccc-encounter-config-body"]
    },
    footer: { template: "templates/generic/form-footer.hbs" }
  };

  async _prepareContext() {
    const config = getConfig();
    return {
      introText: config.introText ?? "",
      slots: config.slots.map((s, i) => ({
        ...s,
        idx: i + 1,
        sounds: s.sounds.map((value, idx) => ({ i: idx, n: idx + 1, value: value ?? "" }))
      })),
      buttons: [
        { type: "button", action: "reset", icon: "fas fa-rotate-left", label: "CCC.Encounter.Config.Reset" },
        { type: "submit", icon: "fas fa-save", label: "CCC.Encounter.Config.Save" }
      ]
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this._wireDrops();
  }

  _wireDrops() {
    const inputs = this.element.querySelectorAll("input[data-drop]");
    inputs.forEach(input => {
      input.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        input.classList.add("drop-hover");
      });
      input.addEventListener("dragleave", () => input.classList.remove("drop-hover"));
      input.addEventListener("drop", async (e) => {
        e.preventDefault();
        input.classList.remove("drop-hover");
        const TE = getTextEditor();
        let data;
        try { data = TE.getDragEventData(e); } catch (err) { return; }
        if (!data?.uuid) return;
        const expected = input.dataset.drop;
        if (expected && data.type !== expected) {
          ui.notifications?.warn(
            game.i18n.format("CCC.Encounter.Config.WrongType", { expected })
          );
          return;
        }
        input.value = data.uuid;
      });
    });
  }

  static async _onClearField(event, target) {
    const name = target.dataset.target;
    if (!name) return;
    const input = this.element.querySelector(`[name="${name}"]`);
    if (input) input.value = "";
  }

  static async _onPreviewSound(event, target) {
    const name = target.dataset.target;
    const input = this.element.querySelector(`[name="${name}"]`);
    const uuid = input?.value;
    if (!uuid) return;
    playOutcomeSound(uuid);
  }

  static async _onReset() {
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("CCC.Encounter.Config.ResetTitle") },
      content: `<p>${game.i18n.localize("CCC.Encounter.Config.ResetConfirm")}</p>`
    });
    if (!ok) return;
    await setConfig(defaultConfig());
    this.render();
  }

  static async _onSubmit(event, form, formData) {
    const data = formData.object;
    const config = getConfig();
    if (typeof data.introText === "string") config.introText = data.introText;
    for (const slot of config.slots) {
      slot.label = data[`slot.${slot.key}.label`] ?? slot.label;
      slot.actorUuid = data[`slot.${slot.key}.actorUuid`] ?? "";
      slot.journalUuid = data[`slot.${slot.key}.journalUuid`] ?? "";
      slot.sounds = [0, 1, 2, 3].map(i => data[`slot.${slot.key}.sound.${i}`] ?? "");
    }
    await setConfig(config);
    ui.notifications?.info(game.i18n.localize("CCC.Encounter.Config.Saved"));
  }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_STATE, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, SETTING_CONFIG, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.registerMenu(MODULE_ID, "encounter-config-menu", {
    name: "CCC.Encounter.Config.MenuName",
    label: "CCC.Encounter.Config.MenuLabel",
    hint: "CCC.Encounter.Config.MenuHint",
    icon: "fas fa-dice-d6",
    type: EncounterConfigMenu,
    restricted: true
  });

  foundry.applications.handlebars.loadTemplates([
    "modules/ccc-vagabond/templates/encounters/panel.hbs",
    "modules/ccc-vagabond/templates/encounters/config.hbs"
  ]);
});

EncounterPanel.registerHooks();
