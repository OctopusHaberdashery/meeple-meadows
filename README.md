# Meeple Meadows

**[⬇ Download the latest APK](https://github.com/OctopusHaberdashery/meeple-meadows/releases/latest/download/MeepleMeadows.apk)** · [All releases](https://github.com/OctopusHaberdashery/meeple-meadows/releases)

<img src="icon-512.png" width="128" alt="Meeple Meadows icon">

A cozy idle homestead game for Android tablets. Meeples farm, water, haul and craft while you
clear the overgrown meadow, unlock 32 crops, and chain ingredients through 14 crafting
buildings into breads, jams, kimchi, teas, oils, quilts, beer, wine and spirits on the way to the
Grand Harvest Fair.

- Orders Board: neighbours pin up timed requests that pay well above market price, sometimes with prizes.
- Animals: chicken coops and dairy barns turn grain into eggs and milk; beehives make honey and speed up nearby
  crops. Eggs, milk and honey feed new recipes (cheese, custard, honey cake, quiche, mead and more).
- Compost Bin: spent plants and tossed produce become fertilizer; fertilized soil can give a double harvest.
- Clearing the woods sometimes turns up coins, wild produce, relics, decorations or a hat.
- Journal: a collection of every crop, good, fish (with size records) and relic. Filling pages unlocks permanent
  bonuses and decorations. The Stats page charts coins per hour and lists your best sellers.
- Faceless Meeples with little running legs, unlockable hats, editable names and speech-bubble emotes.
- Buildings that are stuck waiting on an ingredient show what's missing, and the HUD can jump you to each one.
- After the Grand Harvest Fair: endless Blue Ribbon goals, or start a new meadow with a Legacy bonus.
- Fishing (optional): build a Fishing Dock beside a pond and give a Meeple the Fish job. Fishing XP
  unlocks rarer fish and raises their odds; tap the dock to play the reel-in mini-game. Fish go to the
  Smokehouse, the Sushi Counter, and several kitchen recipes.
- Touching garden plots merge into one bed framed by a wooden border.
- Stone Wells (optional) let Meeples fill watering cans. Watered soil grows 60% faster for 3 harvests.
- Crops follow real growth habits: roots and grains are harvested once and replanted, vines and leafy
  greens give several harvests, and trees and bushes keep producing forever.
- The Greenhouse (late game, level 25) grows crops 50% faster and never needs watering. Tap it to lift the roof.

## Install on your tablet

1. Copy `MeepleMeadows.apk` to the tablet (USB, Google Drive, email to yourself, etc.).
2. Open it from the tablet's Files app.
3. If Android asks, allow your Files app to "Install unknown apps", then tap **Install**.
4. Meeple Meadows appears on your home screen and in the app drawer.

The game only progresses while it is open on screen. There is no offline progress.
Saves are written to the app's private storage (3 slots, autosave every minute by default,
plus on pause and level-up).

## Layout

- `web/`: the game itself (HTML5 canvas, plain JavaScript, no dependencies)
  - `js/data.js`: crops, goods, recipes, buildings, levels, upgrades. `PACE` scales every level requirement.
  - `js/art.js` … `js/art4.js`: all art, drawn procedurally at load in a papercraft "sticker" style
  - `js/world.js`: map generation, Meeple AI, crafting, saving
  - `js/world2.js`: discoveries, compost, orders, journal, hats, stats, Blue Ribbons, legacy
  - `js/render.js`, `js/ui.js`, `js/ui2.js`, `js/audio.js`, `js/main.js`
  - `dev/`: test helpers (autoplay bot, screenshots). Not included in the APK.
- `android/`: WebView wrapper (`MainActivity.java`), manifest, icons, `build.sh`

## Rebuild the APK

Requires the toolchain in `C:\Users\mcnee\android-build` (JDK 17, Android build-tools 34, platform 34).

```bash
bash android/build.sh
```

Bump the version when installing over an older copy, e.g. `VERSION_CODE=3 VERSION_NAME=1.2 bash android/build.sh`. Keep
`android/meeple-meadows.keystore`: updates must be signed with the same key.

## Pacing

An autoplay bot that plays efficiently reached the final Fair after ~60 hours of
in-game time (v1.5; the bot doesn't use orders, animals or compost, which add extra income). A human player will likely take longer. Set `PACE` in `web/js/data.js`
to stretch or shrink the curve (e.g. `1.5` = 50% more produce per goal).

You can test in a desktop browser by serving `web/` (e.g. `python -m http.server`);
`?dev=20` speeds up time 20x for testing.
