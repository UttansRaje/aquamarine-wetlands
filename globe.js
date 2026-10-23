/* AQUA planetary observatory. Local WebGL globe with atmosphere, cloud layer and clickable wetland beacons.
   No external scripts, remote map tile APIs, credentials, or real-time data. */
(() => {
'use strict';
const rad = Math.PI/180;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a),0,1);return x*x*(3-2*x)};
const coordinates={chilika:[19.7,85.3],sundarbans:[21.9,89.2],tsokar:[33.3,78.0],everglades:[25.3,-80.9],pantanal:[-18.2,-56.6],okavango:[-19.3,22.9],kakadu:[-12.6,132.8],wadden:[53.5,7.4],danube:[45.1,29.5],kushiro:[43.1,144.5]};
// Approximate geographic centres for visual navigation, not exact polygon footprints.
const vertex=`attribute vec2 aPos;varying vec2 vUV;void main(){vUV=aPos*.5+.5;gl_Position=vec4(aPos,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 vUV;
uniform sampler2D uEarth;uniform sampler2D uCloud;
uniform float uYaw;uniform float uTilt;uniform float uTime;
const float PI=3.141592653589793;
void main(){
 vec2 p=(vUV*2.-1.)*1.175;float r2=dot(p,p);
 if(r2>1.14){discard;}
 if(r2>=1.0){float halo=pow(max(0.,1.14-r2)/.14,2.)*.25;gl_FragColor=vec4(.10,.85,.68,halo);return;}
 float z=sqrt(max(0.,1.-r2));
 float ct=cos(uTilt),st=sin(uTilt),cy=cos(uYaw),sy=sin(uYaw);
 float wy=p.y*ct+z*st;
 float wz=z*ct-p.y*st;
 float wx=p.x*cy+wz*sy;
 float zz=wz*cy-p.x*sy;
 float lon=atan(wx,zz);
 vec2 uv=vec2(fract(lon/(2.*PI)+.5),.5+asin(clamp(wy,-1.,1.))/PI);
 vec3 earth=texture2D(uEarth,uv).rgb;
 vec4 cloud=texture2D(uCloud,vec2(fract(uv.x-uTime*.0018),uv.y));
 vec3 n=vec3(p,z);
 float sun=max(dot(n,normalize(vec3(-.48,.30,.83))),0.);
 float diffuse=.19+.89*pow(sun,.92);
 vec3 color=mix(earth,mix(earth,vec3(.83,.96,.91),cloud.a*.95),.78)*diffuse;
 float edge=pow(1.-z,3.5);
 color+=vec3(.04,.38,.39)*edge*1.85;
 color+=vec3(.08,.31,.29)*pow(max(0.,dot(n,normalize(vec3(.25,-.2,1.)))),20.)*.35;
 float alpha=smoothstep(0.001,.034,1.-r2);
 gl_FragColor=vec4(color,alpha);
}`;
function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function buildGL(canvas){const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:false,stencil:false,premultipliedAlpha:false,powerPreference:'high-performance'});if(!gl)throw Error('WebGL unavailable');const program=gl.createProgram();gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const vertices=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const att=gl.getAttribLocation(program,'aPos');gl.enableVertexAttribArray(att);gl.vertexAttribPointer(att,2,gl.FLOAT,false,0,0);
 const uniforms={yaw:gl.getUniformLocation(program,'uYaw'),tilt:gl.getUniformLocation(program,'uTilt'),time:gl.getUniformLocation(program,'uTime')};
 const textures=[gl.createTexture(),gl.createTexture()];
 function loadTexture(slot,path){const tex=textures[slot];gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([10,45,54,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 const img=new Image();img.onload=()=>{gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);};img.src=path;}
 loadTexture(0,'/assets/planet/earth-surface.jpg');loadTexture(1,'/assets/planet/earth-clouds.png');gl.uniform1i(gl.getUniformLocation(program,'uEarth'),0);gl.uniform1i(gl.getUniformLocation(program,'uCloud'),1);
 let lastSize=0;
 return {draw(yaw,tilt,now){const size=clamp(Math.round(canvas.getBoundingClientRect().width*Math.min(devicePixelRatio||1,1.65)),260,1240);if(size!==lastSize){canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);lastSize=size;}gl.useProgram(program);gl.uniform1f(uniforms.yaw,yaw);gl.uniform1f(uniforms.tilt,tilt);gl.uniform1f(uniforms.time,now*.001);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);}};
}
function buildCanvasFallback(canvas){
  const out=canvas.getContext('2d',{alpha:true,willReadFrequently:false});if(!out)throw Error('No 2D renderer');
  const W=480,H=480,TW=1024,TH=512;canvas.width=W;canvas.height=H;
  const scratch=document.createElement('canvas');scratch.width=TW;scratch.height=TH;const scratchCtx=scratch.getContext('2d',{willReadFrequently:true});
  const read=(src)=>new Promise(resolve=>{const img=new Image();img.onload=()=>{scratchCtx.clearRect(0,0,TW,TH);scratchCtx.drawImage(img,0,0,TW,TH);resolve(scratchCtx.getImageData(0,0,TW,TH).data)};img.onerror=()=>resolve(null);img.src=src});
  let surface=null,cloud=null;
  Promise.all([read('/assets/planet/earth-surface.jpg'),read('/assets/planet/earth-clouds.png')]).then(([a,b])=>{surface=a;cloud=b});
  const buffer=out.createImageData(W,H),dst=buffer.data, pre=[],scale=1.175;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const py=-(y/H*2-1)*scale,px=(x/W*2-1)*scale;const r2=px*px+py*py;if(r2<1){const z=Math.sqrt(1-r2);pre.push([((y*W+x)*4),px,py,z,.23+.79*Math.max(0,(-px*.48+py*.3+z*.83)),Math.pow(1-z,3)])}}
  let last=0,wasReady=false;
  return {draw(yaw,tilt,now){if(!surface||!cloud)return; // 2D rendering is deliberately throttled on weaker devices.
    if(now-last<65&&wasReady)return;last=now;wasReady=true;
    dst.fill(0);const cy=Math.cos(yaw),sy=Math.sin(yaw),ct=Math.cos(tilt),st=Math.sin(tilt);
    for(let k=0;k<pre.length;k++){
      const [i,px,py,z,shade,rim]=pre[k];const wy=py*ct+z*st,wz=z*ct-py*st,wx=px*cy+wz*sy,zz=wz*cy-px*sy;
      const lat=Math.asin(Math.max(-1,Math.min(1,wy))),lon=Math.atan2(wx,zz);
      const tx=((Math.floor((lon/(Math.PI*2)+.5)*TW)%TW)+TW)%TW,ty=Math.max(0,Math.min(TH-1,Math.floor((.5-lat/Math.PI)*TH))),j=(ty*TW+tx)*4;
      const cx=(tx+Math.floor(now*.000009*TW))%TW,ci=(ty*TW+cx)*4,alpha=cloud[ci+3]/255*.58;
      dst[i]=Math.min(255,(surface[j]*(1-alpha)+220*alpha)*shade+rim*10);
      dst[i+1]=Math.min(255,(surface[j+1]*(1-alpha)+247*alpha)*shade+rim*78);
      dst[i+2]=Math.min(255,(surface[j+2]*(1-alpha)+231*alpha)*shade+rim*76);
      dst[i+3]=255;
    }
    out.putImageData(buffer,0,0);
  }};
}
function start(wetlands,openPortal){
 const hero=document.getElementById('planetHero');const stage=document.getElementById('planetStage');const canvas=document.getElementById('planetCanvas');const markerLayer=document.getElementById('planetMarkers');const status=document.getElementById('planetPosition');const note=document.getElementById('planetHint');if(!hero||!stage||!canvas||!markerLayer)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let drawGL=null;try{drawGL=buildGL(canvas)}catch(err){console.warn('Using interactive 2D globe fallback:',err.message);stage.classList.add('globe-fallback');try{drawGL=buildCanvasFallback(canvas)}catch{stage.classList.add('globe-static')}}
 let yaw=78*rad, tilt=15*rad, vel=0, dragging=false,lastX=0,lastY=0,pointerMoved=false,zoom=1,focus=null,auto=true,lastTick=0,visible=true,scrollProgress=0;
 const markers=new Map();
 function setAuto(next){auto=next;const b=document.getElementById('planetAuto');b?.setAttribute('aria-pressed',String(auto));if(b)b.textContent=auto?'Ⅱ PAUSE ORBIT':'↻ RESUME ORBIT';}
 function moveTo(w){const loc=coordinates[w.key];if(!loc)return;focus={yaw:loc[1]*rad,tilt:loc[0]*rad};setAuto(false);}
 wetlands.forEach((w,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='planet-marker';btn.dataset.key=w.key;btn.innerHTML=`<span class="marker-ring"></span><span class="marker-core"></span><span class="marker-label"><span class="marker-no">${String(i+1).padStart(2,'0')}</span> ${w.name.replace(' Wetland Complex','').replace(' Wetlands','')}</span>`;btn.setAttribute('aria-label',`Open ${w.name} wetland experience`);btn.title=`Open ${w.name}`;btn.addEventListener('pointerdown',e=>e.stopPropagation());btn.addEventListener('click',e=>{e.stopPropagation();moveTo(w);openPortal(w)});markerLayer.appendChild(btn);markers.set(w.key,btn)});
 const directory=document.getElementById('planetDirectory');if(directory){directory.innerHTML=wetlands.map((w,i)=>`<button type="button" class="planet-directory-item" data-place="${w.key}"><span>${String(i+1).padStart(2,'0')}</span>${w.name.replace(' Wetland Complex','').replace(' Wetlands','')}<span>↗</span></button>`).join('');directory.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{const w=wetlands.find(w=>w.key===btn.dataset.place);if(w){moveTo(w);openPortal(w)}}));}
 const explore=document.getElementById('planetExplore');explore?.addEventListener('click',()=>document.getElementById('atlas')?.scrollIntoView({behavior:reduce?'auto':'smooth'}));
 document.getElementById('planetAuto')?.addEventListener('click',()=>{focus=null;setAuto(!auto)});
 document.getElementById('planetReset')?.addEventListener('click',()=>{focus={yaw:78*rad,tilt:15*rad};zoom=1;setAuto(false)});
 canvas.addEventListener('pointerdown',e=>{dragging=true;pointerMoved=false;lastX=e.clientX;lastY=e.clientY;vel=0;focus=null;setAuto(false);canvas.setPointerCapture(e.pointerId);canvas.classList.add('is-dragging')});
 canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(dx)+Math.abs(dy)>1)pointerMoved=true;const width=Math.max(250,canvas.getBoundingClientRect().width);yaw-=dx/width*3.4;tilt=clamp(tilt+dy/width*2.5,-1.25,1.25);vel=-dx/width*3.4;lastX=e.clientX;lastY=e.clientY});
 const endDrag=()=>{dragging=false;canvas.classList.remove('is-dragging')};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom-e.deltaY*.0005,.84,1.19);stage.style.setProperty('--user-zoom',zoom.toFixed(3))},{passive:false});
 canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){yaw+=e.key==='ArrowLeft'?-.15:.15;setAuto(false);e.preventDefault();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){tilt=clamp(tilt+(e.key==='ArrowUp'?.12:-.12),-1.25,1.25);setAuto(false);e.preventDefault()}});
 const obs=new IntersectionObserver(es=>{visible=es[0]?.isIntersecting??true},{threshold:0});obs.observe(hero);
 function scroll(){const r=hero.getBoundingClientRect(),travel=Math.max(1,hero.offsetHeight-innerHeight);scrollProgress=clamp(-r.top/travel,0,1);const slide=smooth(.075,.59,scrollProgress);const targetShift=innerWidth>880?innerWidth*.235:0;hero.style.setProperty('--planet-shift',`${Math.round(slide*targetShift)}px`);hero.style.setProperty('--planet-size-scale',`${(1-slide*(innerWidth>880?.07:.15)).toFixed(3)}`);hero.style.setProperty('--intro-opacity',String(1-smooth(.02,.23,scrollProgress)));hero.style.setProperty('--story-a',String(smooth(.17,.29,scrollProgress)*(1-smooth(.54,.65,scrollProgress))));hero.style.setProperty('--story-b',String(smooth(.57,.67,scrollProgress)*(1-smooth(.82,.92,scrollProgress))));hero.style.setProperty('--story-c',String(smooth(.85,.94,scrollProgress)));hero.style.setProperty('--planet-depth',String(slide));}
 addEventListener('scroll',scroll,{passive:true});addEventListener('resize',scroll,{passive:true});scroll();
 function normalize(){yaw=((yaw+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;}
 function shortest(a,b){return Math.atan2(Math.sin(b-a),Math.cos(b-a));}
 function render(now){requestAnimationFrame(render);if(!visible||document.hidden)return;const dt=clamp((now-lastTick)/16.67||1,.25,3);lastTick=now;
 if(focus){const dy=shortest(yaw,focus.yaw),dp=focus.tilt-tilt;yaw+=dy*.062*dt;tilt+=dp*.065*dt;if(Math.abs(dy)+Math.abs(dp)<.012)focus=null;}else if(!dragging){if(auto&&!reduce)yaw+=.00085*dt;else if(Math.abs(vel)>.00005){yaw+=vel*.75*dt;vel*=Math.pow(.91,dt)}}normalize();
 if(drawGL){try{drawGL.draw(yaw,tilt,reduce?0:now)}catch(err){console.warn('WebGL render disabled',err);try{drawGL=buildCanvasFallback(canvas)}catch{drawGL=null;stage.classList.add('globe-static')}}}
 const size=canvas.getBoundingClientRect().width;const radius=size/2/1.175;
 for(const w of wetlands){const b=markers.get(w.key);const loc=coordinates[w.key];const lat=loc[0]*rad,dlon=loc[1]*rad-yaw;
 const x=Math.cos(lat)*Math.sin(dlon),y=Math.sin(lat)*Math.cos(tilt)-Math.cos(lat)*Math.cos(dlon)*Math.sin(tilt),z=Math.sin(lat)*Math.sin(tilt)+Math.cos(lat)*Math.cos(dlon)*Math.cos(tilt);
 const onfront=z>.105; b.style.left=`${size/2+x*radius}px`;b.style.top=`${size/2-y*radius}px`;b.classList.toggle('is-behind',!onfront);b.style.setProperty('--marker-z',String(clamp(z,0,1)));b.tabIndex=onfront?0:-1;
 }
 if(status){const n=((Math.round(yaw/rad)%360)+360)%360;status.textContent=`${Math.round(tilt/rad)}°N / ${n}°E`}
 }
 requestAnimationFrame(render);
 window.AQUA_PLANET={turnTo:moveTo,focusWetland:(key)=>{const w=wetlands.find(x=>x.key===key);if(w)moveTo(w)},getCoordinates:()=>coordinates};
}
window.AquaGlobe={start,coordinates};
})();
