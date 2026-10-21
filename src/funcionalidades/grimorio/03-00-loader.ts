(()=>{'use strict';
  const loader=document.getElementById('forja-loader');
  const embedded=window.self!==window.top;
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const requestAnimationFrame=window.requestAnimationFrame?.bind(window)||(callback=>setTimeout(()=>callback(Date.now()),16));
  const cancelAnimationFrame=window.cancelAnimationFrame?.bind(window)||clearTimeout;
  let leaving=false;
  function dismiss(){if(!loader)return;loader.classList.add('is-finished');setTimeout(()=>{if(!leaving)loader.hidden=true},reduce?.matches?0:280)}
  function ready(){requestAnimationFrame(()=>requestAnimationFrame(dismiss))}
  if(embedded){if(loader)loader.hidden=true;return}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  window.addEventListener('pageshow',()=>{leaving=false;dismiss()});
  // Real navigation, not a simulated percentage. Modified clicks retain browser behavior.
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||link.download||link.target)return;
    const destination=new URL(link.href,location.href);
    if(!/\/(index|Criador%20de%20Ficha%20T20|Arsenal%20de%20Arton|grimorio|taverna|mercenarios)\.html$/i.test(destination.pathname)||destination.hash)return;
    if(!loader)return;
    event.preventDefault();leaving=true;loader.hidden=false;loader.classList.remove('is-finished');
    location.assign(destination.href);
  });
  // Atmosphere is separate from content: three depths, soft sprites, no DOM particles.
  if(document.getElementById('dust'))return;
  const canvas=document.createElement('canvas');canvas.className='forja-atmosphere';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const sprite=document.createElement('canvas');sprite.width=sprite.height=128;
  const paint=sprite.getContext('2d');if(!paint)return;
  const gradient=paint.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'#b82b4540');gradient.addColorStop(.45,'#701d3420');gradient.addColorStop(1,'#701d3400');paint.fillStyle=gradient;paint.fillRect(0,0,128,128);
  let width=0,height=0,frame=0,last=0,clouds=[],pointer={x:0,y:0};
  function resize(){width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);clouds=Array.from({length:width<600?50:75},(_,i)=>({x:Math.random()*width,y:Math.random()*height,depth:1+i%3,r:45+Math.random()*95,phase:Math.random()*6.28}))}
  function draw(time){frame=0;const dt=Math.min((time-last)/1000||0,.05);last=time;ctx.clearRect(0,0,width,height);for(const cloud of clouds){if(!reduce?.matches){cloud.phase+=dt*.12;cloud.y-=dt*cloud.depth*3;cloud.x+=Math.sin(cloud.phase)*dt*4;if(cloud.y<-cloud.r)cloud.y=height+cloud.r}const x=cloud.x+pointer.x*cloud.depth*3,y=cloud.y+pointer.y*cloud.depth*3;ctx.globalAlpha=.18+cloud.depth*.12;ctx.drawImage(sprite,x-cloud.r,y-cloud.r,cloud.r*2,cloud.r*2)}if(!reduce?.matches&&!document.hidden)frame=requestAnimationFrame(draw)}
  function restart(){cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(draw)}
  window.addEventListener('pointermove',event=>{if(!reduce?.matches)pointer={x:event.clientX/width-.5,y:event.clientY/height-.5}},{passive:true});
  window.addEventListener('resize',()=>{resize();restart()});document.addEventListener('visibilitychange',restart);reduce?.addEventListener('change',restart);resize();restart();
})();
