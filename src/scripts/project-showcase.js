function initShowcases(){
 document.querySelectorAll('[data-project-showcase]').forEach(root=>{
  if(root.dataset.carouselReady)return;root.dataset.carouselReady='true';
  const slides=[...root.querySelectorAll('[data-project-slide]')];if(slides.length<2)return;
  let index=0,paused=false,hovered=false,focused=false;
  const count=root.querySelector('[data-carousel-count]'),pause=root.querySelector('[data-carousel-pause]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');paused=reduced.matches;
  const updatePause=()=>{if(pause){pause.textContent=paused?'继续轮播':'暂停轮播';pause.setAttribute('aria-pressed',String(paused));}};
  function show(next){index=(next+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.hidden=i!==index;});if(count)count.textContent=(index+1)+' / '+slides.length;}
  root.querySelector('[data-carousel-prev]')?.addEventListener('click',()=>show(index-1));
  root.querySelector('[data-carousel-next]')?.addEventListener('click',()=>show(index+1));
  pause?.addEventListener('click',()=>{paused=!paused;updatePause();});updatePause();
  root.addEventListener('mouseenter',()=>hovered=true);root.addEventListener('mouseleave',()=>hovered=false);
  root.addEventListener('focusin',()=>focused=true);root.addEventListener('focusout',()=>{setTimeout(()=>focused=root.contains(document.activeElement),0);});
  const timer=setInterval(()=>{if(!root.isConnected){clearInterval(timer);return;}if(!paused&&!hovered&&!focused&&!document.hidden)show(index+1);},6000);
 });
}
initShowcases();document.addEventListener('DOMContentLoaded',initShowcases);document.addEventListener('mizuki:page:loaded',initShowcases);
