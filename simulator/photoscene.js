/* AQUA weather simulator — photo scene.
   The wetland's real photograph is the world; a mask (R water, G water-blur, B vegetation, A sky) tells the shader
   where things are, and every weather state is painted onto the photo itself. */
import * as THREE from "three";

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPhoto, uMask; uniform vec2 uRes, uFit, uPar;
uniform float uTime, uLevel, uDry, uWither, uSnow, uIce, uFog, uDay, uCloud, uHeat, uMud, uRainI, uSnowI, uFlash, uWind, uWet, uHaze, uStormDark;

float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x), mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float a=0.0, w=0.5; for(int i=0;i<5;i++){ a+=w*vnoise(p); p=p*2.03+17.1; w*=0.5; } return a; }
float lum(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
// crack network: distance to cell borders of a jittered grid
float cracks(vec2 p){ vec2 i=floor(p), f=fract(p); float d1=9.0, d2=9.0;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=vec2(hash21(i+g), hash21(i+g+7.3)); float d=length(g+o-f); if(d<d1){d2=d1;d1=d;} else if(d<d2) d2=d; }
  return smoothstep(0.08, 0.0, d2-d1); }
vec3 skyBase(vec2 uv){
  float h = 1.0-uv.y;
  vec3 zenith = mix(vec3(0.20,0.46,0.86), vec3(0.78,0.60,0.42), uHeat*0.55);
  vec3 horizon = mix(vec3(0.78,0.86,0.93), vec3(0.98,0.80,0.52), uHeat*0.7);
  return mix(horizon, zenith, pow(h,0.8)); }

