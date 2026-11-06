// Meeple Meadows — game data: crops, goods, recipes, buildings, levels, upgrades.
'use strict';

if (!Object.fromEntries) Object.fromEntries = function (it) { const o = {}; for (const [k, v] of it) o[k] = v; return o; };

// One knob to stretch or shrink the whole progression curve (level requirements).
const PACE = 1.0;

// ---------------------------------------------------------------- seasons
const SEASON_LEN = 7200; // seconds of play per season (2 hours)
const SEASONS = [
  { id: 'spring', name: 'Spring', col: '#f29ac0', icon: '🌸' },
  { id: 'summer', name: 'Summer', col: '#f2c23a', icon: '☀️' },
  { id: 'fall',   name: 'Fall',   col: '#e8802a', icon: '🍂' },
  { id: 'winter', name: 'Winter', col: '#8ab8e0', icon: '❄️' },
];

// ---------------------------------------------------------------- crops
// grow: seconds to ripen. sea: seasons it grows in (0 spring … 3 winter).
// mc: produce needed for a Meeple. meeple: stats (speed tiles/s, carry items, work = hands speed).
const CROPS = [
  { id: 'carrot',     name: 'Carrot',     grow: 30,  sea: [0, 1, 2, 3], col: '#f07a2a', leaf: '#5aa335', meeple: { speed: 2.0, carry: 2,  work: 1.0, col: '#ef7d2d', trait: 'Steady' } },
  { id: 'wheat',      name: 'Wheat',      grow: 40,  sea: [0, 1, 2],    col: '#e9c25a', leaf: '#b9a043', meeple: { speed: 2.3, carry: 3,  work: 1.0, col: '#e8c050', trait: 'Nimble' } },
  { id: 'potato',     name: 'Potato',     grow: 55,  sea: [0, 2, 3],    col: '#c69a62', leaf: '#4f8f3a', meeple: { speed: 1.6, carry: 6,  work: 0.9, col: '#b98b5a', trait: 'Sturdy' } },
  { id: 'parsnip',    name: 'Parsnip',    grow: 60,  sea: [0, 3],       col: '#efe0b0', leaf: '#6aa84a', meeple: { speed: 2.1, carry: 4,  work: 1.0, col: '#eadcae', trait: 'Humble' } },
  { id: 'cabbage',    name: 'Cabbage',    grow: 70,  sea: [0, 2, 3],    col: '#9fd27a', leaf: '#6fb352', meeple: { speed: 1.9, carry: 5,  work: 1.1, col: '#9bd37c', trait: 'Layered' } },
  { id: 'lettuce',    name: 'Lettuce',    grow: 75,  sea: [0, 1, 2],    col: '#b8e070', leaf: '#7cc04a', meeple: { speed: 2.6, carry: 3,  work: 1.2, col: '#b4dc6c', trait: 'Breezy' } },
  { id: 'sugarbeet',  name: 'Sugar Beet', grow: 85,  sea: [2, 3],       col: '#c2306a', leaf: '#4a9a3c', meeple: { speed: 2.2, carry: 4,  work: 1.2, col: '#c93a73', trait: 'Sweet' } },
  { id: 'strawberry', name: 'Strawberry', grow: 95,  sea: [0, 1],       col: '#e8344a', leaf: '#3f9a3e', meeple: { speed: 2.9, carry: 3,  work: 1.2, col: '#e5384b', trait: 'Zippy' } },
  { id: 'garlic',     name: 'Garlic',     grow: 105, sea: [0, 2, 3],    col: '#efe6d2', leaf: '#7fae4c', meeple: { speed: 2.2, carry: 5,  work: 1.3, col: '#ece2cc', trait: 'Bold' } },
  { id: 'tomato',     name: 'Tomato',     grow: 115, sea: [1, 2],       col: '#e23a2a', leaf: '#4a9a3a', meeple: { speed: 2.5, carry: 5,  work: 1.3, col: '#e0402e', trait: 'Juicy' } },
  { id: 'chili',      name: 'Chili',      grow: 125, sea: [1, 2],       col: '#d8241c', leaf: '#3e8a33', meeple: { speed: 3.3, carry: 3,  work: 1.4, col: '#d42a20', trait: 'Fiery' } },
  { id: 'cucumber',   name: 'Cucumber',   grow: 130, sea: [0, 1],       col: '#5aa040', leaf: '#4f9a3a', meeple: { speed: 2.6, carry: 5,  work: 1.3, col: '#62a848', trait: 'Cool' } },
  { id: 'barley',     name: 'Barley',     grow: 140, sea: [0, 2],       col: '#d7bf7c', leaf: '#a7a256', meeple: { speed: 2.4, carry: 6,  work: 1.2, col: '#d4bb78', trait: 'Hardy' } },
  { id: 'hops',       name: 'Hops',       grow: 155, sea: [1, 2],       col: '#a9d455', leaf: '#4f9a3a', meeple: { speed: 2.6, carry: 5,  work: 1.4, col: '#a6d257', trait: 'Bitter' } },
  { id: 'sunflower',  name: 'Sunflower',  grow: 165, sea: [1, 2],       col: '#f6c81a', leaf: '#5a9a3a', meeple: { speed: 2.7, carry: 6,  work: 1.3, col: '#f4c628', trait: 'Sunny' } },
  { id: 'kale',       name: 'Kale',       grow: 175, sea: [2, 3],       col: '#3f7a4a', leaf: '#3f7a4a', meeple: { speed: 2.3, carry: 7,  work: 1.4, col: '#4a8a55', trait: 'Tough' } },
  { id: 'apple',      name: 'Apple',      grow: 200, sea: [2],          col: '#d8392b', leaf: '#4b9a3c', meeple: { speed: 2.5, carry: 7,  work: 1.3, col: '#cf3b2c', trait: 'Crisp' } },
  { id: 'cotton',     name: 'Cotton',     grow: 210, sea: [1, 2],       col: '#f6f2ea', leaf: '#6a8a3a', meeple: { speed: 2.8, carry: 6,  work: 1.5, col: '#f2ede2', trait: 'Fluffy' } },
  { id: 'blueberry',  name: 'Blueberry',  grow: 220, sea: [1],          col: '#4c5fb8', leaf: '#3f8a46', meeple: { speed: 3.1, carry: 5,  work: 1.5, col: '#5165bf', trait: 'Bright' } },
  { id: 'tea',        name: 'Tea',        grow: 235, sea: [0, 1],       col: '#5a9a4a', leaf: '#3f7a3a', meeple: { speed: 2.6, carry: 6,  work: 1.7, col: '#6aa858', trait: 'Calm' } },
  { id: 'corn',       name: 'Corn',       grow: 250, sea: [1, 2],       col: '#f2cf3a', leaf: '#5aa03a', meeple: { speed: 2.5, carry: 8,  work: 1.4, col: '#f0cb35', trait: 'Tall' } },
  { id: 'flax',       name: 'Flax',       grow: 265, sea: [0, 1],       col: '#6a8ad8', leaf: '#7aa04a', meeple: { speed: 3.0, carry: 6,  work: 1.6, col: '#7090dc', trait: 'Graceful' } },
  { id: 'grapes',     name: 'Grapes',     grow: 285, sea: [1, 2],       col: '#7b3f9e', leaf: '#5a9a3a', meeple: { speed: 2.9, carry: 7,  work: 1.6, col: '#8044a6', trait: 'Fine' } },
  { id: 'cranberry',  name: 'Cranberry',  grow: 300, sea: [2, 3],       col: '#c8203a', leaf: '#5a7a3a', meeple: { speed: 3.0, carry: 7,  work: 1.6, col: '#c82840', trait: 'Tart' } },
  { id: 'pumpkin',    name: 'Pumpkin',    grow: 320, sea: [2],          col: '#f08a1c', leaf: '#4f9438', meeple: { speed: 2.0, carry: 12, work: 1.3, col: '#ee8a24', trait: 'Mighty' } },
  { id: 'rice',       name: 'Rice',       grow: 340, sea: [0, 1],       col: '#e8dca0', leaf: '#6aaa4a', meeple: { speed: 2.8, carry: 8,  work: 1.7, col: '#e6d89c', trait: 'Patient' } },
  { id: 'olive',      name: 'Olive',      grow: 360, sea: [1, 2],       col: '#7a8a3a', leaf: '#8aa080', meeple: { speed: 2.7, carry: 9,  work: 1.7, col: '#86964a', trait: 'Wise' } },
  { id: 'lavender',   name: 'Lavender',   grow: 380, sea: [0, 1],       col: '#9a7ad8', leaf: '#7a9a7a', meeple: { speed: 3.2, carry: 7,  work: 1.8, col: '#a084dc', trait: 'Dreamy' } },
  { id: 'melon',      name: 'Melon',      grow: 400, sea: [1],          col: '#6ab04a', leaf: '#4f9438', meeple: { speed: 2.2, carry: 13, work: 1.5, col: '#70b450', trait: 'Hefty' } },
  { id: 'juniper',    name: 'Juniper',    grow: 420, sea: [2, 3],       col: '#5a74a8', leaf: '#3c6e52', meeple: { speed: 3.5, carry: 8,  work: 1.8, col: '#5f78ad', trait: 'Swift' } },
  { id: 'peach',      name: 'Peach',      grow: 440, sea: [0, 1],       col: '#f8a070', leaf: '#4b9a3c', meeple: { speed: 3.2, carry: 9,  work: 1.8, col: '#f6a478', trait: 'Lovely' } },
  { id: 'cocoa',      name: 'Cocoa',      grow: 470, sea: [1],          col: '#8a4a2a', leaf: '#3f7a3a', meeple: { speed: 3.6, carry: 10, work: 2.0, col: '#8e5232', trait: 'Rich' } },
];
// How many times one planting can be harvested, and how fast it regrows afterwards (fraction of
// the first grow time), loosely based on how each crop really grows. 0 harvests = perennial (forever).
const REGROW = {
  // dug up or cut whole: one harvest, then the plot needs a new seed
  carrot: [1], wheat: [1], potato: [1], parsnip: [1], cabbage: [1], sugarbeet: [1], garlic: [1],
  barley: [1], sunflower: [1], corn: [1], flax: [1], pumpkin: [1],
  // cut-and-come-again leaves, pick-as-they-ripen vines, short-lived berry plants
  lettuce: [3, 0.45],     // leaf lettuce takes ~3 cuttings before bolting
  kale: [6, 0.4],         // outer leaves picked for months
  tomato: [8, 0.35],      // indeterminate vines fruit until frost
  chili: [8, 0.35],
  cucumber: [6, 0.3],     // picked every few days for several weeks
  strawberry: [6, 0.4],   // repeat flushes; beds wear out after a few years
  cotton: [3, 0.5],       // bolls open over two or three pickings
  melon: [3, 0.5],        // a vine sets a few fruit
  rice: [2, 0.6],         // a smaller "ratoon" crop regrows from the stubble
  // perennials that produce for decades
  apple: [0, 0.5], peach: [0, 0.5], olive: [0, 0.5], cocoa: [0, 0.4], grapes: [0, 0.5],
  blueberry: [0, 0.5], hops: [0, 0.6], tea: [0, 0.3], cranberry: [0, 0.6], juniper: [0, 0.8], lavender: [0, 0.6],
};
CROPS.forEach(c => {
  c.price = Math.max(2, Math.round(c.grow / 13)); c.mc = c.meeple.carry >= 12 ? 6 : 8;
  const r = REGROW[c.id] || [1];
  c.harvests = r[0];                                   // 0 = unlimited
  c.regrow = r[0] === 1 ? c.grow : Math.round(c.grow * r[1]);
  if (r[0] === 1) c.price = Math.round(c.price * 1.25 + 0.4); // single-harvest crops pay a bit more per harvest
});
const harvestLabel = c => c.harvests === 0 ? '∞' : c.harvests + '×';
const CROP = Object.fromEntries(CROPS.map(c => [c.id, c]));
// flowers for the bees: planted in plots like crops, they bloom and stay in bloom (nothing to harvest).
// Each blooming flower within 4 tiles of a beehive speeds up its honey; every 3 add an extra honey per batch.
const FLOWERS = [
  { id: 'clover',   name: 'White Clover', grow: 50,  col: '#f4f0f4', leaf: '#4f9a3a', lvl: 5,  bee: 0.12 },
  { id: 'marigold', name: 'Marigold',     grow: 80,  col: '#f29a1a', leaf: '#5a9a3a', lvl: 7,  bee: 0.15 },
  { id: 'borage',   name: 'Borage',       grow: 110, col: '#5a7ae8', leaf: '#6a9a5a', lvl: 10, bee: 0.2 },
  { id: 'poppy',    name: 'Poppy',        grow: 140, col: '#e8402a', leaf: '#5a9a4a', lvl: 14, bee: 0.25 },
];
FLOWERS.forEach(f => { Object.assign(f, { flower: true, harvests: 0, regrow: f.grow, price: 0 }); CROP[f.id] = f; });

