//listener for static assets
const STATIC_CACHE = "static-cache-v1";
const DATA_CACHE = "data-cache-v1";


const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/indexedDB.js",
    "/manifest.webmanifest",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

// install
self.addEventListener("install", function (evt) {
    // pre cache image data
    evt.waitUntil(
        caches.open(STATIC_CACHE).then(cache => cache.addAll(FILES_TO_CACHE))
    );
    //skip waiting stage
    self.skipWaiting();
});

// activate
self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== STATIC_CACHE && key !== DATA_CACHE) {
                        console.log("Removing old data in cache", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});


//Fetching
self.addEventListener('fetch', evt => {
    evt.respondWith( 
        caches.match(evt.request).then(response => response || fetch (evt.request))
    )
});