# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Module Overview

`ccc-vagabond` is a **content-only** FoundryVTT module — "The Count, The Castle & The Curse" adventure for the Vagabond system. No JavaScript, no build pipeline. Changes are live immediately in FoundryVTT after saving.

- Module ID: `ccc-vagabond`
- Requires FoundryVTT v13+, system: `vagabond`
- Hard dependencies: `totm-manager`, `macro-button`

## No Build Step

No `package.json`, no compiler, no bundler. CSS edits in `styles/ccc-styles.css` take effect immediately. Nothing to run.

## CSS

Single file: `styles/ccc-styles.css`. All styles scoped under `.ccc-adventure` to prevent bleed into the rest of Foundry. Dark mode handled via `@media (prefers-color-scheme: dark)`. Color palette: dark reds (`#5a0000`, `#8b0000`) on cream.

## Adventure Pack

`packs/adventure/` is LevelDB binary format — do not edit manually. Modify adventure content through the FoundryVTT UI, then export. Pack type is `Adventure`; default ownership: players=OBSERVER, assistants=OWNER.

## Assets

- `assets/audio/` — 34 `.ogg` ambient/effect files
- `assets/ui/` — UI frames and overlays (`.webp`)
- `assets/scenes/`, `assets/battlemaps/`, `assets/tokens/` — visual content

All assets are `.webp` (images) or `.ogg` (audio). Keep new assets in the same formats.

## module.json

Source of truth for version, dependencies, and file registration. CSS is registered here; if adding new CSS files, register them in the `styles` array.
