/**
 * Stress Level Tracker
 * Top-right UI: left click +1, right click -1 (GM only)
 * Applies a universalCheckBonus penalty to all characters equal to -stressLevel
 */

const MODULE_ID = "ccc-vagabond";
const STRESS_ENABLED = "stress-level-enabled";
const STRESS_SETTING = "stress-level-value";
const EFFECT_LABEL = "Global Stress Penalty";

function registerStressSetting() {
    game.settings.register(MODULE_ID, STRESS_ENABLED, {
        name: "Use Stress Level",
        hint: "Enable the Stress Level tracker overlay and its penalty effects on characters.",
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
        name: "Global Stress Level",
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

    element.innerHTML = `Stress Level: ${val}`;
}

async function updateStressValue(newVal) {
    if (!game.user.isGM) return;

    await game.settings.set(MODULE_ID, STRESS_SETTING, newVal);
    const penalty = -Math.abs(newVal);

    for (const actor of game.actors.filter(a => a.type === "character")) {
        const effect = actor.effects.find(e => e.getFlag(MODULE_ID, "isStressEffect"));

        if (newVal === 0) {
            if (effect) await effect.delete();
            continue;
        }

        const effectData = {
            name: EFFECT_LABEL,
            icon: "icons/magic/control/fear-fright-white.webp",
            origin: actor.uuid,
            changes: [{
                key: "system.universalCheckBonus",
                value: penalty,
                mode: CONST.ACTIVE_EFFECT_MODES.ADD
            }],
            flags: { [MODULE_ID]: { isStressEffect: true } }
        };

        if (effect) {
            await effect.update(effectData);
        } else {
            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }
    }
}

Hooks.once("init", () => registerStressSetting());
Hooks.on("ready", () => renderStressUI());
Hooks.on("renderSceneNavigation", () => renderStressUI());
