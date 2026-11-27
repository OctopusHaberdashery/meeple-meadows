# Meeple Meadows

**[▶ Play in your browser](https://octopushaberdashery.github.io/meeple-meadows/)** (installs to an iPad or iPhone home screen) · **[⬇ Android APK](https://github.com/OctopusHaberdashery/meeple-meadows/releases/latest/download/MeepleMeadows.apk)** · [All releases](https://github.com/OctopusHaberdashery/meeple-meadows/releases)

<img src="icon-512.png" width="128" alt="Meeple Meadows icon">

A cozy idle homestead game for tablets: Android, and iPad through the web app. Meeples farm, water, haul and craft while you
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
- Pests: field mice nibble growing crops (the plant stops growing until a Meeple tends it) and squirrels steal
  ripe ones. A Barn Owl Box catches mice, a Dog House chases squirrels off, and a Cat Tree does a little of both.
- Ducks (Duck House by a pond) lay duck eggs and drop feathers. Bees fly out to nearby plants; plant clover,
  marigold, borage or poppies near a hive for faster honey and bigger batches. Hives also make beeswax for the Chandlery.
- Trees: buy seedlings at Market → Seeds (or find them clearing the woods) and plant oak, birch, pine, willow and maple
  trees that give acorns, birch sap, resin, withies and maple sap for syrups, birch beer, acorn bread, baskets and candles.
- Meeples have their crop for a head, a walking style of their own (moonwalk, slide, waddle, skip, float...) and 31 hats.
- Buildings are built by the Meeples themselves: every free Meeple hammers away at the site and the building rises
  from the ground pixel by pixel, with scaffolding, a hoist and a progress sign. More Meeples build faster.
- Pip's requests: a run of small jobs with rewards that teaches the first hour, then endless little wishes.
- Each Meeple keeps its own record (harvests, distance walked, favourite crop) and earns badges. Idle Meeples sit on
  benches and gather by lanterns at night.
- A travelling visitor stops by the Market once per real day with a gift and one special request. Nothing is lost by missing a day.
- Crop mastery: bank 100 / 1,000 / 10,000 of a crop for bronze, silver and gold stars (faster growth, better price).
- Feel: coins fly to the purse, plants and buildings squash and stretch, level-ups hush the world and sweep in a banner
  with confetti, farm sounds are tuned to the music (which gains instruments as the farm grows), wind crosses the crops
  in waves, grass parts around running Meeples, birds perch on scarecrows, long shadows at sunset, and almost
  anything you tap answers back.
- Landmarks: five old places are hidden in the woods (a ruined cottage, standing stones, a beached rowboat, a hollow
  oak, a wayside shrine). Clear a way to one and explore it for a story, a gift and a lasting bonus.
- Wonders: the Clock Tower, Harvest Hall and Observatory are great works built in four stages, each needing a
  delivery from storage before the Meeples can carry on. Each gives the whole farm a lasting bonus.
- Charm: decorations, landmarks and Wonders add Charm, which brings passers-by who admire the farm and spend at the stall.
- Meeple wishes: now and then a Meeple wants a hat, more of a crop, or a new bench; granting it makes them faster for a while.
- Little surprises: a rainbow after rain, a shooting star at night, a lost duckling, a travelling band.
- A welcome-back note from Pip when you return, and a postcard mode (Pause → Take a Postcard) that saves a framed picture.
- More feel: press and hold a Meeple to follow it, double-tap to zoom, sound that follows what you zoom in on, body
  language (leaning under loads, high-fives, sheltering from rain), footprints,
  puddles, thunder, morning mist, a rooster at dawn, lanterns that light one by one, and extra weight on rare moments.
- Meeples walk the way people do: straight to where they are going, cutting corners across open ground instead of
  following the grid. Where they walk most, the grass is pressed flat, then marked with footprints, then worn to a
  narrow earth trail. Trails that fall out of use slowly grow over.
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

## Install on an iPad or iPhone

1. Open **https://octopushaberdashery.github.io/meeple-meadows/** in Safari.
2. Tap **Share**, then **Add to Home Screen**.
3. Open Meeple Meadows from the home screen. It runs full screen and works without a connection.

Saves stay on the device you play on. When a new version is published, opening the game while online picks it
up. On an iPad the game starts at High quality for a sharp picture, and steps down to Medium by itself, once, if
the tablet can't keep that smooth; Settings changes it either way. With **Keep screen on** set, the web app asks
the browser to hold the screen awake while the game is in front.

The game only progresses while it is open on screen. There is no offline progress.
Saves are written to the app's private storage (3 slots, autosave every minute by default,
plus on pause and level-up).

## Layout

- `web/`: the game itself (HTML5 canvas, plain JavaScript, no dependencies)
  - `js/data.js`: crops, goods, recipes, buildings, levels, upgrades. `PACE` scales every level requirement.
  - `js/art.js` … `js/art5.js`: all art, drawn procedurally at load in a papercraft "sticker" style
  - `js/world.js`: map generation, Meeple AI, route finding and straight-line walking, crafting, saving
  - `js/world2.js`: discoveries, compost, orders, journal, hats, stats, Blue Ribbons, legacy
  - `js/world3.js`: pests and their hunters, bee flowers, trees, ducks, walking styles
  - `js/world4.js`: building sites, Pip's requests, Meeple records and badges, crop mastery, the daily visitor
  - `js/world5.js`: landmarks, Wonders, Charm and passers-by, Meeple wishes, surprises, the wear map behind desire paths
  - `js/fx.js`: construction drawing, squash and stretch, shadows, grass, birds, ripples, confetti, camera easing
  - `js/fx2.js`: landmark and Wonder art, weather, body language, follow camera, close-up sound, rare moments
  - `js/render.js`, `js/ui.js`, `js/ui2.js`, `js/ui3.js`, `js/ui4.js`, `js/ui5.js`, `js/audio.js`, `js/main.js`
  - `dev/`: test helpers (autoplay bot, screenshots). Not included in the APK.
- `android/`: WebView wrapper (`MainActivity.java`), manifest, icons, `build.sh`
- `pwa/`: the installable web app: manifest, icons, service worker, `build.py` and `publish.sh`

## Rebuild the APK

Requires the toolchain in `C:\Users\mcnee\android-build` (JDK 17, Android build-tools 34, platform 34).

```bash
bash android/build.sh
```

The web app is the same single page plus a manifest and a service worker. `bash pwa/publish.sh` builds it and
replaces the `gh-pages` branch, which GitHub Pages serves.

Bump the version when installing over an older copy, e.g. `VERSION_CODE=3 VERSION_NAME=1.2 bash android/build.sh`. Keep
`android/meeple-meadows.keystore`: updates must be signed with the same key.

## Pacing

An autoplay bot that plays efficiently reached the final Fair after ~52 hours of
in-game time (v1.8.1, down from ~58 because straight-line walking shortens every trip; the bot doesn't use orders, animals, compost, the daily visitor, landmarks or Wonders, which add extra income and bonuses). A human player will likely take longer. Set `PACE` in `web/js/data.js`
to stretch or shrink the curve (e.g. `1.5` = 50% more produce per goal).

You can test in a desktop browser by serving `web/` (e.g. `python -m http.server`);
`?dev=20` speeds up time 20x for testing.
