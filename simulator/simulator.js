/* AQUA — full-screen wetland weather simulator (photo-based, per wetland) */
import { createPhotoScene } from "./photoscene.js";
import { createSpeciesLayer } from "./species.js";
(function () {
  "use strict";
  const lerp = (a, b, t) => a + (b - a) * t, c01 = (v) => Math.max(0, Math.min(1, v)), TAU = Math.PI * 2;
  const $ = (id) => document.getElementById(id);
  const canvas = $("scene"), scene = createPhotoScene(canvas), life = createSpeciesLayer($("life"), scene);

  /* ---------------- weather state ---------------- */
  const MODES = {
    clear:   { label: "Clear sky",    level: 0.5,  fog: 0,    rain: 0,   snow: 0, heat: 0.25, storm: 0 },
    haze:    { label: "Haze",         level: 0.5,  fog: 1,    rain: 0,   snow: 0, heat: 0.4,  storm: 0 },
    rain:    { label: "Rain",         level: 0.55, fog: 0.25, rain: 1,   snow: 0, heat: 0.1,  storm: 0 },
    storm:   { label: "Thunderstorm", level: 0.75, fog: 0.35, rain: 1.6, snow: 0, heat: 0.05, storm: 1 },
    snow:    { label: "Snow",         level: 0.42, fog: 0.3,  rain: 0,   snow: 1, heat: 0,    storm: 0 },
    drought: { label: "Drought",      level: 0.5,  fog: 0.05, rain: 0,   snow: 0, heat: 1,    storm: 0 },
    flood:   { label: "Flood",        level: 0.98, fog: 0.2,  rain: 0.8, snow: 0, heat: 0.1,  storm: 0.4 },
  };
  const S = { mode: "clear", intensity: 0.6, wind: 0.3, hour: 14, level: 0.5, fog: 0, snowCover: 0, ice: 0, rainMM: 0, cloud: 0, puddle: 0, wither: 0, auto: false, autoT: 0 };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches, FAST = location.search.includes("fast");
  function habitatValue(w, snow, fog) { return c01(1 - Math.pow((w - 0.5) / 0.38, 2)) * (1 - snow * 0.35) * (1 - fog * 0.1); }
  function targets() {
    const m = MODES[S.mode], i = S.intensity; let level = m.level;
    if (S.mode === "drought") level = 0.5 - 0.44 * i; if (S.mode === "rain") level = 0.5 + 0.28 * i; if (S.mode === "storm") level = 0.6 + 0.35 * i; if (S.mode === "flood") level = 0.85 + 0.15 * i;
    return { life: habitatValue(S.level, S.snowCover, S.fog), level, fog: m.fog * (S.mode === "haze" ? lerp(0.3, 1, i) : 1), rain: m.rain * lerp(0.15, 1, i), snow: m.snow * lerp(0.2, 1, i), heat: m.heat * (S.mode === "drought" ? lerp(0.5, 1, i) : 1), storm: m.storm * i, cloud: m.rain > 0 || m.snow > 0 || m.fog > 0.5 ? 1 : 0.15 };
  }
  function step(dt) {
    const t = targets(), rate = reduceMotion || FAST ? 2.5 : 0.22;
    S.level += (t.level - S.level) * c01(dt * rate);
    S.fog += (t.fog - S.fog) * c01(dt * 0.5); S.cloud += (t.cloud - S.cloud) * c01(dt * 0.6);
    S.snowCover += ((t.snow > 0 ? t.snow : 0) - S.snowCover) * c01(dt * (FAST ? 2 : t.snow > 0 ? 0.12 : 0.25 * (1 + t.heat)));
    S.ice += ((t.snow > 0 ? 1 : 0) - S.ice) * c01(dt * (FAST ? 2 : 0.15));
    S.puddle += ((t.rain > 0 ? c01(t.rain) : 0) - S.puddle) * c01(dt * (t.rain > 0 ? 0.3 : 0.12));
    // vegetation withers slowly in heat and drought, recovers when water returns
    const dry = c01((0.45 - S.level) / 0.4), witherTarget = c01(dry * 0.9 + Math.max(0, t.heat - 0.5) * 0.6 + Math.max(0, (S.level - 0.8) / 0.2) * 0.5);
    S.wither += (witherTarget - S.wither) * c01(dt * (FAST ? 1.5 : witherTarget > S.wither ? 0.08 : 0.12));
    if (t.rain > 0) S.rainMM += dt * t.rain * 2.5; else S.rainMM = Math.max(0, S.rainMM - dt * 1.5);
    if (S.auto) { S.autoT += dt; if (S.autoT > 11) { S.autoT = 0; const keys = Object.keys(MODES); setMode(keys[(keys.indexOf(S.mode) + 1) % keys.length]); } }
    return t;
  }

  /* ---------------- wetlands (from the AQUA dataset) ---------------- */
  const COORDS = { chilika: [19.7, 85.3], sundarbans: [21.9, 89.2], tsokar: [33.3, 78.0], everglades: [25.3, -80.9], pantanal: [-18.2, -56.6], okavango: [-19.3, 22.9], kakadu: [-12.6, 132.8], wadden: [53.5, 7.4], danube: [45.1, 29.5], kushiro: [43.1, 144.5] };
  let wetlands = [], current = null, currentIndex = 0; const SITES = [];
  function selectSite(i) {
    current = wetlands[i]; currentIndex = i;
    document.querySelectorAll("#sites button").forEach((b, j) => b.setAttribute("aria-current", j === i ? "true" : "false"));
    $("site-name").textContent = current.name; $("site-meta").textContent = `${current.region.toUpperCase()} · ${current.type.toUpperCase()} · ${current.climate.toUpperCase()}`;
    history.replaceState(null, "", "#site=" + current.key);
    scene.loadSite(current.key).then((mask) => life.setSite(current, mask));
  }
  fetch("../data/content.json").then((r) => r.json()).then((d) => {
    wetlands = d.wetlands; const nav = $("sites");
    wetlands.forEach((w, i) => { const b = document.createElement("button"); b.innerHTML = `<img src="../assets/wetlands/${w.key}.jpg" alt=""><span>${w.name}</span>`; b.addEventListener("click", () => selectSite(i)); nav.appendChild(b);
      SITES.push([w.key, w.name, COORDS[w.key][0], COORDS[w.key][1]]); site.add(new Option(w.name, i)); });
    [["aral", "Aral Sea — a wetland that vanished", 45.0, 59.5], ["chad", "Lake Chad — shrinking basin", 13.2, 14.2], ["mesopotamia", "Mesopotamian Marshes — drained, then restored", 31.0, 47.0]].forEach((s) => { SITES.push(s); site.add(new Option(s[1], SITES.length - 1)); });
    const deep = location.hash.match(/site=([a-z]+)/), wantHistory = location.hash.includes("history");
    const idx = deep ? Math.max(0, wetlands.findIndex((w) => w.key === deep[1])) : 0;
    selectSite(idx); scene.resize(); life.resize();
    if (wantHistory) { site.value = currentIndex; $("panel").hidden = false; loadImages(); }
  });

  /* ---------------- frame loop ---------------- */
  let last = performance.now(); const par = { x: 0, y: 0 };
  canvas.addEventListener("pointermove", (e) => { par.x = (e.clientX / window.innerWidth - 0.5) * 2; par.y = -(e.clientY / window.innerHeight - 0.5) * 2; });
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    const t = step(dt); const info = scene.update(S, t, dt, par); life.render(S, t, dt, info.day); readout(t);
    requestAnimationFrame(frame);
  }
  window.addEventListener("resize", () => { scene.resize(); life.resize(); });
  requestAnimationFrame(frame);

  /* ---------------- readouts ---------------- */
  let panelTick = 0;
  function readout(t) {
    const vis = c01(1 - S.fog * 0.8 - c01(t.rain / 1.6) * 0.3 - t.snow * 0.3), hab = habitatValue(S.level, S.snowCover, S.fog), ph = life.plantHealth(S, t);
    set("water", Math.round(S.level * 100) + "%", S.level); set("hab", Math.round(hab * 100) + "%", hab); set("veg", Math.round(ph * 100) + "%", ph); set("vis", Math.round(vis * 100) + "%", vis); set("rain", Math.round(S.rainMM) + " mm", c01(S.rainMM / 150));
    $("status").textContent = MODES[S.mode].label + " · " + Math.round(S.intensity * 100) + "% · " + fmtHour(S.hour);
    if ((panelTick++ % 20) === 0 && current) { const st = life.status(S, t);
      $("flora").innerHTML = st.plants.map((p) => `<li><span>${p.name}</span><i><u style="width:${Math.round(p.health * 100)}%"></u></i></li>`).join("");
      $("fauna").innerHTML = st.animals.map((a) => `<li class="${a.state}"><span>${a.name}</span><b>${a.state.toUpperCase()}</b></li>`).join(""); }
  }
  function set(k, text, v) { $("r-" + k).textContent = text; $("b-" + k).style.width = (v * 100) + "%"; }
  function fmtHour(h) { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); }

  /* ---------------- controls ---------------- */
  function setMode(m) { S.mode = m; document.querySelectorAll("#modes button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === m ? "true" : "false")); }
  document.querySelectorAll("#modes button").forEach((b) => b.addEventListener("click", () => { setMode(b.dataset.mode); S.auto = false; $("auto").setAttribute("aria-pressed", "false"); }));
  const bind = (id, fn, fmt) => { const el = $(id), out = $("o-" + id); const upd = () => { fn(+el.value); if (out) out.textContent = fmt(+el.value); }; el.addEventListener("input", upd); upd(); };
  bind("intensity", (v) => (S.intensity = v / 100), (v) => v + "%"); bind("wind", (v) => (S.wind = v / 100), (v) => v + "%"); bind("hour", (v) => (S.hour = v), (v) => fmtHour(v));
  $("auto").addEventListener("click", () => { S.auto = !S.auto; S.autoT = 0; $("auto").setAttribute("aria-pressed", String(S.auto)); });
  $("reset").addEventListener("click", () => { Object.assign(S, { level: 0.5, fog: 0, snowCover: 0, ice: 0, rainMM: 0, puddle: 0, cloud: 0, wither: 0 }); setMode("clear"); $("intensity").value = 60; $("wind").value = 30; $("hour").value = 14; ["intensity", "wind", "hour"].forEach((id) => $(id).dispatchEvent(new Event("input"))); });
  $("full").addEventListener("click", () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen()));
  const toggleUI = (hide) => { ["dock", "readout", "sites", "lifepanel"].forEach((id) => $(id).classList.toggle("hidden", hide)); $("show").hidden = !hide; };
  $("hide").addEventListener("click", () => toggleUI(true)); $("show").addEventListener("click", () => toggleUI(false));
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select, textarea")) return;
    const keys = Object.keys(MODES); if (e.key >= "1" && e.key <= "7") { setMode(keys[e.key - 1]); S.auto = false; }
    if (e.key === "f") $("full").click(); if (e.key === "h") toggleUI($("show").hidden); if (e.key === "Escape") closePanel();
    if (e.key === "ArrowRight" && wetlands.length) selectSite((currentIndex + 1) % wetlands.length); if (e.key === "ArrowLeft" && wetlands.length) selectSite((currentIndex - 1 + wetlands.length) % wetlands.length);
  });
  setMode("clear");

  /* ---------------- historical imagery (NASA GIBS) ---------------- */
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const site = $("site"), month = $("month");
  MONTHS.forEach((m, i) => month.add(new Option(m, i)));
  month.value = 10; $("yearB").max = $("yearA").max = new Date().getFullYear(); $("yearB").value = new Date().getFullYear() - 1;
  bind("yearA", () => {}, (v) => v); bind("yearB", () => {}, (v) => v);
  $("history").addEventListener("click", () => { site.value = currentIndex; $("panel").hidden = false; loadImages(); });
  $("close").addEventListener("click", closePanel);
  function closePanel() { $("panel").hidden = true; }
  $("load").addEventListener("click", loadImages);

  function tileXY(lat, lon, z) { const n = Math.pow(2, z), x = (lon + 180) / 360 * n, latR = lat * Math.PI / 180, y = (1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2 * n; return [x, y]; }
  function tileUrl(date, z, x, y) { return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/${z}/${y}/${x}.jpg`; }
  function loadMosaic(cv, date, lat, lon, z) {
    const cols = 4, rows = 3, T = 256; cv.width = cols * T; cv.height = rows * T; const c = cv.getContext("2d"); c.fillStyle = "#000"; c.fillRect(0, 0, cv.width, cv.height);
    const [cx, cy] = tileXY(lat, lon, z), x0 = Math.floor(cx - cols / 2 + 0.5), y0 = Math.floor(cy - rows / 2 + 0.5), n = Math.pow(2, z);
    const jobs = [];
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const tx = ((x0 + k) % n + n) % n, ty = y0 + r; if (ty < 0 || ty >= n) continue;
      jobs.push(new Promise((res) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { c.drawImage(im, k * T, r * T, T, T); res(); }; im.onerror = () => res(); im.src = tileUrl(date, z, tx, ty); }));
    }
    // centre marker
    return Promise.all(jobs).then(() => { c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 2; const mx = (cx - x0) * T, my = (cy - y0) * T; c.beginPath(); c.arc(mx, my, 14, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(mx - 22, my); c.lineTo(mx - 8, my); c.moveTo(mx + 8, my); c.lineTo(mx + 22, my); c.moveTo(mx, my - 22); c.lineTo(mx, my - 8); c.moveTo(mx, my + 8); c.lineTo(mx, my + 22); c.stroke(); });
  }
  function loadImages() {
    const s = SITES[site.value], m = +month.value, z = +$("zoom").value, lat = s[2], lon = s[3], dA = `${$("yearA").value}-${String(m + 1).padStart(2, "0")}-15`, dB = `${$("yearB").value}-${String(m + 1).padStart(2, "0")}-15`;
    $("tagA").innerHTML = "<strong>" + $("yearA").value + "</strong> · " + MONTHS[m].toUpperCase(); $("tagB").innerHTML = "<strong>" + $("yearB").value + "</strong> · " + MONTHS[m].toUpperCase();
    $("loading").hidden = false;
    Promise.all([loadMosaic($("imgA"), dA, lat, lon, z), loadMosaic($("imgB"), dB, lat, lon, z)]).then(() => { $("loading").hidden = true; sizeClip(); });
  }
  // comparison slider
  const compare = $("compare"), clip = $("clip"), handle = $("handle"); let pos = 0.5, dragging = false;
  function sizeClip() { const r = compare.getBoundingClientRect(); $("imgB").style.width = r.width + "px"; $("imgB").style.height = r.height + "px"; clip.style.width = (pos * 100) + "%"; handle.style.left = (pos * 100) + "%"; }
  window.addEventListener("resize", sizeClip);
  compare.addEventListener("pointerdown", (e) => { dragging = true; compare.setPointerCapture(e.pointerId); move(e); });
  compare.addEventListener("pointermove", (e) => dragging && move(e)); compare.addEventListener("pointerup", () => (dragging = false));
  function move(e) { const r = compare.getBoundingClientRect(); pos = c01((e.clientX - r.left) / r.width); sizeClip(); }
})();
