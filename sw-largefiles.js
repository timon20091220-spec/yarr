const manifestPromise = fetch('./large-files.json', { cache: 'no-store' }).then(r => r.json());
self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    let manifest;
    try { manifest = await manifestPromise; } catch (_) { return fetch(event.request); }
    const reqUrl = new URL(event.request.url);
    const scopePath = new URL(self.registration.scope).pathname;
    if (!reqUrl.pathname.startsWith(scopePath)) return fetch(event.request);
    const key = decodeURIComponent(reqUrl.pathname.substring(scopePath.length));
    const item = manifest.files[key];
    if (!item) return fetch(event.request);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const part of item.parts) {
            const res = await fetch(new URL(part, self.registration.scope), { cache: 'force-cache' });
            if (!res.ok) throw new Error('Chunk load failed: ' + part + ' / ' + res.status);
            const reader = res.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          }
          controller.close();
        } catch (err) { controller.error(err); }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': item.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  })());
});
