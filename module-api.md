# Vagabond Module API

Vagabond exposes a comprehensive hook system and static API surface for external modules (like `ccc-vagabond`) to integrate seamlessly with the roll system, status effects, damage application, and socket relay.

## Quick Start

```js
// Example: Listen for pre-roll hooks to modify difficulty
Hooks.on('vagabond.preD20Roll', ({ actor, rollKey, rollType, difficulty, favorHinder, rollData }) => {
  if (rollType === 'skill' && rollKey === 'awareness') {
    console.log(`Rolling ${rollKey} with difficulty ${difficulty}`);
  }
});

// Example: Mutate difficulty from a module
Hooks.on('vagabond.preD20Roll', (ctx) => {
  if (ctx.actor.hasCondition('hindered')) {
    ctx.difficulty += 2;  // Easier
  }
});

// Example: Access static API
const { VagabondDamageHelper, StatusHelper } = game.vagabond.api;
const critNumber = VagabondDamageHelper.calculateCritThreshold(rollData, 'melee');
```

---

## Hooks Reference

### Roll Hooks

#### `vagabond.preD20Roll`
**Type:** `Hooks.call()` — cancellable by returning `false`

Fired before any d20 roll (skills, saves, weapon attacks, spells).

**Context shape:**
```js
{
  actor,           // VagabondActor rolling
  item,            // Item or null (null for skill/save; item for weapon/spell)
  rollKey,         // String: skill/save/weapon key or manaSkillKey for spells
  rollType,        // 'stat' | 'skill' | 'save' | 'weapon' | 'spell'
  difficulty,      // Number: target DC; null for stat rolls
  favorHinder,     // 'favor' | 'hinder' | 'none'
  rollData         // Roll context from actor.getRollData()
}
```

**Mutation:**

- Modules can mutate `ctx.difficulty` and `ctx.favorHinder` — the updated values are used for the roll, the success check, and the chat card.
- Mutations propagate across all roll types:
  - **skill / save / stat:** difficulty used directly in `roll.total >= difficulty` check
  - **weapon:** mutated difficulty passed to `item.rollAttack()` via the `difficultyOverride` parameter (only when mutated)
  - **spell:** mutated difficulty hoisted to outer scope so the chat card displays the modified value
- Return `false` to cancel the roll entirely.

**Examples:**
```js
// Reduce difficulty for undead targets
Hooks.on('vagabond.preD20Roll', (ctx) => {
  if (ctx.rollType === 'weapon' && ctx.actor.system.undead) {
    ctx.difficulty -= 2;
  }
});

// Apply a penalty to rolls during daytime
Hooks.on('vagabond.preD20Roll', (ctx) => {
  if (isDaytime()) ctx.favorHinder = 'hinder';
});
```

---

#### `vagabond.postD20Roll`
**Type:** `Hooks.callAll()` — observational only

Fired after any d20 roll completes (after success check, before chat card posted).

**Context shape:**
```js
{
  actor,           // VagabondActor who rolled
  item,            // Item or null
  rollKey,         // String: skill/save/weapon key, etc.
  rollType,        // 'stat' | 'skill' | 'save' | 'weapon' | 'spell'
  roll,            // Roll object with evaluated result
  difficulty,      // Number: final DC used
  isSuccess,       // Boolean; null for stat rolls
  isCritical,      // Boolean
  extraMetadata,   // Array: additional metadata to inject into chat card
  extraTags        // Array: additional tags to inject into chat card
}
```

**Usage:**
- Modules can **push to** `ctx.extraMetadata` and `ctx.extraTags` to add custom data to the chat card.
- `extraMetadata` items are visible in the card's metadata section.
- `extraTags` are appended to the skill/damage/delivery tag list.

**Examples:**
```js
// Track roll history
Hooks.on('vagabond.postD20Roll', (ctx) => {
  if (ctx.isSuccess) recordSuccess(ctx.actor, ctx.rollKey);
});

// Add custom tags to all weapon attacks
Hooks.on('vagabond.postD20Roll', (ctx) => {
  if (ctx.rollType === 'weapon') {
    ctx.extraTags.push({ label: 'Custom Tag', cssClass: 'custom' });
  }
});
```

---

### Status Hooks

#### `vagabond.preStatusApply`
**Type:** `Hooks.call()` — cancellable

Fired before a status effect is applied to an actor (after all immunity/save checks pass).

**Context shape:**
```js
{
  actor,              // VagabondActor receiving the status
  statusId,           // String: 'burning', 'poisoned', etc.
  sourceName,         // String: name of effect source (e.g., "Burn Spell")
  saveType,           // String: 'reflex' | 'endure' | 'will' | 'none'
  damageWasBlocked    // Boolean: did armor fully block incoming damage?
}
```

