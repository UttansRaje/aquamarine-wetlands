/* AQUA animated lessons — browser player */
(function () {
  "use strict";
  const A = window.AquaLessons, mods = A.modules;
  const $ = (id) => document.getElementById(id);
  const stage = $("stage"), canvas = $("screen"), ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let mod = mods[0], time = 0, playing = false, last = 0, raf = 0, dur = 0, starts = [];
  const voice = new Audio(); voice.preload = "auto"; let voiceOn = true;
  let W = 1280, H = 720;

  /* ---------- sizing ---------- */
  function resize() {
    const r = stage.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, Math.round(r.width)); H = Math.round(W * 9 / 16);
    if (document.fullscreenElement === stage) { H = Math.round(r.height); W = Math.round(r.width); if (W / H > 16 / 9) W = Math.round(H * 16 / 9); else H = Math.round(W * 9 / 16); }
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  window.addEventListener("resize", resize);

  /* ---------- render loop ---------- */
  function draw() {
    const info = A.render(mod, ctx, W, H, time);
    $("fill").style.width = (time / dur * 100) + "%";
    $("timeline").setAttribute("aria-valuenow", Math.round(time / dur * 100));
    $("clock").textContent = fmt(time) + " / " + fmt(dur);
    document.querySelectorAll("#scene-list li").forEach((li, i) => li.setAttribute("aria-current", i === info.sceneIndex ? "true" : "false"));
    // transcript highlight
    let active = -1; const items = document.querySelectorAll("#transcript li");
    items.forEach((li, i) => { if (+li.dataset.t <= time) active = i; });
    items.forEach((li, i) => li.setAttribute("aria-current", i === active ? "true" : "false"));
  }
  function loop(now) {
    if (!playing) return;
    const dt = Math.min((now - last) / 1000, 0.1); last = now; time += dt;
    if (voiceOn && !voice.paused && voice.readyState > 2 && Math.abs(voice.currentTime - time) > 0.25) time = voice.currentTime;
    if (time >= dur) { time = dur; draw(); pause(); return; }
    draw(); raf = requestAnimationFrame(loop);
  }
  function play() { if (time >= dur) time = 0; playing = true; stage.classList.add("playing"); last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); if (voiceOn && voice.src) { voice.currentTime = time; voice.play().catch(() => {}); } }
  function pause() { playing = false; stage.classList.remove("playing"); cancelAnimationFrame(raf); voice.pause(); }
  function seek(t) { time = Math.max(0, Math.min(dur, t)); if (voice.src) { try { voice.currentTime = time; } catch (e) {} } draw(); }
  function fmt(s) { s = Math.floor(s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  /* ---------- module switching ---------- */
  function load(m, autoplay) {
    pause(); mod = m; dur = A.duration(m); starts = A.sceneStarts(m); time = 0;
    voice.src = "audio/" + m.id + ".mp3"; voice.load();
    $("lesson-title").textContent = m.title; $("lesson-summary").textContent = m.summary;
    document.querySelectorAll("#picker button").forEach((b) => b.setAttribute("aria-current", b.dataset.id === m.id ? "true" : "false"));
    // scene list
    const sl = $("scene-list"); sl.innerHTML = "";
    m.scenes.forEach((s, i) => {
      const li = document.createElement("li"); li.innerHTML = `<time>${fmt(starts[i])}</time><span>${sceneName(s, i)}</span>`;
      li.addEventListener("click", () => { seek(starts[i]); play(); }); sl.appendChild(li);
    });
    // transcript
    const tr = $("transcript"); tr.innerHTML = "";
    m.scenes.forEach((s, i) => (s.caps || []).forEach((c) => {
      const li = document.createElement("li"); li.dataset.t = starts[i] + c.at; li.innerHTML = `<time>${fmt(starts[i] + c.at)}</time><span>${c.text}</span>`;
      li.addEventListener("click", () => { seek(starts[i] + c.at); play(); }); tr.appendChild(li);
    }));
    // markers
    const mk = $("markers"); mk.innerHTML = ""; starts.slice(1).forEach((t) => { const i = document.createElement("i"); i.style.left = (t / dur * 100) + "%"; mk.appendChild(i); });
    history.replaceState(null, "", "#" + m.id);
    draw();
    if (autoplay && !reduceMotion) play();
  }
  function sceneName(s, i) {
    if (s.caps && s.caps.length) { const t = s.caps[0].text; return t.length > 70 ? t.slice(0, 68) + "…" : t; }
    return i === 0 ? "Title" : "Scene " + (i + 1);
  }

  /* ---------- picker with live thumbnails ---------- */
  const picker = $("picker");
  mods.forEach((m) => {
    const b = document.createElement("button"); b.dataset.id = m.id;
    b.innerHTML = `<span class="thumb"><canvas width="176" height="99"></canvas></span><span><b>${m.short}</b><span>${fmt(A.duration(m))}</span></span>`;
    b.addEventListener("click", () => load(m, true)); picker.appendChild(b);
    const c = b.querySelector("canvas").getContext("2d"), thumbT = A.sceneStarts(m)[1] + 4;
    A.render(m, c, 176, 99, thumbT);
  });

  /* ---------- controls ---------- */
  $("play").addEventListener("click", () => (playing ? pause() : play()));
  $("bigplay").addEventListener("click", play);
  canvas.addEventListener("click", () => (playing ? pause() : play()));
  $("prev").addEventListener("click", () => { const i = starts.filter((s) => s < time - 1).length - 1; seek(starts[Math.max(0, i)]); });
  $("next").addEventListener("click", () => { const i = starts.findIndex((s) => s > time + 0.5); if (i >= 0) seek(starts[i]); });
  $("full").addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen && stage.requestFullscreen(); });
  document.addEventListener("fullscreenchange", () => setTimeout(resize, 50));
  const tl = $("timeline");
  const seekFromEvent = (e) => { const r = tl.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; seek(x / r.width * dur); };
  let dragging = false;
  tl.addEventListener("pointerdown", (e) => { dragging = true; tl.setPointerCapture(e.pointerId); seekFromEvent(e); });
  tl.addEventListener("pointermove", (e) => { if (dragging) seekFromEvent(e); });
  tl.addEventListener("pointerup", () => (dragging = false));
  tl.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") seek(time - 5); if (e.key === "ArrowRight") seek(time + 5); });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); playing ? pause() : play(); }
    if (e.key === "ArrowRight" && !e.target.matches(".timeline")) $("next").click();
    if (e.key === "ArrowLeft" && !e.target.matches(".timeline")) $("prev").click();
    if (e.key === "f") $("full").click();
    if (e.key >= "1" && e.key <= "4" && mods[e.key - 1]) load(mods[e.key - 1], true);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });

  $("mute").addEventListener("click", () => { voiceOn = !voiceOn; voice.muted = !voiceOn; $("mute").setAttribute("aria-pressed", String(!voiceOn)); $("mute").textContent = voiceOn ? "🔊" : "🔇"; });

  /* ---------- start ---------- */
  function start() {
    const fromHash = mods.find((m) => "#" + m.id === location.hash);
    resize(); load(fromHash || mods[0], false);
  }
  fetch("timing.json").then((r) => r.json()).then((t) => { A.applyTiming(t); start(); }).catch(start);
})();
