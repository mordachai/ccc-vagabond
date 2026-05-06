# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Module Overview

`ccc-vagabond` is a FoundryVTT module — "The Count, The Castle & The Curse" adventure for the Vagabond system. No build pipeline. JS and CSS changes are live immediately in FoundryVTT after saving.

- Module ID: `ccc-vagabond`
- Repo: [mordachai/ccc-vagabond](https://github.com/mordachai/ccc-vagabond)
- Requires FoundryVTT v13+, system: `vagabond`
- Hard dependencies: `totm-manager`, `macro-button`

## No Build Step

No `package.json`, no compiler, no bundler. All edits take effect immediately. Nothing to run.

## JavaScript Entry Points

There are two distinct script types registered in `module.json`:

- **`esmodules`**: `scripts/vampiric/index.js` — ES module with `import`/`export`. This is the vampiric curse subsystem.
- **`scripts`**: `scripts/stress-tracker.js` — Classic (non-module) script. No imports; uses only global Foundry APIs.

New ES module files must be imported from `index.js`; new classic scripts go in the `scripts` array in `module.json`.

Use `Hooks.once('init', ...)` for settings registration, `Hooks.once('ready', ...)` for socket/hook binding that needs the world loaded.

## Vampiric Subsystem Architecture

The main feature is a vampiric curse tracker for PC characters. Files live in `scripts/vampiric/`:

- **`data.js`** — All constants (`MODULE_ID`, item names, table names, setting keys), actor flag helpers (`getVampiricFlags`, `setVampiricFlags`), and stat accessors. Import from here rather than hardcoding strings elsewhere.
- **`curse.js`** — Applies/cures vampiric curses: draws unique items from world RollTables, creates embedded items on the actor, and updates the `Vampiric Resistance` item's active effect.
- **`endgame.js`** — Soul save contest (`performEndgameContest`): rolls `1d20 + (Reason+Awareness)/2 + trinketCount` vs accumulated VHD. `revealVerdict` posts the final chat card.
- **`trinket.js`** — Trinket application logic.
- **`chat-card.js`** — Creates request chat cards with action buttons. Handles the GM/player socket split: players emit `game.socket.emit('module.ccc-vagabond', ...)`, GM client receives and executes.
- **`panel.js`** — `VampiricPanel` extends `ApplicationV2`. GM-only; registered as a token control button via `getSceneControlButtons`. Shows all player characters with their curse state.
- **`index.js`** — Entry point: loads the Handlebars template, registers world settings, wires up hooks.

### State Storage

All vampiric state is stored as actor flags at `ccc-vagabond.vampiric`:

```js
{
  cursedCount: 0,        // number of times cursed
  hitDicePoints: 0,      // accumulated VHD (used as endgame target)
  history: [],           // curse history [{ts, trait, weakness, hpRoll}]
  endgameRolls: [],      // soul save results [{pcRoll, d20, vhd, forfeit, ts, ...}]
  verdictRevealed: false,
  trinkets: []
}
```

Access via `getVampiricFlags(actor)` / `setVampiricFlags(actor, patch)` from `data.js`.

### Required World Assets

The vampiric system silently fails or errors without these world-level assets present in the active world:

- **Item** named `"Vampiric Resistance"` — must exist in world Items; gets copied to actors and its active effect value is incremented.
- **RollTable** named `"Vampiric Traits"` — drawn during curse application.
- **RollTable** named `"Vampiric Weaknesses"` — drawn during curse application.

### Socket Pattern

The module declares `"socket": true` in `module.json`. Non-GM players cannot update actors directly, so curse/endgame/trinket rolls are delegated:

1. Player clicks button in chat → `game.socket.emit('module.ccc-vagabond', { action, actorId, messageId, userId })`
2. GM client receives in `onSocket` (registered in `registerChatCardHooks`) → locks the message flag → calls the handler

Chat cards carry a `ccc-vagabond.curseRequest` flag `{ kind, actorId, locked }`. Once `locked: true`, the button is disabled to prevent double-execution.

## Stress Tracker

`scripts/stress-tracker.js` (classic script, not an ES module). Adds a DOM element to `document.body` showing the current stress level. GM can left-click (+1) or right-click (−1), clamped 0–10. Hooks into `vagabond.preD20Roll` to add the stress value to `ctx.difficulty`. Tags outgoing chat messages via `preCreateChatMessage` so the renderer can highlight the difficulty number with `.ccc-stressed-difficulty`.

## CSS

Single file: `styles/ccc-styles.css`. All styles scoped under `.ccc-adventure` (adventure content) or `.ccc-vampiric` (vampiric panel/cards) to prevent bleed. Dark mode handled via `@media (prefers-color-scheme: dark)`. Color palette: dark reds (`#5a0000`, `#8b0000`) on cream.

## Templates

Handlebars templates live in `templates/`. Currently: `templates/vampiric/panel.hbs` for `VampiricPanel`. Templates are pre-loaded in `Hooks.once('init')` via `foundry.applications.handlebars.loadTemplates(...)`.

## Vagabond System API

`module-api.md` documents the hooks and static classes the `vagabond` system exposes:

- **`vagabond.preD20Roll`** (cancellable, `ctx.difficulty` and `ctx.favorHinder` mutable) — fired before any d20 roll
- **`vagabond.postD20Roll`** (observational, `ctx.extraMetadata` / `ctx.extraTags` appendable) — after roll, before chat card
- **`vagabond.preDamageApply`** / **`vagabond.postDamageApply`** — damage pipeline hooks
- **`vagabond.preStatusApply`** / **`vagabond.postStatusApply`** — status effect hooks
- **`game.vagabond.api`** — `VagabondChatCard`, `VagabondDamageHelper`, `StatusHelper`, `VagabondRollBuilder`
- **`game.vagabond.socket`** — `.emit(action, payload)` / `.register(action, handler)` for GM-delegated operations

## Adventure Pack

`packs/adventure/` is LevelDB binary format — do not edit manually. Modify adventure content through the FoundryVTT UI, then export. Pack type is `Adventure`; default ownership: players=OBSERVER, assistants=OWNER.

## Assets

- `assets/audio/` — `.ogg` ambient/effect files
- `assets/ui/` — UI frames and overlays (`.webp`)
- `assets/scenes/`, `assets/battlemaps/`, `assets/tokens/` — visual content
- `assets/docs/` — in-world document images (`.webp`)
- `assets/escalating_encounters/` — JSON data for the escalating encounters feature

All images are `.webp`; all audio is `.ogg`.

## module.json

Source of truth for version, dependencies, and file registration. Register new CSS in `styles`, new ES modules in `esmodules`, new classic scripts in `scripts`. Manifest and download URLs point to GitHub releases — bump `version` to trigger CI release.

## Releases

GitHub Actions workflow at `.github/workflows/release.yml` auto-releases when `module.json` version increases on push to `main`. Packages `styles/`, `assets/`, `packs/`, `scripts/`, `lang/`, `templates/` into `module.zip`.
