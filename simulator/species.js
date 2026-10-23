/* AQUA weather simulator — flora & fauna layer.
   Reads the wetland's real plant and animal lists from data/content.json, classifies each name, places silhouettes
   on the photo (water creatures on water, waders at the edge, birds in the sky, grazers on land) and fades them
   in or out as conditions change. */
const RULES = [
  ["fish", /fish|sturgeon|carp|catfish|salmon|barramundi|hilsa|mullet/i, "water"],
  ["dolphin", /dolphin|manatee|dugong|whale|seal/i, "water"],
  ["croc", /crocodile|alligator|caiman|gharial|turtle/i, "edge"],
  ["hippo", /hippo/i, "water"],
  ["wader", /crane|heron|egret|stork|flamingo|pelican|spoonbill|ibis|cormorant|shorebird|sandpiper|plover|wader|waterbird|goose|geese|duck|swan|teal/i, "edge"],
  ["bird", /eagle|kite|osprey|bird|hawk|owl|parrot|swallow/i, "sky"],
  ["bigmammal", /elephant|buffalo|deer|lechwe|antelope|wild ass|asses|kiang|horse|zebra|capybara|wallaby|kangaroo|tiger|jaguar|cat|otter|boar/i, "land"],
  ["frog", /frog|toad|newt|salamander/i, "edge"],
  ["insect", /dragonfl|butterfl|insect|bee|mosquito/i, "water"],
  ["shellfish", /shellfish|crab|mussel|oyster|shrimp|prawn|snail|mollusc|worm/i, "edge"],
];
function classify(name) { for (const [kind, re, zone] of RULES) if (re.test(name)) return { kind, zone }; return { kind: "bird", zone: "sky" }; }

/* silhouettes (unit size ~ s px) */
const draw = {
  fish(x, c, s, t) { const w = Math.sin(t * 6) * 0.25; x.beginPath(); x.ellipse(0, 0, s, s * 0.38, 0, 0, 7); x.moveTo(-s * 0.9, 0); x.lineTo(-s * 1.5, -s * 0.5 + w * s); x.lineTo(-s * 1.5, s * 0.5 + w * s); x.closePath(); x.fill(); },
  dolphin(x, c, s, t) { const b = Math.sin(t * 2) * 0.2; x.beginPath(); x.moveTo(-s * 1.4, s * 0.2); x.quadraticCurveTo(-s * 0.4, -s * 0.9 - b * s, s * 0.8, -s * 0.1); x.quadraticCurveTo(s * 1.2, 0, s * 1.5, s * 0.25); x.lineTo(-s * 1.4, s * 0.25); x.closePath(); x.fill(); x.beginPath(); x.moveTo(-s * 0.2, -s * 0.5); x.lineTo(0, -s * 1.0); x.lineTo(s * 0.25, -s * 0.5); x.fill(); },
  croc(x, c, s, t) { x.beginPath(); x.moveTo(-s * 1.6, 0); x.quadraticCurveTo(-s * 0.6, -s * 0.45, s * 0.3, -s * 0.3); x.lineTo(s * 1.6, -s * 0.12); x.lineTo(s * 1.6, s * 0.1); x.lineTo(-s * 1.6, s * 0.15); x.closePath(); x.fill(); for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(-s * 1.1 + i * s * 0.35, -s * 0.33); x.lineTo(-s * 1.0 + i * s * 0.35, -s * 0.6); x.lineTo(-s * 0.9 + i * s * 0.35, -s * 0.33); x.fill(); } },
  hippo(x, c, s, t) { x.beginPath(); x.ellipse(0, 0, s * 1.3, s * 0.5, 0, Math.PI, 0); x.lineTo(s * 1.3, s * 0.15); x.lineTo(-s * 1.3, s * 0.15); x.closePath(); x.fill(); x.beginPath(); x.ellipse(s * 1.2, -s * 0.1, s * 0.45, s * 0.3, 0, Math.PI, 0); x.fill(); },
  wader(x, c, s, t) { const nod = Math.sin(t * 1.3) * 0.08; x.lineWidth = s * 0.08; x.lineCap = "round"; x.strokeStyle = c; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -s * 0.9); x.moveTo(s * 0.15, 0); x.lineTo(s * 0.12, -s * 0.9); x.stroke();
    x.beginPath(); x.ellipse(s * 0.05, -s * 1.1, s * 0.5, s * 0.28, -0.15, 0, 7); x.fill(); x.beginPath(); x.moveTo(s * 0.3, -s * 1.25); x.quadraticCurveTo(s * 0.45 + nod * s, -s * 1.9, s * 0.72, -s * 1.9 + nod * s); x.stroke();
    x.beginPath(); x.ellipse(s * 0.75, -s * 1.9 + nod * s, s * 0.14, s * 0.1, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(s * 0.85, -s * 1.9 + nod * s); x.lineTo(s * 1.3, -s * 1.82 + nod * s); x.stroke(); },
  bird(x, c, s, t) { const f = Math.sin(t * 7) * 0.6; x.lineWidth = Math.max(1.2, s * 0.14); x.lineCap = "round"; x.strokeStyle = c; x.beginPath(); x.moveTo(-s, f * s * 0.5); x.quadraticCurveTo(-s * 0.5, -s * 0.3, 0, 0); x.quadraticCurveTo(s * 0.5, -s * 0.3, s, f * s * 0.5); x.stroke(); },
  bigmammal(x, c, s, t) { const st = Math.sin(t * 1.6) * 0.1; x.beginPath(); x.ellipse(0, -s * 0.6, s * 0.9, s * 0.45, 0, 0, 7); x.fill(); x.lineWidth = s * 0.14; x.strokeStyle = c; x.lineCap = "round";
    for (const [lx, d] of [[-0.6, 1], [-0.35, -1], [0.35, 1], [0.6, -1]]) { x.beginPath(); x.moveTo(lx * s, -s * 0.4); x.lineTo(lx * s + d * st * s, 0); x.stroke(); }
    x.beginPath(); x.moveTo(s * 0.8, -s * 0.8); x.lineTo(s * 1.2, -s * 1.05); x.stroke(); x.beginPath(); x.ellipse(s * 1.3, -s * 1.05, s * 0.3, s * 0.2, 0.2, 0, 7); x.fill(); },
  frog(x, c, s, t) { x.beginPath(); x.ellipse(0, 0, s * 0.6, s * 0.35, 0, 0, 7); x.fill(); x.beginPath(); x.arc(-s * 0.25, -s * 0.3, s * 0.12, 0, 7); x.arc(s * 0.2, -s * 0.3, s * 0.12, 0, 7); x.fill(); },
  insect(x, c, s, t) { const w = Math.sin(t * 40) * 0.5; x.lineWidth = 1.5; x.strokeStyle = "rgba(220,240,255,0.9)"; for (const d of [-1, 1]) { x.beginPath(); x.ellipse(d * s * 0.5, -s * 0.15, s * 0.6, s * 0.18 * (0.5 + Math.abs(w)), d * 0.3, 0, 7); x.stroke(); } x.lineWidth = 2; x.strokeStyle = c; x.beginPath(); x.moveTo(-s * 0.2, 0); x.lineTo(s * 1.1, 0); x.stroke(); },
  shellfish(x, c, s, t) { x.beginPath(); x.ellipse(0, 0, s * 0.5, s * 0.32, 0, 0, 7); x.fill(); x.lineWidth = s * 0.1; x.strokeStyle = c; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(i * s * 0.2, s * 0.2); x.lineTo(i * s * 0.25, s * 0.5); x.stroke(); } },
};

