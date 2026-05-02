import { MODULE_ID } from "./data.js";
import { applyVampiricCurse } from "./curse.js";

const FLAG_KEY = "curseRequest";
const SOCKET_NAME = `module.${MODULE_ID}`;

export async function postCurseRequest(actor) {
  const portrait = actor.img ?? "icons/svg/mystery-man.svg";
  const content = `
    <div class="ccc-vampiric-card" data-actor-id="${actor.id}">
      <div class="ccc-vampiric-header">
        <img src="${portrait}" alt="${actor.name}" />
        <div class="ccc-vampiric-header-text">
          <h3>${actor.name}</h3>
          <p>${game.i18n.localize("CCC.Vampiric.CardPrompt")}</p>
        </div>
      </div>
      <button type="button" class="ccc-vampiric-btn" data-action="rollCurse">
        ${game.i18n.localize("CCC.Vampiric.RollButton")}
      </button>
    </div>`;
  return ChatMessage.create({
    content,
    flags: {
      [MODULE_ID]: {
        [FLAG_KEY]: { actorId: actor.id, locked: false }
      }
    }
  });
}

async function handleClick(message, btn) {
  if (btn.disabled) return;
  const flag = message.getFlag(MODULE_ID, FLAG_KEY);
  if (!flag || flag.locked) return;
  btn.disabled = true;
  btn.classList.add("locked");

  if (game.user.isGM) {
    await message.setFlag(MODULE_ID, FLAG_KEY, { ...flag, locked: true });
    const actor = game.actors.get(flag.actorId);
    if (actor) await applyVampiricCurse(actor);
    return;
  }
  game.socket.emit(SOCKET_NAME, {
    action: "rollCurse",
    actorId: flag.actorId,
    messageId: message.id,
    userId: game.user.id
  });
}

function bindButton(message, html) {
  const flag = message.getFlag(MODULE_ID, FLAG_KEY);
  if (!flag) return;
  const root = html?.[0] ?? html;
  if (!root || typeof root.querySelector !== "function") return;
  const btn = root.querySelector(`button.ccc-vampiric-btn[data-action="rollCurse"]`);
  if (!btn || btn.dataset.cccBound === "1") return;
  btn.dataset.cccBound = "1";
  if (flag.locked) {
    btn.disabled = true;
    btn.classList.add("locked");
  }
  btn.addEventListener("click", (ev) => {
    ev.preventDefault();
    handleClick(message, btn);
  });
}

function onSocket(payload) {
  if (!game.user.isGM) return;
  if (payload?.action !== "rollCurse") return;
  const message = game.messages.get(payload.messageId);
  const actor = game.actors.get(payload.actorId);
  if (!message || !actor) return;
  const flag = message.getFlag(MODULE_ID, FLAG_KEY);
  if (!flag || flag.locked) return;
  message.setFlag(MODULE_ID, FLAG_KEY, { ...flag, locked: true })
    .then(() => applyVampiricCurse(actor));
}

export function registerChatCardHooks() {
  Hooks.on("renderChatMessage", bindButton);
  Hooks.on("renderChatMessageHTML", bindButton);
  game.socket.on(SOCKET_NAME, onSocket);
}
