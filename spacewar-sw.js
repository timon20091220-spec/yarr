const CACHE_NAME='space-arcade-v13-24-1-20260817172213';
const SHELL=['./','./index.html','./manifest.webmanifest?v=13.24.1','./spacewar-icon-192.png','./spacewar-icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('space-arcade-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const isUnityAsset=url.pathname.includes('/Build/')||url.pathname.includes('/TemplateData/');
  if(isUnityAsset){
    // Always prefer the freshly deployed Unity build. Old cache entries can otherwise
    // mix a new index/loader with old .data/.wasm files and appear to hang forever.
    event.respondWith(fetch(event.request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
    return response;
  }).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./'))));
});