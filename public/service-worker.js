//listener for static assets
const STATIC_CACHE = 'static-cache-v2';
const DATA_CACHE = "data-cache-v1";


const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/indexedDB",
    "/manifest.webmanifest",
    "/service-worker.js",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512-512.png",
];

// install
self.addEventListener("install", function (evt) {
    // pre cache image data
    evt.waitUntil(
        caches.open(DATA_CACHE).then((cache) => cache.add("/api/images"))
    );

    // pre cache all static assets
    evt.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(FILES_TO_CACHE))
    );

    // tell the browser to activate this service worker immediately once it
    // has finished installing
    self.skipWaiting();
});

// activate
self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== STATIC_CACHE && key !== DATA_CACHE
        ) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// fetch
self.addEventListener("fetch", function (evt) {
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
            caches.open(DATA_CACHE
).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        // If the response was good, clone it and store it in the cache.
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        // Network request failed, try to get it from the cache.
                        return cache.match(evt.request);
                    });
            }).catch(err => console.log(err))
        );

        return;
    }

    //app will serve static assets if api is not requested 
    evt.respondWith(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.match(evt.request).then(response => {
                return response || fetch(evt.request);
            })
        })
    );
});






