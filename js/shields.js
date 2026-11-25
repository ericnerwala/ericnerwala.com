// Route shields, drawn on demand. The style asks for an image called
// "shield:<kind>:<ref>" and this draws it the first time it is needed.
//   i  = US interstate (blue, red crown)
//   us = US highway (white shield)
//   st = US state route (white circle / oval)
//   rd = anything else (white rounded rectangle)

const SCALE = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));
const PAD = 1.5; // room for the outline

const INK = '#1f1f1f';
const OUTLINE = '#4a4d51';
const BLUE = '#3f6fba';
const RED = '#e04a40';

function interstatePath(w, h) {
  const p = new Path2D();
  const r = 2.6;
  p.moveTo(r, 0);
  p.lineTo(w - r, 0);
  p.quadraticCurveTo(w, 0, w, r);
  p.lineTo(w, h * 0.46);
  p.bezierCurveTo(w, h * 0.76, w * 0.74, h * 0.92, w * 0.5, h);
  p.bezierCurveTo(w * 0.26, h * 0.92, 0, h * 0.76, 0, h * 0.46);
  p.lineTo(0, r);
  p.quadraticCurveTo(0, 0, r, 0);
  p.closePath();
  return p;
}

function usPath(w, h) {
  const p = new Path2D();
  const m = w / 2;
  p.moveTo(m, 1.3);
  p.quadraticCurveTo(w * 0.74, 2.3, w - 3.3, 0.2);
  p.quadraticCurveTo(w - 1.5, 1.4, w - 0.2, 3.5);
  p.bezierCurveTo(w - 2.3, 6.6, w + 0.5, 10.4, w - 1.1, 13.2);
  p.bezierCurveTo(w - 2.6, 16, w * 0.7, 16.5, m, h);
  p.bezierCurveTo(w * 0.3, 16.5, 2.6, 16, 1.1, 13.2);
  p.bezierCurveTo(-0.5, 10.4, 2.3, 6.6, 0.2, 3.5);
  p.quadraticCurveTo(1.5, 1.4, 3.3, 0.2);
  p.quadraticCurveTo(w * 0.26, 2.3, m, 1.3);
  p.closePath();
  return p;
}

function roundRectPath(w, h, r) {
  const p = new Path2D();
  p.moveTo(r, 0);
  p.arcTo(w, 0, w, h, r);
  p.arcTo(w, h, 0, h, r);
  p.arcTo(0, h, 0, 0, r);
  p.arcTo(0, 0, w, 0, r);
  p.closePath();
  return p;
}

function draw(kind, ref) {
  const n = ref.length;
  const measure = document.createElement('canvas').getContext('2d');

  let w;
  let h;
  let font;
  let textY;
  if (kind === 'i') {
    w = n <= 2 ? 19 : n === 3 ? 23 : 27;
    h = 20;
    font = `700 ${n <= 2 ? 10.5 : 10}px Roboto, Arial, sans-serif`;
    textY = 15.1;
  } else if (kind === 'us') {
    w = n <= 2 ? 19 : n === 3 ? 22 : 26;
    h = 19;
    font = `500 ${n <= 2 ? 10.5 : 9.75}px Roboto, Arial, sans-serif`;
    textY = 12.9;
  } else {
    font = '500 10.25px Roboto, Arial, sans-serif';
    measure.font = font;
    const tw = measure.measureText(ref).width;
    h = 18;
    w = kind === 'st' ? Math.max(18, Math.ceil(tw + 9)) : Math.max(18, Math.ceil(tw + 8));
    textY = 12.7;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((w + PAD * 2) * SCALE);
  canvas.height = Math.ceil((h + PAD * 2) * SCALE);
  const g = canvas.getContext('2d');
  g.scale(SCALE, SCALE);
  g.translate(PAD, PAD);
  g.lineJoin = 'round';

  if (kind === 'i') {
    const p = interstatePath(w, h);
    g.strokeStyle = '#fff';
    g.lineWidth = 2.2;
    g.stroke(p);
    g.fillStyle = BLUE;
    g.fill(p);
    g.save();
    g.clip(p);
    g.fillStyle = RED;
    g.fillRect(-1, -1, w + 2, h * 0.27 + 1);
    g.restore();
    g.fillStyle = '#fff';
  } else {
    const p =
      kind === 'us'
        ? usPath(w, h)
        : kind === 'st'
          ? roundRectPath(w, h, h / 2)
          : roundRectPath(w, h, 3.5);
    g.fillStyle = '#fff';
    g.fill(p);
    g.strokeStyle = OUTLINE;
    g.lineWidth = 1;
    g.stroke(p);
    g.fillStyle = INK;
  }

  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillText(ref, w / 2, textY);

  return g.getImageData(0, 0, canvas.width, canvas.height);
}

export function installShields(map) {
  map.on('styleimagemissing', (e) => {
    const m = /^shield:(i|us|st|rd):(.+)$/.exec(e.id);
    if (!m || map.hasImage(e.id)) return;
    map.addImage(e.id, draw(m[1], m[2]), { pixelRatio: SCALE });
  });
}
