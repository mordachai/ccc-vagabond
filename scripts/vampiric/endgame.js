import {
  getActorReason,
  getActorAwareness,
  getTrinketCount,
  getVampiricFlags,
  setVampiricFlags
} from "./data.js";

function renderDiceDisplay(roll) {
  const helper = globalThis.vagabond?.VagabondChatCard?.formatRollWithDice
    ?? game.vagabond?.api?.VagabondChatCard?.formatRollWithDice;
  if (typeof helper === "function") {
    try { return helper(roll, false); } catch (e) { /* fall through */ }
  }
  return "";
}

export async function performEndgameContest(actor) {
  const flags = getVampiricFlags(actor);
  const reason = getActorReason(actor);
  const awareness = getActorAwareness(actor);
  const statBonus = Math.floor((reason + awareness) / 2);
  const trinkets = getTrinketCount(actor);

  const formula = `1d20 + ${statBonus} + ${trinkets}`;
  const pcRoll = new Roll(formula);
  await pcRoll.evaluate();

  const vhd = flags.hitDicePoints || 0;
  const forfeit = vhd > pcRoll.total;
  const d20 = pcRoll.dice?.[0]?.total ?? 0;

  // Roll dice animation only — no chat card. GM tracks via panel (Saves col).
  if (game.dice3d?.showForRoll) {
    try { await game.dice3d.showForRoll(pcRoll, game.user, true); } catch (e) { /* ignore */ }
  }

  const entry = {
    pcRoll: pcRoll.total,
    d20,
    vhd,
    forfeit,
    formula: `${formula} = ${pcRoll.total}`,
    statBonus,
    trinkets,
    ts: Date.now()
  };
  await setVampiricFlags(actor, {
    endgameRolls: [...(flags.endgameRolls ?? []), entry],
    verdictRevealed: false
  });
  return entry;
}

export async function revealVerdict(actor) {
  const flags = getVampiricFlags(actor);
  const rolls = flags.endgameRolls ?? [];
  if (!rolls.length) return null;

  const anyForfeit = rolls.some(r => r.forfeit);
  const verdict = anyForfeit
    ? game.i18n?.localize?.("CCC.Vampiric.SoulForfeit") ?? "Soul Forfeit"
    : game.i18n?.localize?.("CCC.Vampiric.SoulSaved") ?? "Soul Saved";
  const verdictClass = anyForfeit ? "forfeit" : "safe";
  const portrait = actor.img ?? "icons/svg/mystery-man.svg";
  const title = game.i18n?.localize?.("CCC.Vampiric.FinalVerdict") ?? "Final Verdict";

  const rowsHtml = rolls.map((r, i) => {
    const cls = r.forfeit ? "forfeit" : "safe";
    const d20 = r.d20 ?? "?";
    return `
      <div class="ccc-vampiric-roll-row ${cls}">
        <span class="idx">#${i + 1}</span>
        <span class="vals">
          <span class="part" title="d20"><i class="fas fa-dice-d20"></i> ${d20}</span>
          <span class="op">+</span>
          <span class="part" title="(Reason + Awareness) / 2"><i class="fas fa-brain"></i> ${r.statBonus}</span>
          <span class="op">+</span>
          <span class="part" title="Trinkets"><i class="fas fa-tag"></i> ${r.trinkets}</span>
          <span class="op">=</span>
          <span class="total"><strong>${r.pcRoll}</strong></span>
          <span class="op">vs</span>
          <span class="part vhd" title="Vampiric Hit Dice"><i class="fas fa-tint"></i> <strong>${r.vhd}</strong></span>
        </span>
      </div>`;
  }).join("");

  const content = `
    <div class="vagabond-chat-card-v2 ccc-vampiric-endgame ${verdictClass}" data-card-type="vampiric-verdict" data-actor-id="${actor.id}">
      <h3 class="actor-name-header">${actor.name}</h3>
      <div class="card-body">
        <header class="card-header">
          <div class="header-icon"><img src="${portrait}" alt="${actor.name}" /></div>
          <div class="header-info">
            <h3 class="header-title">${title}</h3>
            <div class="metadata-tags-row">
              <div class="meta-tag"><i class="fas fa-dice-d20"></i><span>${rolls.length} ${rolls.length === 1 ? "roll" : "rolls"}</span></div>
            </div>
          </div>
        </header>
        <div class="card-description">
          <div class="ccc-vampiric-roll-list">${rowsHtml}</div>
          <div class="ccc-vampiric-verdict ${verdictClass}">${verdict}</div>
        </div>
      </div>
    </div>`;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });

  await setVampiricFlags(actor, { verdictRevealed: true });
  return { forfeit: anyForfeit, rolls };
}

export async function purgeEndgameHistory(actor) {
  await setVampiricFlags(actor, { endgameRolls: [], verdictRevealed: false, history: [], trinkets: [] });
}