// ---------------------------------------------------------------- goods
// icon: drawing recipe used by art.js. Prices are derived from recipes below.
const GOODS = [
  { id: 'flour',        name: 'Flour',            icon: { t: 'sack', c: '#f4ecd8', l: '#e2c26a' } },
  { id: 'sugar',        name: 'Sugar',            icon: { t: 'sack', c: '#fbf6ee', l: '#c2306a' } },
  { id: 'malt',         name: 'Malt',             icon: { t: 'sack', c: '#e6d2a0', l: '#8a5a2a' } },
  { id: 'cornmeal',     name: 'Cornmeal',         icon: { t: 'sack', c: '#f6dc6a', l: '#5aa03a' } },
  { id: 'stew',         name: 'Veggie Stew',      icon: { t: 'bowl', c: '#d9792f', b: '#8b5a3c' } },
  { id: 'mash',         name: 'Potato Mash',      icon: { t: 'bowl', c: '#efe0b0', b: '#6c7a89' } },
  { id: 'parsnipsoup',  name: 'Parsnip Soup',     icon: { t: 'bowl', c: '#efd890', b: '#5a7a9a' } },
  { id: 'salad',        name: 'Garden Salad',     icon: { t: 'bowl', c: '#8fd060', b: '#c8a070', salad: 1 } },
  { id: 'garlicbread',  name: 'Garlic Bread',     icon: { t: 'bread' } },
  { id: 'tomatosauce',  name: 'Tomato Sauce',     icon: { t: 'jar', c: '#c8281a', l: '#f2e0b0' } },
  { id: 'wort',         name: 'Hopped Wort',      icon: { t: 'bowl', c: '#b97a2a', b: '#5d4a3a' } },
  { id: 'kalesoup',     name: 'Kale Soup',        icon: { t: 'bowl', c: '#5a8a4a', b: '#a86a3a' } },
  { id: 'grainmash',    name: 'Grain Mash',       icon: { t: 'bowl', c: '#d9b25a', b: '#6a4a30' } },
  { id: 'pumpkinsoup',  name: 'Pumpkin Soup',     icon: { t: 'bowl', c: '#ef8a22', b: '#4a6a5a' } },
  { id: 'risotto',      name: 'Olive Risotto',    icon: { t: 'bowl', c: '#f2e6c0', b: '#3a5a7a', salad: 1 } },
  { id: 'chocolate',    name: 'Chocolate',        icon: { t: 'bar', c: '#6a3a1a' } },
  { id: 'sauerkraut',   name: 'Sauerkraut',       icon: { t: 'crock', c: '#e7e3b0', b: '#c9b48c' } },
  { id: 'pickles',      name: 'Pickled Carrots',  icon: { t: 'jar', c: '#f08a35', l: '#b6d66a', tall: 1, s: '#ffad60' } },
  { id: 'kimchi',       name: 'Kimchi',           icon: { t: 'crock', c: '#e2482c', b: '#a8693f' } },
  { id: 'hotsauce',     name: 'Hot Sauce',        icon: { t: 'bottle', c: '#c8201a', shape: 'sauce' } },
  { id: 'dillpickles',  name: 'Dill Pickles',     icon: { t: 'jar', c: '#8ab060', l: '#fbf3df', tall: 1, s: '#4f8a30' } },
  { id: 'bread',        name: 'Country Loaf',     icon: { t: 'loaf' } },
  { id: 'berrypie',     name: 'Strawberry Pie',   icon: { t: 'pie', c: '#d63a52' } },
  { id: 'pizza',        name: 'Meadow Pizza',     icon: { t: 'pizza' } },
  { id: 'applepie',     name: 'Apple Pie',        icon: { t: 'pie', c: '#e8c070' } },
  { id: 'pumpkinpie',   name: 'Pumpkin Pie',      icon: { t: 'pie', c: '#e8902a', open: 1 } },
  { id: 'peachcobbler', name: 'Peach Cobbler',    icon: { t: 'pie', c: '#f8a070' } },
  { id: 'cake',         name: 'Chocolate Cake',   icon: { t: 'cake', c: '#5a2a12' } },
  { id: 'jam',          name: 'Strawberry Jam',   icon: { t: 'jar', c: '#d8223e', l: '#f4e5c3' } },
  { id: 'pepperjelly',  name: 'Pepper Jelly',     icon: { t: 'jar', c: '#e8562a', l: '#f2d24a' } },
  { id: 'applejelly',   name: 'Apple Jelly',      icon: { t: 'jar', c: '#e9b84a', l: '#d8392b' } },
  { id: 'bluejam',      name: 'Blueberry Jam',    icon: { t: 'jar', c: '#3c3f8f', l: '#c9d8f2' } },
  { id: 'grapejelly',   name: 'Grape Jelly',      icon: { t: 'jar', c: '#5a1f6e', l: '#e6d0f0' } },
  { id: 'cranberrysauce', name: 'Cranberry Sauce', icon: { t: 'jar', c: '#a8102a', l: '#f4e5c3' } },
  { id: 'peachjam',     name: 'Peach Jam',        icon: { t: 'jar', c: '#f89050', l: '#fff2d8' } },
  { id: 'driedtomato',  name: 'Sun-dried Tomatoes', icon: { t: 'dried', c: '#a8281a' } },
  { id: 'chiliflakes',  name: 'Chili Flakes',     icon: { t: 'dried', c: '#d8401a', fine: 1 } },
  { id: 'driedapple',   name: 'Apple Chips',      icon: { t: 'dried', c: '#ecd098', ring: 1 } },
  { id: 'tealeaves',    name: 'Tea Leaves',       icon: { t: 'dried', c: '#4a7a3a', leafy: 1 } },
  { id: 'raisins',      name: 'Raisins',          icon: { t: 'dried', c: '#4a2a3a' } },
  { id: 'driedlavender',name: 'Lavender Bundle',  icon: { t: 'bundle', c: '#9a7ad8' } },
  { id: 'cocoanibs',    name: 'Cocoa Nibs',       icon: { t: 'dried', c: '#5a2a12', fine: 1 } },
  { id: 'driedpeach',   name: 'Dried Peaches',    icon: { t: 'dried', c: '#f0a060', ring: 1 } },
  { id: 'carrotjuice',  name: 'Carrot Juice',     icon: { t: 'glass', c: '#f08a2a' } },
  { id: 'tomatojuice',  name: 'Tomato Juice',     icon: { t: 'glass', c: '#d8281a' } },
  { id: 'applejuice',   name: 'Apple Juice',      icon: { t: 'glass', c: '#f2c85a' } },
  { id: 'cranberryjuice', name: 'Cranberry Juice', icon: { t: 'glass', c: '#c8203a' } },
  { id: 'melonjuice',   name: 'Melon Juice',      icon: { t: 'glass', c: '#a8e080' } },
  { id: 'peachnectar',  name: 'Peach Nectar',     icon: { t: 'glass', c: '#f8b080' } },
  { id: 'sunoil',       name: 'Sunflower Oil',    icon: { t: 'bottle', c: '#f2c81a', shape: 'oil' } },
  { id: 'oliveoil',     name: 'Olive Oil',        icon: { t: 'bottle', c: '#9aa040', shape: 'oil' } },
  { id: 'lavenderoil',  name: 'Lavender Oil',     icon: { t: 'bottle', c: '#b89ae8', shape: 'vial' } },
  { id: 'cloth',        name: 'Cotton Cloth',     icon: { t: 'cloth', c: '#f4efe4', s: '#c8d8f0' } },
  { id: 'linen',        name: 'Linen',            icon: { t: 'cloth', c: '#d8c8a0', s: '#b8a880' } },
  { id: 'quilt',        name: 'Patchwork Quilt',  icon: { t: 'quilt' } },
  { id: 'sachet',       name: 'Lavender Sachet',  icon: { t: 'sachet', c: '#d8c8a0', f: '#9a7ad8' } },
  { id: 'greentea',     name: 'Green Tea',        icon: { t: 'cup', c: '#9ac060' } },
  { id: 'lavtea',       name: 'Lavender Tea',     icon: { t: 'cup', c: '#c8a8e8' } },
  { id: 'peachtea',     name: 'Peach Iced Tea',   icon: { t: 'cup', c: '#f8b880' } },
  { id: 'hotcocoa',     name: 'Hot Cocoa',        icon: { t: 'cup', c: '#7a4a2a', foam: 1 } },
  { id: 'beer',         name: 'Amber Beer',       icon: { t: 'mug', c: '#d9902a' } },
  { id: 'cider',        name: 'Hard Cider',       icon: { t: 'bottle', c: '#e5b545', shape: 'jug' } },
  { id: 'berrywine',    name: 'Blueberry Wine',   icon: { t: 'bottle', c: '#3a2f7a', shape: 'wine' } },
  { id: 'wine',         name: 'Red Wine',         icon: { t: 'bottle', c: '#6a1530', shape: 'wine' } },
  { id: 'whiskey',      name: 'Oak Whiskey',      icon: { t: 'bottle', c: '#b8661c', shape: 'whiskey' } },
  { id: 'pumpkinale',   name: 'Pumpkin Ale',      icon: { t: 'mug', c: '#c9601a' } },
  { id: 'sake',         name: 'Rice Wine',        icon: { t: 'bottle', c: '#f4f0e0', shape: 'tall' } },
  { id: 'whitedog',     name: 'White Dog',        icon: { t: 'bottle', c: '#e8f2f4', shape: 'flask' } },
  { id: 'vodka',        name: 'Meadow Vodka',     icon: { t: 'bottle', c: '#eef6fa', shape: 'tall' } },
  { id: 'brandy',       name: 'Brandy',           icon: { t: 'bottle', c: '#a8481c', shape: 'round' } },
  { id: 'applejack',    name: 'Applejack',        icon: { t: 'bottle', c: '#c97a22', shape: 'jug' } },
  { id: 'gin',          name: 'Juniper Gin',      icon: { t: 'bottle', c: '#dff0f4', shape: 'square' } },
  { id: 'soju',         name: 'Rice Soju',        icon: { t: 'bottle', c: '#d8f4e4', shape: 'square' } },
  { id: 'schnapps',     name: 'Peach Schnapps',   icon: { t: 'bottle', c: '#f8c8a0', shape: 'round' } },
  // from the water
  { id: 'fishstew',     name: 'Fisherman\'s Stew', icon: { t: 'bowl', c: '#e0a060', b: '#3a6a8a', fish: 1 } },
  { id: 'chowder',      name: 'Catfish Chowder',  icon: { t: 'bowl', c: '#f4ecd0', b: '#6a4a3a', fish: 1 } },
  { id: 'fishpie',      name: 'Bass Pie',         icon: { t: 'pie', c: '#e8c890' } },
  { id: 'fishchips',    name: 'Fish & Chips',     icon: { t: 'fishchips' } },
  { id: 'fishsauce',    name: 'Fish Sauce',       icon: { t: 'bottle', c: '#a8602a', shape: 'sauce' } },
  { id: 'caviar',       name: 'Caviar',           icon: { t: 'jar', c: '#22222e', l: '#d8c060' } },
  { id: 'smokedperch',  name: 'Smoked Perch',     icon: { t: 'smoked', c: '#c89040' } },
  { id: 'smokedtrout',  name: 'Smoked Trout',     icon: { t: 'smoked', c: '#c8784a' } },
  { id: 'smokedsalmon', name: 'Smoked Salmon',    icon: { t: 'smoked', c: '#e0704a' } },
  { id: 'nigiri',       name: 'Salmon Nigiri',    icon: { t: 'sushi', c: '#f08a5a' } },
  { id: 'troutroll',    name: 'Trout Roll',       icon: { t: 'sushi', c: '#e8987a', roll: 1 } },
  { id: 'platter',      name: 'Deluxe Platter',   icon: { t: 'sushi', c: '#e0704a', deluxe: 1 } },
  // from the barnyard
  { id: 'frittata',     name: 'Garden Frittata',  icon: { t: 'pan', c: '#f2d24a' } },
  { id: 'cheese',       name: 'Farmhouse Cheese', icon: { t: 'cheese', c: '#f2cc5a' } },
  { id: 'custard',      name: 'Vanilla Custard',  icon: { t: 'pie', c: '#f6e08a', open: 1 } },
  { id: 'honeycake',    name: 'Honey Cake',       icon: { t: 'cake', c: '#e8a83a' } },
  { id: 'quiche',       name: 'Cheese Quiche',    icon: { t: 'pie', c: '#eec860', open: 1 } },
  { id: 'mead',         name: 'Honey Mead',       icon: { t: 'mug', c: '#e8b040' } },
  { id: 'milktea',      name: 'Honey Milk Tea',   icon: { t: 'cup', c: '#d8b890', foam: 1 } },
  { id: 'eggnoodles',   name: 'Egg Noodles',      icon: { t: 'bowl', c: '#f2d890', b: '#c8603a', noodle: 1 } },
  { id: 'featherpillow',name: 'Feather Pillow',   icon: { t: 'pillow', c: '#fbf8f0' } },
  // candles and the woods
  { id: 'candle',       name: 'Beeswax Candles',  icon: { t: 'candle', c: '#f4e0a0' } },
  { id: 'lavcandle',    name: 'Lavender Candle',  icon: { t: 'candle', c: '#c8a8e8', jar: 1 } },
  { id: 'pinecandle',   name: 'Pine Candle',      icon: { t: 'candle', c: '#a8c890', jar: 1 } },
  { id: 'maplesyrup',   name: 'Maple Syrup',      icon: { t: 'bottle', c: '#b8661c', shape: 'jug' } },
  { id: 'maplecandy',   name: 'Maple Candy',      icon: { t: 'candy', c: '#d89040' } },
  { id: 'birchbeer',    name: 'Birch Beer',       icon: { t: 'mug', c: '#7a3a2a' } },
  { id: 'acornflour',   name: 'Acorn Flour',      icon: { t: 'sack', c: '#e8d8b8', l: '#8a5a2e' } },
  { id: 'acornbread',   name: 'Acorn Bread',      icon: { t: 'loaf' } },
  { id: 'willowbasket', name: 'Willow Basket',    icon: { t: 'wbasket' } },
];
const GOOD = Object.fromEntries(GOODS.map(g => [g.id, g]));

