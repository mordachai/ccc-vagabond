export const MODULE_ID = "ccc-vagabond";
export const FOLDER_NAME = "vampiricFolder";

export const FLAG_VAMPIRIC = "vampiric";

export const TRAITS_TABLE_NAME = "Vampiric Traits";
export const WEAKNESSES_TABLE_NAME = "Vampiric Weaknesses";
export const RESISTANCE_ITEM_NAME = "Vampiric Resistance";
export const TRINKET_ITEM_NAME = "Personal Trinket";

export const SETTING_RESISTANCE_DIE = "vampiric-resistance-die";
export const SETTING_TRINKET_DIE = "vampiric-trinket-die";

export function getResistanceDie() {
  return game.settings.get(MODULE_ID, SETTING_RESISTANCE_DIE) || "1d8";
}

export function getTrinketDie() {
  return game.settings.get(MODULE_ID, SETTING_TRINKET_DIE) || "1d6";
}

export const STAT_PATHS = {
  reasonTotal: "system.stats.reason.total",
  reasonValue: "system.stats.reason.value",
  awarenessTotal: "system.stats.awareness.total",
  awarenessValue: "system.stats.awareness.value",
  healthMax: "system.health.max",
  healthValue: "system.health.value",
  healthBonus: "system.health.bonus"
};

export function getActorReason(actor) {
  const total = foundry.utils.getProperty(actor, STAT_PATHS.reasonTotal);
  if (typeof total === "number") return total;
  return Number(foundry.utils.getProperty(actor, STAT_PATHS.reasonValue)) || 0;
}

export function getActorAwareness(actor) {
  const total = foundry.utils.getProperty(actor, STAT_PATHS.awarenessTotal);
  if (typeof total === "number") return total;
  return Number(foundry.utils.getProperty(actor, STAT_PATHS.awarenessValue)) || 0;
}

export function getTrinketCount(actor) {
  return actor.items.filter(i => i.name === TRINKET_ITEM_NAME).length;
}

export function getVampiricFlags(actor) {
  return foundry.utils.mergeObject(
    { cursedCount: 0, hitDicePoints: 0, history: [], endgameRolls: [], trinkets: [], verdictRevealed: false },
    actor.getFlag(MODULE_ID, FLAG_VAMPIRIC) ?? {},
    { inplace: false }
  );
}

export async function setVampiricFlags(actor, patch) {
  const current = getVampiricFlags(actor);
  const next = foundry.utils.mergeObject(current, patch, { inplace: false });
  return actor.setFlag(MODULE_ID, FLAG_VAMPIRIC, next);
}
