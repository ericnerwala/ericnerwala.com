/**
 * Late-Night Mirror Scene — 2.5D WebGL Depth-Parallax + Interactive Condensation
 *
 * Architecture:
 *  - #gl-scene (WebGL): Renders the 16:9 anime artwork through a calibrated
 *    3-plane spatial depth map (foreground boy shoulder/head, midground wall/frame,
 *    recessed mirror interior), live interactive mirror-mist wiping texture,
 *    subtle 35mm tungsten halation, lens chromatic aberration, and film grain.
 *  - #fx-scene (2D Canvas): Synchronized crisp particle FX locked to exact
 *    calibrated quads — rain streaks & droplets inside the reflected night window,
 *    twinkling distant city bokeh, volumetric wall-sconce light cone & warm dust motes,
 *    and subtle lamp warmth pulsing.
 */
(() => {
  const glCanvas = document.getElementById("gl-scene");
  const fxCanvas = document.getElementById("fx-scene");
  if (!glCanvas || !fxCanvas) return;

  const fxCtx = fxCanvas.getContext("2d");
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const img = new Image();
  img.src = "./assets/mirror-boy-lofi.jpg";

  // -------------------------------------------------------------------------
  // Calibrated Normalized Scene Coordinates (measured on 1280x720 artwork)
  // -------------------------------------------------------------------------
  const MIRROR_QUAD = [
    { x: 0.376, y: 0.197 }, // TL
    { x: 0.892, y: 0.156 }, // TR
    { x: 0.893, y: 0.774 }, // BR
    { x: 0.376, y: 0.733 }, // BL
  ];

  const WINDOW_PANES = [
    [
      { x: 0.696, y: 0.220 },
      { x: 0.802, y: 0.214 },
      { x: 0.802, y: 0.435 }, // stops cleanly above the reflected brass desk lamp shade
      { x: 0.734, y: 0.440 },
      { x: 0.728, y: 0.505 },
      { x: 0.696, y: 0.505 },
    ],
    [
      { x: 0.812, y: 0.213 },
      { x: 0.891, y: 0.208 },
      { x: 0.891, y: 0.525 },
      { x: 0.812, y: 0.528 },
    ],
  ];

  const SCONCE = { x: 0.583, y: 0.098 };
  const DESK_LAMP = { x: 0.766, y: 0.506 };

  // -------------------------------------------------------------------------
  // Offscreen Calibrated Depth Map (1024x576, smooth feathered 3-plane depth)
  //   0.18 = recessed mirror interior (flat across reflection so face never warps)
  //   0.50 = midground wall, wooden frame, shelf, mug, bottle
  //   0.94 = closest foreground boy head & hoodie shoulder
  // -------------------------------------------------------------------------
  function buildDepthMapCanvas() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 288;
    const g = c.getContext("2d");

    // Midground baseline (wall, frame, shelf)
    g.fillStyle = "rgb(128, 128, 128)";
    g.fillRect(0, 0, c.width, c.height);

    // Recessed mirror interior plane (smoothly recessed behind glass)
    g.save();
    g.filter = "blur(6px)";
    g.fillStyle = "rgb(44, 44, 44)";
    g.beginPath();
    MIRROR_QUAD.forEach((p, idx) => {
      const px = p.x * c.width;
      const py = p.y * c.height;
      if (idx === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    });
    g.closePath();
    g.fill();
    g.restore();

    // Closest foreground plane: boy's silhouette (head + neck + hoodie shoulder)
    g.save();
    g.filter = "blur(10px)";
    g.fillStyle = "rgb(242, 242, 242)";
    // Head silhouette
    g.beginPath();
    g.ellipse(0.19 * c.width, 0.43 * c.height, 0.142 * c.width, 0.225 * c.height, -0.06, 0, Math.PI * 2);
    g.fill();
    // Shoulders & hoodie torso
    g.beginPath();
    g.moveTo(0, 0.59 * c.height);
    g.quadraticCurveTo(0.14 * c.width, 0.58 * c.height, 0.275 * c.width, 0.72 * c.height);
    g.quadraticCurveTo(0.345 * c.width, 0.85 * c.height, 0.355 * c.width, c.height);
    g.lineTo(0, c.height);
    g.closePath();
    g.fill();
    g.restore();

    return c;
  }

  // -------------------------------------------------------------------------
  // Interactive Mirror Condensation / Steam Buffer (512x288)
  //   White = soft mist clinging to mirror glass; black = wiped crystal clear
  // -------------------------------------------------------------------------
  const fogCanvas = document.createElement("canvas");
  fogCanvas.width = 512;
  fogCanvas.height = 288;
  const fogCtx = fogCanvas.getContext("2d");

  const mirrorMaskCanvas = document.createElement("canvas");
  mirrorMaskCanvas.width = 512;
  mirrorMaskCanvas.height = 288;
  const mmCtx = mirrorMaskCanvas.getContext("2d");

  function initFogBuffers() {
    const w = fogCanvas.width;
    const h = fogCanvas.height;

    // Build exact mirror glass mask (vignetted so mist clings naturally to corners/edges)
    mmCtx.clearRect(0, 0, w, h);
    mmCtx.save();
    mmCtx.beginPath();
    MIRROR_QUAD.forEach((p, idx) => {
      if (idx === 0) mmCtx.moveTo(p.x * w, p.y * h);
      else mmCtx.lineTo(p.x * w, p.y * h);
    });
    mmCtx.closePath();
    mmCtx.clip();

    // Soft radial veil: light mist across center, richer mist near edges/bottom corners
    const grad = mmCtx.createRadialGradient(w * 0.61, h * 0.44, w * 0.08, w * 0.63, h * 0.46, w * 0.36);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.24)");
    grad.addColorStop(0.6, "rgba(255, 255, 255, 0.52)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.92)");
    mmCtx.fillStyle = grad;
    mmCtx.fillRect(0, 0, w, h);
    mmCtx.restore();

    // Seed initial delicate mist layer
    fogCtx.clearRect(0, 0, w, h);
    fogCtx.drawImage(mirrorMaskCanvas, 0, 0);
  }
  initFogBuffers();

  // Wipe a soft organic trail across the mirror condensation buffer
  function wipeMirrorFog(imgU, imgV, radius = 26) {
    if (imgU < 0.35 || imgU > 0.92 || imgV < 0.13 || imgV > 0.80) return;
    const x = imgU * fogCanvas.width;
    const y = imgV * fogCanvas.height;
    fogCtx.save();
    fogCtx.globalCompositeOperation = "destination-out";
    const g = fogCtx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    g.addColorStop(0, "rgba(0, 0, 0, 0.55)");
    g.addColorStop(0.65, "rgba(0, 0, 0, 0.24)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    fogCtx.fillStyle = g;
    fogCtx.beginPath();
    fogCtx.arc(x, y, radius, 0, Math.PI * 2);
    fogCtx.fill();
    fogCtx.restore();
  }

  // Gently re-condense mist back over time
  function regenerateMirrorFog(amount = 0.0045) {
    fogCtx.save();
    fogCtx.globalCompositeOperation = "source-over";
    fogCtx.globalAlpha = amount;
    fogCtx.drawImage(mirrorMaskCanvas, 0, 0);
    fogCtx.restore();
  }

  // -------------------------------------------------------------------------
  // WebGL Renderer (2.5D Depth Parallax + Halation + Fog + Film Grain)
  // + Seamless 3-Layer 2D Spatial Parallax Fallback when WebGL is unavailable
  // -------------------------------------------------------------------------
  const gl = glCanvas.getContext("webgl", {
    alpha: false,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  const fallbackCtx = gl ? null : glCanvas.getContext("2d", { alpha: false });
  let glProgram = null;
  let glUniforms = {};
  let texImage = null, texDepth = null, texFog = null;

  // Offscreen frosted/blurred mirror buffer & foreground boy layer for 2D fallback
  let fallbackBlurredImg = null;
  let fallbackForegroundLayer = null;
  let fallbackGrainPattern = null;

  function initFallbackLayers() {
    if (!fallbackCtx) return;

    // Softly blurred copy of the mirror region for realistic frosted condensation
    const b = document.createElement("canvas");
    b.width = 640;
    b.height = 360;
    const bctx = b.getContext("2d");
    bctx.filter = "blur(6px)";
    bctx.drawImage(img, 0, 0, b.width, b.height);
    bctx.filter = "none";
    bctx.fillStyle = "rgba(116, 146, 178, 0.22)";
    bctx.fillRect(0, 0, b.width, b.height);
    fallbackBlurredImg = b;

    // Soft-feathered foreground boy silhouette layer for true 2.5D depth shift
    const fg = document.createElement("canvas");
    fg.width = img.naturalWidth;
    fg.height = img.naturalHeight;
    const fctx = fg.getContext("2d");
    fctx.save();
    fctx.filter = "blur(12px)";
    fctx.fillStyle = "#fff";
    fctx.beginPath();
    fctx.ellipse(0.19 * fg.width, 0.43 * fg.height, 0.145 * fg.width, 0.228 * fg.height, -0.06, 0, Math.PI * 2);
    fctx.fill();
    fctx.beginPath();
    fctx.moveTo(0, 0.59 * fg.height);
    fctx.quadraticCurveTo(0.14 * fg.width, 0.58 * fg.height, 0.275 * fg.width, 0.72 * fg.height);
    fctx.quadraticCurveTo(0.348 * fg.width, 0.85 * fg.height, 0.358 * fg.width, fg.height);
    fctx.lineTo(0, fg.height);
    fctx.closePath();
    fctx.fill();
    fctx.restore();
    fctx.globalCompositeOperation = "source-in";
    fctx.drawImage(img, 0, 0);
    fallbackForegroundLayer = fg;

    // Subtle cached 35mm film grain tile
    const gr = document.createElement("canvas");
    gr.width = 160;
    gr.height = 160;
    const gctx = gr.getContext("2d");
    const gImg = gctx.createImageData(160, 160);
    for (let i = 0; i < gImg.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 64;
      gImg.data[i] = v;
      gImg.data[i + 1] = v;
      gImg.data[i + 2] = v;
      gImg.data[i + 3] = 15;
    }
    gctx.putImageData(gImg, 0, 0);
    fallbackGrainPattern = fallbackCtx.createPattern(gr, "repeat");
  }

  const VERT_SRC = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      v_uv.y = 1.0 - v_uv.y;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const FRAG_SRC = `
    precision highp float;
    varying vec2 v_uv;

    uniform sampler2D u_image;
    uniform sampler2D u_depth;
    uniform sampler2D u_fog;
    uniform vec2 u_mouse;       // smoothed camera look (-1..1)
    uniform vec2 u_coverScale;  // aspect cover scale
    uniform float u_zoom;
    uniform float u_time;
    uniform float u_lampPulse;  // subtle warm filament hum

    // Fast organic hash for subtle 35mm film grain
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    vec2 toImageUV(vec2 screenUV) {
      vec2 centered = (screenUV - 0.5) / (u_coverScale * u_zoom);
      return centered + 0.5;
    }

    void main() {
      vec2 baseUV = toImageUV(v_uv);

      // Subtle global camera drift inside overscan margin
      vec2 panUV = baseUV + u_mouse * vec2(0.014, 0.010);

      // 2.5D Spatial Depth Parallax (two-pass refined depth lookup for crisp foreground edges)
      float d0 = texture2D(u_depth, clamp(panUV, 0.002, 0.998)).r;
      vec2 parallaxStrength = vec2(0.024, 0.015);
      vec2 uv1 = panUV - u_mouse * (d0 - 0.5) * parallaxStrength;
      float d1 = texture2D(u_depth, clamp(uv1, 0.002, 0.998)).r;
      float depth = mix(d0, d1, 0.65);

      vec2 finalUV = clamp(panUV - u_mouse * (depth - 0.5) * parallaxStrength, 0.001, 0.999);

      // Subtle optical lens chromatic aberration near outer edges
      float edgeDist = length(v_uv - 0.5);
      vec2 caOffset = (v_uv - 0.5) * 0.0018 * edgeDist;
      float r = texture2D(u_image, clamp(finalUV + caOffset, 0.001, 0.999)).r;
      float g = texture2D(u_image, finalUV).g;
      float b = texture2D(u_image, clamp(finalUV - caOffset, 0.001, 0.999)).b;
      vec3 col = vec3(r, g, b);

      // Interactive mirror condensation / soft blurred steam overlay
      float fogAmt = texture2D(u_fog, finalUV).a;
      if (fogAmt > 0.01) {
        // Soft 5-tap glass blur under frosted mist
        vec2 px = vec2(0.0032, 0.0056);
        vec3 blurred = (
          texture2D(u_image, finalUV + vec2( px.x,  px.y)).rgb +
          texture2D(u_image, finalUV + vec2(-px.x,  px.y)).rgb +
          texture2D(u_image, finalUV + vec2( px.x, -px.y)).rgb +
          texture2D(u_image, finalUV + vec2(-px.x, -px.y)).rgb +
          col
        ) * 0.2;
        vec3 mistTint = mix(blurred, vec3(0.42, 0.52, 0.64), 0.16);
        col = mix(col, mistTint, fogAmt * 0.44);
      }

      // Subtle 35mm warm tungsten halation around bright highlights + gentle lamp breathing
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      float bright = smoothstep(0.62, 0.98, lum);
      vec3 halation = vec3(1.0, 0.68, 0.34) * bright * (0.12 + u_lampPulse * 0.08);
      col += halation;

      // Subtle warm glow modulation near top sconce & reflected desk lamp
      float dSconce = distance(finalUV * vec2(1.777, 1.0), vec2(0.583 * 1.777, 0.098));
      float dDesk = distance(finalUV * vec2(1.777, 1.0), vec2(0.766 * 1.777, 0.506));
      col += vec3(1.0, 0.66, 0.30) * exp(-dSconce * 3.8) * (0.055 + u_lampPulse * 0.06);
      col += vec3(1.0, 0.62, 0.26) * exp(-dDesk * 5.8) * (0.045 + u_lampPulse * 0.05);

      // Nostalgic late-90s cinema vignette
      float vig = smoothstep(0.95, 0.34, edgeDist * 1.12);
      col *= mix(0.64, 1.0, vig);

      // Subtle organic 35mm film grain
      float grain = (hash(v_uv * 900.0 + fract(u_time * 12.0)) - 0.5) * 0.032;
      col += grain;

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `;

  function compileShader(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function createTexture(source) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (source) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }
    return t;
  }

  function initWebGL() {
    if (!gl) return;
    const vs = compileShader(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;

    glProgram = gl.createProgram();
    gl.attachShader(glProgram, vs);
    gl.attachShader(glProgram, fs);
    gl.linkProgram(glProgram);
    gl.useProgram(glProgram);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(glProgram, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    glUniforms = {
      u_image: gl.getUniformLocation(glProgram, "u_image"),
      u_depth: gl.getUniformLocation(glProgram, "u_depth"),
      u_fog: gl.getUniformLocation(glProgram, "u_fog"),
      u_mouse: gl.getUniformLocation(glProgram, "u_mouse"),
      u_coverScale: gl.getUniformLocation(glProgram, "u_coverScale"),
      u_zoom: gl.getUniformLocation(glProgram, "u_zoom"),
      u_time: gl.getUniformLocation(glProgram, "u_time"),
      u_lampPulse: gl.getUniformLocation(glProgram, "u_lampPulse"),
    };

    texImage = createTexture(img);
    texDepth = createTexture(buildDepthMapCanvas());
    texFog = createTexture(fogCanvas);

    gl.uniform1i(glUniforms.u_image, 0);
    gl.uniform1i(glUniforms.u_depth, 1);
    gl.uniform1i(glUniforms.u_fog, 2);
  }

  // -------------------------------------------------------------------------
  // Synchronized Atmospheric Particles (Reflected Window Rain + Warm Dust)
  // -------------------------------------------------------------------------
  const rainStreaks = Array.from({ length: 46 }, () => ({
    pane: Math.random() < 0.56 ? 0 : 1,
    u: Math.random(),
    v: Math.random(),
    speed: 0.35 + Math.random() * 0.45,
    len: 0.018 + Math.random() * 0.028,
    alpha: 0.14 + Math.random() * 0.28,
  }));

  const rainBeads = Array.from({ length: 18 }, () => ({
    pane: Math.random() < 0.56 ? 0 : 1,
    u: Math.random(),
    v: Math.random(),
    speed: 0.018 + Math.random() * 0.032,
    r: 1.0 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
  }));

  const cityBokeh = Array.from({ length: 24 }, () => ({
    pane: Math.random() < 0.55 ? 0 : 1,
    u: 0.06 + Math.random() * 0.88,
    v: 0.32 + Math.random() * 0.62,
    warm: Math.random() < 0.55,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 1.2,
  }));

  const dustMotes = Array.from({ length: 40 }, () => ({
    x: 0.34 + Math.random() * 0.52,
    y: 0.06 + Math.random() * 0.72,
    vx: (Math.random() - 0.5) * 0.005,
    vy: 0.002 + Math.random() * 0.005,
    r: 0.7 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
  }));

  // -------------------------------------------------------------------------
  // Viewport, Camera Rig & Pointer Interaction
  // -------------------------------------------------------------------------
  let vw = 0, vh = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let coverScaleX = 1, coverScaleY = 1;

  const cam = {
    targetX: 0,
    targetY: 0,
    x: 0,
    y: 0,
    targetZoom: 1.055,
    zoom: 1.055,
    lampBoost: 0,
  };

  function updateCoverScale() {
    const imgAspect = 16 / 9;
    const viewAspect = vw / Math.max(1, vh);
    if (viewAspect > imgAspect) {
      coverScaleX = 1;
      coverScaleY = viewAspect / imgAspect;
    } else {
      coverScaleX = imgAspect / viewAspect;
      coverScaleY = 1;
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    updateCoverScale();

    glCanvas.width = Math.floor(vw * dpr);
    glCanvas.height = Math.floor(vh * dpr);
    if (gl) gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    if (fallbackCtx) fallbackCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fxCanvas.width = Math.floor(vw * dpr);
    fxCanvas.height = Math.floor(vh * dpr);
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  // Map normalized image UV (at a given depth plane) -> CSS screen px
  function imageUVToScreen(u, v, depth = 0.5) {
    const panU = u + cam.x * (depth - 0.5) * 0.024 - cam.x * 0.014;
    const panV = v + cam.y * (depth - 0.5) * 0.015 - cam.y * 0.010;
    const sx = ((panU - 0.5) * coverScaleX * cam.zoom + 0.5) * vw;
    const sy = ((panV - 0.5) * coverScaleY * cam.zoom + 0.5) * vh;
    return { x: sx, y: sy };
  }

  // Map CSS screen px -> normalized image UV (for mirror fog wiping)
  function screenToImageUV(px, py) {
    const su = px / Math.max(1, vw);
    const sv = py / Math.max(1, vh);
    const u = (su - 0.5) / (coverScaleX * cam.zoom) + 0.5 + cam.x * 0.014;
    const v = (sv - 0.5) / (coverScaleY * cam.zoom) + 0.5 + cam.y * 0.010;
    return { u, v };
  }

  let lastPointer = null;
  window.addEventListener(
    "pointermove",
    (e) => {
      cam.targetX = (e.clientX / Math.max(1, vw) - 0.5) * 2;
      cam.targetY = (e.clientY / Math.max(1, vh) - 0.5) * 2;

      // Smoothly wipe mirror condensation along cursor path
      const cur = screenToImageUV(e.clientX, e.clientY);
      if (lastPointer) {
        const steps = 4;
        for (let i = 1; i <= steps; i++) {
          const k = i / steps;
          wipeMirrorFog(
            lastPointer.u + (cur.u - lastPointer.u) * k,
            lastPointer.v + (cur.v - lastPointer.v) * k,
            24
          );
        }
      } else {
        wipeMirrorFog(cur.u, cur.v, 24);
      }
      lastPointer = cur;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    cam.targetX = 0;
    cam.targetY = 0;
    lastPointer = null;
  });

  // Scroll or W/S slowly pushes camera closer toward the mirror reflection
  window.addEventListener(
    "wheel",
    (e) => {
      cam.targetZoom = Math.max(1.04, Math.min(1.26, cam.targetZoom + e.deltaY * 0.00028));
    },
    { passive: true }
  );

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "w" || k === "arrowup") cam.targetZoom = Math.min(1.26, cam.targetZoom + 0.035);
    if (k === "s" || k === "arrowdown") cam.targetZoom = Math.max(1.04, cam.targetZoom - 0.035);
    if (k === "a" || k === "arrowleft") cam.targetX = Math.max(-1, cam.targetX - 0.25);
    if (k === "d" || k === "arrowright") cam.targetX = Math.min(1, cam.targetX + 0.25);
    if (k === " ") cam.lampBoost = 1;
  });

  // Click subtly pulses the tungsten lamp filament warmth & wipes mist at click spot
  glCanvas.addEventListener("click", (e) => {
    cam.lampBoost = 1;
    const p = screenToImageUV(e.clientX, e.clientY);
    wipeMirrorFog(p.u, p.v, 38);
  });

  // Helper: bilinear point inside a quad's bounding box (works for notched polygons too)
  function quadPoint(poly, u, v) {
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const p of poly) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      x: minX + (maxX - minX) * u,
      y: minY + (maxY - minY) * v,
    };
  }

  // -------------------------------------------------------------------------
  // Main Render Loop
  // -------------------------------------------------------------------------
  let ready = false;
  function onImageReady() {
    if (ready) return;
    if (gl) initWebGL();
    else initFallbackLayers();
    ready = true;
  }
  img.onload = onImageReady;
  if (img.complete && img.naturalWidth > 0) onImageReady();

  // Reusable offscreen compositing buffer for masked fog in 2D fallback
  const fogCompCanvas = document.createElement("canvas");
  fogCompCanvas.width = 640;
  fogCompCanvas.height = 360;
  const fogCompCtx = fogCompCanvas.getContext("2d");

  function renderFallback2D(lampPulse) {
    if (!fallbackCtx) return;
    const drawW = vw * coverScaleX * cam.zoom;
    const drawH = vh * coverScaleY * cam.zoom;
    const baseX = (vw - drawW) * 0.5 - cam.x * 0.014 * drawW;
    const baseY = (vh - drawH) * 0.5 - cam.y * 0.010 * drawH;

    fallbackCtx.fillStyle = "#090d14";
    fallbackCtx.fillRect(0, 0, vw, vh);

    // Layer 1: Midground wall, mirror frame, wooden shelf, mug & bottle
    fallbackCtx.drawImage(img, baseX, baseY, drawW, drawH);

    // Layer 2: Recessed Mirror Interior (shifts deeper inside the glass frame!)
    const mirrorShiftX = -cam.x * 0.0085 * drawW;
    const mirrorShiftY = -cam.y * 0.0055 * drawH;
    fallbackCtx.save();
    fallbackCtx.beginPath();
    MIRROR_QUAD.forEach((pt, idx) => {
      const mx = baseX + pt.x * drawW;
      const my = baseY + pt.y * drawH;
      if (idx === 0) fallbackCtx.moveTo(mx, my);
      else fallbackCtx.lineTo(mx, my);
    });
    fallbackCtx.closePath();
    fallbackCtx.clip();

    // Slightly scaled recessed reflection so edges never reveal gaps during shift
    const recScale = 1.028;
    const recW = drawW * recScale;
    const recH = drawH * recScale;
    const recX = baseX - (recW - drawW) * 0.62 + mirrorShiftX;
    const recY = baseY - (recH - drawH) * 0.45 + mirrorShiftY;
    fallbackCtx.drawImage(img, recX, recY, recW, recH);

    // Interactive mirror condensation / frosted glass veil (wiped by cursor!)
    if (fallbackBlurredImg) {
      fogCompCtx.clearRect(0, 0, fogCompCanvas.width, fogCompCanvas.height);
      fogCompCtx.globalCompositeOperation = "source-over";
      fogCompCtx.drawImage(fallbackBlurredImg, 0, 0, fogCompCanvas.width, fogCompCanvas.height);
      fogCompCtx.globalCompositeOperation = "destination-in";
      fogCompCtx.drawImage(fogCanvas, 0, 0, fogCompCanvas.width, fogCompCanvas.height);
      fogCompCtx.globalCompositeOperation = "source-over";

      fallbackCtx.save();
      fallbackCtx.globalAlpha = 0.5;
      fallbackCtx.drawImage(fogCompCanvas, baseX, baseY, drawW, drawH);
      fallbackCtx.restore();
    }
    fallbackCtx.restore();

    // Layer 3: Closest Foreground Boy Silhouette (strong near-camera parallax!)
    if (fallbackForegroundLayer) {
      const fgShiftX = cam.x * 0.012 * drawW;
      const fgShiftY = cam.y * 0.0075 * drawH;
      fallbackCtx.drawImage(fallbackForegroundLayer, baseX + fgShiftX, baseY + fgShiftY, drawW, drawH);
    }

    // Subtle 35mm film grain & warm cinema vignette
    if (fallbackGrainPattern) {
      fallbackCtx.save();
      fallbackCtx.globalCompositeOperation = "overlay";
      fallbackCtx.fillStyle = fallbackGrainPattern;
      fallbackCtx.fillRect(0, 0, vw, vh);
      fallbackCtx.restore();
    }

    const vig = fallbackCtx.createRadialGradient(
      vw * 0.5,
      vh * 0.48,
      Math.min(vw, vh) * 0.34,
      vw * 0.5,
      vh * 0.5,
      Math.max(vw, vh) * 0.78
    );
    vig.addColorStop(0, "rgba(0, 0, 0, 0)");
    vig.addColorStop(1, `rgba(6, 9, 16, ${0.44 - lampPulse * 0.04})`);
    fallbackCtx.fillStyle = vig;
    fallbackCtx.fillRect(0, 0, vw, vh);
  }

  function renderFX(t, lampPulse) {
    fxCtx.clearRect(0, 0, vw, vh);

    // 1. Reflected Night Window: Falling Rain Streaks, Sliding Droplets & City Bokeh
    const mirrorDepth = 0.17;
    for (let pIdx = 0; pIdx < WINDOW_PANES.length; pIdx++) {
      const pane = WINDOW_PANES[pIdx];
      fxCtx.save();
      fxCtx.beginPath();
      pane.forEach((pt, idx) => {
        const s = imageUVToScreen(pt.x, pt.y, mirrorDepth);
        if (idx === 0) fxCtx.moveTo(s.x, s.y);
        else fxCtx.lineTo(s.x, s.y);
      });
      fxCtx.closePath();
      fxCtx.clip();

      // Twinkling distant city window lights outside
      fxCtx.globalCompositeOperation = "screen";
      for (const b of cityBokeh) {
        if (b.pane !== pIdx) continue;
        const pulse = 0.5 + 0.5 * Math.sin(t * b.speed + b.phase);
        if (pulse < 0.45) continue;
        const uv = quadPoint(pane, b.u, b.v);
        const pt = imageUVToScreen(uv.x, uv.y, mirrorDepth);
        const a = (pulse - 0.45) * 0.48;
        const r = Math.max(2.2, vw * 0.0024);
        const g = fxCtx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 2.2);
        g.addColorStop(0, b.warm ? `rgba(255, 224, 168, ${a})` : `rgba(186, 220, 255, ${a})`);
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        fxCtx.fillStyle = g;
        fxCtx.fillRect(pt.x - r * 2.2, pt.y - r * 2.2, r * 4.4, r * 4.4);
      }

      // Fine slanted rain streaks
      fxCtx.lineWidth = Math.max(0.8, vw * 0.0007);
      for (const r of rainStreaks) {
        if (r.pane !== pIdx) continue;
        if (!prefersReduced) {
          r.v = (r.v + r.speed * 0.016) % 1.05;
          r.u = (r.u - r.speed * 0.0022 + 1) % 1;
        }
        const p1 = quadPoint(pane, r.u, r.v);
        const p2 = quadPoint(pane, r.u - 0.008, r.v + r.len * 2.4);
        const s1 = imageUVToScreen(p1.x, p1.y, mirrorDepth);
        const s2 = imageUVToScreen(p2.x, p2.y, mirrorDepth);
        fxCtx.strokeStyle = `rgba(185, 214, 245, ${r.alpha})`;
        fxCtx.beginPath();
        fxCtx.moveTo(s1.x, s1.y);
        fxCtx.lineTo(s2.x, s2.y);
        fxCtx.stroke();
      }

      // Slow glass raindrop beads catching window light
      for (const d of rainBeads) {
        if (d.pane !== pIdx) continue;
        if (!prefersReduced) {
          const jitter = 0.5 + 0.5 * Math.sin(t * 2.2 + d.phase);
          d.v = (d.v + d.speed * 0.016 * (0.35 + jitter * 0.9)) % 1;
        }
        const uv = quadPoint(pane, d.u, d.v);
        const pt = imageUVToScreen(uv.x, uv.y, mirrorDepth);
        fxCtx.fillStyle = "rgba(205, 228, 250, 0.36)";
        fxCtx.beginPath();
        fxCtx.arc(pt.x, pt.y, d.r * (vw / 1440), 0, Math.PI * 2);
        fxCtx.fill();
      }
      fxCtx.restore();
    }

    // 2. Volumetric Warm Tungsten Glow (Top Wall Sconce & Reflected Desk Lamp)
    fxCtx.save();
    fxCtx.globalCompositeOperation = "screen";

    const sconcePt = imageUVToScreen(SCONCE.x, SCONCE.y, 0.52);
    const sconceR = vw * 0.24 * (1 + lampPulse * 0.07);
    const gSconce = fxCtx.createRadialGradient(sconcePt.x, sconcePt.y, 0, sconcePt.x, sconcePt.y, sconceR);
    gSconce.addColorStop(0, `rgba(255, 236, 186, ${0.24 + lampPulse * 0.14})`);
    gSconce.addColorStop(0.28, `rgba(255, 174, 82, ${0.13 + lampPulse * 0.08})`);
    gSconce.addColorStop(1, "rgba(255, 130, 42, 0)");
    fxCtx.fillStyle = gSconce;
    fxCtx.fillRect(sconcePt.x - sconceR, sconcePt.y - sconceR, sconceR * 2, sconceR * 2);

    const deskPt = imageUVToScreen(DESK_LAMP.x, DESK_LAMP.y, mirrorDepth);
    const deskR = vw * 0.11 * (1 + lampPulse * 0.06);
    const gDesk = fxCtx.createRadialGradient(deskPt.x, deskPt.y, 0, deskPt.x, deskPt.y, deskR);
    gDesk.addColorStop(0, `rgba(255, 224, 152, ${0.22 + lampPulse * 0.12})`);
    gDesk.addColorStop(0.42, `rgba(246, 156, 66, ${0.10 + lampPulse * 0.05})`);
    gDesk.addColorStop(1, "rgba(240, 120, 40, 0)");
    fxCtx.fillStyle = gDesk;
    fxCtx.fillRect(deskPt.x - deskR, deskPt.y - deskR, deskR * 2, deskR * 2);

    // 3. Slow Floating Dust Motes caught in the Warm Tungsten Lamp Cone
    for (const m of dustMotes) {
      if (!prefersReduced) {
        m.x += m.vx * 0.04;
        m.y += m.vy * 0.04;
        if (m.y > 0.78) {
          m.y = 0.08;
          m.x = 0.36 + Math.random() * 0.46;
        }
      }
      const distSconce = Math.hypot((m.x - SCONCE.x) * 1.4, m.y - SCONCE.y);
      const lit = Math.max(0, 1 - distSconce / 0.48);
      if (lit <= 0.04) continue;
      const shimmer = 0.45 + 0.55 * Math.sin(t * 1.8 + m.phase);
      const pt = imageUVToScreen(m.x, m.y, 0.55);
      fxCtx.fillStyle = `rgba(255, 224, 168, ${lit * shimmer * 0.42})`;
      fxCtx.beginPath();
      fxCtx.arc(pt.x, pt.y, m.r * (vw / 1440), 0, Math.PI * 2);
      fxCtx.fill();
    }

    fxCtx.restore();
  }

  let frameCount = 0;
  function render(now) {
    const t = now * 0.001;
    frameCount++;

    if (!ready) {
      requestAnimationFrame(render);
      return;
    }

    // Smooth handheld breathing sway + damped spatial mouse-look
    const swayX = prefersReduced ? 0 : Math.sin(t * 0.48) * 0.045;
    const swayY = prefersReduced ? 0 : Math.sin(t * 0.92) * 0.038;
    cam.x += (cam.targetX + swayX - cam.x) * 0.055;
    cam.y += (cam.targetY + swayY - cam.y) * 0.055;
    cam.zoom += (cam.targetZoom - cam.zoom) * 0.065;
    cam.lampBoost *= 0.92;

    // Gentle organic tungsten filament breathing
    const lampPulse = prefersReduced
      ? 0.2
      : 0.25 + 0.14 * Math.sin(t * 2.4) + 0.08 * Math.sin(t * 6.3 + 1.2) + cam.lampBoost * 0.85;

    // Slowly re-condense mirror fog every couple frames
    if (!prefersReduced && frameCount % 2 === 0) {
      regenerateMirrorFog(0.004);
    }

    if (gl && glProgram) {
      gl.useProgram(glProgram);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texImage);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texDepth);

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, texFog);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fogCanvas);

      gl.uniform2f(glUniforms.u_mouse, cam.x, cam.y);
      gl.uniform2f(glUniforms.u_coverScale, coverScaleX, coverScaleY);
      gl.uniform1f(glUniforms.u_zoom, cam.zoom);
      gl.uniform1f(glUniforms.u_time, t);
      gl.uniform1f(glUniforms.u_lampPulse, lampPulse);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else {
      renderFallback2D(lampPulse);
    }

    renderFX(t, lampPulse);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
