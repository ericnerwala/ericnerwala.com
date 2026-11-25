import { HOME, PLACES, PARKS, YOU } from './places.js';
import { buildStyle } from './map-style.js';
import { installShields } from './shields.js';
import { mountStories } from './story-layer.js?v=nav4';

const $ = (sel) => document.querySelector(sel);

// Google counts zoom on 256px tiles, MapLibre on 512px tiles: one level apart.
const toMapZoom = (googleZoom) => googleZoom - 1;
const toGoogleZoom = (mapZoom) => mapZoom + 1;

// ---- view from the URL, Google style: #@39.91,-74.875,9.37z -----------------
function viewFromHash() {
  const m = /^#@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)z$/.exec(location.hash);
  if (!m) return null;
  const [lat, lng, zoom] = m.slice(1).map(Number);
  if (Math.abs(lat) > 85 || Math.abs(lng) > 180) return null;
  return { center: [lng, lat], zoom };
}

// ---- glyphs: Latin ranges ship with the site, the rest come from VersaTiles --
const LOCAL_RANGES = new Set(['0-255', '256-511', '8192-8447']);
const glyphs = `${new URL('assets/glyphs/', document.baseURI).href}{fontstack}/{range}.pbf`;

function transformRequest(url, type) {
  if (type !== 'Glyphs') return undefined;
  const m = /\/glyphs\/([^/]+)\/(\d+-\d+)\.pbf$/.exec(url);
  if (!m || LOCAL_RANGES.has(m[2])) return undefined;
  const stack = decodeURIComponent(m[1]).toLowerCase().replace(/ /g, '_');
  return { url: `https://tiles.versatiles.org/assets/glyphs/${stack}/${m[2]}.pbf` };
}

function myFeatures() {
  const point = (p, props) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: p.at },
    properties: { name: p.name, ...props },
  });
  return {
    type: 'FeatureCollection',
    features: [
      ...PLACES.map((p) => point(p, { kind: 'place', tier: p.tier ?? 4 })),
      ...PARKS.map((p) => point(p, { kind: 'park', align: p.align ?? 'center' })),
    ],
  };
}

function dot(className, html = '') {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = html;
  return el;
}

// ---- scale bar ---------------------------------------------------------------
const FEET = [5, 10, 20, 50, 100, 200, 500, 1000, 2000];
const MILES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
const MAX_BAR = 110;

function updateScale(map) {
  const { lat } = map.getCenter();
  const metersPerPx = (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (512 * 2 ** map.getZoom());
  const steps = [
    ...FEET.map((n) => ({ label: `${n} ft`, meters: n * 0.3048 })),
    ...MILES.map((n) => ({ label: `${n.toLocaleString('en-US')} mi`, meters: n * 1609.344 })),
  ];
  let pick = steps[0];
  for (const s of steps) if (s.meters / metersPerPx <= MAX_BAR) pick = s;
  $('#scale-label').textContent = pick.label;
  $('#scale-bar').style.width = `${Math.round(pick.meters / metersPerPx)}px`;
}

// ---- category chips: arrows appear only when there is more to scroll ----------
function initChips() {
  const scroller = $('.chips-scroll');
  const prev = $('.chips-prev');
  const next = $('.chips-next');
  const sync = () => {
    const max = scroller.scrollWidth - scroller.clientWidth;
    prev.hidden = scroller.scrollLeft < 4;
    next.hidden = scroller.scrollLeft > max - 4;
  };
  const step = (dir) => scroller.scrollBy({ left: dir * Math.max(160, scroller.clientWidth * 0.6), behavior: 'smooth' });
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  scroller.addEventListener('scroll', sync, { passive: true });
  new ResizeObserver(sync).observe(scroller);
  sync();
}

async function fontsReady() {
  if (!document.fonts?.load) return;
  const load = Promise.all(['500 10px Roboto', '700 10px Roboto'].map((f) => document.fonts.load(f)));
  await Promise.race([load, new Promise((r) => setTimeout(r, 1500))]);
}

async function init() {
  initChips();
  $('#year').textContent = new Date().getFullYear();
  await fontsReady(); // shields are drawn with Roboto, so wait for it (briefly)

  const start = viewFromHash() ?? HOME;
  const map = new maplibregl.Map({
    container: 'map',
    style: buildStyle({ glyphs, homeBounds: HOME.bounds }),
    center: start.center,
    zoom: toMapZoom(start.zoom),
    minZoom: 1.5,
    maxZoom: 18.5,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    fadeDuration: 180,
    validateStyle: false,
    transformRequest,
  });
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  installShields(map);
  window.__map = map; // handy in devtools

  map.on('load', () => {
    map.getSource('me').setData(myFeatures());
    map.getSource('urban').setData(new URL('assets/urban.json', document.baseURI).href);
    map.getSource('military').setData(new URL('assets/military.json', document.baseURI).href);
    document.body.classList.add('map-ready');
  });

  // The URL only starts tracking the view once the visitor has moved the map.
  let touched = Boolean(viewFromHash());
  const touch = () => {
    touched = true;
  };
  const stories = mountStories(map, { touch, home: HOME, toMapZoom });

  const you = dot('you', '<i></i>');
  you.setAttribute('role', 'button');
  you.tabIndex = 0;
  you.setAttribute('aria-label', 'About Eric');
  you.addEventListener('click', () => stories.openIndex());
  you.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    stories.openIndex();
  });
  new maplibregl.Marker({ element: you }).setLngLat(YOU.at).addTo(map);

  // controls
  $('#zoom-in').addEventListener('click', () => {
    touch();
    map.zoomIn({ duration: 280 });
  });
  $('#zoom-out').addEventListener('click', () => {
    touch();
    map.zoomOut({ duration: 280 });
  });
  $('#locate').addEventListener('click', () => {
    stories.dismiss({ hold: true });
    touched = false;
    history.replaceState(null, '', location.pathname + location.search);
    map.easeTo({ center: HOME.center, zoom: toMapZoom(HOME.zoom), duration: 900 });
    map.once('moveend', () => stories.sync());
  });

  const syncControls = () => {
    updateScale(map);
    $('#zoom-in').disabled = map.getZoom() >= map.getMaxZoom() - 0.01;
    $('#zoom-out').disabled = map.getZoom() <= map.getMinZoom() + 0.01;
  };
  map.on('move', syncControls);
  syncControls();

  map.on('movestart', (e) => {
    if (e.originalEvent) touch();
  });
  map.on('moveend', () => {
    if (!touched) return;
    const c = map.getCenter();
    const hash = `#@${c.lat.toFixed(7)},${c.lng.toFixed(7)},${toGoogleZoom(map.getZoom()).toFixed(2)}z`;
    history.replaceState(null, '', hash);
  });
  window.addEventListener('hashchange', () => {
    const v = viewFromHash();
    if (v) map.jumpTo({ center: v.center, zoom: toMapZoom(v.zoom) });
  });
}

init();
