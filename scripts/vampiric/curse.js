import {
  TRAITS_TABLE_NAME,
  WEAKNESSES_TABLE_NAME,
  RESISTANCE_ITEM_NAME,
  getResistanceDie,
  dieIconClass,
  getVampiricFlags,
  setVampiricFlags
} from "./data.js";

async function getItemFromResult(result) {
  if (result.documentUuid) return fromUuid(result.documentUuid);
  const desc = result.description ?? result.text ?? "";
  const m = desc.match(/@UUID\[([^\]]+)\]/);
  if (m) return fromUuid(m[1]);
  return null;
}

async function drawUniqueItem(actor, table) {
  if (!table) return null;
  const max = table.results.size;
  for (let i = 0; i < max + 5; i++) {
    const drawResult = await table.roll();
    const result = drawResult.results?.[0];
    if (!result) continue;
    const item = await getItemFromResult(result);
    if (!item) continue;
    if (!actor.items.find(it => it.name === item.name)) return item;
  }
  return null;
}

async function applyResistance(actor, hpRoll) {
  const owned = actor.items.find(i => i.name === RESISTANCE_ITEM_NAME);
  if (!owned) {
    const worldItem = game.items.find(i => i.name === RESISTANCE_ITEM_NAME);
    if (!worldItem) {
      ui.notifications?.error(`${RESISTANCE_ITEM_NAME} not found in world`);
      return;
    }
    const data = worldItem.toObject();
    delete data._id;
    if (data.effects?.[0]?.changes?.[0]) {
      data.effects[0].changes[0].value = String(hpRoll);
    }
    await actor.createEmbeddedDocuments("Item", [data]);
  } else {
    const eff = owned.effects.contents[0];
    if (!eff) return;
    const current = Number(eff.changes?.[0]?.value) || 0;
    const newChanges = foundry.utils.deepClone(eff.changes);
    newChanges[0].value = String(current + hpRoll);
    await eff.update({ changes: newChanges });
  }
  const max = foundry.utils.getProperty(actor, "system.health.max");
  if (typeof max === "number") {
    await actor.update({ "system.health.value": max });
  }
}

