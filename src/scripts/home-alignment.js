const instances=new WeakMap();
function alignHome() {
 const home=document.querySelector('.learning-home');
 if(!home)return;
 const existing=instances.get(home);
 if(existing){existing.refresh();return;}
 const grid=home.querySelector('.learning-category-grid');
 if(!grid)return;
 let frame;const timers=new Set();
 function update(){
  if(!home.isConnected){observer.disconnect();window.removeEventListener('resize',schedule);instances.delete(home);for(const timer of timers)clearTimeout(timer);return;}
  if(window.innerWidth<1280){home.style.removeProperty('--home-category-height');return;}
  const target=document.querySelector('#right-sidebar widget-layout[data-id="categories"]');
  if(!target||!target.getBoundingClientRect().width)return;
  const height=Math.max(328,target.getBoundingClientRect().bottom-grid.getBoundingClientRect().top);
  const value=height+'px';if(home.style.getPropertyValue('--home-category-height')!==value)home.style.setProperty('--home-category-height',value);
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(update);}
 function refresh(){schedule();for(const delay of [100,350,800]){const timer=setTimeout(()=>{timers.delete(timer);schedule();},delay);timers.add(timer);}}
 const observer=new ResizeObserver(schedule);
 for(const el of [home.querySelector('.learning-intro'),...document.querySelectorAll('#right-sidebar .sidebar-content')])if(el)observer.observe(el);
 instances.set(home,{refresh});window.addEventListener('resize',schedule);document.fonts.ready.then(schedule);refresh();
}
alignHome();
for(const event of ['mizuki:page:loaded','astro:page-load'])document.addEventListener(event,alignHome);
window.addEventListener('pageshow',alignHome);window.addEventListener('popstate',()=>setTimeout(alignHome,0));
// Navigation may restore cached markup with old data attributes, or replace
// content before the theme emits its page-loaded event.
new MutationObserver(alignHome).observe(document.body,{childList:true,subtree:true});
