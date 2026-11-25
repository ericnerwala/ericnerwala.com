// Great-circle helpers for the Shandong → Philadelphia route.
// Longitudes are unwrapped so the line crosses the Pacific, then split at ±180
// so the map does not draw the long way across Asia.

function vec(lng, lat) {
  const λ = (lng * Math.PI) / 180;
  const φ = (lat * Math.PI) / 180;
  return [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)];
}

function slerp(a, b, t) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.min(1, Math.max(-1, dot));
  const th = Math.acos(dot);
  if (th < 1e-5) return a.map((v, i) => v * (1 - t) + b[i] * t);
  const s = Math.sin(th);
  const w1 = Math.sin((1 - t) * th) / s;
  const w2 = Math.sin(t * th) / s;
  return a.map((v, i) => v * w1 + b[i] * w2);
}

export function greatCircle(a, b, n = 72) {
  const va = vec(a[0], a[1]);
  const vb = vec(b[0], b[1]);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const v = slerp(va, vb, i / n);
    out.push([
      (Math.atan2(v[1], v[0]) * 180) / Math.PI,
      (Math.atan2(v[2], Math.hypot(v[0], v[1])) * 180) / Math.PI,
    ]);
  }
  return out;
}

// Continuous longitudes, each step the short way from the previous point.
export function unwrap(coords) {
  const out = [[coords[0][0], coords[0][1]]];
  for (let i = 1; i < coords.length; i++) {
    let lng = coords[i][0];
    const prev = out[i - 1][0];
    while (lng - prev > 180) lng -= 360;
    while (prev - lng > 180) lng += 360;
    out.push([lng, coords[i][1]]);
  }
  return out;
}

export function routeLine(stops) {
  const raw = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const seg = greatCircle(stops[i], stops[i + 1], 80);
    if (i) seg.shift();
    raw.push(...seg);
  }
  return unwrap(raw);
}

export function wrapLng(lng) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

// MultiLineString in wrapped degrees, broken on the antimeridian.
export function toMultiLine(unwrapped) {
  const parts = [];
  let cur = [];
  let prevBand = null;
  for (const [lng, lat] of unwrapped) {
    const band = Math.floor((lng + 180) / 360);
    const wrapped = lng - band * 360;
    if (prevBand != null && band !== prevBand && cur.length) {
      const edge = band > prevBand ? 180 : -180;
      cur.push([edge, lat]);
      parts.push(cur);
      cur = [[-edge, lat]];
    }
    cur.push([wrapped, lat]);
    prevBand = band;
  }
  if (cur.length > 1) parts.push(cur);
  return parts;
}

export function bearing(a, b) {
  const φ1 = (a[1] * Math.PI) / 180;
  const φ2 = (b[1] * Math.PI) / 180;
  const Δλ = ((b[0] - a[0]) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Camera that frames an unwrapped route (Pacific crossing included).
export function routeCamera(unwrapped, width, height, pad) {
  const lngs = unwrapped.map((p) => p[0]);
  const lats = unwrapped.map((p) => p[1]);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  let cLng = (west + east) / 2;
  const cLat = (south + north) / 2;
  cLng = wrapLng(cLng);
  const span = Math.max(east - west, 30);
  const latSpan = Math.max((north - south) * 1.3, 20);
  const w = Math.max(160, width - pad.left - pad.right);
  const h = Math.max(160, height - pad.top - pad.bottom);
  const zLng = Math.log2((w * 360) / (span * 512));
  const zLat = Math.log2((h * 170) / (latSpan * 512));
  return { center: [cLng, cLat], zoom: Math.min(zLng, zLat) - 0.35 };
}
