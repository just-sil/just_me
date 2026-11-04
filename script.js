const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
$('#year').textContent=new Date().getFullYear();
// Mobile navigation
$('#menu')?.addEventListener('click',()=>$('.navlinks').classList.toggle('open'));
$$('.navlinks a').forEach(a=>a.addEventListener('click',()=>$('.navlinks').classList.remove('open')));
// Scroll progress + subtle reveal
const progress=$('#progress');addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max?scrollY/max:0})`},{passive:true});
if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen');io.unobserve(e.target)}}),{threshold:.08});$$('.project,.achievement,.section-index,.timeline-list>div,.cert-card').forEach(el=>io.observe(el));}
// Project filters
$$('.filter').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;$$('.project').forEach(card=>{card.style.display=f==='all'||card.dataset.category===f?'':'none'})}));
// Local media preview (files stay in browser; add media files to repo to publish them)
$('#mediaUpload')?.addEventListener('change',e=>{const grid=$('#mediaGrid');[...e.target.files].forEach(file=>{const url=URL.createObjectURL(file),wrap=document.createElement('div');wrap.className='media-placeholder';wrap.style.padding='8px';let media;if(file.type.startsWith('video/')){media=document.createElement('video');media.controls=true;media.src=url}else{media=document.createElement('img');media.src=url;media.alt=file.name}media.className='media-item';wrap.append(media);const cap=document.createElement('small');cap.textContent=file.name;cap.style.cssText='padding:8px;color:#aaa;font:9px monospace';wrap.append(cap);grid.prepend(wrap)});});
// Certificate preview
$('#certUpload')?.addEventListener('change',e=>{const root=$('#certPreview');[...e.target.files].forEach(file=>{const url=URL.createObjectURL(file);if(file.type.startsWith('image/')){const img=document.createElement('img');img.src=url;img.alt=file.name;root.append(img)}else{const a=document.createElement('a');a.href=url;a.target='_blank';a.textContent='📄 '+file.name;root.append(a)}})});
// 3D hero: Three.js WebGL orb with accessible fallback when CDN/WebGL unavailable
async function init3D(){
 const host=$('#scene');try{
 const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js');
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(40,host.clientWidth/host.clientHeight,.1,100);camera.position.z=5.2;
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(host.clientWidth,host.clientHeight);renderer.setClearColor(0x000000,0);host.innerHTML='';host.append(renderer.domElement);
 const group=new THREE.Group();scene.add(group);
 const geometry=new THREE.IcosahedronGeometry(1.35,5);
 const material=new THREE.MeshStandardMaterial({color:0x9acb4b,metalness:.68,roughness:.24,wireframe:false});
 const sphere=new THREE.Mesh(geometry,material);group.add(sphere);
 const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(1.39,2),new THREE.MeshBasicMaterial({color:0xc6ff4d,wireframe:true,transparent:true,opacity:.13}));group.add(wire);
 const particles=new THREE.BufferGeometry(),pts=[];for(let i=0;i<600;i++){const r=2.1+Math.random()*1.5,a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);pts.push(r*Math.sin(b)*Math.cos(a),r*Math.sin(b)*Math.sin(a),r*Math.cos(b))}
 particles.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const dust=new THREE.Points(particles,new THREE.PointsMaterial({color:0xb8ff66,size:.012,transparent:true,opacity:.65}));group.add(dust);
 scene.add(new THREE.AmbientLight(0x9fb5c8,1.4));const key=new THREE.PointLight(0xc6ff4d,35);key.position.set(3,3,4);scene.add(key);const blue=new THREE.PointLight(0x627cff,22);blue.position.set(-3,-2,2);scene.add(blue);
 let mx=0,my=0;host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5});
 const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();group.rotation.y=t*.12+mx*.25;group.rotation.x=Math.sin(t*.2)*.1+my*.18;sphere.rotation.y=t*.08;wire.rotation.x=-t*.07;dust.rotation.y=-t*.025;renderer.render(scene,camera)}animate();
 const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};new ResizeObserver(resize).observe(host);
 }catch(err){console.warn('3D unavailable; CSS fallback shown.',err)}
}
init3D();