// ---------------------------------------------------------------- recipes
// at: building type. in: inputs. out: [item, qty]. t: seconds. lvl: level index required.
const RECIPES = [
  // Windmill
  { id: 'r_flour',     at: 'mill',    in: { wheat: 3 },                             out: ['flour', 1],      t: 25,   lvl: 1 },
  { id: 'r_sugar',     at: 'mill',    in: { sugarbeet: 3 },                         out: ['sugar', 1],      t: 30,   lvl: 6 },
  { id: 'r_malt',      at: 'mill',    in: { barley: 3 },                            out: ['malt', 1],       t: 40,   lvl: 12 },
  { id: 'r_cornmeal',  at: 'mill',    in: { corn: 3 },                              out: ['cornmeal', 1],   t: 45,   lvl: 20 },
  // Big Pot
  { id: 'r_stew',      at: 'pot',     in: { carrot: 3, potato: 3 },                 out: ['stew', 1],       t: 60,   lvl: 2 },
  { id: 'r_mash',      at: 'pot',     in: { potato: 5 },                            out: ['mash', 1],       t: 50,   lvl: 2 },
  { id: 'r_psnipsoup', at: 'pot',     in: { parsnip: 3, carrot: 2 },                out: ['parsnipsoup', 1],t: 60,   lvl: 3 },
  { id: 'r_gbread',    at: 'pot',     in: { flour: 2, garlic: 2 },                  out: ['garlicbread', 1],t: 60,   lvl: 8 },
  { id: 'r_tsauce',    at: 'pot',     in: { tomato: 4, garlic: 1 },                 out: ['tomatosauce', 1],t: 70,   lvl: 9 },
  { id: 'r_salad',     at: 'pot',     in: { lettuce: 2, cucumber: 1, tomato: 1 },   out: ['salad', 1],      t: 40,   lvl: 11 },
  { id: 'r_wort',      at: 'pot',     in: { malt: 2, hops: 2 },                     out: ['wort', 1],       t: 80,   lvl: 13 },
  { id: 'r_kalesoup',  at: 'pot',     in: { kale: 2, potato: 2, garlic: 1 },        out: ['kalesoup', 1],   t: 80,   lvl: 15 },
  { id: 'r_grainmash', at: 'pot',     in: { cornmeal: 2, malt: 1 },                 out: ['grainmash', 1],  t: 90,   lvl: 20 },
  { id: 'r_psoup',     at: 'pot',     in: { pumpkin: 2, carrot: 2, garlic: 1 },     out: ['pumpkinsoup', 1],t: 90,   lvl: 24 },
  { id: 'r_risotto',   at: 'pot',     in: { rice: 3, garlic: 1, oliveoil: 1 },      out: ['risotto', 1],    t: 100,  lvl: 26 },
  { id: 'r_choc',      at: 'pot',     in: { cocoanibs: 2, sugar: 1 },               out: ['chocolate', 1],  t: 100,  lvl: 31 },
  // Ferment Crock
  { id: 'r_kraut',     at: 'crock',   in: { cabbage: 4 },                           out: ['sauerkraut', 1], t: 180,  lvl: 4 },
  { id: 'r_pickles',   at: 'crock',   in: { carrot: 5, garlic: 1 },                 out: ['pickles', 1],    t: 180,  lvl: 8 },
  { id: 'r_kimchi',    at: 'crock',   in: { cabbage: 3, chili: 2, garlic: 2 },      out: ['kimchi', 1],     t: 300,  lvl: 10 },
  { id: 'r_hotsauce',  at: 'crock',   in: { chili: 5, garlic: 1 },                  out: ['hotsauce', 1],   t: 300,  lvl: 10 },
  { id: 'r_dill',      at: 'crock',   in: { cucumber: 4, garlic: 1 },               out: ['dillpickles', 1],t: 240,  lvl: 11 },
  // Bakery Oven
  { id: 'r_bread',     at: 'oven',    in: { flour: 2 },                             out: ['bread', 1],      t: 50,   lvl: 6 },
  { id: 'r_berrypie',  at: 'oven',    in: { flour: 2, strawberry: 3, sugar: 1 },    out: ['berrypie', 1],   t: 90,   lvl: 7 },
  { id: 'r_pizza',     at: 'oven',    in: { flour: 2, tomatosauce: 1 },             out: ['pizza', 1],      t: 80,   lvl: 9 },
  { id: 'r_applepie',  at: 'oven',    in: { flour: 2, apple: 3, sugar: 1 },         out: ['applepie', 1],   t: 100,  lvl: 16 },
  { id: 'r_ppie',      at: 'oven',    in: { flour: 2, pumpkin: 1, sugar: 1 },       out: ['pumpkinpie', 1], t: 100,  lvl: 24 },
  { id: 'r_pcobbler',  at: 'oven',    in: { flour: 2, peach: 3, sugar: 1 },         out: ['peachcobbler', 1],t: 110, lvl: 30 },
  { id: 'r_cake',      at: 'oven',    in: { flour: 2, chocolate: 1, sugar: 1 },     out: ['cake', 1],       t: 120,  lvl: 31 },
  // Jam Kettle
  { id: 'r_jam',       at: 'kettle',  in: { strawberry: 4, sugar: 1 },              out: ['jam', 1],        t: 70,   lvl: 7 },
  { id: 'r_pjelly',    at: 'kettle',  in: { chili: 3, sugar: 1 },                   out: ['pepperjelly', 1],t: 80,   lvl: 10 },
  { id: 'r_ajelly',    at: 'kettle',  in: { apple: 4, sugar: 1 },                   out: ['applejelly', 1], t: 90,   lvl: 16 },
  { id: 'r_bjam',      at: 'kettle',  in: { blueberry: 4, sugar: 1 },               out: ['bluejam', 1],    t: 90,   lvl: 18 },
  { id: 'r_gjelly',    at: 'kettle',  in: { grapes: 4, sugar: 1 },                  out: ['grapejelly', 1], t: 100,  lvl: 22 },
  { id: 'r_csauce',    at: 'kettle',  in: { cranberry: 4, sugar: 1 },               out: ['cranberrysauce', 1], t: 100, lvl: 23 },
  { id: 'r_peachjam',  at: 'kettle',  in: { peach: 4, sugar: 1 },                   out: ['peachjam', 1],   t: 110,  lvl: 30 },
  // Drying Rack
  { id: 'r_drytom',    at: 'dryer',   in: { tomato: 4 },                            out: ['driedtomato', 1],t: 120,  lvl: 9 },
  { id: 'r_flakes',    at: 'dryer',   in: { chili: 4 },                             out: ['chiliflakes', 1],t: 120,  lvl: 10 },
  { id: 'r_dryapple',  at: 'dryer',   in: { apple: 4 },                             out: ['driedapple', 1], t: 140,  lvl: 16 },
  { id: 'r_tealeaves', at: 'dryer',   in: { tea: 3 },                               out: ['tealeaves', 1],  t: 120,  lvl: 19 },
  { id: 'r_raisins',   at: 'dryer',   in: { grapes: 5 },                            out: ['raisins', 1],    t: 160,  lvl: 22 },
  { id: 'r_drylav',    at: 'dryer',   in: { lavender: 3 },                          out: ['driedlavender', 1], t: 140, lvl: 27 },
  { id: 'r_drypeach',  at: 'dryer',   in: { peach: 4 },                             out: ['driedpeach', 1], t: 160,  lvl: 30 },
  { id: 'r_nibs',      at: 'dryer',   in: { cocoa: 3 },                             out: ['cocoanibs', 1],  t: 160,  lvl: 31 },
  // Juice Press
  { id: 'r_cjuice',    at: 'juicer',  in: { carrot: 5 },                            out: ['carrotjuice', 1],t: 40,   lvl: 11 },
  { id: 'r_tjuice',    at: 'juicer',  in: { tomato: 4 },                            out: ['tomatojuice', 1],t: 45,   lvl: 11 },
  { id: 'r_ajuice',    at: 'juicer',  in: { apple: 3 },                             out: ['applejuice', 1], t: 50,   lvl: 16 },
  { id: 'r_crjuice',   at: 'juicer',  in: { cranberry: 4, sugar: 1 },               out: ['cranberryjuice', 1], t: 60, lvl: 23 },
  { id: 'r_mjuice',    at: 'juicer',  in: { melon: 2 },                             out: ['melonjuice', 1], t: 60,   lvl: 28 },
  { id: 'r_nectar',    at: 'juicer',  in: { peach: 3, sugar: 1 },                   out: ['peachnectar', 1],t: 60,   lvl: 30 },
  // Oak Barrel
  { id: 'r_beer',      at: 'barrel',  in: { wort: 1 },                              out: ['beer', 2],       t: 600,  lvl: 13 },
  { id: 'r_cider',     at: 'barrel',  in: { apple: 6 },                             out: ['cider', 1],      t: 600,  lvl: 16 },
  { id: 'r_bwine',     at: 'barrel',  in: { blueberry: 6, sugar: 1 },               out: ['berrywine', 1],  t: 900,  lvl: 18 },
  { id: 'r_whiskey',   at: 'barrel',  in: { whitedog: 1 },                          out: ['whiskey', 1],    t: 1800, lvl: 20 },
  { id: 'r_wine',      at: 'barrel',  in: { grapes: 6 },                            out: ['wine', 1],       t: 1200, lvl: 22 },
  { id: 'r_pale',      at: 'barrel',  in: { wort: 1, pumpkin: 2 },                  out: ['pumpkinale', 2], t: 900,  lvl: 24 },
  { id: 'r_sake',      at: 'barrel',  in: { rice: 6 },                              out: ['sake', 1],       t: 1000, lvl: 25 },
  // Oil Press
  { id: 'r_sunoil',    at: 'press',   in: { sunflower: 4 },                         out: ['sunoil', 1],     t: 90,   lvl: 14 },
  { id: 'r_oliveoil',  at: 'press',   in: { olive: 5 },                             out: ['oliveoil', 1],   t: 110,  lvl: 26 },
  { id: 'r_lavoil',    at: 'press',   in: { driedlavender: 2, sunoil: 1 },          out: ['lavenderoil', 1],t: 140,  lvl: 27 },
  // Loom
  { id: 'r_cloth',     at: 'loom',    in: { cotton: 4 },                            out: ['cloth', 1],      t: 120,  lvl: 17 },
  { id: 'r_linen',     at: 'loom',    in: { flax: 4 },                              out: ['linen', 1],      t: 130,  lvl: 21 },
  { id: 'r_quilt',     at: 'loom',    in: { cloth: 2, linen: 2 },                   out: ['quilt', 1],      t: 300,  lvl: 21 },
  { id: 'r_sachet',    at: 'loom',    in: { linen: 1, driedlavender: 2 },           out: ['sachet', 1],     t: 150,  lvl: 27 },
  // Tea House
  { id: 'r_greentea',  at: 'teahouse',in: { tealeaves: 2 },                         out: ['greentea', 2],   t: 90,   lvl: 19 },
  { id: 'r_lavtea',    at: 'teahouse',in: { tealeaves: 1, driedlavender: 1 },       out: ['lavtea', 1],     t: 100,  lvl: 27 },
  { id: 'r_peachtea',  at: 'teahouse',in: { tealeaves: 1, peach: 2, sugar: 1 },     out: ['peachtea', 1],   t: 100,  lvl: 30 },
  { id: 'r_hotcocoa',  at: 'teahouse',in: { chocolate: 1, sugar: 1 },               out: ['hotcocoa', 1],   t: 90,   lvl: 31 },
  // Copper Still
  { id: 'r_whitedog',  at: 'still',   in: { grainmash: 2 },                         out: ['whitedog', 1],   t: 240,  lvl: 20 },
  { id: 'r_vodka',     at: 'still',   in: { mash: 4 },                              out: ['vodka', 1],      t: 240,  lvl: 20 },
  { id: 'r_applejack', at: 'still',   in: { cider: 2 },                             out: ['applejack', 1],  t: 300,  lvl: 20 },
  { id: 'r_brandy',    at: 'still',   in: { wine: 2 },                              out: ['brandy', 1],     t: 360,  lvl: 22 },
  { id: 'r_soju',      at: 'still',   in: { sake: 2 },                              out: ['soju', 1],       t: 300,  lvl: 25 },
  { id: 'r_gin',       at: 'still',   in: { vodka: 1, juniper: 4 },                 out: ['gin', 1],        t: 300,  lvl: 29 },
  { id: 'r_schnapps',  at: 'still',   in: { peachnectar: 2 },                       out: ['schnapps', 1],   t: 300,  lvl: 30 },
  // fish dishes (fishing is optional, so these never block level goals)
  { id: 'r_fishstew',  at: 'pot',     in: { perch: 2, potato: 2, carrot: 1 },       out: ['fishstew', 1],   t: 70,   lvl: 2 },
  { id: 'r_chowder',   at: 'pot',     in: { catfish: 1, potato: 2, corn: 1 },       out: ['chowder', 1],    t: 90,   lvl: 20 },
  { id: 'r_fishpie',   at: 'oven',    in: { flour: 2, bass: 1, potato: 1 },         out: ['fishpie', 1],    t: 100,  lvl: 6 },
  { id: 'r_fishchips', at: 'oven',    in: { bluegill: 2, potato: 2, sunoil: 1 },    out: ['fishchips', 1],  t: 80,   lvl: 14 },
  { id: 'r_fishsauce', at: 'crock',   in: { minnow: 6, garlic: 1 },                 out: ['fishsauce', 1],  t: 360,  lvl: 8 },
  { id: 'r_caviar',    at: 'crock',   in: { sturgeon: 1 },                          out: ['caviar', 2],     t: 300,  lvl: 4 },
  { id: 'r_smperch',   at: 'smokehouse', in: { perch: 3 },                          out: ['smokedperch', 1],  t: 150, lvl: 3 },
  { id: 'r_smtrout',   at: 'smokehouse', in: { trout: 2 },                          out: ['smokedtrout', 1],  t: 180, lvl: 3 },
  { id: 'r_smsalmon',  at: 'smokehouse', in: { salmon: 1 },                         out: ['smokedsalmon', 1], t: 240, lvl: 3 },
  { id: 'r_nigiri',    at: 'sushi',   in: { salmon: 1, rice: 2 },                   out: ['nigiri', 2],     t: 90,   lvl: 25 },
  { id: 'r_troutroll', at: 'sushi',   in: { trout: 1, rice: 2, cucumber: 1 },       out: ['troutroll', 2],  t: 90,   lvl: 25 },
  { id: 'r_platter',   at: 'sushi',   in: { smokedsalmon: 1, caviar: 1, rice: 3 },  out: ['platter', 1],    t: 150,  lvl: 25 },
  // barnyard (animals are optional, so these never block level goals)
  { id: 'r_eggs',      at: 'coop',    in: { wheat: 3 },                             out: ['eggs', 2],       t: 80,   lvl: 3 },
  { id: 'r_eggs2',     at: 'coop',    in: { corn: 2 },                              out: ['eggs', 3],       t: 80,   lvl: 20 },
  { id: 'r_milk',      at: 'barn',    in: { wheat: 4 },                             out: ['milk', 2],       t: 100,  lvl: 6 },
  { id: 'r_milk2',     at: 'barn',    in: { barley: 3 },                            out: ['milk', 3],       t: 100,  lvl: 12 },
  { id: 'r_honey',     at: 'hive',    in: {},                                       out: ['honey', 1],      t: 150,  lvl: 5 },
  { id: 'r_frittata',  at: 'pot',     in: { eggs: 3, potato: 2 },                   out: ['frittata', 1],   t: 60,   lvl: 3 },
  { id: 'r_cheese',    at: 'crock',   in: { milk: 4 },                              out: ['cheese', 1],     t: 360,  lvl: 6 },
  { id: 'r_honeycake', at: 'oven',    in: { flour: 2, honey: 2, eggs: 1 },          out: ['honeycake', 1],  t: 100,  lvl: 6 },
  { id: 'r_custard',   at: 'oven',    in: { eggs: 2, milk: 2, sugar: 1 },           out: ['custard', 1],    t: 80,   lvl: 7 },
  { id: 'r_quiche',    at: 'oven',    in: { flour: 2, eggs: 2, cheese: 1 },         out: ['quiche', 1],     t: 100,  lvl: 7 },
  { id: 'r_mead',      at: 'barrel',  in: { honey: 5 },                             out: ['mead', 1],       t: 900,  lvl: 13 },
  { id: 'r_milktea',   at: 'teahouse',in: { tealeaves: 1, milk: 1, honey: 1 },      out: ['milktea', 1],    t: 90,   lvl: 19 },
  // ducks
  { id: 'r_duckeggs',  at: 'duckhouse', in: { lettuce: 3 },                         out: ['duckeggs', 2],   t: 90,   lvl: 8 },
  { id: 'r_duckeggs2', at: 'duckhouse', in: { barley: 2 },                          out: ['duckeggs', 3],   t: 90,   lvl: 12 },
  { id: 'r_noodles',   at: 'pot',     in: { flour: 2, duckeggs: 2 },                out: ['eggnoodles', 1], t: 70,   lvl: 8 },
  { id: 'r_pillow',    at: 'loom',    in: { feathers: 6, cloth: 1 },                out: ['featherpillow', 1], t: 200, lvl: 17 },
  // candles
  { id: 'r_candle',    at: 'chandlery', in: { beeswax: 2 },                         out: ['candle', 2],     t: 90,   lvl: 5 },
  { id: 'r_pinecandle',at: 'chandlery', in: { beeswax: 1, resin: 2 },               out: ['pinecandle', 1], t: 110,  lvl: 5 },
  { id: 'r_lavcandle', at: 'chandlery', in: { beeswax: 2, driedlavender: 1 },       out: ['lavcandle', 1],  t: 120,  lvl: 27 },
  // trees (they only start producing once grown)
  { id: 'r_acorns',    at: 'oaktree',    in: {},                                    out: ['acorns', 2],     t: 200,  lvl: 3 },
  { id: 'r_birchsap',  at: 'birchtree',  in: {},                                    out: ['birchsap', 1],   t: 220,  lvl: 3 },
  { id: 'r_resin',     at: 'pinetree',   in: {},                                    out: ['resin', 1],      t: 260,  lvl: 3 },
  { id: 'r_maplesap',  at: 'mapletree',  in: {},                                    out: ['maplesap', 1],   t: 240,  lvl: 3 },
  { id: 'r_withies',   at: 'willowtree', in: {},                                    out: ['withies', 2],    t: 200,  lvl: 3 },
  { id: 'r_acornflour',at: 'mill',    in: { acorns: 4 },                            out: ['acornflour', 1], t: 40,   lvl: 3 },
  { id: 'r_acornbread',at: 'oven',    in: { acornflour: 2, honey: 1 },              out: ['acornbread', 1], t: 80,   lvl: 6 },
  { id: 'r_maplesyrup',at: 'kettle',  in: { maplesap: 4 },                          out: ['maplesyrup', 1], t: 120,  lvl: 7 },
  { id: 'r_maplecandy',at: 'kettle',  in: { maplesyrup: 1, sugar: 1 },              out: ['maplecandy', 2], t: 80,   lvl: 7 },
  { id: 'r_birchbeer', at: 'barrel',  in: { birchsap: 4, sugar: 1 },                out: ['birchbeer', 2],  t: 600,  lvl: 13 },
  { id: 'r_basket',    at: 'loom',    in: { withies: 5 },                           out: ['willowbasket', 1], t: 150, lvl: 17 },
];
const RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));

