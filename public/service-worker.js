/*
Copyright 2015, 2019, 2020, 2021 Google LLC. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

// Incrementing OFFLINE_VERSION will kick off the install event and force
// previously cached resources to be updated from the network.
// This variable is intentionally declared and unused.
// Add a comment for your linter if you want:
// eslint-disable-next-line no-unused-vars
const OFFLINE_VERSION = 1;
const CACHE_NAME = "offline";
// Customize this with a different URL if needed.
const OFFLINE_URL = "offline.html";
const a = location.pathname.split("/"); a.pop();
const root = (a.join('/') + '/').replace(/\/demo\/.*/,'/'); 

const appFiles = ["", "index.html", "pwa.js", "manifest.json", "offline.html", "demo/", "demo/index.html", "demo/script.js", "demo/style.css", "demo/test.html", "demo/test.js", "images/icon.png", "images/Plan2Go.png", "images/Plan2GoBanner.png"]
const contentToCache = [...appFiles.map((f)=>`${root}${f}`), "https://unpkg.com/ical.js", "https://kit.fontawesome.com/a0d8d27dcc.js"];

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      console.log("[Service Worker] Caching all app files");

      // Setting {cache: 'reload'} in the new request ensures that the
      // response isn't fulfilled from the HTTP cache; i.e., it will be
      // from the network.
      // await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));

      // await cache.addAll(contentToCache);
      await cache.addAll(contentToCache.map((urlToPrefetch) => new Request(urlToPrefetch, { cache: "reload" })))

      console.log("[Service Worker] Cached all app files!");
    })()
  );

  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key === CACHE_NAME) return;
          return caches.delete(key);
        })
      );
    })
  );

  event.waitUntil(
    (async () => {
      // Enable navigation preload if it's supported.
      // See https://developers.google.com/web/updates/2017/02/navigation-preload
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );

  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only call event.respondWith() if this is a navigation request
  // for an HTML page.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          // First, try to use the navigation preload response if it's
          // supported.
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) return preloadResponse;

          // Always try the network first.
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          // catch is only triggered if an exception is thrown, which is
          // likely due to a network error.
          // If fetch() returns a valid HTTP response with a response code in
          // the 4xx or 5xx range, the catch() will NOT be called.
          console.log("[Service Worker] Fetch failed; returning cached page instead.", error);

          let cacheUrl = event.request.url.replace(location.origin, '');
          const cachedResponse = await caches.match(cacheUrl) ?? await cache.match(cacheUrl);
          console.log(`[Service Worker] Fetching resource: ${cacheUrl}`);
          if (cachedResponse) return cachedResponse;
          else {
            console.log("[Service Worker] Cannot find cached page; returning offline page instead.");
            return await cache.match(OFFLINE_URL);
          }
        }
      })()
    );
  }

  // If our if() condition is false, then this fetch handler won't
  // intercept the request. If there are any other fetch handlers
  // registered, they will get a chance to call event.respondWith().
  // If no fetch handlers call event.respondWith(), the request
  // will be handled by the browser as if there were no service
  // worker involvement.
});

self.addEventListener('notificationclick', event => {
  if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(self.clients.matchAll().then(clients => {
      if(clients.length){ // check if at least one tab is already open
        clients[0].focus();
        clients[0].postMessage('Push notification clicked!');
      } else {
        self.clients.openWindow(root);
      }
    }));
  }
});