void main(){
  vec2 suv = vUv;
  // cover-fit the photo
  vec2 uv = (suv - 0.5) * uFit + 0.5;
  vec4 m0 = texture2D(uMask, uv);
  // 2.5-D parallax: sky far, ground nearer toward the bottom
  float depth = mix(0.1 + uv.y*0.85, 1.0, m0.a);
  uv += uPar * (depth - 0.45) * 0.028;
  uv = clamp(uv, vec2(0.002), vec2(0.998));
  vec4 m = texture2D(uMask, uv);
  float water = m.r, wb = m.g, veg = m.b, sky = m.a;
  vec3 photo = texture2D(uPhoto, uv).rgb;
  float L = lum(photo);

  // ---------- water extent ----------
  float th = 0.5 - uLevel*0.34;                       // flood lowers the threshold (water spreads), drought raises it (water shrinks)
  float wArea = smoothstep(th-0.07, th+0.07, wb) * (1.0-sky);
  wArea = max(wArea, water * smoothstep(th-0.07, th+0.07, 0.5 + 0.35*water)); // the deepest original water survives longest
  if (uLevel < -0.85) wArea *= smoothstep(-1.0, -0.85, uLevel);
  float exposed = max(0.0, water - wArea);              // dried-out bed
  float flooded = max(0.0, wArea - water);              // newly drowned ground

  vec3 c = photo;

  // ---------- vegetation health ----------
  vec3 dryVeg = mix(vec3(L)*vec3(0.95,0.78,0.45), photo*vec3(1.15,0.95,0.55), 0.45);
  c = mix(c, dryVeg, veg*uDry*0.9);
  vec3 lushVeg = photo*vec3(0.85,1.12,0.82);
  c = mix(c, lushVeg, veg*uWet*0.35);
  // withering: plants thin out and expose soil
  float wn = fbm(uv*vec2(90.0, 50.0));
  float gone = veg * smoothstep(0.0, 0.08, uWither*1.1 - wn);
  vec3 soil = vec3(0.50,0.38,0.24)*(0.45+L*0.9) * (0.85 + 0.3*vnoise(uv*300.0));
  c = mix(c, soil, gone*0.9);

  // ---------- dried-out bed + cracks ----------
  vec3 mud = vec3(0.56,0.44,0.30)*(0.55+L*0.6) * (0.85 + 0.3*vnoise(uv*240.0));
  c = mix(c, mud, exposed*0.95);
  float ck = cracks(uv*vec2(38.0,22.0)) ;
  float crackZone = max(exposed, (1.0-veg)*(1.0-sky)*smoothstep(0.15,0.5,wb)*uDry) ;
  c = mix(c, vec3(0.16,0.10,0.06), ck * crackZone * uDry * 0.95);
  // dust haze over dry ground
  c = mix(c, vec3(0.9,0.8,0.6), uDry*0.08*(1.0-sky)*(1.0-wArea));

  // ---------- water surface ----------
  vec2 wp = uv*vec2(60.0,120.0);
  float wv = sin(wp.x*0.9 + uTime*1.4)*0.5 + sin(wp.x*0.4+wp.y*0.8 - uTime*1.1)*0.5 + sin(wp.y*1.7 + uTime*2.3)*0.3*(0.5+uWind);
  // rain ripples
  float rip = 0.0;
  if (uRainI > 0.0) { vec2 g = uv*vec2(40.0,24.0); vec2 cell=floor(g);
    for (int i=0;i<4;i++){ vec2 cc = cell + vec2(mod(float(i),2.0), floor(float(i)*0.5)); vec2 ctr = cc + vec2(hash21(cc), hash21(cc+5.0)); float ph = hash21(cc+9.0);
      float age = fract(uTime*0.8 + ph); float d = length(g-ctr); rip += sin((d-age*1.4)*30.0)*exp(-d*5.0)*(1.0-age)*step(d, age*1.4)*step(hash21(cc+13.0), uRainI); } }
  vec2 dist = vec2(wv*0.0025 + rip*0.004, wv*0.0015)*(1.0-uIce);
  vec3 refr = texture2D(uPhoto, clamp(uv+dist, 0.002, 0.998)).rgb;
  vec3 reflCol = skyBase(vec2(uv.x, 0.15));
  reflCol = mix(reflCol, vec3(0.45,0.5,0.55), uCloud*0.8);
  reflCol *= mix(0.12, 1.0, uDay);
  float gn = vnoise(wp*1.7 + vec2(uTime*0.9, -uTime*0.6)) * vnoise(wp*2.6 - vec2(uTime*0.7, uTime*1.1)); float glint = pow(gn, 7.0) * 2.2 * (1.0-uCloud*0.9) * uDay;
  vec3 waterOld = mix(refr, reflCol, 0.22 + 0.15*wv) + glint;
  vec3 waterNew = mix(refr*vec3(0.55,0.65,0.7), reflCol, 0.55) + glint*0.6;   // drowned ground reads as water
  vec3 wcol = mix(waterOld, waterNew, flooded / max(wArea, 0.001));
  vec3 mudWater = mix(wcol, vec3(0.48,0.36,0.22)*(0.5+0.6*uDay), 0.75);
  wcol = mix(wcol, mudWater, uMud);
  vec3 ice = vec3(0.84,0.91,0.97)*mix(0.2,1.0,uDay)*(0.85+0.15*vnoise(uv*80.0));
  float ick = smoothstep(0.03,0.0,abs(fract(vnoise(uv*14.0)*6.0)-0.5)-0.47);
  ice = mix(ice, vec3(0.6,0.72,0.82)*mix(0.2,1.0,uDay), ick*0.6);
  wcol = mix(wcol, ice, uIce);
  c = mix(c, wcol, wArea);
  // wet sheen on ground next to water after rain
  c = mix(c, c*0.75 + reflCol*0.12, uWet*(1.0-wArea)*(1.0-sky)*smoothstep(0.05,0.45,wb)*0.9);

  // ---------- snow ----------
  float sn = uSnow * (1.0-wArea) * (1.0-sky) * smoothstep(0.25, 0.75, 0.55 + 0.45*vnoise(uv*140.0) - 0.15*(1.0-L));
  c = mix(c, vec3(0.93,0.96,1.0)*mix(0.25,1.0,uDay), sn*0.95);

  // ---------- sky ----------
  vec3 skyc = photo;
  vec2 cuv = uv*vec2(3.0,1.5) + vec2(uTime*0.012*(0.5+uWind), 0.0);
  float cl = fbm(cuv*2.0);
  vec3 overcast = mix(vec3(0.42,0.47,0.53), vec3(0.62,0.66,0.70), cl) * mix(0.12,1.0,uDay);
  overcast = mix(overcast, overcast*0.45, uStormDark*(0.6+0.4*cl));
  // clear hot sky replaces the photo's own clouds in drought / clear-hot weather
  vec3 hotSky = skyBase(uv) + vec3(1.0,0.85,0.6)*pow(max(0.0, 1.0-length((uv-vec2(0.72,0.88))*vec2(1.0,1.6))*1.6), 3.0)*0.9;
  skyc = mix(skyc, hotSky, uHeat*0.85*(1.0-uCloud));
  skyc = mix(skyc, overcast, uCloud*0.92);
  skyc = mix(skyc, skyc*vec3(1.15,0.9,0.7), uHeat*0.5*uDay);
  // night
  vec3 nightSky = vec3(0.02,0.04,0.09);
  float star = 0.0; { vec2 g = uv*vec2(160.0,90.0); vec2 cell=floor(g); float s=hash21(cell); vec2 f=fract(g)-0.5; float d=length(f - (vec2(hash21(cell+2.0),hash21(cell+4.0))-0.5)*0.6); star = smoothstep(0.1,0.0,d)*step(0.94,s)*(0.5+0.5*sin(uTime*2.0+s*40.0)); }
  skyc = mix(skyc, nightSky + star*(1.0-uCloud), (1.0-uDay)*0.92);
  c = mix(c, skyc, sky);

  // ---------- global light ----------
  vec3 night = c*vec3(0.22,0.28,0.42);
  c = mix(night, c, mix(0.0, 1.0, smoothstep(0.0,1.0,uDay)));
  c = mix(c, c*vec3(1.08,0.98,0.85), uHeat*0.35*uDay);
  c = mix(c, c*0.62, uStormDark*(1.0-sky)*0.8);

  // ---------- fog / haze ----------
  float fogAmt = uFog * mix(0.25, 1.0, depth) ;
  vec3 fogCol = vec3(0.80,0.84,0.88)*mix(0.15,1.0,uDay);
  float fogN = fbm(uv*vec2(4.0,2.0) + vec2(uTime*0.03, 0.0));
  c = mix(c, fogCol, clamp(fogAmt*(0.55+0.45*fogN), 0.0, 0.95));
  c = mix(c, fogCol, uHaze*0.25*depth);

  // ---------- rain streaks (screen space) ----------
  if (uRainI > 0.0) {
    for (int l=0; l<3; l++) { float fl = float(l); float sc = 90.0 + fl*70.0; float sp = 1.6 + fl*0.9;
      vec2 p = vec2(suv.x*sc + suv.y*(uWind-0.3)*8.0, suv.y*3.0*sc/90.0 + uTime*sp);
      vec2 cell = floor(p); float h = hash21(cell + fl*31.0); vec2 f = fract(p);
      float streak = smoothstep(0.08,0.0,abs(f.x-0.5-(h-0.5)*0.4)) * smoothstep(0.0,0.15,f.y) * smoothstep(1.0,0.55,f.y);
      c += vec3(0.75,0.82,0.9) * streak * step(h, uRainI*0.65) * (0.18 + 0.1*fl) * mix(0.3,1.0,uDay); }
  }
  // ---------- snowfall ----------
  if (uSnowI > 0.0) {
    for (int l=0; l<3; l++) { float fl=float(l); float sc = 30.0 + fl*25.0;
      vec2 p = vec2(suv.x*sc + sin(uTime*0.7+fl)*0.6 + suv.y*(uWind-0.3)*6.0, suv.y*sc*0.6 + uTime*(0.35+fl*0.25));
      vec2 cell=floor(p); float h=hash21(cell+fl*17.0); vec2 f=fract(p)-0.5-(vec2(hash21(cell+1.0),hash21(cell+2.0))-0.5)*0.6;
      float flake = smoothstep(0.08+fl*0.03, 0.0, length(f)) * step(h, uSnowI*0.8);
      c = mix(c, vec3(0.97)*mix(0.3,1.0,uDay), flake*0.9); }
  }
  // lightning flash
  c += vec3(0.85,0.92,1.0)*uFlash*(0.35 + 0.45*sky);
  // vignette + grain
  float vig = smoothstep(1.35, 0.35, length((suv-0.5)*vec2(1.0,1.3)));
  c *= 0.75 + 0.25*vig;
  c += (hash21(suv*uRes + fract(uTime))-0.5)*0.025;
  gl_FragColor = vec4(c, 1.0);
}`;

export function createPhotoScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const U = { uPhoto: { value: null }, uMask: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uFit: { value: new THREE.Vector2(1, 1) }, uPar: { value: new THREE.Vector2(0, 0) },
    uTime: { value: 0 }, uLevel: { value: 0 }, uDry: { value: 0 }, uWither: { value: 0 }, uSnow: { value: 0 }, uIce: { value: 0 }, uFog: { value: 0 }, uDay: { value: 1 }, uCloud: { value: 0 }, uHeat: { value: 0 }, uMud: { value: 0 }, uRainI: { value: 0 }, uSnowI: { value: 0 }, uFlash: { value: 0 }, uWind: { value: 0.3 }, uWet: { value: 0 }, uHaze: { value: 0 }, uStormDark: { value: 0 } };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false }));
  scene.add(quad);
  const loader = new THREE.TextureLoader(); let photoAspect = 16 / 9, ready = false, maskData = null;
  function fit() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); U.uRes.value.set(w, h);
    const sa = w / h; if (sa > photoAspect) U.uFit.value.set(1, photoAspect / sa); else U.uFit.value.set(sa / photoAspect, 1); }
  function loadSite(key) {
    ready = false;
    return Promise.all([
      new Promise((res) => loader.load(`../assets/wetlands/${key}.jpg`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; res(t); })),
      new Promise((res) => loader.load(`masks/${key}.png`, (t) => { t.minFilter = THREE.LinearFilter; res(t); })),
    ]).then(([photo, mask]) => {
      if (U.uPhoto.value) U.uPhoto.value.dispose(); if (U.uMask.value) U.uMask.value.dispose();
      U.uPhoto.value = photo; U.uMask.value = mask; photoAspect = photo.image.width / photo.image.height; fit();
      // read the mask pixels so the species layer can place creatures on water / land / sky
      const c = document.createElement("canvas"); c.width = 160; c.height = 90; const x = c.getContext("2d"); x.drawImage(mask.image, 0, 0, 160, 90); maskData = x.getImageData(0, 0, 160, 90);
      ready = true; return maskData;
    });
  }
  let time = 0, flash = 0, nextStrike = 2;
  function update(S, T, dt, par) {
    time += dt; U.uTime.value = time;
    const day = Math.max(0, Math.min(1, 1 - Math.abs(S.hour - 13) / 7.5));
    U.uDay.value = day; U.uCloud.value = S.cloud; U.uHeat.value = T.heat; U.uFog.value = S.fog; U.uWind.value = S.wind;
    U.uLevel.value = (S.level - 0.5) * 2; U.uDry.value = Math.max(0, (0.45 - S.level) / 0.4) * 0.6 + Math.max(0, T.heat - 0.4) * 0.6;
    U.uWither.value = S.wither; U.uSnow.value = S.snowCover; U.uIce.value = S.ice; U.uMud.value = Math.max(0, (S.level - 0.72) / 0.28);
    U.uRainI.value = Math.min(1, T.rain); U.uSnowI.value = T.snow; U.uWet.value = Math.min(1, S.puddle); U.uHaze.value = T.heat * 0.5; U.uStormDark.value = T.storm;
    U.uPar.value.lerp(new THREE.Vector2(par.x, par.y), 0.05);
    if (T.storm > 0.05) { nextStrike -= dt; if (nextStrike <= 0) { flash = 1; nextStrike = (1.5 + Math.random() * 7) * (1.2 - T.storm); } }
    flash = Math.max(0, flash - dt * 3.5); U.uFlash.value = flash > 0.6 ? flash : flash * 0.5;
    if (ready) renderer.render(scene, camera);
    return { day, flash };
  }
  function photoToScreen(u, v) { // mask/photo uv (0..1, v from top) → screen px
    const w = canvas.clientWidth, h = canvas.clientHeight, f = U.uFit.value;
    return [((u - 0.5) / f.x + 0.5) * w, ((v - 0.5) / f.y + 0.5) * h];
  }
  return { loadSite, update, resize: fit, photoToScreen, getMask: () => maskData, uniforms: U };
}