// ---------------------------------------------------------------- fish
// base: catch weight at fishing level 0. minLv: fishing level before it can bite. xp: fishing XP per catch.
const RARITY = {
  common:    { name: 'Common',    col: '#8a9a8a', g: -0.02 },
  uncommon:  { name: 'Uncommon',  col: '#4f9a3a', g: 0.06 },
  rare:      { name: 'Rare',      col: '#3a7ac8', g: 0.16 },
  epic:      { name: 'Epic',      col: '#9a4ad8', g: 0.45 },
  legendary: { name: 'Legendary', col: '#e8a020', g: 0.9 },
};
const FISH = [
  { id: 'minnow',   name: 'Minnow',          rar: 'common',    base: 40,   minLv: 0,  price: 3,   xp: 2, cm: 6,  look: { c: '#a8b8c0', b: '#e8eef0', len: 0.8 } },
  { id: 'bluegill', name: 'Bluegill',        rar: 'common',    base: 30,   minLv: 0,  price: 6,   xp: 3, cm: 18,  look: { c: '#5a7ab0', b: '#f0a040', round: 1 } },
  { id: 'perch',    name: 'Yellow Perch',    rar: 'common',    base: 26,   minLv: 0,  price: 8,   xp: 4, cm: 24,  look: { c: '#d8c040', b: '#f4ecb0', bars: '#5a5a2a' } },
  { id: 'carp',     name: 'Carp',            rar: 'uncommon',  base: 14,   minLv: 0,  price: 12,  xp: 6, cm: 55,  look: { c: '#b88a40', b: '#e8d090', round: 1, scales: 1 } },
  { id: 'trout',    name: 'Rainbow Trout',   rar: 'uncommon',  base: 10,   minLv: 1,  price: 18,  xp: 8, cm: 45,  look: { c: '#7a9a7a', b: '#f0e8e0', stripe: '#e87a8a', spots: 1 } },
  { id: 'catfish',  name: 'Catfish',         rar: 'uncommon',  base: 9,    minLv: 1,  price: 20,  xp: 9, cm: 70,  look: { c: '#6a6a5a', b: '#c8c0a8', whiskers: 1, len: 1.15 } },
  { id: 'bass',     name: 'Largemouth Bass', rar: 'rare',      base: 5,    minLv: 2,  price: 30,  xp: 12, cm: 42, look: { c: '#5a8a3a', b: '#e0e8c0', stripe: '#2a4a1a' } },
  { id: 'pike',     name: 'Northern Pike',   rar: 'rare',      base: 3,    minLv: 4,  price: 45,  xp: 16, cm: 85, look: { c: '#5a7a3a', b: '#e8e8c0', len: 1.4, spots: 1 } },
  { id: 'salmon',   name: 'Salmon',          rar: 'epic',      base: 1.6,  minLv: 6,  price: 70,  xp: 25, cm: 76, look: { c: '#7a8aa0', b: '#f0a080', len: 1.2, spots: 1 } },
  { id: 'sturgeon', name: 'Sturgeon',        rar: 'epic',      base: 0.8,  minLv: 9,  price: 120, xp: 35, cm: 160, look: { c: '#6a6a7a', b: '#b8b8c0', len: 1.5, ridge: 1 } },
  { id: 'koi',      name: 'Golden Koi',      rar: 'legendary', base: 0.25, minLv: 12, price: 400, xp: 80, cm: 60, look: { c: '#f2a020', b: '#fff6e0', patches: 1, shine: 1 } },
];
const FISHMAP = Object.fromEntries(FISH.map(f => [f.id, f]));
const FISH_LV_MAX = 20;
const fishXpFor = l => Math.round(40 * Math.pow(l, 1.7));   // total XP needed to reach level l