**Cancellation:**
- Return `false` to prevent the status from applying (returns `{ outcome: 'cancelled' }`).

**Examples:**
```js
// Prevent undead from being poisoned
Hooks.on('vagabond.preStatusApply', (ctx) => {
  if (ctx.statusId === 'poisoned' && ctx.actor.system.undead) {
    return false;
  }
});

// Log all status applications
Hooks.on('vagabond.preStatusApply', (ctx) => {
  console.log(`${ctx.actor.name} is getting ${ctx.statusId} from ${ctx.sourceName}`);
});
```

---

#### `vagabond.postStatusApply`
**Type:** `Hooks.callAll()` — observational only

Fired after a status effect is successfully applied to an actor.

**Context shape:**
```js
{
  actor,              // VagabondActor
  statusId,           // String
  sourceName,         // String
  saveType,           // String
  damageWasBlocked    // Boolean
}
```

---

### Damage Hooks

#### `vagabond.preDamageApply`
**Type:** `Hooks.call()` — cancellable; **`ctx.amount` is mutable**

Fired before HP is reduced by damage (3 sites: auto-apply save damage, Apply Direct button, Apply Save button).

**Context shape:**
```js
{
  actor,        // VagabondActor taking damage
  amount,       // Number: damage to apply — MUTABLE (modules can change this)
  damageType,   // String: 'physical' | 'fire' | 'cold' | etc.
  sourceItem    // Item or null (null when applying save damage from chat button)
}
```

**Mutation & Cancellation:**
- Modules can **mutate** `ctx.amount` to change final damage (e.g., `ctx.amount *= 0.5` for half damage).
- Mutations are clamped to `Math.max(0, amount)` after the hook.
- Return `false` to cancel the apply entirely (no HP change, no post hook).

**Examples:**
```js
// Halve damage to constructs
Hooks.on('vagabond.preDamageApply', (ctx) => {
  if (ctx.actor.type === 'npc' && ctx.actor.system.isConstruct) {
    ctx.amount = Math.floor(ctx.amount / 2);
  }
});

// Block fire damage to fire elementals
Hooks.on('vagabond.preDamageApply', (ctx) => {
  if (ctx.damageType === 'fire' && ctx.actor.system.fireElemental) {
    return false;  // Cancel the apply
  }
});
```

---

#### `vagabond.postDamageApply`
**Type:** `Hooks.callAll()` — observational only

Fired after damage is applied and HP is updated.

**Context shape:**
```js
{
  actor,        // VagabondActor
  amount,       // Number: final damage applied (after hook mutation)
  damageType,   // String
  sourceItem,   // Item or null
  oldHp,        // Number: HP before damage
  newHp         // Number: HP after damage
}
```

**Examples:**
```js
// Trigger regeneration when actor is damaged
Hooks.on('vagabond.postDamageApply', (ctx) => {
  if (ctx.newHp > 0) {
    triggerRegeneration(ctx.actor, ctx.amount);
  }
});
```

---

## API Surface: `game.vagabond`

All static classes are exposed for direct use by modules.

```js
game.vagabond = {
  version,                    // String: system version
  
  api: {
    VagabondChatCard,         // Chat card builder (static methods)
    VagabondDamageHelper,     // Damage calculation & application
    StatusHelper,             // Status effect utilities
    VagabondRollBuilder       // Roll construction & crit thresholds
  },
  
  socket: {
    emit(action, payload),    // Emit socket relay action (GM client executes)
    register(action, handler) // Register custom socket action
  }
}
```

### `VagabondChatCard`
Static utility class for building and posting chat cards.

**Key methods:**
- `createActionCard({ actor, item, title, rollData, tags, metadata, ... })` — Build and post a chat card
- `applyResult(actor, { type, finalAmount, newValue, ... })` — Post a damage/heal result
- `skillRoll(actor, skillKey, roll, difficulty, isSuccess, extraMetadata, extraTags)` — Post skill check
- `saveRoll(actor, saveKey, roll, difficulty, isSuccess, extraMetadata, extraTags)` — Post save check
- `weaponAttack(actor, weapon, attackResult, damageRoll, targets, extraMetadata, extraTags)` — Post weapon attack
- `spellCast(actor, spell, spellCastResult, damageRoll, targets, extraMetadata, extraTags)` — Post spell cast

### `VagabondDamageHelper`
Static utility class for damage calculation.

**Key methods:**
- `calculateFinalDamage(targetActor, baseDamage, damageType, sourceItem)` → Number (after armor/immune/weak)
- `calculateCritThreshold(rollData, weaponSkill)` → Number (d20 crit threshold)
- `shouldRollDamage(isHit)` → Boolean
- `rollSpellDamage(actor, spell, state, isCritical, manaSkillStat, targetsAtRollTime)` → Promise<Roll>

