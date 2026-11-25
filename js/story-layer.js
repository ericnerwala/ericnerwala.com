import { CARDS, CAT_COLOR, PINS, ROUTE, STORIES, storyById } from './stories.js?v=nav4';
import { bearing, routeCamera, routeLine, toMultiLine, wrapLng } from './route-geom.js';

const $ = (sel) => document.querySelector(sel);
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const EMPTY = { type: 'FeatureCollection', features: [] };

export function mountStories(map, { touch, home, toMapZoom }) {
  const pins = PINS.map((pin) => ({ ...pin, el: null, marker: null }));
  const byId = Object.fromEntries(pins.map((p) => [p.id, p]));
  let active = null;
  let openId = null;
  let flight = 0;
  let line = [];
  let routeReady = false;

  const planeEl = document.createElement('div');
  planeEl.className = 'plane';
  planeEl.hidden = true;
  planeEl.innerHTML = `<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6 20.2 21 12 16.6 3.8 21z" fill="#1a73e8" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg></span>`;
  const plane = new maplibregl.Marker({ element: planeEl, anchor: 'center' }).setLngLat(home.center).addTo(map);

  for (const pin of pins) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = pin.cluster ? 'pin pin-pulse' : 'pin';
    el.setAttribute('aria-label', pin.label);
    el.title = pin.label;
    el.hidden = true;
    const mark = document.createElement('span');
    mark.className = 'pin-mark';
    const name = document.createElement('span');
    name.className = 'pin-name';
    name.textContent = pin.short || pin.label;
    el.append(mark, name);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (pin.cluster) openIndex();
      else openFromPin(pin);
    });
    const marker = new maplibregl.Marker({ element: el, anchor: 'left' }).setLngLat(pin.at).addTo(map);
    pin.el = el;
    pin.marker = marker;
  }

  const onLoad = () => {
    if (map.getSource('route')) return;
    map.addSource('route', { type: 'geojson', data: EMPTY });
    const casing = {
      id: 'route-casing',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ffffff', 'line-width': 6.5, 'line-opacity': 0.9 },
    };
    const ink = {
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#1a73e8', 'line-width': 3.5 },
    };
    const before = map.getLayer('label-water') ? 'label-water' : undefined;
    map.addLayer(casing, before);
    map.addLayer(ink, before);
    routeReady = true;
    line = routeLine(ROUTE.map((id) => byId[id].at));
    sync();
  };
  if (map.loaded()) onLoad();
  else map.on('load', onLoad);

  map.on('zoom', sync);
  map.on('movestart', (e) => {
    if (!e.originalEvent || !flight) return;
    cancelAnimationFrame(flight);
    flight = 0;
    drawLine(line);
    hidePlane();
  });

  $('#story-close').addEventListener('click', closePanel);
  $('#story-back').addEventListener('click', openIndex);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  for (const chip of document.querySelectorAll('.chip[data-cat]')) {
    chip.addEventListener('click', () => setChip(chip.dataset.cat));
  }
  $('#saved')?.addEventListener('click', openIndex);
  $('#recent-philly')?.addEventListener('click', openIndex);
  $('.omnibox-directions')?.addEventListener('click', () => setChip('route', { replay: true }));

  const input = $('#q');
  const suggest = $('#suggest');
  input?.addEventListener('input', () => renderSuggest(input.value));
  input?.form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const first = suggest.querySelector('button');
    if (first && !suggest.hidden) first.click();
  });
  input?.addEventListener('blur', () => {
    setTimeout(() => {
      suggest.hidden = true;
    }, 150);
  });

  function pad() {
    const card = !$('#story').hidden;
    const row = !$('#results')?.hidden;
    const narrow = window.innerWidth <= 760;
    if (narrow) {
      return {
        top: 112,
        left: 12,
        right: 12,
        bottom: card ? Math.round(window.innerHeight * 0.46) : row ? 196 : 88,
      };
    }
    // Padding is inside the map, and the map already starts at the rail.
    return {
      top: 100,
      left: card ? 424 : 24,
      right: 56,
      bottom: row ? 228 : 84,
    };
  }

  function shouldShow(pin) {
    const z = map.getZoom();
    if (active) return !pin.cluster && pin.cats.includes(active);
    if (pin.cluster) return z < 11;
    if (pin.country) return z < 3.5;
    if (pin.local && z >= 11) return true;
    if (pin.routeStop && z < 6) return true;
    return false;
  }

  function sync() {
    const z = map.getZoom();
    const low = z < 4.6;
    for (const pin of pins) {
      const show = shouldShow(pin);
      if (!show) {
        pin.el.hidden = true;
        continue;
      }
      const first = pin.el.hidden && !pin.el.dataset.in;
      pin.el.hidden = false;
      if (first) {
        pin.el.dataset.in = '1';
        requestAnimationFrame(() => pin.el.classList.add('shown'));
      } else {
        pin.el.classList.add('shown');
      }
      let nudge = low && pin.offset ? pin.offset : [0, 0];
      if (low && pin.id === 'cambridge') nudge = [10, -28];
      if (low && pin.id === 'london') nudge = [-20, 16];
      if (low && pin.id === 'amsterdam') nudge = [26, 2];
      if (active === 'movement' && pin.id === 'sauna') nudge = [18, -24];
      pin.marker.setOffset([nudge[0] - 11, nudge[1]]);
      const cat = (active && pin.cats.includes(active) && active) || pin.cats[0] || 'curiosity';
      pin.el.style.setProperty('--pin', CAT_COLOR[cat] || '#1a73e8');
    }
  }

  function paintChips() {
    for (const b of document.querySelectorAll('.chip[data-cat]')) {
      const on = b.dataset.cat === active;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function cardFor(pinId, cat = active) {
    return (CARDS[cat] || []).find((c) => c.pin === pinId) || null;
  }

  function storyFor(pin) {
    return cardFor(pin.id)?.story || pin.story;
  }

  function markSelected(id) {
    for (const pin of pins) pin.el.classList.toggle('is-on', pin.id === id);
    for (const card of document.querySelectorAll('#results .result')) {
      card.classList.toggle('is-on', card.dataset.pin === id);
    }
  }

  function drawLine(pts) {
    if (!routeReady) return;
    const parts = pts.length > 1 ? toMultiLine(pts) : [];
    map.getSource('route').setData(
      parts.length
        ? { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: parts } }
        : EMPTY,
    );
  }

  function clearLine() {
    cancelAnimationFrame(flight);
    flight = 0;
    drawLine([]);
    hidePlane();
  }

  function hidePlane() {
    planeEl.hidden = true;
  }

  function showPlane(at, deg) {
    planeEl.hidden = false;
    plane.setLngLat([wrapLng(at[0]), at[1]]);
    planeEl.firstElementChild.style.transform = `rotate(${deg}deg)`;
  }

  function playRoute() {
    cancelAnimationFrame(flight);
    if (!line.length) return;
    if (reduce) {
      drawLine(line);
      return;
    }
    const t0 = performance.now();
    const dur = 7000;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
      const n = Math.max(2, Math.round(e * (line.length - 1)) + 1);
      const slice = line.slice(0, n);
      drawLine(slice);
      const a = slice[n - 2] || slice[0];
      const b = slice[n - 1];
      showPlane(b, bearing(a, b));
      if (t < 1) flight = requestAnimationFrame(step);
      else {
        flight = 0;
        hidePlane();
      }
    };
    flight = requestAnimationFrame(step);
  }

  function frameRoute() {
    if (!line.length || !map.loaded()) return;
    touch();
    const cam = routeCamera(line, map.getContainer().clientWidth, map.getContainer().clientHeight, pad());
    map.easeTo({ center: cam.center, zoom: Math.max(map.getMinZoom(), cam.zoom), padding: pad(), duration: reduce ? 0 : 1000 });
  }

  function framePins(list) {
    if (!list.length || !map.getCenter) return;
    touch();
    const dur = reduce ? 0 : 850;
    const padding = pad();
    if (list.length === 1) {
      map.easeTo({
        center: list[0].at,
        zoom: toMapZoom(list[0].zoom || 14),
        padding,
        duration: dur,
      });
      return;
    }
    const lons = list.map((p) => p.at[0]);
    const width = Math.max(...lons) - Math.min(...lons);
    if (width > 80) {
      map.easeTo({
        center: [8, 16],
        zoom: 1.05,
        padding: { top: padding.top, left: padding.left, right: Math.max(padding.right, 250), bottom: padding.bottom },
        duration: dur,
      });
      return;
    }
    const b = new maplibregl.LngLatBounds(list[0].at, list[0].at);
    for (const p of list) b.extend(p.at);
    map.fitBounds(b, { padding, duration: dur, maxZoom: 13.2 });
  }

  function easeHome() {
    touch();
    map.easeTo({
      center: home.center,
      zoom: toMapZoom(home.zoom),
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      duration: reduce ? 0 : 800,
    });
  }

  function setChip(id, { replay = false } = {}) {
    // `load` fires once. Tile and glyph fetches later make isStyleLoaded() flap,
    // and a second `load` never comes, so don't defer on that.
    if (!routeReady) {
      map.once('load', () => setChip(id, { replay }));
      return;
    }
    if (active === id && !replay) {
      dismiss({ fly: true });
      return;
    }
    active = id;
    paintChips();
    closePanel({ immediate: true });
    renderResults();
    sync();
    if (id === 'route') {
      frameRoute();
      playRoute();
    } else {
      clearLine();
      framePins(pins.filter((p) => p.cats.includes(id)));
    }
  }

  function dismiss({ fly = false, hold = false } = {}) {
    active = null;
    paintChips();
    renderResults();
    clearLine();
    closePanel({ immediate: true });
    if (fly) {
      easeHome();
      map.once('moveend', sync);
    } else if (!hold) sync();
  }

  let panelGen = 0;

  function openPanel() {
    const gen = ++panelGen;
    const panel = $('#story');
    panel.hidden = false;
    $('#results')?.classList.add('panel-open');
    requestAnimationFrame(() => {
      if (panelGen === gen) panel.classList.add('open');
    });
  }

  function closePanel({ immediate = false } = {}) {
    const panel = $('#story');
    const gen = ++panelGen;
    openId = null;
    markSelected(null);
    $('#results')?.classList.remove('panel-open');
    panel.classList.remove('open');
    if (immediate || reduce) {
      panel.hidden = true;
      return;
    }
    if (panel.hidden) return;
    setTimeout(() => {
      if (panelGen === gen) panel.hidden = true;
    }, 260);
  }

  function ensureVisible(pin) {
    const p = map.project(pin.at);
    const box = pad();
    const w = map.getContainer().clientWidth;
    const h = map.getContainer().clientHeight;
    const inside = p.x > box.left + 24 && p.x < w - box.right - 24 && p.y > box.top + 24 && p.y < h - box.bottom - 24;
    if (inside) return;
    touch();
    map.easeTo({
      center: pin.at,
      zoom: Math.max(map.getZoom(), toMapZoom(pin.zoom || 12)),
      padding: box,
      duration: reduce ? 0 : 700,
    });
  }

  function renderSuggest(raw) {
    const q = raw.trim().toLowerCase();
    suggest.innerHTML = '';
    if (q.length < 1) {
      suggest.hidden = true;
      return;
    }
    const hits = [];
    for (const s of STORIES) {
      const hay = [s.title, s.kicker, s.line, ...(s.paragraphs || []), ...(s.notes || []), ...(s.books || []).flatMap((b) => [b.title, b.note])]
        .join(' ')
        .toLowerCase();
      if (q.split(/\s+/).every((w) => hay.includes(w))) hits.push({ label: s.title, hint: s.kicker, run: () => openStory(s.id) });
    }
    for (const pin of pins) {
      if (pin.cluster) continue;
      if (pin.label.toLowerCase().includes(q) && !hits.some((h) => h.label === pin.label)) {
        hits.push({ label: pin.label, hint: pin.cats[0] || '', run: () => focusPin(pin.id) });
      }
    }
    if (!hits.length) {
      const empty = document.createElement('p');
      empty.className = 'suggest-empty';
      empty.textContent = 'No place on this map for that.';
      suggest.append(empty);
      suggest.hidden = false;
      return;
    }
    for (const hit of hits.slice(0, 6)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<strong></strong><span></span>`;
      b.querySelector('strong').textContent = hit.label;
      b.querySelector('span').textContent = hit.hint;
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        suggest.hidden = true;
        input.value = '';
        hit.run();
      });
      suggest.append(b);
    }
    suggest.hidden = false;
  }

  function fillHead(kicker, title, place) {
    $('#story-kicker').textContent = kicker || '';
    $('#story-title').textContent = title || '';
    const where = $('#story-place');
    where.hidden = !place;
    where.textContent = place || '';
  }

  function flyTo(pin) {
    if (!pin) return;
    touch();
    map.easeTo({
      center: pin.at,
      zoom: toMapZoom(pin.zoom || 12),
      padding: pad(),
      duration: reduce ? 0 : 900,
    });
  }

  function renderResults() {
    const row = $('#results');
    if (!row) return;
    row.innerHTML = '';
    const list = active ? CARDS[active] : null;
    if (!list?.length) {
      row.hidden = true;
      row.classList.remove('panel-open');
      return;
    }
    row.hidden = false;
    row.style.setProperty('--pin', CAT_COLOR[active] || '#1a73e8');
    for (const item of list) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'result';
      b.dataset.pin = item.pin;
      const img = document.createElement('img');
      img.src = `./assets/cards/${item.pin}.jpg`;
      img.alt = '';
      const strong = document.createElement('strong');
      strong.textContent = item.title;
      const span = document.createElement('span');
      span.textContent = item.line;
      b.append(img, strong, span);
      b.addEventListener('click', () => openCard(item));
      row.append(b);
    }
  }

  function openCard(item) {
    const pin = byId[item.pin];
    if (!pin) return;
    openStory(item.story, pin.id, item);
    flyTo(pin);
    document
      .querySelector(`#results .result[data-pin="${item.pin}"]`)
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }

  function openFromPin(pin) {
    const item = cardFor(pin.id);
    if (item) openCard(item);
    else {
      openStory(storyFor(pin), pin.id);
      flyTo(pin);
    }
  }

  function openIndex() {
    openId = 'index';
    $('#story-back').hidden = true;
    fillHead('Eric', 'Places', '');
    const body = $('#story-body');
    body.innerHTML = '';
    for (const s of STORIES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'story-row';
      const strong = document.createElement('strong');
      strong.textContent = s.title;
      const em = document.createElement('em');
      em.textContent = s.kicker;
      b.append(strong, em);
      b.addEventListener('click', () => openStory(s.id));
      body.append(b);
    }
    markSelected('cluster');
    openPanel();
  }

  function openStory(id, pinId, card) {
    const story = storyById[id];
    if (!story) return;
    openId = id;
    $('#story-back').hidden = false;
    const pin = pinId ? byId[pinId] : null;
    fillHead(story.kicker, card?.title || story.title, card?.place || (pin && pin.label !== story.title ? pin.label : ''));
    const body = $('#story-body');
    body.innerHTML = '';
    for (const text of story.paragraphs || []) {
      const p = document.createElement('p');
      p.textContent = text;
      body.append(p);
    }
    if (story.books) {
      const ul = document.createElement('ul');
      ul.className = 'story-books';
      for (const book of story.books) {
        const li = document.createElement('li');
        const cite = document.createElement('cite');
        cite.textContent = book.title;
        li.append(cite, document.createTextNode(` ${book.note}`));
        ul.append(li);
      }
      body.append(ul);
    }
    if (story.places?.length) {
      const row = document.createElement('div');
      row.className = 'story-places';
      for (const place of story.places) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'story-jump';
        b.textContent = place.label;
        if (place.pin === pinId) b.classList.add('is-on');
        b.addEventListener('click', () => focusPin(place.pin, id));
        row.append(b);
      }
      body.append(row);
    }
    if (id === 'walked' && !card) {
      const row = document.createElement('div');
      row.className = 'story-places';
      for (const c of pins.filter((p) => p.country)) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'story-jump';
        b.textContent = c.label;
        if (c.id === pinId) b.classList.add('is-on');
        b.addEventListener('click', () => focusPin(c.id, 'walked'));
        row.append(b);
      }
      body.append(row);
    }
    if (id === 'roots') {
      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'story-action';
      play.textContent = 'Play the route';
      play.addEventListener('click', () => setChip('route', { replay: true }));
      body.append(play);
    }
    if (story.notes?.length) {
      const ul = document.createElement('ul');
      ul.className = 'story-notes';
      for (const note of story.notes) {
        const li = document.createElement('li');
        li.textContent = note;
        ul.append(li);
      }
      body.append(ul);
    }
    if (id === 'roots') {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'story-text-link';
      more.textContent = 'The difficulty is the good part';
      more.addEventListener('click', () => openStory('discomfort'));
      body.append(more);
    }
    markSelected(pinId || null);
    openPanel();
    body.scrollTop = 0;
  }

  function focusPin(id) {
    const pin = byId[id];
    if (!pin) return;
    const cat = active && pin.cats.includes(active) ? active : pin.cats[0];
    if (cat && active !== cat) {
      active = cat;
      paintChips();
      renderResults();
      if (cat === 'route') {
        if (!flight) drawLine(line);
      } else clearLine();
      sync();
    }
    const item = cardFor(id, cat);
    if (item) openCard(item);
    else {
      openStory(pin.story, id);
      flyTo(pin);
    }
  }

  sync();

  return { openIndex, dismiss, setChip, sync };
}