// raw produce from animals and the compost heap
const FARM_GOODS = [
  { id: 'eggs',       name: 'Eggs',       price: 8 },
  { id: 'milk',       name: 'Milk',       price: 10 },
  { id: 'honey',      name: 'Honey',      price: 14 },
  { id: 'fertilizer', name: 'Fertilizer', price: 2 },
  { id: 'beeswax',    name: 'Beeswax',    price: 9 },
  { id: 'duckeggs',   name: 'Duck Eggs',  price: 9 },
  { id: 'feathers',   name: 'Feathers',   price: 4 },
  { id: 'acorns',     name: 'Acorns',     price: 5 },
  { id: 'maplesap',   name: 'Maple Sap',  price: 12 },
  { id: 'birchsap',   name: 'Birch Sap',  price: 10 },
  { id: 'withies',    name: 'Willow Withies', price: 6 },
  { id: 'resin',      name: 'Pine Resin', price: 14 },
];
// trees grow from seedlings bought at the market or found while clearing the woods
const TREES = [
  { id: 'oaktree',    seed: 'seed_oak',    name: 'Oak Tree',    seedName: 'Oak Seedling',    buy: 200, prod: 'acorns',   kind: 'oak' },
  { id: 'birchtree',  seed: 'seed_birch',  name: 'Birch Tree',  seedName: 'Birch Seedling',  buy: 300, prod: 'birchsap', kind: 'birch' },
  { id: 'pinetree',   seed: 'seed_pine',   name: 'Pine Tree',   seedName: 'Pine Seedling',   buy: 350, prod: 'resin',    kind: 'pine' },
  { id: 'willowtree', seed: 'seed_willow', name: 'Willow Tree', seedName: 'Willow Cutting',  buy: 450, prod: 'withies',  kind: 'willow' },
  { id: 'mapletree',  seed: 'seed_maple',  name: 'Maple Tree',  seedName: 'Maple Seedling',  buy: 600, prod: 'maplesap', kind: 'maple' },
];
const TREE_GROW = 1500;   // seconds for a seedling to grow up and start producing

