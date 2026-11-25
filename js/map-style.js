// MapLibre style that reproduces Google Maps' default (2023+) roadmap palette.
// Colors were sampled from a Google Maps screenshot at the home view.

export const COLORS = {
  land: '#d1f8e1',
  landCity: '#f2f4f5',
  farmland: '#c9f5dc',
  grass: '#c0f1d5',
  wood: '#c8f4db',
  park: '#b8efcd',
  urban: '#f3f4f5',
  sand: '#f5f1e0',
  water: '#8cd9ed',
  military: '#e1e2e6',
  airport: '#dfe5f3',
  building: '#e8ebef',
  buildingEdge: '#dadee4',

  motorway: '#98a8c8',
  motorwayCasing: '#8497bb',
  trunk: '#a1b0cc',
  primary: '#adbad3',
  secondary: '#b4c0d7',
  tertiary: '#bcc7db',
  minor: '#c7d1e0',
  service: '#d5dce7',
  rail: '#c4c9d1',

  border: '#80868d',
  borderWater: '#5aa5bf',

  label1: '#1f1f1f',
  label2: '#232527',
  label3: '#2b2d30',
  label4: '#35383b',
  labelMinor: '#5f6368',
  labelPark: '#2f7359',
  labelWater: '#4b88ac',
  labelRoad: '#5a616b',
  halo: '#ffffff',
};

const C = COLORS;
const REGULAR = ['Roboto Regular'];
const MEDIUM = ['Roboto Medium'];

const lin = (...stops) => ['interpolate', ['linear'], ['zoom'], ...stops];
const exp = (...stops) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops];
const isClass = (...names) => ['match', ['get', 'class'], names, true, false];
const name = ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];

// Road width ramp. Ramps (on/off slips) draw at 55% of the parent road.
const rampScale = ['case', ['==', ['get', 'ramp'], 1], 0.55, 1];
const roadWidth = (stops, extra = 0) => {
  const out = [];
  for (let i = 0; i < stops.length; i += 2) out.push(stops[i], ['+', ['*', rampScale, stops[i + 1]], extra]);
  return exp(...out);
};

const ROADS = [
  { id: 'service', classes: ['service'], minzoom: 13.5, color: C.service, width: [14, 1, 16, 3, 18, 9] },
  { id: 'minor', classes: ['minor'], minzoom: 11.5, color: C.minor, width: [12, 0.7, 13, 1.3, 14, 2.8, 16, 8, 18, 19] },
  { id: 'tertiary', classes: ['tertiary'], minzoom: 9.5, color: C.tertiary, width: [10, 0.9, 12, 1.9, 14, 4, 16, 10, 18, 22] },
  { id: 'secondary', classes: ['secondary'], minzoom: 7.5, color: C.secondary, width: [8, 0.9, 9, 1.2, 10, 1.6, 12, 2.6, 14, 5, 16, 12, 18, 24] },
  { id: 'primary', classes: ['primary'], minzoom: 6, color: C.primary, fade: '#bfc9dd', width: [7, 0.4, 8, 0.65, 9, 1.1, 10, 1.8, 12, 3.4, 14, 6, 16, 13, 18, 26] },
  { id: 'trunk', classes: ['trunk'], minzoom: 5, color: C.trunk, width: [6, 0.6, 8, 1.3, 9, 1.8, 10, 2.6, 12, 4.2, 14, 7, 16, 14, 18, 28] },
  { id: 'motorway', classes: ['motorway'], minzoom: 3.5, color: C.motorway, width: [5, 0.9, 8, 2.3, 9, 2.8, 10, 3.7, 12, 5.2, 14, 8, 16, 16, 18, 32] },
];

const notTunnel = ['!=', ['get', 'brunnel'], 'tunnel'];

function roadLayers() {
  const layers = [
    {
      id: 'road-motorway-casing',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: 11,
      filter: isClass('motorway'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': C.motorwayCasing,
        'line-width': roadWidth([10, 4, 12, 5.2, 14, 8, 16, 16, 18, 32], 1.6),
        'line-opacity': lin(11, 0, 12, 1),
      },
    },
    {
      id: 'road-path',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: 14.5,
      filter: isClass('path', 'track'),
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: { 'line-color': C.minor, 'line-width': lin(15, 0.8, 18, 2), 'line-dasharray': [2, 1.5] },
    },
  ];
  for (const r of ROADS) {
    layers.push({
      id: `road-${r.id}`,
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: r.minzoom,
      filter: isClass(...r.classes),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': r.fade ? lin(8, r.fade, 9.5, r.color) : r.color,
        'line-width': roadWidth(r.width),
        'line-opacity': ['case', notTunnel, 1, 0.55],
      },
    });
  }
  return layers;
}

