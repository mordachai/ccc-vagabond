export const MODULE_ID = "ccc-vagabond";
export const FOLDER_NAME = "vampiricFolder";

export const FLAG_VAMPIRIC = "vampiric";

export const TRAITS_TABLE_NAME = "Vampiric Traits";
export const WEAKNESSES_TABLE_NAME = "Vampiric Weaknesses";
export const RESISTANCE_ITEM_NAME = "Vampiric Resistance";
export const TRINKET_ITEM_NAME = "Personal Trinket";

export const STAT_PATHS = {
  reasonValue: "system.stats.reason.value",
  reasonBonus: "system.stats.reason.bonus",
  awarenessValue: "system.stats.awareness.value",
  awarenessBonus: "system.stats.awareness.bonus",
  healthMax: "system.health.max",
  healthValue: "system.health.value",
  healthBonus: "system.health.bonus"
};

export function getActorReason(actor) {
  return (foundry.utils.getProperty(actor, STAT_PATHS.reasonValue) || 0)
       + (foundry.utils.getProperty(actor, STAT_PATHS.reasonBonus) || 0);
}

export function getActorAwareness(actor) {
  return (foundry.utils.getProperty(actor, STAT_PATHS.awarenessValue) || 0)
       + (foundry.utils.getProperty(actor, STAT_PATHS.awarenessBonus) || 0);
}

export function getTrinketCount(actor) {
  return actor.items.filter(i => i.name === TRINKET_ITEM_NAME).length;
}

export function getVampiricFlags(actor) {
  return foundry.utils.mergeObject(
    { cursedCount: 0, hitDicePoints: 0, feedingCount: 0, history: [], endgame: null },
    actor.getFlag(MODULE_ID, FLAG_VAMPIRIC) ?? {},
    { inplace: false }
  );
}

export async function setVampiricFlags(actor, patch) {
  const current = getVampiricFlags(actor);
  const next = foundry.utils.mergeObject(current, patch, { inplace: false });
  return actor.setFlag(MODULE_ID, FLAG_VAMPIRIC, next);
}