export function createSpeciesLayer(canvas, scene) {
  const x = canvas.getContext("2d"); let site = null, creatures = [], plants = [], time = 0;
  function resize() { canvas.width = canvas.clientWidth * (window.devicePixelRatio > 1 ? 1.5 : 1); canvas.height = canvas.clientHeight * (window.devicePixelRatio > 1 ? 1.5 : 1); }
  function samplePoint(mask, zone, rnd) {
    // mask: ImageData 160x90, RGBA = water, waterBlur, veg, sky
    const W = mask.width, H = mask.height, d = mask.data; const pts = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) { const i = (r * W + c) * 4, w = d[i] / 255, wb = d[i + 1] / 255, v = d[i + 2] / 255, s = d[i + 3] / 255;
      const ok = zone === "water" ? w > 0.6 : zone === "edge" ? (wb > 0.25 && wb < 0.6 && w < 0.3 && s < 0.3 && r > H * 0.4) : zone === "sky" ? (s > 0.6 && r < H * 0.45) : (v > 0.5 && s < 0.2 && w < 0.2 && r > H * 0.55);
      if (ok) pts.push([c / W, r / H]); }
    if (!pts.length) { // fall back: water → land, sky → top band, edge → low rows
      if (zone === "water" || zone === "edge") return [0.3 + rnd * 0.4, 0.78]; if (zone === "sky") return [0.2 + rnd * 0.6, 0.15]; return [0.2 + rnd * 0.6, 0.7]; }
    return pts[Math.floor(rnd * pts.length)];
  }
  function setSite(w, mask) {
    site = w; creatures = []; plants = w.plants.slice(0, 6);
    w.animals.slice(0, 6).forEach((name, i) => { const { kind, zone } = classify(name); const n = kind === "fish" || kind === "bird" || kind === "insect" ? 3 : kind === "wader" || kind === "shellfish" ? 2 : 1;
      for (let k = 0; k < n; k++) { const seed = (i * 7 + k * 3 + 1) * 0.173 % 1; const p = samplePoint(mask, zone, (seed + k * 0.31) % 1); creatures.push({ name, kind, zone, u: p[0], v: p[1], seed, label: k === 0, a: 0 }); } });
  }
  // how well each kind copes with the current state (0 gone … 1 thriving)
  function fitness(kind, zone, S, T) {
    const hab = T.life, dry = Math.max(0, (0.45 - S.level) / 0.4), flood = Math.max(0, (S.level - 0.72) / 0.28), cold = S.snowCover;
    let f = hab;
    if (zone === "water" || kind === "fish" || kind === "dolphin" || kind === "hippo") f = Math.min(f, 1 - dry * 1.6, 1 - S.ice * 0.9, 1 - flood * 0.5);
    if (kind === "wader" || kind === "shellfish") f = Math.min(f, 1 - dry * 1.3, 1 - flood * 1.4, 1 - cold * 0.9);
    if (kind === "bird") f = Math.min(f, 1 - T.storm * 0.9, 1 - Math.min(1, T.rain) * 0.6, 1 - cold * 0.5);
    if (kind === "insect") f = Math.min(f, 1 - Math.min(1, T.rain), 1 - cold, 1 - dry * 0.8, 1 - (1 - (S.hour > 7 && S.hour < 19 ? 1 : 0)));
    if (kind === "bigmammal") f = Math.min(f, 1 - dry * 0.9, 1 - flood * 1.2, 1 - T.storm * 0.6);
    if (kind === "croc" || kind === "frog") f = Math.min(f, 1 - dry * 1.4, 1 - cold * 1.5, 1 - flood * 0.6);
    return Math.max(0, Math.min(1, f));
  }
  function plantHealth(S, T) { const dry = Math.max(0, (0.45 - S.level) / 0.4), flood = Math.max(0, (S.level - 0.72) / 0.28); return Math.max(0, Math.min(1, 1 - S.wither - dry * 0.4 - flood * 0.5 - S.snowCover * 0.5)); }
  function render(S, T, dt, day) {
    time += dt; if (!site) return; const W = canvas.width, H = canvas.height, k = W / canvas.clientWidth;
    x.clearRect(0, 0, W, H);
    const ink = `rgba(${Math.round(18 * day + 6)},${Math.round(28 * day + 10)},${Math.round(30 * day + 14)},1)`;
    for (const c of creatures) {
      const target = fitness(c.kind, c.zone, S, T); c.a += (target - c.a) * Math.min(1, dt * 0.6);
      if (c.a < 0.03) continue;
      let u = c.u, v = c.v; const s = Math.max(8, H * 0.018) * (c.kind === "bigmammal" ? 3.2 : c.kind === "hippo" || c.kind === "croc" ? 2.4 : c.kind === "wader" ? 2.0 : c.kind === "dolphin" ? 1.6 : c.kind === "insect" ? 0.7 : 1);
      if (c.kind === "bird") { u = (c.u + time * 0.012 * (0.6 + c.seed)) % 1.1 - 0.05; v = c.v + Math.sin(time * 0.8 + c.seed * 9) * 0.02; }
      if (c.kind === "fish" || c.kind === "dolphin") { u = c.u + Math.sin(time * 0.35 + c.seed * 7) * 0.05; v = c.v + Math.cos(time * 0.5 + c.seed * 5) * 0.012; }
      if (c.kind === "insect") { u = c.u + Math.sin(time * 1.4 + c.seed * 8) * 0.03; v = c.v - 0.05 + Math.cos(time * 2.1 + c.seed * 3) * 0.02; }
      const [sx, sy] = scene.photoToScreen(u, v); const persp = c.kind === "bird" ? 1 : 0.45 + v * 1.1;
      x.save(); x.translate(sx * k, sy * k); x.globalAlpha = c.a * (c.kind === "fish" ? 0.55 : 0.92); x.fillStyle = ink; x.strokeStyle = ink;
      if (c.kind === "fish" || c.kind === "dolphin") { x.filter = "blur(1px)"; }
      const dir = (c.kind === "fish" || c.kind === "dolphin") ? (Math.cos(time * 0.35 + c.seed * 7) > 0 ? 1 : -1) : 1; x.scale(dir, 1);
      (draw[c.kind] || draw.bird)(x, ink, s * k * persp, time + c.seed * 10); x.restore();
      if (c.label && c.a > 0.3) { x.save(); x.globalAlpha = Math.min(1, (c.a - 0.3) * 2); x.font = `700 ${Math.round(9 * k)}px "Space Mono", monospace`; x.textAlign = "center"; const w = x.measureText(c.name.toUpperCase()).width + 14 * k;
        x.fillStyle = "rgba(6,21,17,0.75)"; x.fillRect(sx * k - w / 2, sy * k - s * k * persp * 2.6 - 14 * k, w, 16 * k); x.fillStyle = "#cdff64"; x.fillText(c.name.toUpperCase(), sx * k, sy * k - s * k * persp * 2.6 - 2 * k); x.restore(); }
    }
  }
  function status(S, T) { const ph = plantHealth(S, T);
    return { plants: plants.map((p) => ({ name: p, health: ph })), animals: site ? site.animals.slice(0, 6).map((n) => { const { kind, zone } = classify(n); const f = fitness(kind, zone, S, T); return { name: n, state: f > 0.66 ? "present" : f > 0.25 ? "stressed" : "gone", f }; }) : [] }; }
  return { setSite, render, resize, status, plantHealth };
}