const shieldKind = [
  'match',
  ['get', 'network'],
  'us-interstate', 'i',
  'us-highway', 'us',
  'us-state', 'st',
  'rd',
];

const shieldLayer = (id, minzoom, filter, spacing) => ({
  id,
  type: 'symbol',
  source: 'omt',
  'source-layer': 'transportation_name',
  minzoom,
  filter: ['all', ['has', 'ref'], ['<=', ['get', 'ref_length'], 5], filter],
  layout: {
    'symbol-placement': 'line',
    'symbol-spacing': spacing,
    'icon-image': ['concat', 'shield:', shieldKind, ':', ['get', 'ref']],
    'icon-size': 0.82,
    'icon-rotation-alignment': 'viewport',
    'icon-padding': 5,
  },
});

// `tier` describes a level of place label: font, colour and size by zoom.
const TIERS = {
  1: { font: MEDIUM, color: C.label1, size: [4, 13, 8, 19, 9.5, 21, 13, 25], minzoom: 2.5 },
  2: { font: MEDIUM, color: C.label2, size: [5, 11.5, 8, 14.5, 9.5, 15.5, 13, 19], minzoom: 5.5 },
  3: { font: MEDIUM, color: C.label3, size: [7, 11.5, 9.5, 13, 13, 16], minzoom: 7 },
  4: { font: MEDIUM, color: C.label4, size: [7.5, 11.5, 9.5, 12.25, 13, 14.5], minzoom: 7.5 },
};

const placeText = (tier, extra = {}) => ({
  layout: {
    'text-font': tier.font,
    'text-size': lin(...tier.size),
    'text-max-width': 5.9,
    'text-line-height': 1.15,
    'text-padding': 2,
    ...extra,
  },
  paint: {
    'text-color': tier.color,
    'text-halo-color': C.halo,
    'text-halo-width': 1.6,
    'text-halo-blur': 0.2,
  },
});

function box([w, s, e, n]) {
  return { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] };
}

