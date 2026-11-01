# Meeple Meadows

A cozy idle homestead game for Android tablets. Meeples farm, water, haul and craft while you
clear the overgrown meadow, unlock 32 seasonal crops, and chain ingredients through 12 crafting
buildings into breads, jams, kimchi, teas, oils, quilts, beer, wine and spirits on the way to the
Grand Harvest Fair.

- Seasons rotate every 2 hours of play. Crops grow only in their seasons and rest otherwise;
  each plot can hold a per-season plan and switches automatically.
- Stone Wells (optional) let Meeples fill watering cans. Watered soil grows 60% faster for 3 harvests.
- The Greenhouse (late game, level 25) grows any crop in any season. Tap it to lift the roof.

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
  - `js/art.js`, `js/art2.js`: all art, drawn procedurally at load in a papercraft "sticker" style
  - `js/world.js`: map generation, Meeple AI, crafting, saving
  - `js/render.js`, `js/ui.js`, `js/audio.js`, `js/main.js`
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

An autoplay bot that plays efficiently reached the final Fair after ~81 hours of
in-game time (v1.1). A human player will likely take longer. Set `PACE` in `web/js/data.js`
to stretch or shrink the curve (e.g. `1.5` = 50% more produce per goal).

You can test in a desktop browser by serving `web/` (e.g. `python -m http.server`);
`?dev=20` speeds up time 20x for testing.
