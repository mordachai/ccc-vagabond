import {
  getActorReason,
  getActorAwareness,
  getTrinketCount,
  getVampiricFlags,
  setVampiricFlags
} from "./data.js";

export async function logFeeding(actor, delta = 1) {
  const flags = getVampiricFlags(actor);
  const next = Math.max(0, flags.feedingCount + delta);
  await setVampiricFlags(actor, { feedingCount: next });
  return next;
}

export async function performEndgameContest(actor) {
  const flags = getVampiricFlags(actor);
  const reason = getActorReason(actor);
  const awareness = getActorAwareness(actor);
  const statBonus = Math.floor((reason + awareness) / 2);
  const trinkets = getTrinketCount(actor);

  const parts = ["1d20", String(statBonus)];
  if (trinkets > 0) parts.push(`${trinkets}d6`);
  const formula = parts.join(" + ");

  const pcRoll = new Roll(formula);
  await pcRoll.evaluate();

  const vhd = flags.hitDicePoints || 0;
  const forfeit = vhd > pcRoll.total;

  const gmIds = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
  await pcRoll.toMessage({
    speaker: { alias: actor.name },
    flavor: `Soul Save vs Vampiric Hit Dice (VHD = ${vhd})`,
    whisper: gmIds
  });

  const result = {
    pcRoll: pcRoll.total,
    vhd,
    forfeit,
    formula: `${formula} = ${pcRoll.total}`,
    statBonus,
    trinkets,
    ts: Date.now()
  };
  await setVampiricFlags(actor, { endgame: result });
  return result;
}
