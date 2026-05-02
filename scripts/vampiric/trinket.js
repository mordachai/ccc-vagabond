import { MODULE_ID, TRINKET_ITEM_NAME, getTrinketDie, dieIconClass, getVampiricFlags, setVampiricFlags } from "./data.js";

const TRINKET_ITEM_ID = "oW2PZPS5fisprdHt";
const FLAG_KEY = "curseRequest";

async function getWorldTrinket() {
  let item = game.items.get(TRINKET_ITEM_ID);
  if (item) return item;
  item = await fromUuid(`Item.${TRINKET_ITEM_ID}`);
  if (item) return item;
  return game.items.find(i => i.name === TRINKET_ITEM_NAME) ?? null;
}

export async function applyTrinket(actor) {
  const worldItem = await getWorldTrinket();
  if (!worldItem) {
    ui.notifications?.error(`${TRINKET_ITEM_NAME} (Item.${TRINKET_ITEM_ID}) not found in world`);
    return null;
  }

  const dieFormula = getTrinketDie();
  const hpRoll = new Roll(dieFormula);
  await hpRoll.evaluate();

  const data = worldItem.toObject();
  delete data._id;
  if (data.effects?.[0]?.changes?.[0]) {
    data.effects[0].changes[0].value = String(hpRoll.total);
  }
  await actor.createEmbeddedDocuments("Item", [data]);

  const max = foundry.utils.getProperty(actor, "system.health.max");
  if (typeof max === "number") {
    await actor.update({ "system.health.value": max });
  }

  const flags = getVampiricFlags(actor);
  await setVampiricFlags(actor, {
    trinkets: [...(flags.trinkets ?? []), { ts: Date.now(), hpRoll: hpRoll.total }]
  });

  const portrait = actor.img ?? "icons/svg/mystery-man.svg";
  const trinketImg = worldItem.img ?? "icons/svg/mystery-man.svg";
  const title = game.i18n?.localize?.("CCC.Vampiric.TrinketResultTitle") ?? "Personal Trinket";
  const lblBonus = game.i18n?.localize?.("CCC.Vampiric.LblTrinketHP") ?? "Health Bonus";
  const content = `
    <div class="vagabond-chat-card-v2 ccc-vampiric-result" data-card-type="vampiric-trinket-result" data-actor-id="${actor.id}">
      <h3 class="actor-name-header">${actor.name}</h3>
      <div class="card-body">
        <div class="card-header">
          <div class="header-icon"><img src="${portrait}" alt="${actor.name}" /></div>
          <div class="header-info">
            <h2 class="header-title">${title}</h2>
            <div class="metadata-tags-row">
              <span class="meta-tag"><i class="fas fa-heart"></i> +${hpRoll.total} HP</span>
            </div>
          </div>
        </div>
        <div class="card-description">
          <div class="item-stats-grid">
            <div class="stat-row">
              <span class="stat-label"><img src="${trinketImg}" class="ccc-vampiric-inline-icon" /> ${worldItem.name}</span>
              <span class="stat-value">+${hpRoll.total} HP</span>
            </div>
            <div class="stat-row">
              <span class="stat-label"><i class="${dieIconClass(dieFormula)}"></i> ${lblBonus} (${dieFormula})</span>
              <span class="stat-value">+${hpRoll.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  await ChatMessage.create({
    speaker: { alias: actor.name },
    content,
    rolls: [hpRoll],
    sound: CONFIG.sounds.dice
  });

  return { hpRoll: hpRoll.total };
}

export async function postTrinketRequest(actor) {
  const portrait = actor.img ?? "icons/svg/mystery-man.svg";
  const title = game.i18n.localize("CCC.Vampiric.TrinketCardTitle");
  const prompt = game.i18n.localize("CCC.Vampiric.TrinketCardPrompt");
  const rollLabel = game.i18n.localize("CCC.Vampiric.TrinketRollButton");
  const dieIcon = dieIconClass(getTrinketDie());
  const content = `
    <div class="vagabond-chat-card-v2 ccc-vampiric-card" data-card-type="vampiric-trinket-request" data-actor-id="${actor.id}">
      <h3 class="actor-name-header">${actor.name}</h3>
      <div class="card-body">
        <div class="card-header">
          <div class="header-icon"><img src="${portrait}" alt="${actor.name}" /></div>
          <div class="header-info">
            <h2 class="header-title">${title}</h2>
            <div class="metadata-tags-row">
              <span class="meta-tag"><i class="fas fa-tag"></i> ${game.i18n.localize("CCC.Vampiric.MetaTrinket")}</span>
            </div>
          </div>
        </div>
        <div class="card-description">
          <p>${prompt}</p>
        </div>
        <div class="card-actions">
          <button type="button" class="ccc-vampiric-btn" data-action="rollTrinket">
            <i class="${dieIcon}"></i> ${rollLabel}
          </button>
        </div>
      </div>
    </div>`;
  return ChatMessage.create({
    content,
    flags: {
      [MODULE_ID]: {
        [FLAG_KEY]: { kind: "trinket", actorId: actor.id, locked: false }
      }
    }
  });
}
