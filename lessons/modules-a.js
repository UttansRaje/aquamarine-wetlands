/* AQUA animated lessons — modules 1 & 2 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) factory(require("./engine.js"));
  else factory(root.AquaLessons);
})(typeof self !== "undefined" ? self : this, function (A) {
  "use strict";
  const { C, seg, easeOut, easeIn, easeInOut, lerp, c01, rnd, hsla, TAU, pulse } = A;

  /* ===================================================================
     LESSON 1 — The water cycle & changing rainfall
     =================================================================== */
  function oceanScene(ctx, g, sunHeight, heat, cloudA, cloudDark, rainI, time) {
    const { W, H } = g;
    const night = 1 - sunHeight;
    A.sky(ctx, W, H, `rgb(${Math.round(lerp(6, 70, sunHeight))},${Math.round(lerp(26, 120, sunHeight))},${Math.round(lerp(31, 150, sunHeight))})`, `rgb(${Math.round(lerp(10, 190, sunHeight))},${Math.round(lerp(40, 150, sunHeight))},${Math.round(lerp(50, 90, sunHeight))})`);
    A.stars(ctx, W, H, time, night * 0.8);
    A.sun(ctx, W * 0.72, lerp(H * 0.95, H * 0.22, sunHeight), H * 0.07, time, heat);
    if (cloudA > 0) { A.cloud(ctx, W * 0.3, H * 0.2, H * 0.09, cloudA, cloudDark); A.cloud(ctx, W * 0.55, H * 0.14, H * 0.07, cloudA * 0.8, cloudDark); }
    A.water(ctx, W, H, 0, W, H * 0.62, time, { amp: H * 0.01, top: hsla(190, 60, lerp(30, 70, sunHeight), 1), shimmer: 0.2 + sunHeight * 0.3 });
    A.rain(ctx, W, H, time, rainI, 0, W, H * 0.2, H * 0.63, 1);
    A.splashes(ctx, time, rainI, 0, W, H * 0.63, 1);
    // sun reflection
    A.glow(ctx, W * 0.72, H * 0.66, H * 0.25, C.sun, 0.25 * sunHeight);
  }
  function vapour(ctx, g, time, amount, gatherY) {
    const { W, H } = g, list = [];
    for (let i = 0; i < 140; i++) {
      const f = ((time * (0.08 + rnd(i + 3) * 0.08)) + rnd(i)) % 1;
      if (rnd(i + 11) > amount) continue;
      const x = rnd(i + 1) * W + Math.sin(time + i) * 18, y = lerp(H * 0.6, gatherY, f);
      const a = Math.min(f * 4, 1) * (gatherY > H * 0.3 ? 1 - f : 1) * 0.6;
      list.push({ x, y, r: 2 + rnd(i + 2) * 3, a, col: C.foam });
    }
    A.particles(ctx, time, list);
  }

  const L1 = {
    id: "water-cycle", title: "Lesson 1 · The water cycle",
    short: "Water cycle & rainfall patterns",
    summary: "Where rain comes from, where it goes, and why its rhythm is shifting.",
    scenes: [
      { dur: 8, caps: [{ at: 3.2, text: "Every drop that fills a wetland is on a journey that never ends." }],
        draw(ctx, g, p, t) { oceanScene(ctx, g, easeOut(seg(p, 0, 0.6)), 0.2, 0, false, 0, g.time); A.rays(ctx, g.W * 0.72, g.H * 0.22, g.W, g.H, g.time, 0.12 * easeOut(seg(p, 0.3, 0.8))); A.bigTitle(ctx, g.W, g.H, "The water cycle", "Where rain begins", p); } },
      { dur: 12, caps: [{ at: 0.5, text: "The sun warms oceans, lakes and wet soil." }, { at: 5.5, text: "Water rises as invisible vapour — evaporation." }],
        draw(ctx, g, p, t) { oceanScene(ctx, g, 1, 0.6, 0, false, 0, g.time); A.rays(ctx, g.W * 0.72, g.H * 0.22, g.W, g.H, g.time, 0.16); vapour(ctx, g, g.time, easeOut(seg(p, 0.1, 0.6)), g.H * 0.12); A.label(ctx, g.W * 0.5, g.H * 0.5, "evaporation", Math.round(g.H * 0.03), C.foam, "center", pulse(p, 0.45, 0.95, 0.15)); } },
      { dur: 12, caps: [{ at: 0.5, text: "High up, the air is colder. Vapour condenses into tiny droplets." }, { at: 6, text: "Billions of droplets together are a cloud — condensation." }],
        draw(ctx, g, p, t) {
          const a = easeOut(seg(p, 0.05, 0.7)), dark = seg(p, 0.6, 1);
          oceanScene(ctx, g, 1 - dark * 0.35, 0.4, a, dark > 0.5, 0, g.time);
          vapour(ctx, g, g.time, 1 - easeIn(seg(p, 0.6, 1)), g.H * 0.18);
          A.cloud(ctx, g.W * 0.42, g.H * 0.17, g.H * (0.05 + 0.08 * a), a, dark > 0.5);
          A.label(ctx, g.W * 0.42, g.H * 0.36, "condensation", Math.round(g.H * 0.03), C.foam, "center", pulse(p, 0.35, 0.95, 0.15));
        } },
      { dur: 14, caps: [{ at: 0.4, text: "Heavy droplets fall as rain — precipitation." }, { at: 5, text: "Rain runs off hills and streams, collecting in the lowest places on the land." }, { at: 10, text: "Those low, wet places are wetlands." }],
        draw(ctx, g, p, t) {
          const { W, H } = g, time = g.time, rainI = easeOut(seg(p, 0, 0.25)) * (1 - easeIn(seg(p, 0.85, 1)));
          A.sky(ctx, W, H, "#3a4b58", "#6b7f8a");
          A.cloud(ctx, W * 0.25, H * 0.12, H * 0.09, 1, true); A.cloud(ctx, W * 0.62, H * 0.1, H * 0.1, 1, true); A.cloud(ctx, W * 0.9, H * 0.16, H * 0.07, 0.9, true);
          A.hills(ctx, W, H, H * 0.5, "#2f4f3a", time, 1, H * 0.06); A.hills(ctx, W, H, H * 0.6, "#3d6b45", time, 2, H * 0.05);
          // streams running down to the basin
          ctx.save(); ctx.strokeStyle = C.aqua; ctx.lineWidth = 3; ctx.lineCap = "round";
          const flow = easeOut(seg(p, 0.15, 0.6));
          for (const [sx, sy] of [[0.15, 0.52], [0.8, 0.5], [0.4, 0.57]]) {
            ctx.globalAlpha = 0.8 * flow; ctx.setLineDash([14, 12]); ctx.lineDashOffset = -time * 60;
            ctx.beginPath(); ctx.moveTo(W * sx, H * sy); ctx.quadraticCurveTo(W * (sx + 0.1), H * 0.68, W * 0.5, H * 0.78); ctx.stroke();
          }
          ctx.restore();
          const level = lerp(H * 0.9, H * 0.76, easeInOut(seg(p, 0.25, 0.85)));
          ctx.save(); ctx.fillStyle = C.mud; ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.86, W * 0.42, H * 0.16, 0, 0, TAU); ctx.fill(); ctx.restore();
          ctx.save(); ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.86, W * 0.4, H * 0.15, 0, 0, TAU); ctx.clip();
          A.water(ctx, W, H, W * 0.1, W * 0.9, level, time, { amp: H * 0.005 }); ctx.restore();
          A.reeds(ctx, W * 0.1, W * 0.3, H * 0.8, 18, H * 0.14, time, null, false, 1); A.reeds(ctx, W * 0.7, W * 0.9, H * 0.8, 18, H * 0.14, time, null, false, 2);
          A.rain(ctx, W, H, time, rainI * 1.7, 0, W, H * 0.15, H * 0.95, 2); A.rain(ctx, W, H, time * 1.3, rainI * 1.2, 0, W, H * 0.1, H, 21); A.lightning(ctx, W, H, time, 4.5, 1, 0.9 * rainI);
          A.label(ctx, W * 0.5, H * 0.3, "precipitation", Math.round(H * 0.03), C.foam, "center", pulse(p, 0.05, 0.4, 0.1));
          A.label(ctx, W * 0.5, H * 0.72, "collection", Math.round(H * 0.03), C.foam, "center", pulse(p, 0.5, 1, 0.1));
        } },
      { dur: 20, caps: [{ at: 0.5, text: "But the rhythm of the rain is changing." }, { at: 5, text: "Warmer air holds about 7% more moisture for every 1 °C of warming." }, { at: 11, text: "So rain tends to arrive in heavier bursts — with longer dry gaps in between." }, { at: 16.5, text: "Same yearly total, very different year. Next: what that does to a wetland." }],
        draw(ctx, g, p, t) {
          const { W, H } = g, time = g.time;
          A.sky(ctx, W, H, C.night, "#0c3540");
          // chart frame
          const x0 = W * 0.1, x1 = W * 0.9, yb = H * 0.74, yt = H * 0.28, months = 12;
          ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.moveTo(x0, yb); ctx.lineTo(x0, yt); ctx.stroke(); ctx.restore();
          A.label(ctx, x0, yt - H * 0.03, "Monthly rainfall, one year", Math.round(H * 0.03), C.ink, "left");
          const then = [1, 1.2, 1.5, 2, 3.5, 6, 7, 6.5, 5, 2.5, 1.3, 1];
          const now = [0.3, 0.4, 0.6, 0.9, 1.5, 9.5, 2.5, 10, 7, 0.9, 0.5, 0.2];
          const mix = easeInOut(seg(p, 0.25, 0.7));
          const bw = (x1 - x0) / months;
          for (let i = 0; i < months; i++) {
            const grow = easeOut(seg(p, 0.02 + i * 0.015, 0.2 + i * 0.015));
            const v = lerp(then[i], now[i], mix) * grow, h = v / 10 * (yb - yt);
            const extreme = c01((v - 6.5) / 3) * mix, dry = c01((1 - v) / 1) * mix;
            ctx.fillStyle = hsla(lerp(190, 8, extreme), 75, lerp(55, 60, extreme), 1);
            if (dry > 0.3) ctx.fillStyle = hsla(38, 60, 50, 1);
            A.roundRect(ctx, x0 + i * bw + bw * 0.18, yb - h, bw * 0.64, h, 4); ctx.fill();
            if (extreme > 0.2) A.glow(ctx, x0 + i * bw + bw * 0.5, yb - h, bw, C.warn, 0.4 * extreme);
            A.label(ctx, x0 + i * bw + bw * 0.5, yb + H * 0.045, "JFMAMJJASOND"[i], Math.round(H * 0.024), "rgba(234,246,248,0.6)", "center");
          }
          // tags
          A.label(ctx, x1, yt - H * 0.03, mix < 0.5 ? "a typical past year" : "a warmer-world year", Math.round(H * 0.028), mix < 0.5 ? C.aqua : C.warn, "right");
          if (mix > 0.6) {
            A.label(ctx, x0 + bw * 6, yt + H * 0.05, "heavier bursts", Math.round(H * 0.028), C.warn, "left", pulse(p, 0.55, 1, 0.1));
            A.label(ctx, x0 + bw * 1.5, yb - H * 0.1, "longer dry gaps", Math.round(H * 0.028), "#e0b060", "left", pulse(p, 0.6, 1, 0.1));
          }
          A.rain(ctx, W, H, time, 0.25 * mix * pulse(p, 0.5, 1, 0.2), x0 + bw * 5, x0 + bw * 9, yt - H * 0.2, yb, 3);
        } },
    ],
  };

  /* ===================================================================
     LESSON 2 — Wetlands as sponges / flood buffers
     =================================================================== */
  function crossSection(ctx, g, x0, x1, kind, soak, surfaceWater, time, label) {
    // kind: "hard" (drained/paved) or "sponge" (wetland)
    const { W, H } = g, ground = H * 0.55, bottom = H * 0.95;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, H); ctx.clip();
    if (kind === "hard") {
      ctx.fillStyle = "#6e6e6e"; ctx.fillRect(x0, ground, x1 - x0, H * 0.05);
      ctx.fillStyle = "#4a3b31"; ctx.fillRect(x0, ground + H * 0.05, x1 - x0, bottom - ground);
      for (let i = 0; i < 10; i++) { ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(x0 + ((i + 0.5) / 10) * (x1 - x0) - 1, ground, 2, H * 0.05); }
      // thin fast sheet of water
      if (surfaceWater > 0) { ctx.fillStyle = C.aqua; ctx.globalAlpha = 0.8; ctx.fillRect(x0, ground - H * 0.012 * surfaceWater, x1 - x0, H * 0.012 * surfaceWater); ctx.globalAlpha = 1;
        ctx.strokeStyle = C.foam; ctx.lineWidth = 2; ctx.setLineDash([10, 16]); ctx.lineDashOffset = -time * 180; ctx.beginPath(); ctx.moveTo(x0, ground - H * 0.005); ctx.lineTo(x1, ground - H * 0.005); ctx.stroke(); ctx.setLineDash([]); }
    } else {
      // peat layers
      const layers = ["#4d3523", "#3f2a1a", "#352214", "#2b1a0f"];
      layers.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(x0, ground + i * H * 0.1, x1 - x0, H * 0.11); });
      // pores filling with water
      for (let i = 0; i < 160; i++) {
        const px = x0 + rnd(i) * (x1 - x0), py = ground + H * 0.02 + rnd(i + 1) * (bottom - ground - H * 0.04), depth = (py - ground) / (bottom - ground);
        const filled = c01((soak - depth) * 2.5);
        ctx.fillStyle = filled > 0 ? hsla(190, 70, lerp(35, 60, filled), 0.9) : "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.arc(px, py, 2 + rnd(i + 2) * 4, 0, TAU); ctx.fill();
      }
      // roots
      ctx.strokeStyle = "rgba(200,170,120,0.5)"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) { const rx = x0 + rnd(i + 30) * (x1 - x0); ctx.beginPath(); ctx.moveTo(rx, ground); ctx.quadraticCurveTo(rx + (rnd(i) - 0.5) * 40, ground + H * 0.1, rx + (rnd(i + 1) - 0.5) * 60, ground + H * 0.2 + rnd(i + 2) * H * 0.1); ctx.stroke(); }
      ctx.fillStyle = "#3b5f2f"; ctx.fillRect(x0, ground - H * 0.015, x1 - x0, H * 0.02);
      if (surfaceWater > 0) { ctx.fillStyle = C.teal; ctx.globalAlpha = 0.6; ctx.fillRect(x0, ground - H * 0.015 - H * 0.03 * surfaceWater, x1 - x0, H * 0.03 * surfaceWater); ctx.globalAlpha = 1; }
      A.reeds(ctx, x0 + 10, x1 - 10, ground - H * 0.01, 24, H * 0.13, time, null, false, 5);
    }
    ctx.restore();
    A.label(ctx, (x0 + x1) / 2, H * 0.23, label, Math.round(H * 0.032), C.ink, "center");
  }
  function hydrograph(ctx, g, p, showHard, showSponge, time) {
    const { W, H } = g, x0 = W * 0.12, x1 = W * 0.88, yb = H * 0.74, yt = H * 0.3;
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.moveTo(x0, yb); ctx.lineTo(x0, yt); ctx.stroke(); ctx.restore();
    A.label(ctx, x0, yt - H * 0.035, "River flow downstream after one storm", Math.round(H * 0.03), C.ink, "left");
    A.label(ctx, x1, yb + H * 0.045, "time → (hours to days)", Math.round(H * 0.024), "rgba(234,246,248,0.6)", "right");
    A.label(ctx, x0 - 6, yt + H * 0.01, "flow", Math.round(H * 0.024), "rgba(234,246,248,0.6)", "right");
    const hard = (u) => Math.exp(-Math.pow((u - 0.18) / 0.06, 2)) * 1 + 0.05;
    const sponge = (u) => Math.exp(-Math.pow((u - 0.45) / 0.22, 2)) * 0.32 + 0.08;
    const drawCurve = (fn, col, reach, glowCol) => {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.shadowColor = glowCol; ctx.shadowBlur = 12; ctx.beginPath();
      for (let u = 0; u <= reach; u += 0.005) { const x = lerp(x0, x1, u), y = yb - fn(u) * (yb - yt) * 0.9; u === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      if (reach > 0 && reach < 1) { const x = lerp(x0, x1, reach), y = yb - fn(reach) * (yb - yt) * 0.9; ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); }
      ctx.restore();
    };
    if (showHard > 0) drawCurve(hard, C.warn, showHard, C.warn);
    if (showSponge > 0) drawCurve(sponge, C.aqua, showSponge, C.aqua);
    if (showHard > 0.5) A.label(ctx, lerp(x0, x1, 0.24), yt + H * 0.04, "drained land: sharp flood peak", Math.round(H * 0.027), C.warn, "left");
    if (showSponge > 0.6) A.label(ctx, lerp(x0, x1, 0.5), yb - H * 0.17, "wetland: lower, later, longer", Math.round(H * 0.027), C.aqua, "left");
    // rain pulse marker
    A.rain(ctx, W, H, time, 0.4 * pulse(p, 0, 0.3, 0.1), x0, lerp(x0, x1, 0.15), yt - H * 0.1, yb, 4);
  }

  const L2 = {
    id: "sponge", title: "Lesson 2 · The living sponge",
    short: "Wetlands as sponges & flood buffers",
    summary: "Why the same storm floods one valley and barely ripples another.",
    scenes: [
      { dur: 7, caps: [{ at: 3, text: "A wetland does something concrete and pavement never can." }],
        draw(ctx, g, p, t) { const { W, H } = g; A.sky(ctx, W, H, "#1c2f3a", "#0a2a33"); A.cloud(ctx, W * 0.7, H * 0.15, H * 0.1, 1, true); A.rain(ctx, W, H, g.time, 1.4 * easeOut(seg(p, 0.2, 0.6)), 0, W, H * 0.1, H, 6); A.lightning(ctx, W, H, g.time, 3.2, 2, 1); A.bigTitle(ctx, W, H, "The living sponge", "How wetlands tame floods", p); } },
      { dur: 16, caps: [{ at: 0.5, text: "Same storm. Two landscapes." }, { at: 4.5, text: "On drained, compacted or paved land, water cannot sink in. It sheets straight off." }, { at: 10.5, text: "In a wetland, peat, roots and still water drink the rain into the ground." }],
        draw(ctx, g, p, t) {
          const { W, H } = g, time = g.time;
          A.sky(ctx, W, H, "#2b3f4c", "#4d6572");
          A.cloud(ctx, W * 0.25, H * 0.09, H * 0.09, 1, true); A.cloud(ctx, W * 0.75, H * 0.09, H * 0.09, 1, true);
          const storm = easeOut(seg(p, 0.05, 0.3)) * (1 - easeIn(seg(p, 0.85, 1)));
          crossSection(ctx, g, 0, W * 0.49, "hard", 0, storm, time, "Drained land");
          crossSection(ctx, g, W * 0.51, W, "sponge", easeInOut(seg(p, 0.25, 0.95)), storm * 0.6, time, "Wetland");
          ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(W * 0.49, 0, W * 0.02, H);
          A.rain(ctx, W, H, time, storm * 1.8, 0, W, H * 0.12, H * 0.55, 7); A.rain(ctx, W, H, time * 1.25, storm, 0, W, H * 0.05, H * 0.56, 27);
          A.splashes(ctx, time, storm * 1.5, 0, W * 0.49, H * 0.55, 8); A.lightning(ctx, W, H, time, 5, 3, storm);
        } },
      { dur: 18, caps: [{ at: 0.5, text: "Measure the river downstream and the difference is dramatic." }, { at: 5, text: "Drained land sends the water out in hours — a sharp, dangerous flood peak." }, { at: 11, text: "A wetland holds it in soil and plants, then releases it slowly over days." }],
        draw(ctx, g, p, t) { const { W, H } = g; A.sky(ctx, W, H, C.night, "#0c3540"); hydrograph(ctx, g, p, easeOut(seg(p, 0.15, 0.5)), easeOut(seg(p, 0.45, 0.95)), g.time); } },
      { dur: 14, caps: [{ at: 0.5, text: "Zoom in and the sponge is real: peat is mostly tiny pores." }, { at: 5.5, text: "Water fills them slowly, and roots hold the soil so it isn't washed away." }, { at: 10, text: "As water seeps through, silt and excess nutrients are filtered out." }],
        draw(ctx, g, p, t) {
          const { W, H } = g, time = g.time;
          A.sky(ctx, W, H, "#1a120c", "#0d0906");
          // magnified pore field
          const fill = easeInOut(seg(p, 0.1, 0.75));
          for (let i = 0; i < 320; i++) {
            const x = rnd(i + 200) * W, y = H * 0.12 + rnd(i + 201) * H * 0.8, r = 6 + rnd(i + 202) * 22, depth = (y - H * 0.12) / (H * 0.8);
            const f = c01((fill - depth * 0.9) * 3);
            ctx.fillStyle = "#2b1a0f"; ctx.beginPath(); ctx.arc(x, y, r + 2, 0, TAU); ctx.fill();
            ctx.fillStyle = f > 0 ? hsla(190, 70, lerp(25, 62, f), 1) : "#15100b"; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
            if (f > 0.5) { ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, TAU); ctx.fill(); }
          }
          // roots across
          ctx.save(); ctx.strokeStyle = "rgba(214,184,130,0.7)"; ctx.lineWidth = 5; ctx.lineCap = "round";
          for (let i = 0; i < 6; i++) { const rx = rnd(i + 60) * W; ctx.beginPath(); ctx.moveTo(rx, 0); ctx.bezierCurveTo(rx + 60, H * 0.3, rx - 80, H * 0.6, rx + (rnd(i) - 0.5) * 200, H); ctx.stroke(); }
          ctx.restore();
          // silt particles trapped
          const list = [];
          for (let i = 0; i < 80; i++) { const f = ((time * 0.12) + rnd(i + 300)) % 1; const trapped = seg(p, 0.6, 0.9); const y = lerp(0, H * (0.3 + rnd(i + 301) * 0.5), f); list.push({ x: rnd(i + 302) * W, y: trapped > 0 ? Math.min(y, H * (0.3 + rnd(i + 301) * 0.5)) : y, r: 2, a: 0.8, col: "#b08a5a" }); }
          A.particles(ctx, time, list);
          A.label(ctx, W * 0.5, H * 0.1, "×200 — inside the peat", Math.round(H * 0.026), "rgba(234,246,248,0.6)", "center");
        } },
      { dur: 9, caps: [{ at: 0.5, text: "When the rain stops, the sponge keeps giving: streams stay alive through the dry season." }, { at: 6, text: "Lose the wetland and you lose both the brake and the reserve." }],
        draw(ctx, g, p, t) {
          const { W, H } = g, time = g.time;
          A.sky(ctx, W, H, "#5b7f9a", "#d9c58a"); A.sun(ctx, W * 0.82, H * 0.18, H * 0.06, time, 0.8);
          crossSection(ctx, g, 0, W * 0.49, "hard", 0, 0, time, "Drained land");
          A.cracks(ctx, 0, W * 0.49, H * 0.5, H * 0.6, 0.9, 3);
          crossSection(ctx, g, W * 0.51, W, "sponge", 1 - 0.5 * easeInOut(p), 0.3 * (1 - p), time, "Wetland");
          ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(W * 0.49, 0, W * 0.02, H);
          // trickle out of sponge
          ctx.save(); ctx.strokeStyle = C.aqua; ctx.lineWidth = 3; ctx.setLineDash([8, 14]); ctx.lineDashOffset = -time * 50; ctx.globalAlpha = 0.8;
          ctx.beginPath(); ctx.moveTo(W * 0.98, H * 0.72); ctx.lineTo(W * 0.98, H * 0.95); ctx.stroke(); ctx.restore();
          A.label(ctx, W * 0.96, H * 0.68, "slow release", Math.round(H * 0.026), C.aqua, "right");
        } },
    ],
  };

  A.modules.push(L1, L2);
});