const ITEM = {};
CROPS.forEach(c => ITEM[c.id] = { id: c.id, name: c.name, price: c.price, crop: true });
FISH.forEach(f => ITEM[f.id] = { id: f.id, name: f.name, price: f.price, crop: false, fish: true });
FARM_GOODS.forEach(a => ITEM[a.id] = { id: a.id, name: a.name, price: a.price, crop: false, farm: true });
TREES.forEach(t => ITEM[t.seed] = { id: t.seed, name: t.seedName, price: Math.round(t.buy / 8), crop: false, seed: true });
FLOWERS.forEach(f => ITEM[f.id] = { id: f.id, name: f.name, price: 0, crop: false, flower: true });
// goods are worth a markup over their ingredients plus a little for the time they take
(function priceGoods() {
  const byOut = {}; RECIPES.forEach(r => byOut[r.out[0]] = r);
  const val = id => {
    if (ITEM[id]) return ITEM[id].price;
    const r = byOut[id];
    let v = 0; for (const k in r.in) v += val(k) * r.in[k];
    const p = Math.max(3, Math.round((v * 1.35 + r.t * 0.09) / r.out[1]));
    ITEM[id] = { id, name: GOOD[id].name, price: p, crop: false };
    return p;
  };
  GOODS.forEach(g => val(g.id));
})();
GOODS.forEach(g => g.price = ITEM[g.id].price);