async function _postCurseCard(actor, trait, weakness, hpValue, rollObj = null) {
  const dieFormula = getResistanceDie();
  const traitImg = trait?.img ?? "icons/svg/mystery-man.svg";
  const weakImg = weakness?.img ?? "icons/svg/mystery-man.svg";
  const portrait = actor.img ?? "icons/svg/mystery-man.svg";
  const title = game.i18n?.localize?.("CCC.Vampiric.CardTitle") ?? "Vampiric Curse";
  const lblTrait = game.i18n?.localize?.("CCC.Vampiric.LblTrait") ?? "Trait";
  const lblWeak = game.i18n?.localize?.("CCC.Vampiric.LblWeakness") ?? "Weakness";
  const lblVHD = game.i18n?.localize?.("CCC.Vampiric.LblVHD") ?? "Vampiric Hit Die";
  const content = `
    <div class="vagabond-chat-card-v2 ccc-vampiric-result" data-card-type="vampiric-curse-result" data-actor-id="${actor.id}">
      <h3 class="actor-name-header">${actor.name}</h3>
      <div class="card-body">
        <div class="card-header">
          <div class="header-icon"><img src="${portrait}" alt="${actor.name}" /></div>
          <div class="header-info">
            <h2 class="header-title">${title}</h2>
            <div class="metadata-tags-row">
              <span class="meta-tag"><i class="fas fa-skull"></i> +${hpValue} VHD</span>
            </div>
          </div>
        </div>
        <div class="card-description">
          <div class="item-stats-grid">
            <div class="stat-row">
              <span class="stat-label"><img src="${traitImg}" class="ccc-vampiric-inline-icon" /> ${lblTrait}</span>
              <span class="stat-value">${trait?.name ?? "—"}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label"><img src="${weakImg}" class="ccc-vampiric-inline-icon" /> ${lblWeak}</span>
              <span class="stat-value">${weakness?.name ?? "—"}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label"><i class="${dieIconClass(dieFormula)}"></i> ${lblVHD} (${dieFormula})</span>
              <span class="stat-value">+${hpValue} HP</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  const msgData = { speaker: { alias: actor.name }, content, sound: CONFIG.sounds.dice };
  if (rollObj) msgData.rolls = [rollObj];
  await ChatMessage.create(msgData);
}

export async function getAllTableItems(tableName) {
  const table = game.tables.find(t => t.name === tableName);
  if (!table) return [];
  const items = [];
  for (const result of table.results) {
    const item = await getItemFromResult(result);
    if (item) items.push(item);
  }
  return items;
}

export async function applyVampiricCurse(actor) {
  const traitsTable = game.tables.find(t => t.name === TRAITS_TABLE_NAME);
  const weaknessesTable = game.tables.find(t => t.name === WEAKNESSES_TABLE_NAME);
  if (!traitsTable || !weaknessesTable) {
    ui.notifications?.error("Vampiric tables not found");
    return null;
  }

  const trait = await drawUniqueItem(actor, traitsTable);
  const weakness = await drawUniqueItem(actor, weaknessesTable);

  const dieFormula = getResistanceDie();
  const hpRoll = new Roll(dieFormula);
  await hpRoll.evaluate();

  const toCreate = [];
  if (trait) { const td = trait.toObject(); delete td._id; toCreate.push(td); }
  if (weakness) { const wd = weakness.toObject(); delete wd._id; toCreate.push(wd); }
  if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);

  await applyResistance(actor, hpRoll.total);

  const flags = getVampiricFlags(actor);
  await setVampiricFlags(actor, {
    cursedCount: flags.cursedCount + 1,
    hitDicePoints: flags.hitDicePoints + hpRoll.total,
    history: [...flags.history, {
      ts: Date.now(),
      trait: trait?.name ?? null,
      weakness: weakness?.name ?? null,
      hpRoll: hpRoll.total
    }]
  });

  await _postCurseCard(actor, trait, weakness, hpRoll.total, hpRoll);
  return { trait, weakness, hpRoll: hpRoll.total };
}

export async function applyVampiricCurseManual(actor, traitItem, weaknessItem, vhdValue) {
  const toCreate = [];
  if (traitItem && !actor.items.find(it => it.name === traitItem.name)) {
    const td = traitItem.toObject(); delete td._id; toCreate.push(td);
  }
  if (weaknessItem && !actor.items.find(it => it.name === weaknessItem.name)) {
    const wd = weaknessItem.toObject(); delete wd._id; toCreate.push(wd);
  }
  if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);

  await applyResistance(actor, vhdValue);

  const flags = getVampiricFlags(actor);
  await setVampiricFlags(actor, {
    cursedCount: flags.cursedCount + 1,
    hitDicePoints: flags.hitDicePoints + vhdValue,
    history: [...flags.history, {
      ts: Date.now(),
      trait: traitItem?.name ?? null,
      weakness: weaknessItem?.name ?? null,
      hpRoll: vhdValue
    }]
  });

  await _postCurseCard(actor, traitItem, weaknessItem, vhdValue);
  return { trait: traitItem, weakness: weaknessItem, hpRoll: vhdValue };
}

export async function cureActor(actor) {
  const removeIds = actor.items
    .filter(i => i.name === RESISTANCE_ITEM_NAME
      || i.flags?.core?.sourceId?.startsWith?.("Item.")
      && false) // keep simple: only remove resistance + tagged vampiric items by name
    .map(i => i.id);
  // Remove resistance
  const resistanceIds = actor.items.filter(i => i.name === RESISTANCE_ITEM_NAME).map(i => i.id);
  if (resistanceIds.length) {
    await actor.deleteEmbeddedDocuments("Item", resistanceIds);
  }
  await setVampiricFlags(actor, {
    cursedCount: 0,
    hitDicePoints: 0,
    endgame: null
  });
}
