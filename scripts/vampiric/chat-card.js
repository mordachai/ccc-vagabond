import { MODULE_ID } from "./data.js";
import { applyVampiricCurse } from "./curse.js";
import { performEndgameContest } from "./endgame.js";
import { applyTrinket } from "./trinket.js";

const FLAG_KEY = "curseRequest";
const SOCKET_NAME = `module.${MODULE_ID}`;

const KINDS = {
  curse: {
    action: "rollCurse",
    handler: applyVampiricCurse,
    btnSelector: `button[data-action="rollCurse"]`
  },
  endgame: {
    action: "rollEndgame",
    handler: performEndgameContest,
    btnSelector: `button[data-action="rollEndgame"]`
  },
  trinket: {
    action: "rollTrinket",
    handler: applyTrinket,
    btnSelector: `button[data-action="rollTrinket"]`
  }
};

export async function postCurseRequest(actor) {
  const portrait = actor.img ?? "icons/svg/mystery-man.svg";
  const title = game.i18n.localize("CCC.Vampiric.CardTitle");
  const prompt = game.i18n.localize("CCC.Vampiric.CardPrompt");
  const rollLabel = game.i18n.localize("CCC.Vampiric.RollButton");
  const content = `
    <div class="vagabond-chat-card-v2 ccc-vampiric-card" data-card-type="vampiric-curse-request" data-actor-id="${actor.id}">
      <h3 class="actor-name-header">${actor.name}</h3>
      <div class="card-body">
        <div class="card-header">
          <div class="header-icon"><img src="${portrait}" alt="${actor.name}" /></div>
          <div class="header-info">
            <h2 class="header-title">${title}</h2>
            <div class="metadata-tags-row">
              <span class="meta-tag"><i class="fas fa-tint"></i> ${game.i18n.localize("CCC.Vampiric.MetaCurse")}</span>
            </div>
          </div>
        </div>
        <div class="card-description">
          <p>${prompt}</p>
        </div>
        <div class="card-actions">
          <button type="button" class="ccc-vampiric-btn" data-action="rollCurse">
            <i class="fas fa-dice-d20"></i> ${rollLabel}
          </button>
        </div>
      </div>
    </div>`;
  return ChatMessage.create({
    content,
    flags: {
      [MODULE_ID]: {
        [FLAG_KEY]: { kind: "curse", actorId: actor.id, locked: false }
      }
    }
  });
}

export async function postEndgameRequest(actor) {
  const portrait = actor.img ?? "icons/svg/mystery-man.svg";
  const title = game.i18n.localize("CCC.Vampiric.EndGameTitle");
  const prompt = game.i18n.localize("CCC.Vampiric.EndGamePrompt");
  const rollLabel = game.i18n.localize("CCC.Vampiric.EndGameRollBtn");
  const content = `
    <div class="vagabond-chat-card-v2 ccc-vampiric-card" data-card-type="vampiric-endgame-request" data-actor-id="${actor.id}">
      <h3 class="actor-name-header">${actor.name}</h3>
      <div class="card-body">
        <div class="card-header">
          <div class="header-icon"><img src="${portrait}" alt="${actor.name}" /></div>
          <div class="header-info">
            <h2 class="header-title">${title}</h2>
            <div class="metadata-tags-row">
              <span class="meta-tag"><i class="fas fa-skull"></i> ${game.i18n.localize("CCC.Vampiric.MetaSoulSave")}</span>
            </div>
          </div>
        </div>
        <div class="card-description">
          <p>${prompt}</p>
        </div>
        <div class="card-actions">
          <button type="button" class="ccc-vampiric-btn" data-action="rollEndgame">
            <i class="fas fa-dice-d20"></i> ${rollLabel}
          </button>
        </div>
      </div>
    </div>`;
  return ChatMessage.create({
    content,
    flags: {
      [MODULE_ID]: {
        [FLAG_KEY]: { kind: "endgame", actorId: actor.id, locked: false }
      }
    }
  });
}

async function handleClick(message, btn, kind) {
  if (btn.disabled) return;
  const flag = message.getFlag(MODULE_ID, FLAG_KEY);
  if (!flag || flag.locked) return;
  btn.disabled = true;
  btn.classList.add("locked");

  const def = KINDS[kind];
  if (!def) return;

  if (game.user.isGM) {
    await message.setFlag(MODULE_ID, FLAG_KEY, { ...flag, locked: true });
    const actor = game.actors.get(flag.actorId);
    if (actor) await def.handler(actor);
    return;
  }
  game.socket.emit(SOCKET_NAME, {
    action: def.action,
    actorId: flag.actorId,
    messageId: message.id,
    userId: game.user.id
  });
}

function bindButton(message, html) {
  const flag = message.getFlag(MODULE_ID, FLAG_KEY);
  if (!flag) return;
  const kind = flag.kind ?? "curse";
  const def = KINDS[kind];
  if (!def) return;
  const root = html?.[0] ?? html;
  if (!root || typeof root.querySelector !== "function") return;
  const btn = root.querySelector(def.btnSelector);
  if (!btn || btn.dataset.cccBound === "1") return;
  btn.dataset.cccBound = "1";
  if (flag.locked) {
    btn.disabled = true;
    btn.classList.add("locked");
  }
  btn.addEventListener("click", (ev) => {
    ev.preventDefault();
    handleClick(message, btn, kind);
  });
}

function onSocket(payload) {
  if (!game.user.isGM) return;
  const def = Object.values(KINDS).find(k => k.action === payload?.action);
  if (!def) return;
  const message = game.messages.get(payload.messageId);
  const actor = game.actors.get(payload.actorId);
  if (!message || !actor) return;
  const flag = message.getFlag(MODULE_ID, FLAG_KEY);
  if (!flag || flag.locked) return;
  message.setFlag(MODULE_ID, FLAG_KEY, { ...flag, locked: true })
    .then(() => def.handler(actor));
}

export function registerChatCardHooks() {
  Hooks.on("renderChatMessage", bindButton);
  Hooks.on("renderChatMessageHTML", bindButton);
  game.socket.on(SOCKET_NAME, onSocket);
}