// ---------------------------------------------------------------- buildings
// w,h: footprint in tiles. cost: base coins. grow: cost multiplier per extra copy. max: limit.
// lvl: level index that unlocks it. proc: true if it runs recipes.
const BUILDINGS = {
  plot:      { name: 'Garden Plot',     w: 1, h: 1, cost: 30,     grow: 1.10, lvl: 0,  cat: 'farm',  desc: 'A tilled bed. Touching plots join into one big bed.' },
  path:      { name: 'Cobble Path',     w: 1, h: 1, cost: 8,      grow: 1.0,  lvl: 0,  cat: 'farm',  desc: 'Meeples walk 40% faster on paths.' },
  well:      { name: 'Stone Well',      w: 2, h: 2, cost: 250,    grow: 1.7,  lvl: 0,  cat: 'farm',  max: 10, desc: 'Meeples fill their watering cans here. Watered soil grows crops 60% faster and stays moist for 3 harvests.' },
  compost:   { name: 'Compost Bin',     w: 1, h: 1, cost: 350,    grow: 1.6,  lvl: 1,  cat: 'farm',  max: 6, desc: 'Spent plants and spare produce rot down into fertilizer. Fertilized plots have a 30% chance of a double harvest.' },
  scarecrow: { name: 'Scarecrow',       w: 1, h: 1, cost: 600,    grow: 1.4,  lvl: 3,  cat: 'farm',  max: 20, desc: 'Plots within 2 tiles grow 10% faster. Also very handsome.' },
  greenhouse:{ name: 'Greenhouse',      w: 4, h: 4, cost: 450000, grow: 2.2,  lvl: 24, cat: 'farm',  max: 3, walk: 1, desc: '12 glass-covered plots that grow 50% faster and never need watering. Tap it to lift the roof and plant.' },
  dock:      { name: 'Fishing Dock',    w: 1, h: 1, cost: 600,    grow: 2.0,  lvl: 2,  cat: 'water', max: 4, desc: 'Build beside a pond, then give a Meeple the Fish job. Tap it to check catch odds or reel one in yourself.' },
  smokehouse:{ name: 'Smokehouse',      w: 2, h: 2, cost: 6000,   grow: 2.4,  lvl: 3,  cat: 'water', max: 3, proc: 1, desc: 'Slow oak smoke turns fresh fish into smoked delicacies.' },
  sushi:     { name: 'Sushi Counter',   w: 2, h: 2, cost: 200000, grow: 2.3,  lvl: 25, cat: 'water', max: 2, proc: 1, desc: 'Rice, fresh fish and a sharp knife: nigiri, rolls and deluxe platters.' },
  coop:      { name: 'Chicken Coop',    w: 2, h: 2, cost: 3000,   grow: 2.2,  lvl: 3,  cat: 'animal', max: 3, proc: 1, desc: 'A flock of hens turns grain into fresh eggs.' },
  hive:      { name: 'Beehive',         w: 1, h: 1, cost: 2500,   grow: 1.5,  lvl: 5,  cat: 'animal', max: 8, proc: 1, desc: 'Bees make honey all on their own, and crops within 3 tiles grow 15% faster.' },
  barn:      { name: 'Dairy Barn',      w: 2, h: 2, cost: 12000,  grow: 2.2,  lvl: 6,  cat: 'animal', max: 3, proc: 1, desc: 'Gentle cows turn grain into creamy milk.' },
  duckhouse: { name: 'Duck House',      w: 1, h: 1, cost: 8000,   grow: 2.0,  lvl: 8,  cat: 'animal', max: 3, proc: 1, desc: 'Build it beside a pond. Ducks paddle about, lay duck eggs and drop feathers.' },
  owlbox:    { name: 'Barn Owl Box',    w: 1, h: 1, cost: 1500,   grow: 1.8,  lvl: 2,  cat: 'farm',  max: 4, desc: 'A barn owl nests here. It swoops on any field mouse within 9 tiles and carries it back to the nest.' },
  doghouse:  { name: 'Dog House',       w: 1, h: 1, cost: 2500,   grow: 1.8,  lvl: 4,  cat: 'farm',  max: 3, desc: 'A good dog dashes out and chases squirrels off your crops (within 8 tiles).' },
  cattree:   { name: 'Cat Tree',        w: 1, h: 1, cost: 2000,   grow: 1.8,  lvl: 4,  cat: 'farm',  max: 3, desc: 'A farm cat pounces on mice and chases off squirrels within 6 tiles. Slower than an owl or a dog, but it handles both.' },
  chandlery: { name: 'Chandlery',       w: 2, h: 2, cost: 10000,  grow: 2.3,  lvl: 5,  cat: 'craft', max: 2, proc: 1, desc: 'Melts beeswax into candles, plain or scented.' },
  noticeboard:{ name: 'Orders Board',   w: 1, h: 1, cost: 200,    grow: 1,    lvl: 1,  cat: 'core',  max: 1, desc: 'Neighbours pin up orders. Fill them before they expire for bonus coins and prizes.' },
  storehouse:{ name: 'Storehouse',      w: 2, h: 2, cost: 400,    grow: 2.2,  lvl: 0,  cat: 'core',  max: 4, desc: 'Meeples drop harvests at the nearest storehouse. Build more to shorten trips.' },
  market:    { name: 'Market Stall',    w: 2, h: 2, cost: 0,      grow: 1,    lvl: 0,  cat: 'core',  max: 1, desc: 'Sell goods and buy upgrades.' },
  creator:   { name: 'Meeple Creator',  w: 2, h: 2, cost: 250,    grow: 1,    lvl: 0,  cat: 'core',  max: 1, desc: 'Turns produce into new Meeples. Each crop makes a different kind.' },
  mill:      { name: 'Windmill',        w: 2, h: 2, cost: 900,    grow: 2.5,  lvl: 1,  cat: 'craft', max: 3, proc: 1, desc: 'Grinds grain, beets and corn into flour, sugar, malt and meal.' },
  pot:       { name: 'Big Pot',         w: 2, h: 2, cost: 2200,   grow: 2.5,  lvl: 2,  cat: 'craft', max: 3, proc: 1, desc: 'A bubbling cauldron for mixing several ingredients into something new.' },
  crock:     { name: 'Ferment Crock',   w: 1, h: 1, cost: 3500,   grow: 1.45, lvl: 4,  cat: 'craft', max: 12, proc: 1, desc: 'Slow and sour: krauts, kimchi, pickles and hot sauce.' },
  oven:      { name: 'Bakery Oven',     w: 2, h: 2, cost: 5000,   grow: 2.4,  lvl: 6,  cat: 'craft', max: 3, proc: 1, desc: 'A wood-fired dome for loaves, pies, pizza and cake.' },
  kettle:    { name: 'Jam Kettle',      w: 2, h: 2, cost: 9000,   grow: 2.4,  lvl: 7,  cat: 'craft', max: 3, proc: 1, desc: 'A copper kettle for jams, jellies and sauces.' },
  dryer:     { name: 'Drying Rack',     w: 1, h: 1, cost: 8000,   grow: 1.45, lvl: 9,  cat: 'craft', max: 10, proc: 1, desc: 'Sun and breeze turn fruit, chilies, tea and cocoa into dried goods.' },
  juicer:    { name: 'Juice Press',     w: 1, h: 1, cost: 16000,  grow: 1.5,  lvl: 11, cat: 'craft', max: 8, proc: 1, desc: 'Squeezes fruit and veg into fresh juice and nectar.' },
  barrel:    { name: 'Oak Barrel',      w: 1, h: 1, cost: 30000,  grow: 1.35, lvl: 13, cat: 'craft', max: 16, proc: 1, desc: 'Brews beer, cider, wine and rice wine, and ages spirits into whiskey.' },
  press:     { name: 'Oil Press',       w: 2, h: 2, cost: 45000,  grow: 2.3,  lvl: 14, cat: 'craft', max: 3, proc: 1, desc: 'A great wooden screw press for sunflower, olive and lavender oils.' },
  loom:      { name: 'Weaving Loom',    w: 2, h: 2, cost: 80000,  grow: 2.3,  lvl: 17, cat: 'craft', max: 3, proc: 1, desc: 'Spins cotton and flax into cloth, linen, sachets and quilts.' },
  teahouse:  { name: 'Tea House',       w: 2, h: 2, cost: 120000, grow: 2.3,  lvl: 19, cat: 'craft', max: 3, proc: 1, desc: 'Steeps teas and stirs up hot cocoa.' },
  still:     { name: 'Copper Still',    w: 2, h: 2, cost: 150000, grow: 2.2,  lvl: 20, cat: 'craft', max: 3, proc: 1, desc: 'Distils mashes, ciders, wines and nectars into strong spirits.' },
  lantern:   { name: 'Lantern Post',    w: 1, h: 1, cost: 120,    grow: 1.05, lvl: 1,  cat: 'decor', desc: 'Glows warmly at night.' },
  flowers:   { name: 'Flower Bed',      w: 1, h: 1, cost: 60,     grow: 1.03, lvl: 0,  cat: 'decor', desc: 'Pretty. Butterflies love it.' },
  bench:     { name: 'Bench',           w: 1, h: 1, cost: 150,    grow: 1.05, lvl: 2,  cat: 'decor', desc: 'For Meeples to dream on.' },
  // found in the woods or earned from the Journal; never sold in the shop
  gnome:     { name: 'Garden Gnome',    w: 1, h: 1, cost: 0, grow: 1, lvl: 0, cat: 'decor', found: 1, desc: 'Dug up while clearing the woods. Faceless and proud of it.' },
  wheel:     { name: 'Wagon Wheel',     w: 1, h: 1, cost: 0, grow: 1, lvl: 0, cat: 'decor', found: 1, desc: 'From a cart that rolled through here long ago.' },
  stump:     { name: 'Mushroom Stump',  w: 1, h: 1, cost: 0, grow: 1, lvl: 0, cat: 'decor', found: 1, desc: 'An old stump sprouting little red toadstools.' },
  birdbath:  { name: 'Stone Birdbath',  w: 1, h: 1, cost: 0, grow: 1, lvl: 0, cat: 'decor', found: 1, desc: 'Songbirds stop by for a splash.' },
  statue:    { name: 'Mossy Statue',    w: 1, h: 1, cost: 0, grow: 1, lvl: 0, cat: 'decor', found: 1, desc: 'A stone Meeple, worn smooth by the rain.' },
  topiary:   { name: 'Meeple Topiary',  w: 1, h: 1, cost: 0, grow: 1, lvl: 0, cat: 'decor', found: 1, desc: 'A hedge clipped into a familiar shape. A Journal reward.' },
  fountain:  { name: 'Stone Fountain',  w: 2, h: 2, cost: 0, grow: 1, lvl: 0, cat: 'decor', found: 1, desc: 'Burbling water in a mossy basin. A Journal reward.' },
};
const FOUND_DECOR = ['gnome', 'wheel', 'stump', 'birdbath', 'statue'];
TREES.forEach(t => BUILDINGS[t.id] = { name: t.name, w: 1, h: 1, cost: 0, grow: 1, lvl: 3, cat: 'trees', max: 12, proc: 1, tree: 1,
  desc: `Plant ${/^[aeiou]/i.test(t.seedName) ? 'an' : 'a'} ${t.seedName.toLowerCase()}. Once it grows up it gives ${ITEM[t.prod].name.toLowerCase()} on its own.` });

// ---------------------------------------------------------------- levels
// Level i unlocks LEVELS[i].crop. req counts lifetime production (harvests + crafted goods).
const LEVELS = [
  { crop: 'carrot',     req: null },
  { crop: 'wheat',      req: { carrot: 25 } },
  { crop: 'potato',     req: { wheat: 50, carrot: 50 } },
  { crop: 'parsnip',    req: { potato: 90, flour: 15 } },
  { crop: 'cabbage',    req: { parsnip: 100, stew: 12, mash: 8 } },
  { crop: 'lettuce',    req: { cabbage: 120, sauerkraut: 12, parsnipsoup: 10 } },
  { crop: 'sugarbeet',  req: { lettuce: 140, flour: 50 } },
  { crop: 'strawberry', req: { sugarbeet: 160, bread: 20, sugar: 25 } },
  { crop: 'garlic',     req: { strawberry: 180, jam: 15, berrypie: 10 } },
  { crop: 'tomato',     req: { garlic: 200, pickles: 20, garlicbread: 15 } },
  { crop: 'chili',      req: { tomato: 220, tomatosauce: 15, pizza: 10, driedtomato: 10 } },
  { crop: 'cucumber',   req: { chili: 240, kimchi: 15, hotsauce: 10, pepperjelly: 10, chiliflakes: 10 } },
  { crop: 'barley',     req: { cucumber: 250, dillpickles: 20, salad: 15, tomatojuice: 10 } },
  { crop: 'hops',       req: { barley: 280, malt: 40, carrotjuice: 20 } },
  { crop: 'sunflower',  req: { hops: 300, wort: 25, beer: 20 } },
  { crop: 'kale',       req: { sunflower: 320, sunoil: 25 } },
  { crop: 'apple',      req: { kale: 340, kalesoup: 25 } },
  { crop: 'cotton',     req: { apple: 360, cider: 15, applepie: 15, applejuice: 15, driedapple: 10 } },
  { crop: 'blueberry',  req: { cotton: 380, cloth: 25 } },
  { crop: 'tea',        req: { blueberry: 400, bluejam: 20, berrywine: 12 } },
  { crop: 'corn',       req: { tea: 420, tealeaves: 30, greentea: 20 } },
  { crop: 'flax',       req: { corn: 450, cornmeal: 40, whitedog: 15, vodka: 12 } },
  { crop: 'grapes',     req: { flax: 470, linen: 25, quilt: 10 } },
  { crop: 'cranberry',  req: { grapes: 500, wine: 20, raisins: 20, brandy: 8 } },
  { crop: 'pumpkin',    req: { cranberry: 520, cranberrysauce: 20, cranberryjuice: 20 } },
  { crop: 'rice',       req: { pumpkin: 540, pumpkinpie: 20, pumpkinale: 15, pumpkinsoup: 15 } },
  { crop: 'olive',      req: { rice: 560, sake: 15, whiskey: 10 } },
  { crop: 'lavender',   req: { olive: 580, oliveoil: 25, risotto: 15 } },
  { crop: 'melon',      req: { lavender: 600, lavenderoil: 15, sachet: 15, lavtea: 15 } },
  { crop: 'juniper',    req: { melon: 620, melonjuice: 25, soju: 10 } },
  { crop: 'peach',      req: { juniper: 640, gin: 15, applejack: 15 } },
  { crop: 'cocoa',      req: { peach: 660, peachjam: 20, peachtea: 15, schnapps: 10, peachcobbler: 10 } },
  // Final level: the Grand Harvest Fair.
  { crop: null, fair: true, req: { cake: 25, hotcocoa: 25, gin: 20, whiskey: 20, brandy: 20, quilt: 20, kimchi: 60, jam: 60, beer: 80, wine: 30 } },
];
LEVELS.forEach(l => { if (l.req) for (const k in l.req) l.req[k] = Math.max(1, Math.round(l.req[k] * PACE)); });

