import {
  MODULE_ID,
  getVampiricFlags,
  getTrinketCount
} from "./data.js";
import { postCurseRequest } from "./chat-card.js";
import { applyVampiricCurse, cureActor } from "./curse.js";
import { logFeeding, performEndgameContest } from "./endgame.js";

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
      feedPlus: VampiricPanel._onFeedPlus,
      feedMinus: VampiricPanel._onFeedMinus,
      endgame: VampiricPanel._onEndgame,
      audit: VampiricPanel._onAudit,
      cure: VampiricPanel._onCure
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
        return {
          id: a.id,
          name: a.name,
          img: a.img,
          cursedCount: f.cursedCount,
          vhd: f.hitDicePoints,
          feedings: f.feedingCount,
          trinkets: getTrinketCount(a),
          endgameAvailable: f.feedingCount >= 3,
          endgame: f.endgame
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

  static async _onFeedPlus(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (actor) await logFeeding(actor, +1);
    this.render();
  }

  static async _onFeedMinus(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (actor) await logFeeding(actor, -1);
    this.render();
  }

  static async _onEndgame(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (actor) await performEndgameContest(actor);
    this.render();
  }

  static async _onAudit(event, target) {
    const actor = VampiricPanel._getActor(target);
    if (!actor) return;
    const f = getVampiricFlags(actor);
    const rows = (f.history || []).map(h => `
      <tr>
        <td>${new Date(h.ts).toLocaleString()}</td>
        <td>${h.trait ?? "—"}</td>
        <td>${h.weakness ?? "—"}</td>
        <td>+${h.hpRoll}</td>
      </tr>`).join("");
    const html = `
      <table class="ccc-vampiric-audit">
        <thead><tr><th>When</th><th>Trait</th><th>Weakness</th><th>HP</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="4">—</td></tr>`}</tbody>
      </table>`;
    new foundry.applications.api.DialogV2({
      window: { title: `${actor.name} — Vampiric History` },
      content: html,
      buttons: [{ action: "ok", label: "Close", default: true }]
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
    Hooks.on("updateActor", (actor, changes) => {
      if (changes.flags?.[MODULE_ID]) {
        for (const app of Object.values(ui.windows)) {
          if (app instanceof VampiricPanel) app.render();
        }
        const fapp = foundry.applications.instances?.get?.("ccc-vampiric-panel");
        if (fapp) fapp.render();
      }
    });
  }
}
