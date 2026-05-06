# The Count, the Castle, & the Curse — FoundryVTT Module

A gothic horror one-shot for the [Vagabond](https://www.drivethrurpg.com/en/product/123456) system. You're trapped in a vampire's castle. You have until midnight. Good luck.

This module bundles the full adventure and automates its three signature mechanics so the GM can run the whole thing without a spreadsheet in front of them.

---

## What this module does

**The Count, the Castle, & the Curse** is built around a Stress Level that rises and falls as players explore and make decisions. Every single player-facing d20 roll is made against it — it's the difficulty, the AC, the save target, all at once. The module puts that number on screen for everyone and keeps it wired into the Vagabond roll system automatically. The GM clicks it up or down; the math happens.

The adventure also has a progressive curse mechanic that affects each PC individually over the course of the session. The module handles all of that through a GM-only panel — tracking the state of the curse for every character, managing what gets applied, and keeping a full history. Players discover what the curse does by playing.

When the time comes for the final reckoning, the module runs it and posts the result to chat.

---

## Installation

In Foundry's **Add-on Modules** tab, paste this manifest URL:

```
https://github.com/mordachai/ccc-vagabond/releases/latest/download/module.json
```

**Requirements:**
- FoundryVTT v13+
- System: `vagabond`
- Modules: `totm-manager`, `macro-button`

After enabling the module, import the adventure from the **Compendium** tab. Everything else — scenes, tokens, journal entries, roll tables — comes with it.

---

## Running the adventure

The Stress Level counter appears in the top-right corner of the screen, visible to everyone. Only the GM can change it (left click +1, right click −1). It starts at 10.

The **Curse Panel** lives in the token layer controls (the blood drop icon, GM only). It shows every player character and their current state. Everything the GM needs to track the curse is in there — applying it, managing consequences, and resolving the endgame when midnight arrives.

The adventure pack has everything pre-configured. Import it, and run.

---

Made with [Deficient Master](https://youtu.be/hNNTk2Rbljo).