export function buildStyle({ glyphs, homeBounds }) {
  const outsideHome = ['!', ['within', box(homeBounds)]];

  // Real-world labels from the tiles. Cities, towns and villages inside the home
  // box are dropped so the custom labels in places.js stand in for them.
  const tilePlace = (id, tier, minzoom, filter, extra) => {
    const t = placeText(tier, { 'text-field': name, 'symbol-sort-key': ['get', 'rank'], ...extra });
    return { id, type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom, filter, layout: t.layout, paint: t.paint };
  };

  const myPlace = (n) => {
    const tier = TIERS[n];
    const t = placeText(tier, { 'text-field': ['get', 'name'] });
    return {
      id: `me-place-${n}`,
      type: 'symbol',
      source: 'me',
      minzoom: tier.minzoom,
      filter: ['all', ['==', ['get', 'kind'], 'place'], ['==', ['get', 'tier'], n]],
      layout: t.layout,
      paint: t.paint,
    };
  };

  const parkText = {
    layout: {
      'text-font': MEDIUM,
      'text-size': lin(8, 13.5, 13, 14.5),
      'text-max-width': 6.5,
      'text-line-height': 1.2,
      'text-padding': 3,
    },
    paint: { 'text-color': C.labelPark, 'text-halo-color': C.halo, 'text-halo-width': 1.2, 'text-halo-blur': 0.3 },
  };

  return {
    version: 8,
    glyphs,
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
      // Built-up areas (Natural Earth). Loaded after the map, see app.js.
      urban: { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, tolerance: 0.2 },
      // Military land around the home view; the tiles only carry it from z9 up.
      military: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      me: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': lin(10.5, C.land, 12.5, C.landCity) } },

      // ---- ground cover ---------------------------------------------------
      // Towns read as pale grey, then fields and woods are painted back over them,
      // which is what breaks the footprint into Google's speckled texture.
      { id: 'urban-footprint', type: 'fill', source: 'urban', paint: { 'fill-color': C.urban } },
      {
        id: 'farmland',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landcover',
        filter: isClass('farmland'),
        paint: { 'fill-color': C.farmland, 'fill-opacity': lin(10.5, 1, 12.5, 0) },
      },
      {
        id: 'urban',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landuse',
        filter: isClass('residential', 'suburb', 'neighbourhood', 'quarter', 'commercial', 'industrial', 'retail'),
        paint: { 'fill-color': C.urban },
      },
      {
        id: 'grass',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landcover',
        filter: isClass('grass', 'wetland'),
        paint: { 'fill-color': C.grass },
      },
      {
        id: 'green-landuse',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landuse',
        minzoom: 11,
        filter: isClass('cemetery', 'pitch', 'stadium', 'playground', 'garden', 'zoo'),
        paint: { 'fill-color': C.grass },
      },
      {
        id: 'wood',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landcover',
        filter: isClass('wood'),
        paint: { 'fill-color': C.wood },
      },
      // Protected land (state forests, refuges, parks) is the darkest green.
      {
        id: 'park',
        type: 'fill',
        source: 'omt',
        'source-layer': 'park',
        filter: [
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['has', 'class'], // z4 tiles carry unclassed, blocky generalisations
          ['!', isClass('conservation_district', 'historic_district', 'watercourse', 'marine', 'parkway_corridor', 'aboriginal_lands')],
        ],
        paint: { 'fill-color': C.park },
      },
      {
        id: 'sand',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landcover',
        minzoom: 9,
        filter: isClass('sand'),
        paint: { 'fill-color': C.sand },
      },
      {
        id: 'military',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landuse',
        filter: isClass('military'),
        paint: { 'fill-color': C.military },
      },
      { id: 'military-far', type: 'fill', source: 'military', maxzoom: 9, paint: { 'fill-color': C.military } },
      {
        id: 'airport',
        type: 'fill',
        source: 'omt',
        'source-layer': 'aeroway',
        minzoom: 9,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': C.airport },
      },

      // ---- water ----------------------------------------------------------
      {
        id: 'waterway',
        type: 'line',
        source: 'omt',
        'source-layer': 'waterway',
        minzoom: 7.5,
        filter: notTunnel,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': C.water, 'line-width': exp(8, 0.6, 12, 1.6, 16, 6) },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'omt',
        'source-layer': 'water',
        filter: notTunnel,
        paint: { 'fill-color': C.water },
      },

      // ---- borders --------------------------------------------------------
      {
        id: 'border-state',
        type: 'line',
        source: 'omt',
        'source-layer': 'boundary',
        minzoom: 3,
        filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
        paint: {
          'line-color': C.border,
          'line-width': lin(3, 0.5, 8, 0.9, 14, 1.4),
          'line-dasharray': [1.6, 2.2],
          'line-opacity': 0.85,
        },
      },
      {
        id: 'border-country',
        type: 'line',
        source: 'omt',
        'source-layer': 'boundary',
        filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
        layout: { 'line-join': 'round' },
        paint: { 'line-color': C.border, 'line-width': lin(1, 0.5, 6, 1, 12, 1.6) },
      },

      // ---- built ----------------------------------------------------------
      {
        id: 'building',
        type: 'fill',
        source: 'omt',
        'source-layer': 'building',
        minzoom: 14.5,
        paint: {
          'fill-color': C.building,
          'fill-outline-color': C.buildingEdge,
          'fill-opacity': lin(14.5, 0, 15.5, 1),
        },
      },
      {
        id: 'ferry',
        type: 'line',
        source: 'omt',
        'source-layer': 'transportation',
        minzoom: 8,
        filter: isClass('ferry'),
        paint: { 'line-color': C.borderWater, 'line-width': 0.9, 'line-dasharray': [3, 3], 'line-opacity': 0.7 },
      },
      {
        id: 'rail',
        type: 'line',
        source: 'omt',
        'source-layer': 'transportation',
        minzoom: 7.5,
        filter: ['all', isClass('rail'), notTunnel],
        paint: { 'line-color': C.rail, 'line-width': lin(8, 0.6, 13, 1, 17, 2.2) },
      },
      ...roadLayers(),

      // ---- labels (later layers win collisions) ---------------------------
      {
        id: 'label-water',
        type: 'symbol',
        source: 'omt',
        'source-layer': 'water_name',
        minzoom: 3,
        filter: ['==', ['geometry-type'], 'Point'],
        layout: {
          'text-field': name,
          'text-font': REGULAR,
          'text-size': ['match', ['get', 'class'], ['ocean', 'sea'], 14, 12],
          'text-letter-spacing': ['match', ['get', 'class'], ['ocean', 'sea'], 0.08, 0],
          'text-max-width': 6,
          'text-line-height': 1.2,
        },
        paint: {
          'text-color': C.labelWater,
          'text-halo-color': 'rgba(255,255,255,0.55)',
          'text-halo-width': 1,
        },
      },
      {
        id: 'label-road',
        type: 'symbol',
        source: 'omt',
        'source-layer': 'transportation_name',
        minzoom: 12.5,
        filter: ['has', 'name'],
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 320,
          'text-field': name,
          'text-font': REGULAR,
          'text-size': lin(13, 10.5, 16, 12.5),
          'text-letter-spacing': 0.02,
        },
        paint: { 'text-color': C.labelRoad, 'text-halo-color': C.halo, 'text-halo-width': 1.5 },
      },
      // Numbered state routes only: lettered refs (toll-road abbreviations) are skipped.
      shieldLayer('shield-other', 7.9, [
        'all',
        ['!', ['match', ['get', 'network'], ['us-interstate', 'us-highway'], true, false]],
        ['>', ['to-number', ['get', 'ref'], 0], 0],
      ], 700),
      shieldLayer('shield-us', 7, ['==', ['get', 'network'], 'us-highway'], 600),
      shieldLayer('shield-interstate', 5.5, ['==', ['get', 'network'], 'us-interstate'], 420),

      {
        id: 'label-park',
        type: 'symbol',
        source: 'omt',
        'source-layer': 'park',
        minzoom: 8.5,
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['<=', ['get', 'rank'], 2], outsideHome],
        layout: { ...parkText.layout, 'text-field': name },
        paint: parkText.paint,
      },
      tilePlace('place-hood', { font: REGULAR, color: C.labelMinor, size: [11.5, 11, 15, 13] }, 11.5,
        isClass('suburb', 'quarter', 'neighbourhood')),
      tilePlace('place-village', { font: REGULAR, color: C.label4, size: [10, 11.5, 14, 13.5] }, 10,
        ['all', isClass('village'), outsideHome]),
      tilePlace('place-town', TIERS[4], 7.5, ['all', isClass('town'), outsideHome]),
      tilePlace('place-city-small', TIERS[3], 7, ['all', isClass('city'), ['>=', ['get', 'rank'], 9], outsideHome]),
      tilePlace('place-city', TIERS[2], 5.5,
        ['all', isClass('city'), ['>=', ['get', 'rank'], 4], ['<', ['get', 'rank'], 9], outsideHome]),
      tilePlace('place-city-major', TIERS[1], 2.5, ['all', isClass('city'), ['<', ['get', 'rank'], 4], outsideHome]),
      {
        ...tilePlace('place-state', { font: REGULAR, color: C.labelMinor, size: [3, 10, 7, 12.5] }, 3.5, isClass('state'),
          { 'text-transform': 'uppercase', 'text-letter-spacing': 0.12 }),
        maxzoom: 7.2,
      },
      {
        ...tilePlace('place-country', { font: MEDIUM, color: C.label2, size: [1, 11, 5, 15] }, 1, isClass('country')),
        maxzoom: 6.5,
      },

      // ---- yours ----------------------------------------------------------
      {
        id: 'me-park',
        type: 'symbol',
        source: 'me',
        minzoom: 7.5,
        filter: ['==', ['get', 'kind'], 'park'],
        layout: {
          ...parkText.layout,
          'text-field': ['get', 'name'],
          'text-justify': ['coalesce', ['get', 'align'], 'center'],
          'text-anchor': ['coalesce', ['get', 'align'], 'center'],
        },
        paint: parkText.paint,
      },
      myPlace(4),
      myPlace(3),
      myPlace(2),
      myPlace(1),
    ],
  };
}