### `StatusHelper`
Static utility class for status effect utilities.

**Key methods:**
- `applyStatus(actor, entry, damageWasBlocked, sourceName, options)` → Promise<{ outcome }>
- `processCausedStatuses(targetActor, causedStatuses[], damageWasBlocked, sourceName, options)` → Promise<results[]>
- `isStatusImmune(actor, statusId)` → Boolean
- `isStatusResisted(actor, statusId)` → Boolean (applies Favor to save)
- `actorHasStatus(actor, statusId)` → Boolean

### `VagabondRollBuilder`
Static utility class for roll construction.

**Key methods:**
- `buildAndEvaluateD20(actor, favorHinder)` → Promise<Roll>
- `buildAndEvaluateD20WithRollData(rollData, favorHinder)` → Promise<Roll>
- `calculateEffectiveFavorHinder(systemState, shiftKey, ctrlKey)` → 'favor' | 'hinder' | 'none'
- `calculateCritThreshold(rollData, critType)` → Number (per-skill/save/spell crit threshold)

---

## Socket Relay: `game.vagabond.socket`

The socket relay routes damage/status/countdown-die operations through the GM client when a non-owner player triggers them.

### Built-in Actions

- **`applyDamage`** — `{ actorUuid, newHp }` → Update actor HP
- **`applyStatus`** — `{ actorUuid, statusId, active }` → Toggle status effect
- **`createCountdownDie`** — `{ name, diceType, ... }` → Create countdown JournalEntry
- **`grantLuck`** — `{ actorUuid, amount }` → Add Luck to actor

### Custom Actions

Modules can register their own socket actions:

```js
// Register
Hooks.once('ready', () => {
  game.vagabond.socket.register('myCustomAction', async (payload) => {
    // This runs on GM client only
    const actor = await fromUuid(payload.actorUuid);
    await actor.update({ 'system.customField': payload.value });
  });
});

// Emit (from any client)
game.vagabond.socket.emit('myCustomAction', { actorUuid: actor.uuid, value: 42 });
```

**Important:** Socket handlers run **only on the GM client**. Use this for permission-locked operations (actor updates, journal entry creation, etc.).

---

## Example: Difficulty Modifier Module

```js
// manifest.json
{
  "id": "vagabond-ccc-modifier",
  "title": "Vagabond CCC Difficulty Modifier",
  "version": "1.0.0",
  "minimumCoreVersion": "13.0.0",
  "systems": ["vagabond"]
}

// scripts/module.js
Hooks.once('ready', () => {
  console.log('CCC Difficulty Modifier loaded');
});

// Listen for all d20 rolls and apply CCC difficulty bonuses
Hooks.on('vagabond.preD20Roll', (ctx) => {
  const actor = ctx.actor;
  
  // Apply class-specific difficulty modifiers
  if (actor.system.classData?.key === 'warrior') {
    if (ctx.rollType === 'weapon') {
      ctx.difficulty -= 1;  // Weapon attacks are easier
    }
  }
  
  // Apply status-based modifiers
  if (actor.conditions.has('bloodlust')) {
    ctx.difficulty -= 2;  // Easier while in bloodlust
  }
  
  // Don't cancel — just mutate the context
});

// Track crit successes for achievement system
Hooks.on('vagabond.postD20Roll', (ctx) => {
  if (ctx.isCritical) {
    window.myModule.recordCrit(ctx.actor.id, ctx.rollType);
  }
});

// Custom status hook: prevent certain NPCs from being stunned
Hooks.on('vagabond.preStatusApply', (ctx) => {
  if (ctx.statusId === 'stunned' && ctx.actor.system.isElite) {
    console.log(`${ctx.actor.name} resists stun!`);
    return false;  // Prevent the stun
  }
});
```

---

## Best Practices

1. **Always use `Hooks.once('ready', ...)` for initialization** — game world and actors are loaded.
2. **Mutations are safe** — hooks verify their own changes; don't mutate fields you don't own.
3. **Return `false` carefully** — cancelling rolls or status applications has UX implications.
4. **Socket operations are fire-and-forget** — no return value; rely on `postDamageApply` hook for feedback.
5. **Check `actor.type`** — different actor types (character, npc) have different fields and behavior.
6. **Use `fromUuid()` for cross-scene references** — socket handlers may be on different scenes.

---

## API Stability

This API is versioned with the system. Breaking changes will be announced in release notes. Semantic versioning applies:
- **Patch (5.2.1 → 5.2.2):** Bug fixes; no API changes
- **Minor (5.1.0 → 5.2.0):** New hooks/features; existing hooks remain compatible
- **Major (4.x → 5.x):** May include breaking changes to hook signatures or API surface
