import {
  MODULE_ID,
  TRINKET_ITEM_NAME,
  getVampiricFlags,
  getTrinketCount
} from "./data.js";
import { postCurseRequest, postEndgameRequest } from "./chat-card.js";
import { applyVampiricCurse, cureActor } from "./curse.js";
import { revealVerdict, purgeEndgameHistory } from "./endgame.js";
import { postTrinketRequest } from "./trinket.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class VampiricPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ccc-vampiric-panel",
    classes: ["ccc-vampiric", "ccc-vampiric-panel"],
    tag: "section",
    window: {
      title: "CCC.Vampiric.PanelTitle",
      icon: "fas fa-tint",
      resizable: true
    },
    position: { width: 760, height: "auto" },
    actions: {
      curse: VampiricPanel._onCurse,
      curseDirect: VampiricPanel._onCurseDirect,
      endgame: VampiricPanel._onEndgame,
      reveal: VampiricPanel._onReveal,
      audit: VampiricPanel._onAudit,
      cure: VampiricPanel._onCure,
      trinket: VampiricPanel._onTrinket
    }
  };

  static PARTS = {
    body: { template: "modules/ccc-vagabond/templates/vampiric/panel.hbs" }
  };

  async _prepareContext() {
    const rows = game.actors
      .filter(a => a.type === "character" && a.hasPlayerOwner)
      .map(a => {
        const f = getVampiricFlags(a);
        const owners = game.users.filter(u => !u.isGM && a.testUserPermission(u, "OWNER"));
        const playerName = owners.map(u => u.name).join(", ") || "—";
        const rollCount = (f.endgameRolls ?? []).length;
        return {
          id: a.id,
          name: a.name,
          playerName,
          img: a.img,
          cursedCount: f.cursedCount,
          vhd: f.hitDicePoints,
          trinkets: getTrinketCount(a),
          endgameRollCount: rollCount,
          endgameAvailable: f.cursedCount >= 3,
          verdictReady: rollCount > 0
        };
      });
    return { rows };
  }

  static _getActor(target) {
    const id = target.closest("[data-actor-id]")?.dataset.actorId;
    return id ? game.actors.get(id) : null;
  }

  static async _onCurse(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (actor) await postCurseRequest(actor);
  }

  static async _onCurseDirect(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (actor) await applyVampiricCurse(actor);
    this.render();
  }

  static async _onEndgame(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (actor) await postEndgameRequest(actor);
  }

  static async _onTrinket(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (actor) await postTrinketRequest(actor);
  }

  static async _onReveal(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (!actor) return;
    await revealVerdict(actor);
    this.render();
  }

  static async _onAudit(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (!actor) return;
    const f = getVampiricFlags(actor);
    const t = (k) => game.i18n.localize(k);

    const curseRows = (f.history || []).map(h => `
      <tr>
        <td>${new Date(h.ts).toLocaleString()}</td>
        <td>${h.trait ?? "—"}</td>
        <td>${h.weakness ?? "—"}</td>
        <td>+${h.hpRoll}</td>
      </tr>`).join("");
    const saveRows = (f.endgameRolls || []).map((r, i) => `
      <tr class="${r.forfeit ? "forfeit" : "safe"}">
        <td>#${i + 1}</td>
        <td>${new Date(r.ts).toLocaleString()}</td>
        <td>${r.pcRoll}</td>
        <td>${r.vhd}</td>
        <td>${r.forfeit ? t("CCC.Vampiric.Audit.Forfeit") : t("CCC.Vampiric.Audit.Saved")}</td>
      </tr>`).join("");
    const trinketRows = (f.trinkets || []).map((tr, i) => `
      <tr>
        <td>#${i + 1}</td>
        <td>${new Date(tr.ts).toLocaleString()}</td>
        <td>+${tr.hpRoll}</td>
      </tr>`).join("");

    const html = `
      <h3>${t("CCC.Vampiric.Audit.Curses")}</h3>
      <table class="ccc-vampiric-audit">
        <thead><tr>
          <th>${t("CCC.Vampiric.Audit.When")}</th>
          <th>${t("CCC.Vampiric.LblTrait")}</th>
          <th>${t("CCC.Vampiric.LblWeakness")}</th>
          <th>${t("CCC.Vampiric.Audit.HP")}</th>
        </tr></thead>
        <tbody>${curseRows || `<tr><td colspan="4">—</td></tr>`}</tbody>
      </table>
      <h3>${t("CCC.Vampiric.Audit.SoulSaves")}</h3>
      <table class="ccc-vampiric-audit">
        <thead><tr>
          <th>${t("CCC.Vampiric.Audit.Index")}</th>
          <th>${t("CCC.Vampiric.Audit.When")}</th>
          <th>${t("CCC.Vampiric.Audit.PC")}</th>
          <th>${t("CCC.Vampiric.Col.VHD")}</th>
          <th>${t("CCC.Vampiric.Audit.Result")}</th>
        </tr></thead>
        <tbody>${saveRows || `<tr><td colspan="5">—</td></tr>`}</tbody>
      </table>
      <h3>${t("CCC.Vampiric.Audit.Trinkets")}</h3>
      <table class="ccc-vampiric-audit">
        <thead><tr>
          <th>${t("CCC.Vampiric.Audit.Index")}</th>
          <th>${t("CCC.Vampiric.Audit.When")}</th>
          <th>${t("CCC.Vampiric.LblTrinketHP")}</th>
        </tr></thead>
        <tbody>${trinketRows || `<tr><td colspan="3">—</td></tr>`}</tbody>
      </table>`;
    new foundry.applications.api.DialogV2({
      window: { title: `${actor.name} — ${t("CCC.Vampiric.Audit.Title")}` },
      content: html,
      buttons: [
        {
          action: "purge",
          label: t("CCC.Vampiric.Audit.PurgeBtn"),
          icon: "fas fa-trash",
          callback: async () => {
            const ok = await foundry.applications.api.DialogV2.confirm({
              window: { title: t("CCC.Vampiric.Audit.PurgeTitle") },
              content: `<p>${game.i18n.format("CCC.Vampiric.Audit.PurgeConfirm", { name: actor.name })}</p>`
            });
            if (!ok) return;
            await purgeEndgameHistory(actor);
          }
        },
        { action: "ok", label: t("CCC.Vampiric.Audit.Close"), default: true }
      ]
    }).render(true);
  }

  static async _onCure(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (!actor) return;
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Cure Vampirism" },
      content: `<p>Remove vampiric resistance and reset counters for <strong>${actor.name}</strong>?</p><p>Trait/weakness items remain (remove manually if needed).</p>`
    });
    if (!ok) return;
    await cureActor(actor);
    this.render();
  }

  static registerHooks() {
    Hooks.on("getSceneControlButtons", (controls) => {
      if (!game.user.isGM) return;
      const tokens = controls.tokens;
      if (!tokens?.tools) return;
      tokens.tools.cccVampiricPanel = {
        name: "cccVampiricPanel",
        title: "CCC.Vampiric.PanelTitle",
        icon: "fas fa-tint",
        button: true,
        onChange: () => new VampiricPanel().render(true)
      };
    });
    const rerender = () => {
      for (const app of Object.values(ui.windows)) {
        if (app instanceof VampiricPanel) app.render();
      }
      const fapp = foundry.applications.instances?.get?.("ccc-vampiric-panel");
      if (fapp) fapp.render();
    };
    Hooks.on("updateActor", (actor, changes) => {
      if (changes.flags?.[MODULE_ID]) rerender();
    });
    const onItemChange = (item) => {
      if (item?.parent?.documentName === "Actor" && item.name === TRINKET_ITEM_NAME) rerender();
    };
    Hooks.on("createItem", onItemChange);
    Hooks.on("deleteItem", onItemChange);
    Hooks.on("updateItem", (item, changes) => {
      if (item?.parent?.documentName !== "Actor") return;
      if (item.name === TRINKET_ITEM_NAME || changes.name === TRINKET_ITEM_NAME) rerender();
    });
  }
}
