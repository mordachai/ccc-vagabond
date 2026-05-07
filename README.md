# The Count, the Castle, & the Curse 
## A FoundryVTT Adventure Module

> **[Get the adventure on DriveThruRPG](https://www.drivethrurpg.com/en/product/458350/the-count-the-castle-the-curse?language=ptpfromptopwywtruepwywtrueptopwywtruepto)** · **[Watch the overview by Deficient Master](https://youtu.be/hNNTk2Rbljo)**

A gothic horror one-shot by A.B. Bo (Deficient Master), adapted for the [Vagabond system](https://foundryvtt.com/packages/vagabond). You're trapped in a vampire's castle. You have until midnight. Good luck.

This is a full FoundryVTT implementation of the adventure — scenes, tokens, journal entries, AI-generated art and music, all in a Theater of the Mind build. This module automates automates the three signature mechanics that make the adventure tick, so the GM can focus on the horror instead of the math.

---

## How it works

- **Stress Level** the party is in a pinch and it shows. In Vagabond there's no AC — each player already knows the difficulty they need to hit from their own sheet. The Stress Level adds to that. Every room explored, every terrible thing witnessed, every real-time hour that passes pushes it up. It can go down too, but not easily and ometimes at a cost. The module puts the Stress Level on screen for the whole table. The GM activates it in the module settings, and from there it feeds directly into every d20 roll through the Vagabond system — no manual calculation needed. It runs from 0 to 5.

- **The Curse** in the scene tools panel you will find the Vampiric Curse Panel that will help you sort out all thing related to this part of the adventure, from Vampiric Traits, Weaknesses and Hit Dice to Personal Trinkets.

- **Escalating Encounters** this adventure module automatically install the Escalating Encounters module. In the module assets folder and on the instruction below you will find the json file that automatically configures the encounter table for you. You can roll or decide the encounters manually, but loading form this file gives you the automation in sync with the scene navigation controls.

- **Scene navigation** in The Castle scene there is a panel with all castle rooms. Its only visible to the GM. Click on a room there will load the scene image for all players, change the music and in most rooms throw in the chat, also only visible for the GM, the escalating encounter outcome for that room. All of these buttons are powered by the macros you find on the Macros menu, changing things there changes what the button does. Ths Theather of the Mind Manager module is the one taking care of the scene swapping.

<img width="953" height="811" alt="image" src="https://github.com/user-attachments/assets/da2ac475-2423-483a-9893-e54af2fe6932" />

---

## Installation

In Foundry's **Add-on Modules** tab, paste this manifest URL and click Install:

```
https://github.com/mordachai/ccc-vagabond/releases/latest/download/module.json
```

After enabling the module, import the adventure from the **Compendium tab >> CCC >> Adventure**. All items will be imported. After that open the Vampiric Curse Panel in the Scene Tools and load the json referenced in the next section and you're ready to go!

<img width="1814" height="887" alt="image" src="https://github.com/user-attachments/assets/f82b0f01-99de-4888-8ce8-6a478bf1ff3a" />


### Required modules

These must be installed and active (will auto install):

- **Theather of the Mind Manager**
- **Macro Button**
- **Escalating Encounters:** the adventure ships with a pre-configured encounter table for it. After installing, import the config file from here **[CCC Escalation Encounters](https://github.com/mordachai/ccc-vagabond/tree/5e51406db8b3416c7ff4b6def8d00c2877543fee/assets/escalating_encounters)**. The same file is on `modules/ccc-vagabond/assets/escalating_encounters`. Check on the image below where to import: **Edit Tables >> Import from JSON**

<img width="953" height="811" alt="image" src="https://github.com/user-attachments/assets/ea40d118-9652-4794-962f-2babeec7e05c" />


### Recommended modules

These aren't required but the adventure was built with them in mind:

- **[Item Piles](https://foundryvtt.com/packages/item-piles)** + **[Item Piles – Vagabond](https://foundryvtt.com/packages/item-piles-vagabond)** — for loot and item management
- **[Token HUD Wildcard](https://foundryvtt.com/packages/token-hud-wildcard)** — for the NPCs with alternate token forms
- **[Art for Vagabond](https://foundryvtt.com/packages/art-for-vagabond)** — additional artwork for the system NPCs

---

## Running the adventure

Enable the **Stress Level** in the module settings before starting. The counter will appear in the top-right corner, visible to everyone. Only the GM can adjust it — left click to increase, right click to decrease.

The **Curse Panel** lives in the token layer controls (blood drop icon, GM only). Everything needed to track and manage the curse mechanics for each PC is in there.

The adventure pack has everything else pre-configured. Import it, dim the lights, and run.

---

*Art generated with AI tools. Music from Pixabay.* Feel free to populate it with your own assets, its pretty easy to remake it for your table. All systems and apps inside the module will keep working without issues.

---

“This is an independent product published under the Land of the Blind Third-Party License and is not affiliated with Land of the Blind, LLC. Vagabond // Pulp Fantasy RPG © 2025 Land of theBlind, LLC.”
