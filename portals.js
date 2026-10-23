/* AQUA wetland field dossiers: accessible, independently addressable and backed by original research content. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coords={chilika:[19.7,85.3],sundarbans:[21.9,89.2],tsokar:[33.3,78.0],everglades:[25.3,-80.9],pantanal:[-18.2,-56.6],okavango:[-19.3,22.9],kakadu:[-12.6,132.8],wadden:[53.5,7.4],danube:[45.1,29.5],kushiro:[43.1,144.5]};
let wetlands=[],current=null,tab='overview',onLab=()=>{},lastHash='#hero',lastFocus=null;
const layout=(left,right)=>`<div class="portal-essay-layout"><div><span class="portal-mini-kicker">${left}</span><div class="portal-big-number">A.</div></div><div>${right}</div></div>`;
function contentFor(w){if(tab==='overview'){
 return layout(`01 / ${escapeHTML(w.ecosystem.toUpperCase())}`,`<h3 class="portal-section-title">A PLACE<br>BETWEEN<br>WORLDS.</h3><p class="portal-essay">${escapeHTML(w.description)}</p><div class="portal-factgrid"><div class="portal-fact"><small>ECOSYSTEM CATEGORY</small><strong>${escapeHTML(w.type)}</strong></div><div class="portal-fact"><small>CLIMATE</small><strong>${escapeHTML(w.climate)}</strong></div><div class="portal-fact"><small>REGION</small><strong>${escapeHTML(w.region)}, ${escapeHTML(w.country)}</strong></div><div class="portal-fact"><small>HYDROLOGICAL CHARACTER</small><strong>${escapeHTML(w.ecosystem)}</strong></div></div><p class="portal-essay">${escapeHTML(w.waterBehaviour)}</p><p class="portal-source">RESEARCH REFERENCES: ${escapeHTML(w.source)}. These site summaries come from the original AQUA educational dataset.</p>`);
 }
 if(tab==='rainfall'){
 return `<span class="portal-mini-kicker">02 / RAINFALL SCENARIO RESEARCH</span><h3 class="portal-section-title">ONE WETLAND.<br>THREE RAINFALL STORIES.</h3><p class="portal-essay" style="max-width:800px">${escapeHTML(w.waterBehaviour)} Compare the site's original researched dry, typical, and extreme rainfall narratives below. These are descriptions, not measured predictions.</p><div class="portal-scenarios">${w.scenarios.map((s,i)=>`<article class="portal-scenario"><span class="scenario-num">0${i+1}</span><h4>${escapeHTML(s.label)}</h4><p>${escapeHTML(s.effect)}</p><p class="portal-source">SOURCE: ${escapeHTML(s.source)}</p><button class="portal-primary" type="button" data-try-rain="${i}">TEST THIS SCENARIO ↗</button></article>`).join('')}</div>`;
 }
 return `<span class="portal-mini-kicker">03 / BIODIVERSITY FIELD NOTES</span><h3 class="portal-section-title">THE LIFE<br>BEHIND THE LANDSCAPE.</h3><p class="portal-essay" style="max-width:820px">Animals, plants, water, and local climate are part of one interconnected system. These species groups and habitats are described in the original AQUA wetland records.</p><div class="portal-species"><div class="portal-species-group"><span class="portal-mini-kicker">FLORA / PLANT LIFE</span><h4>ROOTED IN WATER.</h4>${w.plants.map(x=>`<span class="portal-chip">${escapeHTML(x)}</span>`).join('')}</div><div class="portal-species-group"><span class="portal-mini-kicker">FAUNA / WILDLIFE</span><h4>THE WETLAND IN MOTION.</h4>${w.animals.map(x=>`<span class="portal-chip">${escapeHTML(x)}</span>`).join('')}</div></div><p class="portal-source">REFERENCE: ${escapeHTML(w.source)}. Species lists are illustrative examples of the wetland's living communities, not biodiversity inventories.</p>`;
}
function render(){const w=current;if(!w)return;const i=wetlands.indexOf(w);const [lat,lon]=coords[w.key];$('portalPhoto').style.backgroundImage=`url('/assets/wetlands/${encodeURIComponent(w.key)}.jpg')`;$('portalEyebrow').textContent=`${String(i+1).padStart(2,'0')} / 10 · ${w.country.toUpperCase()} / ${w.region.toUpperCase()}`;
 const words=w.name.split(' ');let title='';if(words.length===1)title=`${escapeHTML(words[0])}<em>.</em>`;else title=`${escapeHTML(words.slice(0,-1).join(' '))}<br><em>${escapeHTML(words.at(-1))}.</em>`;
 $('portalTitle').innerHTML=title;$('portalTagline').textContent=w.description;$('portalCoords').textContent=`${Math.abs(lat).toFixed(1)}° ${lat>=0?'N':'S'} / ${Math.abs(lon).toFixed(1)}° ${lon>=0?'E':'W'}`;$('portalFileNumber').textContent=String(i+1).padStart(2,'0');const hist=$('portalHistory');if(hist)hist.href=`simulator/#site=${encodeURIComponent(w.key)}&history`;
 for(const btn of document.querySelectorAll('[data-portal-tab]'))btn.setAttribute('aria-selected',String(btn.dataset.portalTab===tab));
 const box=$('portalTabContent');box.innerHTML=contentFor(w);box.style.animation='none';void box.offsetWidth;box.style.animation='';box.querySelectorAll('[data-try-rain]').forEach(b=>b.addEventListener('click',()=>launchLab(Number(b.dataset.tryRain))));
}
function open(w,{route=true}={}){if(!w)return;if(!$('wetlandPortal').classList.contains('active')){lastHash=location.hash&&!location.hash.startsWith('#wetland/')?location.hash:'#hero';lastFocus=document.activeElement;}
 current=w;tab='overview';render();$('wetlandPortal').classList.add('active');$('wetlandPortal').setAttribute('aria-hidden','false');$('wetlandPortal').scrollTop=0;$('portalClose').focus({preventScroll:true});if(route)history.pushState({wetland:w.key},'',`#wetland/${w.key}`);window.AQUA_PLANET?.turnTo(w);
}
function close({route=true}={}){const p=$('wetlandPortal');p.classList.remove('active');p.setAttribute('aria-hidden','true');if(route)history.replaceState({},'',lastHash);if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});current=null;}
function selectTab(t){tab=t;render();$('portalTabContent').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function launchLab(i){if(!current)return;const selected=current;close();onLab(selected,i);}
function navigate(delta){if(!current)return;open(wetlands[(wetlands.indexOf(current)+delta+wetlands.length)%wetlands.length],{route:false});history.replaceState({},'',`#wetland/${current.key}`)}
function syncURL(){const m=location.hash.match(/^#wetland\/([a-z]+)$/);if(m){const w=wetlands.find(x=>x.key===m[1]);if(w&&w!==current)open(w,{route:false})}else if(current)close({route:false})}
function init(items,selectedLab){wetlands=items;onLab=selectedLab;
 $('portalClose').addEventListener('click',()=>close());$('portalLaunchLab').addEventListener('click',()=>launchLab());$('portalExploreSpecies').addEventListener('click',()=>selectTab('wildlife'));
 document.querySelectorAll('[data-portal-tab]').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.portalTab)));
 $('portalPrevious').addEventListener('click',()=>navigate(-1));$('portalNext').addEventListener('click',()=>navigate(1));
 document.addEventListener('keydown',e=>{if(!current)return;if(e.key==='Escape'){e.preventDefault();close()}if((e.key==='ArrowRight'||e.key==='ArrowLeft')&&e.altKey){e.preventDefault();navigate(e.key==='ArrowRight'?1:-1)}if(e.key==='Tab'){const visible=[...$('wetlandPortal').querySelectorAll('button:not([disabled])')].filter(x=>x.getClientRects().length);const first=visible[0],last=visible.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 window.addEventListener('popstate',syncURL);window.addEventListener('hashchange',syncURL);syncURL();}
window.AquaPortals={init,open,close};
})();