// ---------------------------------------------------------------- upgrades
const UPGRADES = [
  { id: 'soil',    name: 'Rich Compost',   desc: '+12% crop growth speed',        base: 300,   mul: 3.2, max: 6, icon: 'soil' },
  { id: 'boots',   name: 'Swift Sandals',  desc: '+10% Meeple walking speed',     base: 500,   mul: 3.0, max: 6, icon: 'boots' },
  { id: 'basket',  name: 'Wicker Baskets', desc: '+1 carry for every Meeple',     base: 800,   mul: 3.4, max: 6, icon: 'basket' },
  { id: 'cans',    name: 'Copper Cans',    desc: '+3 waterings per can refill',   base: 600,   mul: 3.0, max: 5, icon: 'can' },
  { id: 'hands',   name: 'Green Thumbs',   desc: '+15% planting & harvest speed', base: 400,   mul: 3.0, max: 5, icon: 'hands' },
  { id: 'haggle',  name: 'Silver Tongue',  desc: '+10% sell prices',              base: 1500,  mul: 3.5, max: 8, icon: 'haggle' },
  { id: 'copper',  name: 'Copper Coils',   desc: '+12% crafting speed',           base: 5000,  mul: 3.2, max: 6, icon: 'copper', lvl: 1 },
  { id: 'yield',   name: 'Lucky Clover',   desc: '+8% chance of a bonus harvest', base: 2500,  mul: 3.6, max: 6, icon: 'clover', lvl: 2 },
];

// ---------------------------------------------------------------- discoveries, hats, journal
const RELICS = [
  { id: 'horseshoe', name: 'Rusty Horseshoe',  desc: 'Still lucky, probably.' },
  { id: 'oldcoin',   name: 'Old Silver Coin',  desc: 'Stamped with a Meeple wearing a crown.' },
  { id: 'arrowhead', name: 'Flint Arrowhead',  desc: 'Chipped by careful hands long ago.' },
  { id: 'fossil',    name: 'Spiral Fossil',    desc: 'A sea shell, very far from the sea.' },
  { id: 'watch',     name: 'Pocket Watch',     desc: 'Stopped at ten past two.' },
  { id: 'bottle',    name: 'Blue Bottle',      desc: 'A rolled-up note inside says "plant more carrots".' },
  { id: 'key',       name: 'Brass Key',        desc: 'Opens something, somewhere.' },
  { id: 'teacup',    name: 'Chipped Teacup',   desc: 'Painted rosebuds and one tiny crack.' },
  { id: 'marble',    name: 'Glass Marble',     desc: 'A green swirl, like a tiny planet.' },
  { id: 'figurine',  name: 'Wooden Meeple',    desc: 'Carved by someone a very long time ago.' },
];
const HATS = [
  { id: 'straw',  name: 'Straw Hat',     how: 'Pip has worn it since day one' },
  { id: 'flower', name: 'Flower Crown',  how: 'Found while clearing the woods' },
  { id: 'acorn',  name: 'Acorn Cap',     how: 'Clear 150 tiles of woodland' },
  { id: 'beanie', name: 'Knit Beanie',   how: 'Fill 5 orders' },
  { id: 'bucket', name: 'Bucket Hat',    how: 'Reach fishing level 5' },
  { id: 'chef',   name: 'Chef\'s Toque', how: 'Craft 200 goods' },
  { id: 'tophat', name: 'Top Hat',       how: 'Fill 20 orders' },
  { id: 'crown',  name: 'Golden Crown',  how: 'Win the Grand Harvest Fair' },
  { id: 'mushroom', name: 'Toadstool Cap', how: 'Found while clearing the woods' },
  { id: 'leaf',   name: 'Leaf Hat',      how: 'Found while clearing the woods' },
  { id: 'beret',  name: 'Beret',         how: 'Reach level 10' },
  { id: 'halo',   name: 'Halo',          how: 'Reach level 20' },
  { id: 'cowboy', name: 'Cowboy Hat',    how: 'Have 10 Meeples' },
  { id: 'party',  name: 'Party Hat',     how: 'Fill 10 orders' },
  { id: 'propeller', name: 'Propeller Cap', how: 'Clear 400 tiles of woodland' },
  { id: 'pirate', name: 'Pirate Hat',    how: 'Catch 50 fish' },
  { id: 'frog',   name: 'Frog Hat',      how: 'Catch a Golden Koi' },
  { id: 'viking', name: 'Viking Helmet', how: 'Brew 50 beers' },
  { id: 'wizard', name: 'Wizard Hat',    how: 'Find 5 relics' },
  { id: 'bow',    name: 'Big Bow',       how: 'Make 25 finds while clearing' },
  { id: 'bunny',  name: 'Bunny Ears',    how: 'Earn 100,000 coins' },
  { id: 'fez',    name: 'Fez',           how: 'Earn 1,000,000 coins' },
  { id: 'hardhat',name: 'Hard Hat',      how: 'Have 30 buildings' },
  { id: 'grad',   name: 'Graduation Cap',how: 'Reach 6 Journal milestones' },
  { id: 'bonnet', name: 'Sun Bonnet',    how: 'Collect 100 eggs' },
  { id: 'antenna',name: 'Bee Antennae',  how: 'Collect 50 honey' },
  { id: 'duckling', name: 'Duckling',    how: 'Build a Duck House' },
  { id: 'visor',  name: 'Sun Visor',     how: 'Harvest 5,000 crops' },
  { id: 'wreath', name: 'Holly Wreath',  how: 'Win a Blue Ribbon' },
  { id: 'nightcap', name: 'Nightcap',    how: 'Play for 24 hours' },
];
const FIND_HATS = ['flower', 'mushroom', 'leaf'];
// every Meeple gets a way of getting about, picked at random when they're made
const GAITS = [
  { id: 'walk', name: 'Strolls' }, { id: 'moonwalk', name: 'Moonwalks' }, { id: 'slide', name: 'Slides' },
  { id: 'waddle', name: 'Waddles' }, { id: 'skip', name: 'Skips' }, { id: 'float', name: 'Floats' },
  { id: 'hop', name: 'Hops' }, { id: 'twirl', name: 'Twirls' }, { id: 'march', name: 'Marches' }, { id: 'tiptoe', name: 'Tiptoes' },
];
// Journal milestones: discover n entries on a page for a permanent bonus or a decoration.
const JOURNAL = [
  { page: 'crops',  n: 8,  r: { grow: 0.03 } },
  { page: 'crops',  n: 16, r: { grow: 0.03 } },
  { page: 'crops',  n: 24, r: { decor: 'topiary', k: 2 } },
  { page: 'crops',  n: 32, r: { grow: 0.04 } },
  { page: 'goods',  n: 10, r: { sell: 0.03 } },
  { page: 'goods',  n: 25, r: { craft: 0.05 } },
  { page: 'goods',  n: 45, r: { decor: 'fountain', k: 1 } },
  { page: 'goods',  n: 70, r: { sell: 0.05 } },
  { page: 'goods',  n: 0,  r: { craft: 0.08 } },   // 0 = the whole page
  { page: 'fish',   n: 3,  r: { fish: 0.1 } },
  { page: 'fish',   n: 7,  r: { decor: 'statue', k: 1 } },
  { page: 'fish',   n: 11, r: { fish: 0.15 } },
  { page: 'relics', n: 3,  r: { walk: 0.04 } },
  { page: 'relics', n: 6,  r: { decor: 'birdbath', k: 1 } },
  { page: 'relics', n: 10, r: { walk: 0.06 } },
];

const MEEPLE_MAX = 40;
const MEEPLE_NAMES = ('Pip Bean Tuck Moss Fern Clem Dot Hob Juno Kip Lark Mabel Nib Olly Pim Quill Rue Sprout Tilly Umber Vetch Wren Yarrow Zinnia ' +
  'Basil Clove Dill Ginger Hazel Ivy Juniper Kale Leek Mint Nutmeg Okra Parsley Radish Sage Thyme Acorn Bramble Cobble Dandy Ember Fig Gourd Hops Inky ' +
  'Jolly Knob Lentil Mallow Nettle Oat Pebble Quince Rhubarb Sorrel Turnip Willow Barley Burdock Chestnut Dewdrop Flax Gus Huckle').split(' ');

// v1 saves stored levels by this crop order; used to migrate them.
const V1_LEVEL_CROPS = ['carrot', 'wheat', 'potato', 'cabbage', 'sugarbeet', 'strawberry', 'garlic', 'chili', 'barley', 'hops', 'apple', 'blueberry', 'corn', 'grapes', 'pumpkin', 'juniper', 'juniper'];
;(window.__stage = window.__stage || []).push('data.js loaded');
