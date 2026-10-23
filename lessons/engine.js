/* AQUA animated lessons — shared drawing engine.
   Works in the browser (window.AquaLessons) and in Node (module.exports)
   so the website player and the MP4 renderer draw exactly the same frames. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AquaLessons = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------- maths ---------- */
  const PI = Math.PI, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const c01 = (v) => clamp(v, 0, 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => c01((p - a) / (b - a));          // 0..1 inside [a,b]
  const easeOut = (t) => 1 - Math.pow(1 - c01(t), 3);
  const easeIn = (t) => Math.pow(c01(t), 3);
  const easeInOut = (t) => { t = c01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const pulse = (p, a, b, fade) => Math.min(seg(p, a, a + fade), 1 - seg(p, b - fade, b)); // 0→1→0 window
  function rnd(i) { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
  function hsla(h, s, l, a) { return `hsla(${h},${s}%,${l}%,${a})`; }

  /* ---------- palette ---------- */
  const C = {
    night: "#061a1f", deep: "#0a2a33", teal: "#1fa4b8", aqua: "#8de3f0", foam: "#dff7fb",
    reed: "#5c9a3c", reedLight: "#a7d05a", reedDry: "#b58a3c", mud: "#5a3e2b", peat: "#3a2618",
    sun: "#f2c14e", sunHot: "#ff8a3d", cloud: "#c9d8e2", storm: "#5f7584", rain: "#bfe9f4",
    white: "#ffffff", ink: "#eaf6f8", warn: "#ff6b5a",
  };
  const FONT = 'Manrope, "Noto Sans", "DejaVu Sans", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  /* ---------- primitives ---------- */
  function sky(ctx, W, H, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function vignette(ctx, W, H, strength) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function glow(ctx, x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function stars(ctx, W, H, time, alpha) {
    ctx.save(); ctx.fillStyle = C.white;
    for (let i = 0; i < 90; i++) {
      const x = rnd(i) * W, y = rnd(i + 500) * H * 0.6;
      const tw = 0.5 + 0.5 * Math.sin(time * (1 + rnd(i + 900)) + i);
      ctx.globalAlpha = alpha * tw * 0.8;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    ctx.restore();
  }
  function sun(ctx, x, y, r, time, heat) {
    const col = heat > 0.5 ? C.sunHot : C.sun;
    glow(ctx, x, y, r * (3 + heat * 2), col, 0.35 + heat * 0.3);
    ctx.save(); ctx.translate(x, y);
    // slow rotating rays
    ctx.rotate(time * 0.05);
    for (let i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12);
      const g = ctx.createLinearGradient(0, 0, r * 5, 0);
      g.addColorStop(0, hsla(42, 90, 70, 0.18 + heat * 0.2)); g.addColorStop(1, hsla(42, 90, 70, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 5, -r * 0.25); ctx.lineTo(r * 5, r * 0.25); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.5, 0, TAU); ctx.fill();
  }
  function cloud(ctx, x, y, s, alpha, dark) {
    ctx.save(); ctx.globalAlpha = alpha;
    const col = dark ? C.storm : C.cloud;
    const puffs = [[0, 0, 1], [-0.9, 0.2, 0.75], [0.9, 0.15, 0.8], [-0.4, -0.35, 0.7], [0.45, -0.4, 0.65], [1.6, 0.3, 0.5], [-1.6, 0.35, 0.5]];
    for (const [dx, dy, r] of puffs) {
      const g = ctx.createRadialGradient(x + dx * s - r * s * 0.3, y + dy * s - r * s * 0.3, 0, x + dx * s, y + dy * s, r * s);
      g.addColorStop(0, dark ? "#8a9faa" : "#ffffff"); g.addColorStop(1, col);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function rain(ctx, W, H, time, intensity, x0, x1, y0, y1, seed) {
    if (intensity <= 0) return;
    const n = Math.floor(220 * intensity);
    ctx.save(); ctx.strokeStyle = C.rain; ctx.lineWidth = Math.max(1, W / 900);
    ctx.globalAlpha = 0.35 + 0.4 * intensity; ctx.lineCap = "round";
    const len = (y1 - y0) * (0.03 + 0.05 * intensity), drift = -W * 0.02;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const k = i + (seed || 0) * 1000;
      const sp = 0.9 + rnd(k + 2) * 0.6;
      const f = ((time * sp * 0.8) + rnd(k + 1)) % 1;
      const x = x0 + rnd(k) * (x1 - x0) + drift * f, y = y0 + f * (y1 - y0);
      ctx.moveTo(x, y); ctx.lineTo(x + drift * 0.08, y + len);
    }
    ctx.stroke(); ctx.restore();
  }
  function splashes(ctx, time, intensity, x0, x1, y, seed) {
    if (intensity <= 0) return;
    ctx.save(); ctx.strokeStyle = C.foam; ctx.lineWidth = 1.2;
    for (let i = 0; i < 40 * intensity; i++) {
      const k = i + (seed || 0) * 77, f = ((time * 1.4) + rnd(k)) % 1;
      const x = x0 + rnd(k + 3) * (x1 - x0), r = 2 + f * 10;
      ctx.globalAlpha = (1 - f) * 0.7; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.35, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  function water(ctx, W, H, x0, x1, level, time, opts) {
    opts = opts || {};
    const amp = opts.amp == null ? H * 0.006 : opts.amp, col = opts.color || C.teal, bottom = opts.bottom == null ? H : opts.bottom;
    const g = ctx.createLinearGradient(0, level, 0, bottom);
    g.addColorStop(0, opts.top || C.aqua); g.addColorStop(0.25, col); g.addColorStop(1, opts.deep || C.deep);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, bottom);
    for (let x = x0; x <= x1; x += 6) {
      const y = level + Math.sin(x * 0.02 + time * 1.6) * amp + Math.sin(x * 0.045 - time * 2.3) * amp * 0.5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(x1, bottom); ctx.closePath(); ctx.fill();
    // shimmer
    ctx.save(); ctx.globalAlpha = opts.shimmer == null ? 0.25 : opts.shimmer; ctx.strokeStyle = C.foam; ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const y = level + 8 + rnd(i + 40) * (bottom - level) * 0.45, x = x0 + ((rnd(i) + time * 0.03 * (1 + rnd(i + 7))) % 1) * (x1 - x0), w = 20 + rnd(i + 9) * 60;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    }
    ctx.restore();
  }
  function ripples(ctx, time, x0, x1, y, count, seed) {
    ctx.save(); ctx.strokeStyle = C.foam; ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const k = i + (seed || 0) * 31, f = ((time * 0.5) + rnd(k)) % 1, x = x0 + rnd(k + 1) * (x1 - x0);
      ctx.globalAlpha = (1 - f) * 0.5; ctx.beginPath(); ctx.ellipse(x, y, 6 + f * 50, (6 + f * 50) * 0.25, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  function reeds(ctx, x0, x1, baseY, n, height, time, color, dry, seed) {
    ctx.save(); ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const k = i + (seed || 0) * 13, x = x0 + rnd(k) * (x1 - x0), h = height * (0.6 + rnd(k + 1) * 0.6);
      const sway = Math.sin(time * 1.3 + rnd(k + 2) * 6) * (dry ? 4 : 10) * (h / height);
      const hue = dry ? 38 : 95, lit = dry ? 42 + rnd(k + 3) * 15 : 32 + rnd(k + 3) * 20;
      ctx.strokeStyle = color || hsla(hue, dry ? 45 : 55, lit, 1);
      ctx.lineWidth = 2 + rnd(k + 4) * 2;
      ctx.beginPath(); ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(x + sway * 0.4, baseY - h * 0.6, x + sway, baseY - h);
      ctx.stroke();
      if (!dry || rnd(k + 5) > 0.5) { // seed head
        ctx.fillStyle = dry ? "#8b6a3a" : "#6b4a2a";
        ctx.beginPath(); ctx.ellipse(x + sway, baseY - h - 6, 3, 9, sway * 0.02, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
  function hills(ctx, W, H, baseY, color, time, seed, amp) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const y = baseY + Math.sin(x * 0.004 + seed) * amp + Math.sin(x * 0.011 + seed * 2) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  function bird(ctx, x, y, s, time, k) {
    const f = Math.sin(time * 7 + k) * 0.6;
    ctx.save(); ctx.strokeStyle = "rgba(15,30,35,0.85)"; ctx.lineWidth = Math.max(1.5, s * 0.12); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - s, y + f * s * 0.5); ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.3, x, y); ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.3, x + s, y + f * s * 0.5); ctx.stroke(); ctx.restore();
  }
  function fish(ctx, x, y, s, dir, time, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(dir, 1);
    const wag = Math.sin(time * 6) * 0.3;
    ctx.fillStyle = "#e9c46a"; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.4, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 0.9, 0); ctx.lineTo(-s * 1.5, -s * 0.5 + wag * s); ctx.lineTo(-s * 1.5, s * 0.5 + wag * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.1, s * 0.08, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function dragonfly(ctx, x, y, s, time, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);
    const w = Math.sin(time * 40) * 0.5;
    ctx.strokeStyle = "rgba(200,240,255,0.8)"; ctx.lineWidth = 1;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * s * 0.6, -s * 0.2, s * 0.7, s * 0.2 * (0.5 + Math.abs(w)), d * 0.3, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = "#2a9d8f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.2, 0); ctx.lineTo(s * 1.2, 0); ctx.stroke();
    ctx.restore();
  }
  function heron(ctx, x, y, s, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = "#1c2b30"; ctx.fillStyle = "#1c2b30"; ctx.lineWidth = s * 0.08; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s * 0.7); ctx.stroke();                     // leg
    ctx.beginPath(); ctx.ellipse(x + s * 0.05, y - s * 0.85, s * 0.35, s * 0.2, -0.2, 0, TAU); ctx.fill(); // body
    ctx.beginPath(); ctx.moveTo(x + s * 0.2, y - s * 0.95); ctx.quadraticCurveTo(x + s * 0.35, y - s * 1.5, x + s * 0.55, y - s * 1.45); ctx.stroke(); // neck
    ctx.beginPath(); ctx.ellipse(x + s * 0.58, y - s * 1.45, s * 0.1, s * 0.07, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * 0.65, y - s * 1.45); ctx.lineTo(x + s * 0.95, y - s * 1.4); ctx.stroke(); // beak
    ctx.restore();
  }
  function cracks(ctx, x0, x1, y0, y1, amount, seed) {
    if (amount <= 0) return;
    ctx.save(); ctx.strokeStyle = "rgba(30,18,10,0.9)"; ctx.lineCap = "round";
    const n = 26;
    for (let i = 0; i < n; i++) {
      const k = i + (seed || 0) * 17; if (rnd(k) > amount) continue;
      let x = x0 + rnd(k + 1) * (x1 - x0), y = y0 + rnd(k + 2) * (y1 - y0);
      ctx.lineWidth = 1 + rnd(k + 3) * 2 * amount; ctx.beginPath(); ctx.moveTo(x, y);
      const steps = 4 + Math.floor(rnd(k + 4) * 4), grow = c01((amount - rnd(k)) * 3);
      for (let j = 0; j < steps * grow; j++) { x += (rnd(k + j * 5) - 0.5) * 40; y += (rnd(k + j * 7) - 0.5) * 14; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function particles(ctx, time, list, opts) {
    // list: array of {x,y,r,a,col}
    ctx.save();
    for (const p of list) { if (p.a <= 0) continue; ctx.globalAlpha = p.a; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function grain(ctx, W, H, time, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = "#fff";
    const t = Math.floor(time * 12);
    for (let i = 0; i < 160; i++) ctx.fillRect(rnd(i + t * 3) * W, rnd(i + 100 + t * 5) * H, 1, 1);
    ctx.restore();
  }

  function rays(ctx, x, y, W, H, time, alpha, color) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(x, y); ctx.rotate(time * 0.02);
    for (let i = 0; i < 18; i++) {
      ctx.rotate(TAU / 18);
      const w = 0.03 + 0.05 * rnd(i + 77), a = alpha * (0.35 + 0.65 * Math.abs(Math.sin(time * 0.4 + i)));
      const g = ctx.createLinearGradient(0, 0, W * 1.3, 0); g.addColorStop(0, color || `rgba(255,232,170,${a})`); g.addColorStop(1, "rgba(255,232,170,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 1.3, -W * w); ctx.lineTo(W * 1.3, W * w); ctx.fill();
    }
    ctx.restore();
  }
  function ambient(ctx, W, H, time, alpha, color) {
    ctx.save(); ctx.fillStyle = color || "#dff7fb";
    for (let i = 0; i < 70; i++) {
      const sp = 0.01 + rnd(i + 33) * 0.02, x = ((rnd(i) + time * sp * 0.3) % 1) * W, y = ((rnd(i + 1) - time * sp) % 1 + 1) % 1 * H;
      ctx.globalAlpha = alpha * (0.3 + 0.7 * Math.abs(Math.sin(time * 1.5 + i))); ctx.beginPath(); ctx.arc(x, y, 1 + rnd(i + 2) * 2.2, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function lightning(ctx, W, H, time, period, seed, strength) {
    const k = Math.floor(time / period), f = (time - k * period) / period;   // deterministic strike per period
    const jitter = rnd(k + seed * 101);
    if (f < 0.16 && jitter < (strength == null ? 0.8 : strength)) {
      const a = (1 - f / 0.16), x0 = W * (0.15 + rnd(k + seed) * 0.7);
      ctx.save(); ctx.fillStyle = `rgba(225,238,255,${0.55 * a * a})`; ctx.fillRect(0, 0, W, H);
      if (f < 0.09) {
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = Math.max(2, W / 500); ctx.lineCap = "round"; ctx.shadowColor = "#bfe3ff"; ctx.shadowBlur = 30; ctx.globalAlpha = a;
        let x = x0, y = -10; ctx.beginPath(); ctx.moveTo(x, y);
        for (let i = 0; i < 14; i++) { x += (rnd(k * 7 + i + seed) - 0.5) * W * 0.07; y += H * 0.045 * (0.5 + rnd(k * 9 + i)); ctx.lineTo(x, y); if (i === 6) { ctx.moveTo(x, y); ctx.lineTo(x + (rnd(k + i) - 0.5) * W * 0.15, y + H * 0.12); ctx.moveTo(x, y); } }
        ctx.stroke(); A_glow(ctx, x0, H * 0.3, H * 0.6, "#cfe6ff", 0.5 * a);
      }
      ctx.restore();
    }
  }
  function A_glow(ctx, x, y, r, color, alpha) { glow(ctx, x, y, r, color, alpha); }
  function sparks(ctx, x, y, time, t0, n, color) { // radial burst that fades over ~1.2s after t0
    const age = time - t0; if (age < 0 || age > 1.3) return;
    ctx.save(); ctx.fillStyle = color || "#dff7fb";
    for (let i = 0; i < n; i++) { const ang = rnd(i + 500) * TAU, sp = 60 + rnd(i + 501) * 240, d = sp * age * (1 - age * 0.3); ctx.globalAlpha = (1 - age / 1.3) * 0.9; ctx.beginPath(); ctx.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d - age * age * 60, 1.5 + rnd(i + 502) * 2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  /* ---------- text ---------- */
  function wrap(ctx, text, maxW) {
    const words = text.split(" "), lines = []; let line = "";
    for (const w of words) { const test = line ? line + " " + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
    if (line) lines.push(line); return lines;
  }
  function caption(ctx, W, H, text, alpha) {
    if (alpha <= 0 || !text) return;
    const size = Math.round(H * 0.036);
    ctx.save(); ctx.font = `600 ${size}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    const lines = wrap(ctx, text, W * 0.72), lh = size * 1.35, boxH = lines.length * lh + size * 1.1, boxW = Math.min(W * 0.78, Math.max(...lines.map((l) => ctx.measureText(l).width)) + size * 2);
    const y0 = H - boxH - H * 0.085;
    ctx.globalAlpha = alpha; ctx.fillStyle = "rgba(4,16,20,0.86)";
    roundRect(ctx, W / 2 - boxW / 2, y0, boxW, boxH, size * 0.5); ctx.fill();
    ctx.globalAlpha = alpha; ctx.fillStyle = C.ink;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + size * 0.95 + i * lh + size * 0.35));
    ctx.restore();
  }
  function bigTitle(ctx, W, H, title, sub, p) {
    const a = easeOut(seg(p, 0, 0.25)) * (1 - easeIn(seg(p, 0.8, 1)));
    const size = Math.round(H * 0.095);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.font = `800 ${size}px ${FONT}`; ctx.fillStyle = C.ink;
    const lines = wrap(ctx, title, W * 0.6), rise = (1 - easeOut(seg(p, 0, 0.3))) * H * 0.04;
    lines.forEach((l, i) => ctx.fillText(l, W * 0.08, H * 0.42 + i * size * 1.05 + rise));
    if (sub) { ctx.font = `400 ${Math.round(H * 0.034)}px ${FONT}`; ctx.fillStyle = C.aqua; ctx.globalAlpha = a * easeOut(seg(p, 0.15, 0.4)); ctx.fillText(sub, W * 0.08, H * 0.42 + lines.length * size * 1.05 + H * 0.02); }
    // rule
    ctx.globalAlpha = a; ctx.fillStyle = C.teal; ctx.fillRect(W * 0.08, H * 0.42 - size * 1.1, W * 0.5 * easeOut(seg(p, 0.05, 0.4)), 3);
    ctx.restore();
  }
  function label(ctx, x, y, text, size, color, align, alpha) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.font = `600 ${size}px ${FONT}`; ctx.fillStyle = color || C.ink; ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(text, x, y); ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function gauge(ctx, x, y, r, value, title, time, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = "round"; ctx.lineWidth = r * 0.16;
    ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.arc(x, y, r, PI * 0.75, PI * 2.25); ctx.stroke();
    const hue = lerp(8, 160, value);
    ctx.strokeStyle = hsla(hue, 80, 55, 1); ctx.shadowColor = hsla(hue, 80, 55, 0.8); ctx.shadowBlur = r * 0.4;
    ctx.beginPath(); ctx.arc(x, y, r, PI * 0.75, PI * 0.75 + PI * 1.5 * value); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.font = `800 ${Math.round(r * 0.55)}px ${FONT}`; ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(Math.round(value * 100) + "%", x, y);
    ctx.font = `500 ${Math.round(r * 0.22)}px ${FONT}`; ctx.fillStyle = C.aqua; ctx.fillText(title, x, y + r * 1.35);
    ctx.restore();
  }

  /* ---------- scene player ---------- */
  const XFADE = 0.9;
  function render(module, ctx, W, H, time) {
    const scenes = module.scenes; let acc = 0, idx = 0;
    for (; idx < scenes.length; idx++) { if (time < acc + scenes[idx].dur) break; acc += scenes[idx].dur; }
    if (idx >= scenes.length) { idx = scenes.length - 1; acc -= scenes[idx].dur; }
    const sc = scenes[idx], t = time - acc, p = c01(t / sc.dur);
    const g = { W, H, time };
    // slow push-in and drift per scene (Ken Burns), scene index decides direction
    const zoom = 1 + 0.07 * easeInOut(p), dx = (idx % 2 ? 1 : -1) * W * 0.02 * p, dy = -H * 0.012 * p;
    const camera = () => { ctx.translate(W / 2 + dx, H / 2 + dy); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2); };
    ctx.save(); camera(); ctx.globalAlpha = 1; sc.draw(ctx, g, p, t); ctx.restore();
    // crossfade from the previous scene at the start of this one, with a light-leak flash
    if (idx > 0 && t < XFADE) {
      const prev = scenes[idx - 1];
      ctx.save(); ctx.globalAlpha = 1 - easeInOut(t / XFADE); prev.draw(ctx, g, 1, prev.dur); ctx.restore();
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / 0.35) * 0.65; ctx.fillStyle = "#dff7fb"; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    ambient(ctx, W, H, time, 0.35);
    drawCaptions(ctx, W, H, sc, t);
    vignette(ctx, W, H, 0.6);
    grain(ctx, W, H, time, 0.06);
    // letterbox bars
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H * 0.045); ctx.fillRect(0, H * 0.955, W, H * 0.045);
    // persistent module tag
    label(ctx, W * 0.035, H * 0.095, module.title, Math.round(H * 0.024), "rgba(234,246,248,0.55)", "left");
    label(ctx, W * 0.965, H * 0.095, "AQUA · " + (idx + 1) + "/" + scenes.length, Math.round(H * 0.024), "rgba(234,246,248,0.4)", "right");
    return { sceneIndex: idx, sceneTime: t };
  }
  function drawCaptions(ctx, W, H, sc, t) {
    if (!sc.caps) return;
    for (let i = 0; i < sc.caps.length; i++) {
      const c = sc.caps[i], end = i + 1 < sc.caps.length ? sc.caps[i + 1].at : sc.dur + XFADE;
      const a = Math.min(seg(t, c.at, c.at + 0.5), 1 - seg(t, end - 0.4, end));
      if (a > 0) caption(ctx, W, H, c.text, a);
    }
  }
  function duration(module) { return module.scenes.reduce((s, x) => s + x.dur, 0); }
  function sceneStarts(module) { const out = []; let a = 0; for (const s of module.scenes) { out.push(a); a += s.dur; } return out; }

  function applyTiming(timing) { // timing: {moduleId:{scenes:[{dur, caps:[at,...]}]}}
    for (const m of api.modules) { const tm = timing && timing[m.id]; if (!tm) continue; m.scenes.forEach((sc, i) => { const ts = tm.scenes[i]; if (!ts) return; sc.dur = ts.dur; (sc.caps || []).forEach((c, j) => { if (ts.caps[j] != null) c.at = ts.caps[j]; }); }); }
  }
  const api = {
    applyTiming, rays, ambient, lightning, sparks,
    C, FONT, PI, TAU, clamp, c01, lerp, seg, easeOut, easeIn, easeInOut, pulse, rnd, hsla,
    sky, vignette, glow, stars, sun, cloud, rain, splashes, water, ripples, reeds, hills, bird, fish, dragonfly, heron, cracks, particles, grain,
    caption, bigTitle, label, roundRect, gauge, wrap,
    render, duration, sceneStarts, modules: [],
  };
  return api;
});
