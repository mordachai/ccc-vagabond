import {
  TRAITS_TABLE_NAME,
  WEAKNESSES_TABLE_NAME,
  RESISTANCE_ITEM_NAME,
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

export async function applyVampiricCurse(actor) {
  const traitsTable = game.tables.find(t => t.name === TRAITS_TABLE_NAME);
  const weaknessesTable = game.tables.find(t => t.name === WEAKNESSES_TABLE_NAME);
  if (!traitsTable || !weaknessesTable) {
    ui.notifications?.error("Vampiric tables not found");
    return null;
  }

  const trait = await drawUniqueItem(actor, traitsTable);
  const weakness = await drawUniqueItem(actor, weaknessesTable);

  const hpRoll = new Roll("1d8");
  await hpRoll.evaluate();

  const toCreate = [];
  if (trait) {
    const td = trait.toObject();
    delete td._id;
    toCreate.push(td);
  }
  if (weakness) {
    const wd = weakness.toObject();
    delete wd._id;
    toCreate.push(wd);
  }
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

  const traitImg = trait?.img ?? "icons/svg/mystery-man.svg";
  const weakImg = weakness?.img ?? "icons/svg/mystery-man.svg";
  const content = `
    <div class="ccc-vampiric-result">
      <h3>${actor.name} - Vampiric Curse</h3>
      <div class="ccc-vampiric-row">
        <img src="${traitImg}" /> <strong>Trait:</strong> ${trait?.name ?? "—"}
      </div>
      <div class="ccc-vampiric-row">
        <img src="${weakImg}" /> <strong>Weakness:</strong> ${weakness?.name ?? "—"}
      </div>
      <div class="ccc-vampiric-row">
        <strong>Vampiric Hit Die (1d8):</strong> +${hpRoll.total} HP
      </div>
    </div>`;
  await ChatMessage.create({
    speaker: { alias: actor.name },
    content,
    rolls: [hpRoll],
    sound: CONFIG.sounds.dice
  });

  return { trait, weakness, hpRoll: hpRoll.total };
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
    feedingCount: 0,
    endgame: null
  });
}
