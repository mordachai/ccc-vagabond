/**
 * Stress Level Tracker
 * Top-right UI: left click +1, right click -1 (GM only)
 * Increases difficulty of all d20 rolls by the stress level value
 */

const MODULE_ID = "ccc-vagabond";
const STRESS_ENABLED = "stress-level-enabled";
const STRESS_SETTING = "stress-level-value";

function registerStressSetting() {
    game.settings.register(MODULE_ID, STRESS_ENABLED, {
        name: "CCC.Settings.UseStressLevel.Name",
        hint: "CCC.Settings.UseStressLevel.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: (enabled) => {
            if (enabled) renderStressUI();
            else removeStressUI();
        }
    });

    game.settings.register(MODULE_ID, STRESS_SETTING, {
        name: "CCC.Settings.GlobalStressLevel.Name",
        scope: "world",
        config: false,
        type: Number,
        default: 0,
        onChange: () => renderStressUI()
    });
}

function removeStressUI() {
    document.getElementById("stress-tracker-ui")?.remove();
}

function renderStressUI() {
    if (!game.settings.get(MODULE_ID, STRESS_ENABLED)) {
        removeStressUI();
        return;
    }

    let element = document.getElementById("stress-tracker-ui");
    const val = game.settings.get(MODULE_ID, STRESS_SETTING);

    if (!element) {
        element = document.createElement("div");
        element.id = "stress-tracker-ui";
        document.body.appendChild(element);

        element.addEventListener("click", () => {
            if (!game.user.isGM) return;
            const current = game.settings.get(MODULE_ID, STRESS_SETTING);
            if (current < 10) updateStressValue(current + 1);
        });

        element.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (!game.user.isGM) return;
            const current = game.settings.get(MODULE_ID, STRESS_SETTING);
            if (current > 0) updateStressValue(current - 1);
        });
    }

    element.innerHTML = `${game.i18n.localize("CCC.UI.StressLevel")}: ${val}`;
}

async function updateStressValue(newVal) {
    if (!game.user.isGM) return;
    await game.settings.set(MODULE_ID, STRESS_SETTING, newVal);
}

Hooks.once("init", () => registerStressSetting());
Hooks.on("ready", () => renderStressUI());
Hooks.on("renderSceneNavigation", () => renderStressUI());

// Apply stress as difficulty increase
let _pendingStress = null;

Hooks.on("vagabond.preD20Roll", (ctx) => {
  if (!game.settings.get(MODULE_ID, STRESS_ENABLED)) return;
  if (typeof ctx.difficulty !== "number") return;

  const stressLevel = game.settings.get(MODULE_ID, STRESS_SETTING);
  if (stressLevel > 0) {
    ctx.difficulty += stressLevel;
    _pendingStress = { stress: stressLevel, actorId: ctx.actor?.id, time: Date.now() };
  }
});

// Tag chat message with stress flag so renderer can highlight difficulty
Hooks.on("preCreateChatMessage", (msg) => {
  if (!_pendingStress) return;
  const fresh = Date.now() - _pendingStress.time < 2000;
  const speakerMatches = msg.speaker?.actor === _pendingStress.actorId;
  if (fresh && speakerMatches) {
    msg.updateSource({ [`flags.${MODULE_ID}.stressApplied`]: _pendingStress.stress });
  }
  _pendingStress = null;
});

// Add visual border to difficulty number on flagged cards
function highlightStressedDifficulty(msg, html) {
  if (!msg.getFlag(MODULE_ID, "stressApplied")) return;
  const el = html?.[0] ?? html;
  el?.querySelector?.(".roll-target")?.classList.add("ccc-stressed-difficulty");
}
Hooks.on("renderChatMessage", highlightStressedDifficulty);
Hooks.on("renderChatMessageHTML", highlightStressedDifficulty);
