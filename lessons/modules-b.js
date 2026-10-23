/* AQUA animated lessons — modules 3 & 4 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) factory(require("./engine.js"));
  else factory(root.AquaLessons);
})(typeof self !== "undefined" ? self : this, function (A) {
  "use strict";
  const { C, seg, easeOut, easeIn, easeInOut, lerp, c01, rnd, hsla, TAU, pulse } = A;

  /* ===================================================================
     LESSON 3 — Too little, too much (drought vs flood)
     =================================================================== */
  // state: water 0..1 (0.5 = healthy), heat 0..1, storm 0..1, life 0..1
  function wetlandScene(ctx, g, s, time) {
    const { W, H } = g, w = s.water, heat = s.heat, storm = s.storm, life = s.life;
    const skyTop = `rgb(${Math.round(lerp(lerp(40, 210, heat), 45, storm))},${Math.round(lerp(lerp(110, 150, heat), 60, storm))},${Math.round(lerp(lerp(150, 90, heat), 75, storm))})`;
    const skyBot = `rgb(${Math.round(lerp(lerp(150, 240, heat), 70, storm))},${Math.round(lerp(lerp(190, 190, heat), 90, storm))},${Math.round(lerp(lerp(200, 120, heat), 105, storm))})`;
    A.sky(ctx, W, H, skyTop, skyBot);
    if (storm < 0.6) { A.sun(ctx, W * 0.78, H * 0.2, H * 0.06, time, heat); A.rays(ctx, W * 0.78, H * 0.2, W, H, time, 0.08 + heat * 0.14); }
    if (storm > 0) { A.cloud(ctx, W * 0.2, H * 0.1, H * 0.1, storm, true); A.cloud(ctx, W * 0.55, H * 0.08, H * 0.12, storm, true); A.cloud(ctx, W * 0.9, H * 0.14, H * 0.09, storm, true); }
    A.hills(ctx, W, H, H * 0.48, heat > 0.6 ? "#6f6a3e" : "#2f4f3a", time, 4, H * 0.05);
    // banks and basin
    const bankY = H * 0.62;
    ctx.fillStyle = heat > 0.5 ? hsla(30, 35, lerp(30, 45, heat), 1) : C.mud; ctx.fillRect(0, bankY - H * 0.02, W, H);
    const cy = H * 0.82, rx = lerp(W * 0.1, W * 0.62, c01(w * 1.3)), ry = lerp(H * 0.04, H * 0.3, w), level = cy - ry;
    const x0 = W / 2 - rx, x1 = W / 2 + rx;
    // exposed mud + cracks when low
    const dryness = c01((0.45 - w) / 0.4);
    A.cracks(ctx, 0, W, bankY, H, dryness, 9);
    // sediment colour in flood
    const flood = c01((w - 0.6) / 0.4);
    const poolClip = () => { ctx.beginPath(); ctx.ellipse(W / 2, cy, rx, ry, 0, 0, TAU); ctx.clip(); };
    ctx.save(); poolClip();
    A.water(ctx, W, H, x0, x1, level, time, { color: flood > 0 ? hsla(lerp(190, 28, flood), 55, 38, 1) : C.teal, top: flood > 0 ? hsla(lerp(190, 30, flood), 50, 55, 1) : C.aqua, amp: H * (0.004 + storm * 0.01), shimmer: 0.2 * (1 - flood) });
    ctx.restore();
    // submerged reeds vs healthy reeds
    const reedBase = Math.min(bankY, level + 4);
    A.reeds(ctx, W * 0.05, W * 0.3, bankY - H * 0.01, 22, H * 0.16 * lerp(0.6, 1, life), time, null, heat > 0.55, 11);
    A.reeds(ctx, W * 0.7, W * 0.95, bankY - H * 0.01, 22, H * 0.16 * lerp(0.6, 1, life), time, null, heat > 0.55, 12);
    // nest on bank — submerged when flood
    const nestY = bankY - H * 0.015;
    ctx.save(); ctx.globalAlpha = 1 - flood * 0.9; ctx.fillStyle = "#8a6a3a"; ctx.beginPath(); ctx.ellipse(W * 0.4, nestY, 22, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = "#f3eee0"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(W * 0.4 - 8 + i * 8, nestY - 4, 4, 5, 0, 0, TAU); ctx.fill(); } ctx.restore();
    // re-draw water in front of nest/reeds when flooded
    if (flood > 0) { ctx.save(); poolClip(); ctx.globalAlpha = 0.85; A.water(ctx, W, H, x0, x1, level, time, { color: hsla(28, 55, 38, 1), top: hsla(30, 50, 55, 1), amp: H * (0.005 + storm * 0.012), shimmer: 0 }); ctx.restore(); }
    // life
    const fishA = life * (1 - dryness) * (1 - flood);
    A.fish(ctx, W * 0.5 + Math.sin(time * 0.5) * W * 0.1, level + H * 0.1, H * 0.02, Math.cos(time * 0.5) > 0 ? 1 : -1, time, fishA);
    A.fish(ctx, W * 0.55 + Math.sin(time * 0.6 + 2) * W * 0.12, level + H * 0.16, H * 0.016, Math.cos(time * 0.6 + 2) > 0 ? 1 : -1, time, fishA);
    A.dragonfly(ctx, W * 0.3 + Math.sin(time * 1.1) * 40, level - H * 0.08 + Math.cos(time * 1.7) * 15, H * 0.02, time, life * (1 - storm));
    A.heron(ctx, W * 0.68, bankY - H * 0.005, H * 0.12, life * (1 - dryness) * (1 - flood * 0.7));
    // birds leaving as life drops
    const leave = 1 - life;
    for (let i = 0; i < 5; i++) { const bx = W * (0.5 + i * 0.07) + leave * W * 0.5 * (1 + rnd(i)) , by = H * (0.3 - i * 0.03) - leave * H * 0.2; A.bird(ctx, bx, by, H * 0.014, time, i); }
    A.rain(ctx, W, H, time, storm * 1.8, 0, W, H * 0.12, H, 13); A.rain(ctx, W, H, time * 1.3, storm, 0, W, H * 0.05, H, 31); A.lightning(ctx, W, H, time, 4, 4, storm);
    A.splashes(ctx, time, storm * 0.7, x0, x1, level, 14);
    if (heat > 0.5) { // heat shimmer lines
      ctx.save(); ctx.globalAlpha = (heat - 0.5) * 0.5; ctx.strokeStyle = "rgba(255,230,180,0.6)";
      for (let i = 0; i < 8; i++) { const y = H * 0.5 + i * H * 0.03; ctx.beginPath(); for (let x = 0; x < W; x += 10) ctx.lineTo(x, y + Math.sin(x * 0.03 + time * 4 + i) * 3); ctx.stroke(); }
      ctx.restore();
    }
  }
  function habitatValue(w) { // non-monotonic: best near 0.5
    return c01(1 - Math.pow((w - 0.5) / 0.38, 2));
  }

  const L3 = {
    id: "extremes", title: "Lesson 3 · Too little, too much",
    short: "Drought vs flood effects on habitat",
    summary: "Why both a dry year and a flood year can empty a wetland of life.",
    scenes: [
      { dur: 6, caps: [], draw(ctx, g, p, t) { wetlandScene(ctx, g, { water: 0.5, heat: 0.2, storm: 0, life: 1 }, g.time); A.bigTitle(ctx, g.W, g.H, "Too little, too much", "Drought, flood and the life between", p); } },
      { dur: 14, caps: [{ at: 0.5, text: "A healthy wetland lives inside a range of water levels." }, { at: 5.5, text: "Shallow water, wet margins and reed beds: fish, insects, frogs and birds all have a place." }, { at: 11, text: "Rainfall keeps that balance. Change the rain, and the balance moves." }],
        draw(ctx, g, p, t) { wetlandScene(ctx, g, { water: 0.5 + Math.sin(g.time * 0.4) * 0.03, heat: 0.2, storm: 0, life: 1 }, g.time); A.gauge(ctx, g.W * 0.88, g.H * 0.45, g.H * 0.07, habitatValue(0.5), "habitat", g.time, pulse(p, 0.2, 1, 0.1)); } },
      { dur: 18, caps: [{ at: 0.5, text: "Drought. The rain fails and the sun keeps pulling water out." }, { at: 5.5, text: "Pools shrink and split. Mud dries and cracks. Water heats and loses oxygen." }, { at: 11, text: "Fish die, reeds brown, and the birds that fed here simply leave." }],
        draw(ctx, g, p, t) { const d = easeInOut(seg(p, 0.1, 0.85)); const w = lerp(0.5, 0.08, d); wetlandScene(ctx, g, { water: w, heat: lerp(0.2, 1, d), storm: 0, life: 1 - d * 0.95 }, g.time); A.gauge(ctx, g.W * 0.88, g.H * 0.45, g.H * 0.07, habitatValue(w), "habitat", g.time, 1); A.label(ctx, g.W * 0.08, g.H * 0.2, "drought", Math.round(g.H * 0.05), "#ffb36b", "left", pulse(p, 0.1, 0.9, 0.1)); } },
      { dur: 18, caps: [{ at: 0.5, text: "Flood. The rain comes all at once." }, { at: 4.5, text: "Water rises past the banks, thick with silt. Nests and burrows drown." }, { at: 10, text: "Fast, muddy water blocks light, strips oxygen and washes young life downstream." }, { at: 15, text: "Too much water can be as deadly as too little." }],
        draw(ctx, g, p, t) { const f = easeInOut(seg(p, 0.08, 0.8)); const w = lerp(0.5, 0.95, f); wetlandScene(ctx, g, { water: w, heat: 0.1, storm: easeOut(seg(p, 0, 0.25)), life: 1 - f * 0.9 }, g.time); A.gauge(ctx, g.W * 0.88, g.H * 0.45, g.H * 0.07, habitatValue(w), "habitat", g.time, 1); A.label(ctx, g.W * 0.08, g.H * 0.2, "flood", Math.round(g.H * 0.05), C.aqua, "left", pulse(p, 0.1, 0.9, 0.1)); } },
      { dur: 12, caps: [{ at: 0.5, text: "Plot habitat against rainfall and you get a hill, not a straight line." }, { at: 5.5, text: "Both extremes push a wetland off the hill. Life lives in the middle." }],
        draw(ctx, g, p, t) {
          const { W, H } = g; A.sky(ctx, W, H, C.night, "#0c3540");
          const x0 = W * 0.12, x1 = W * 0.88, yb = H * 0.74, yt = H * 0.3, reach = easeOut(seg(p, 0.05, 0.6));
          ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.moveTo(x0, yb); ctx.lineTo(x0, yt); ctx.stroke();
          ctx.strokeStyle = C.aqua; ctx.lineWidth = 4; ctx.shadowColor = C.aqua; ctx.shadowBlur = 14; ctx.beginPath();
          for (let u = 0; u <= reach; u += 0.005) { const x = lerp(x0, x1, u), y = yb - habitatValue(u) * (yb - yt) * 0.92; u === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
          ctx.stroke(); ctx.restore();
          A.label(ctx, x0, yt - H * 0.035, "Habitat suitability vs. rainfall", Math.round(H * 0.03), C.ink, "left");
          A.label(ctx, x0, yb + H * 0.045, "drought", Math.round(H * 0.026), "#ffb36b", "left"); A.label(ctx, x1, yb + H * 0.045, "flood", Math.round(H * 0.026), C.aqua, "right"); A.label(ctx, (x0 + x1) / 2, yb + H * 0.045, "balanced rainfall", Math.round(H * 0.026), C.reedLight, "center");
          // moving marker
          const u = 0.5 + Math.sin(g.time * 0.8) * 0.42 * pulse(p, 0.55, 1, 0.1), mx = lerp(x0, x1, u), my = yb - habitatValue(u) * (yb - yt) * 0.92;
          if (reach >= 1) { A.glow(ctx, mx, my, 30, C.white, 0.6); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(mx, my, 7, 0, TAU); ctx.fill(); }
        } },
    ],
  };

  /* ===================================================================
     LESSON 4 — Carbon keepers & the web of life
     =================================================================== */
  const web = [ // food-web nodes (positions normalised)
    { n: "algae", x: 0.18, y: 0.62 }, { n: "insects", x: 0.36, y: 0.42 }, { n: "snails", x: 0.3, y: 0.78 }, { n: "small fish", x: 0.55, y: 0.6 },
    { n: "frogs", x: 0.6, y: 0.32 }, { n: "heron", x: 0.8, y: 0.3 }, { n: "otter", x: 0.82, y: 0.68 }, { n: "reeds", x: 0.12, y: 0.32 },
  ];
  const links = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 3], [3, 5], [3, 6], [4, 5], [7, 1], [7, 4]];
  function foodWeb(ctx, g, reveal, health, time) {
    const { W, H } = g;
    ctx.save();
    links.forEach(([a, b], i) => {
      const on = c01((reveal - 0.3 - i * 0.05) * 4) * health, A_ = web[a], B_ = web[b];
      if (on <= 0) return;
      ctx.strokeStyle = hsla(175, 70, 60, 0.6 * on); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A_.x * W, A_.y * H); ctx.lineTo(B_.x * W, B_.y * H); ctx.stroke();
      // energy pulse travelling along link
      const f = ((time * 0.35) + rnd(i + 70)) % 1; const px = lerp(A_.x, B_.x, f) * W, py = lerp(A_.y, B_.y, f) * H;
      ctx.fillStyle = hsla(60, 90, 75, on); ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU); ctx.fill();
    });
    web.forEach((n, i) => {
      const on = c01((reveal - i * 0.06) * 4), r = H * 0.045 * on, h = lerp(0.3, 1, health);
      if (on <= 0) return;
      A.glow(ctx, n.x * W, n.y * H, r * 2.2, hsla(175, 80, 60, 1), 0.5 * h);
      ctx.fillStyle = hsla(175, 55, lerp(15, 32, h), 1); ctx.beginPath(); ctx.arc(n.x * W, n.y * H, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = hsla(175, 80, 70, h); ctx.lineWidth = 2; ctx.stroke();
      A.label(ctx, n.x * W, n.y * H + r + H * 0.035, n.n, Math.round(H * 0.026), hsla(175, 60, 85, h), "center", on);
    });
    ctx.restore();
  }
  function carbonScene(ctx, g, s, time) {
    // s: water 0..1, layers 0..1 (peat accumulation), drawdown 0..1 (CO2 sinking), release 0..1 (CO2 rising)
    const { W, H } = g, ground = H * 0.58;
    A.sky(ctx, W, H, s.water > 0.4 ? "#1d4458" : "#6a7c5a", s.water > 0.4 ? "#3a7b8a" : "#b9a86a");
    // soil layers accumulating
    const nL = 7; for (let i = 0; i < nL; i++) { const on = c01((s.layers * nL - i)); if (on <= 0) continue; const y = ground + H * 0.05 * i; ctx.fillStyle = hsla(25, 45, lerp(28, 12, i / nL), 1); ctx.fillRect(0, y, W, H * 0.05 * on + 2); }
    ctx.fillStyle = "#1a1109"; ctx.fillRect(0, ground + H * 0.05 * nL, W, H);
    A.label(ctx, W * 0.03, ground + H * 0.05 * nL - 8, s.layers > 0.9 ? "peat: thousands of years of stored carbon" : "", Math.round(H * 0.024), "rgba(234,246,248,0.6)", "left");
    // water table
    const level = lerp(ground + H * 0.25, ground - H * 0.08, s.water);
    ctx.save(); ctx.globalAlpha = 0.45; A.water(ctx, W, H, 0, W, level, time, { amp: H * 0.004, bottom: ground + H * 0.1, shimmer: 0.1 }); ctx.restore();
    if (s.water > 0.4) { ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = C.aqua; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(0, lerp(ground + H * 0.2, ground + H * 0.02, s.water)); ctx.lineTo(W, lerp(ground + H * 0.2, ground + H * 0.02, s.water)); ctx.stroke(); ctx.restore(); A.label(ctx, W * 0.97, lerp(ground + H * 0.2, ground + H * 0.02, s.water) - 6, "water table", Math.round(H * 0.022), "rgba(141,227,240,0.7)", "right"); }
    A.reeds(ctx, 0, W, ground - 2, 60, H * 0.22 * lerp(0.5, 1, s.water), time, null, s.water < 0.3, 21);
    if (s.water < 0.4) A.cracks(ctx, 0, W, ground - H * 0.01, ground + H * 0.08, (0.4 - s.water) * 2.5, 22);
    // CO2 particles
    const list = [];
    for (let i = 0; i < 90; i++) {
      const x = rnd(i + 400) * W, sp = 0.06 + rnd(i + 401) * 0.06;
      if (s.drawdown > 0 && rnd(i + 402) < s.drawdown) { const f = ((time * sp) + rnd(i + 403)) % 1; list.push({ x: x + Math.sin(time + i) * 10, y: lerp(H * 0.05, ground + H * 0.15, f), r: 3, a: (1 - f * 0.6), col: f < 0.6 ? "#cfe8ff" : "#8a5a2a" }); }
      if (s.release > 0 && rnd(i + 405) < s.release) { const f = ((time * sp * 1.6) + rnd(i + 406)) % 1; list.push({ x: x + Math.sin(time * 2 + i) * 14, y: lerp(ground + H * 0.1, -H * 0.05, f), r: 3 + f * 2, a: (1 - f) * 0.9, col: "#ff9a6a" }); }
    }
    A.particles(ctx, time, list);
  }

  const L4 = {
    id: "carbon", title: "Lesson 4 · Carbon keepers",
    short: "Wetland carbon & biodiversity",
    summary: "The two hidden jobs a wet wetland does for the whole planet.",
    scenes: [
      { dur: 6, caps: [], draw(ctx, g, p, t) { carbonScene(ctx, g, { water: 0.8, layers: 1, drawdown: 0.3, release: 0 }, g.time); A.bigTitle(ctx, g.W, g.H, "Carbon keepers", "Peat, water and the web of life", p); } },
      { dur: 16, caps: [{ at: 0.5, text: "Wetland plants pull carbon dioxide out of the air as they grow." }, { at: 5, text: "When they die, waterlogged soil has almost no oxygen — so they barely decay." }, { at: 10, text: "Layer by layer, that carbon piles up as peat. Peatlands cover about 3% of land yet hold roughly a third of all soil carbon." }],
        draw(ctx, g, p, t) { carbonScene(ctx, g, { water: 0.8, layers: easeInOut(seg(p, 0.3, 0.95)), drawdown: easeOut(seg(p, 0.05, 0.4)), release: 0 }, g.time); A.label(ctx, g.W * 0.5, g.H * 0.12, "CO₂ in", Math.round(g.H * 0.034), "#cfe8ff", "center", pulse(p, 0.1, 0.5, 0.1)); } },
      { dur: 16, caps: [{ at: 0.5, text: "That same standing water powers a second job: it links every living thing here." }, { at: 5.5, text: "Algae feed insects and snails. They feed fish and frogs. They feed herons and otters." }, { at: 11, text: "Wetlands cover a small fraction of Earth but support a huge share of its species." }],
        draw(ctx, g, p, t) { const { W, H } = g; A.sky(ctx, W, H, "#06202a", "#0b3b47"); A.water(ctx, W, H, 0, W, H * 0.9, g.time, { amp: H * 0.004, shimmer: 0.1 }); foodWeb(ctx, g, easeOut(seg(p, 0.05, 0.75)), 1, g.time); } },
      { dur: 16, caps: [{ at: 0.5, text: "Now drain it — or let the rain fail for a few seasons." }, { at: 5, text: "Air enters the peat. Microbes wake up and the carbon burns off as CO₂ — centuries of storage, undone in years." }, { at: 11, text: "And with the water gone, the web unravels link by link." }],
        draw(ctx, g, p, t) {
          const { W, H } = g, d = easeInOut(seg(p, 0.1, 0.85));
          carbonScene(ctx, g, { water: lerp(0.8, 0.1, d), layers: 1 - d * 0.4, drawdown: 1 - d, release: d }, g.time);
          A.label(ctx, W * 0.5, H * 0.12, "CO₂ out", Math.round(H * 0.034), "#ff9a6a", "center", pulse(p, 0.3, 0.9, 0.1));
          // mini food web fading in the corner
          ctx.save(); ctx.translate(W * 0.58, H * 0.02); ctx.scale(0.42, 0.42); ctx.globalAlpha = 0.9; foodWeb(ctx, g, 1, 1 - d, g.time); ctx.restore();
        } },
      { dur: 10, caps: [{ at: 0.5, text: "Bring the water back and both jobs restart: carbon sinks, life returns." }, { at: 6, text: "Keep the water. Keep the carbon. Keep the life." }],
        draw(ctx, g, p, t) {
          const { W, H } = g, r = easeInOut(seg(p, 0.05, 0.7));
          carbonScene(ctx, g, { water: lerp(0.1, 0.8, r), layers: lerp(0.6, 1, r), drawdown: r, release: 1 - r }, g.time);
          A.rain(ctx, W, H, g.time, 1.3 * pulse(p, 0, 0.6, 0.15), 0, W, H * 0.05, H * 0.6, 23); A.sparks(ctx, W * 0.5, H * 0.45, t, 0.6, 90, "#cdff64");
          ctx.save(); ctx.translate(W * 0.58, H * 0.02); ctx.scale(0.42, 0.42); ctx.globalAlpha = 0.9; foodWeb(ctx, g, 1, r, g.time); ctx.restore();
        } },
    ],
  };

  A.modules.push(L3, L4);
});
