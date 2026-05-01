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

## JavaScript

Scripts live in `scripts/`. Register new files in `module.json` under the `scripts` array. Use ES modules (`type: "module"`). FoundryVTT v13 exposes the full Foundry API — no imports needed for core Foundry globals (`game`, `Hooks`, `ui`, etc.).

Use `Hooks.once('init', ...)` for module init, `Hooks.on(...)` for event listeners.

## CSS

Single file: `styles/ccc-styles.css`. All styles scoped under `.ccc-adventure` to prevent bleed into the rest of Foundry. Dark mode handled via `@media (prefers-color-scheme: dark)`. Color palette: dark reds (`#5a0000`, `#8b0000`) on cream.

## Adventure Pack

`packs/adventure/` is LevelDB binary format — do not edit manually. Modify adventure content through the FoundryVTT UI, then export. Pack type is `Adventure`; default ownership: players=OBSERVER, assistants=OWNER.

## Assets

- `assets/audio/` — `.ogg` ambient/effect files
- `assets/ui/` — UI frames and overlays (`.webp`)
- `assets/scenes/`, `assets/battlemaps/`, `assets/tokens/` — visual content

All assets are `.webp` (images) or `.ogg` (audio). Keep new assets in the same formats.

## module.json

Source of truth for version, dependencies, and file registration. Register new CSS in `styles` array, new JS in `scripts` array. Manifest and download URLs point to GitHub releases — bump `version` to trigger CI release.

## Releases

GitHub Actions workflow at `.github/workflows/release.yml` auto-releases when `module.json` version increases on push to `main`. Packages `styles/`, `assets/`, `packs/`, `scripts/` into `module.zip`.
