/*
	Cache Service Worker for Console Graphics Converter by Marc Robledo
	https://github.com/marcrobledo/console-graphics-converter
	
	Used to cache the webapp files for offline use
*/

var PRECACHE_ID = 'console-graphics-converter';
var PRECACHE_VERSION = 'v1';
var PRECACHE_URLS = [
	'/console-graphics-converter/', '/console-graphics-converter/index.html',
	'/console-graphics-converter/manifest.json',
	/* webapp */
	'/console-graphics-converter/app/style.css',
	'/console-graphics-converter/app/console-graphics-converter.js',
	'/console-graphics-converter/app/console-graphics.js',
	'/console-graphics-converter/app/console-graphics.gb.js',
	'/console-graphics-converter/app/console-graphics.snes.js',
	'/console-graphics-converter/app/console-graphics.ngpc.js',
	'/console-graphics-converter/app/cash.min.js',
	'/console-graphics-converter/app/color-diff.js',
	'/console-graphics-converter/app/data-exporter.js',
	/* webapp assets */
	'/console-graphics-converter/assets/favicon.png',
	'/console-graphics-converter/assets/favicon114.png',
	'/console-graphics-converter/assets/favicon144.png',
	'/console-graphics-converter/assets/favicon192.png',
	'/console-graphics-converter/assets/header.jpg',
	'/console-graphics-converter/assets/header_logo.png',
	'/console-graphics-converter/assets/console_dmg.png',
	'/console-graphics-converter/assets/console_cgb.png',
	'/console-graphics-converter/assets/console_sfc.png',
	'/console-graphics-converter/assets/console_ngpc.png',
	'/console-graphics-converter/assets/logo.png',
	'/console-graphics-converter/assets/octicon_arrow_down.svg',
	'/console-graphics-converter/assets/octicon_arrow_left.svg',
	'/console-graphics-converter/assets/octicon_arrow_right.svg',
	'/console-graphics-converter/assets/octicon_arrow_up.svg',
	'/console-graphics-converter/assets/octicon_copy.svg',
	'/console-graphics-converter/assets/octicon_download.svg',
	'/console-graphics-converter/assets/octicon_github.svg',
	'/console-graphics-converter/assets/octicon_kebab_horizontal.svg',
	'/console-graphics-converter/assets/octicon_pencil.svg',
	'/console-graphics-converter/assets/octicon_pin.svg',
	'/console-graphics-converter/assets/octicon_stack.svg',
	'/console-graphics-converter/assets/octicon_trash.svg',
	'/console-graphics-converter/assets/octicon_upload.svg',
	'/console-graphics-converter/assets/octicon_x.svg'
];



// install event (fired when sw is first installed): opens a new cache
self.addEventListener('install', evt => {
	evt.waitUntil(
		caches.open('precache-' + PRECACHE_ID + '-' + PRECACHE_VERSION)
			.then(cache => cache.addAll(PRECACHE_URLS))
			.then(self.skipWaiting())
	);
});


// activate event (fired when sw is has been successfully installed): cleans up old outdated caches
self.addEventListener('activate', evt => {
	evt.waitUntil(
		caches.keys().then(cacheNames => {
			return cacheNames.filter(cacheName => (cacheName.startsWith('precache-' + PRECACHE_ID + '-') && !cacheName.endsWith('-' + PRECACHE_VERSION)));
		}).then(cachesToDelete => {
			return Promise.all(cachesToDelete.map(cacheToDelete => {
				console.log('Delete cache: ' + cacheToDelete);
				return caches.delete(cacheToDelete);
			}));
		}).then(() => self.clients.claim())
	);
});


// fetch event (fired when requesting a resource): returns cached resource when possible
self.addEventListener('fetch', evt => {
	if (evt.request.url.startsWith(self.location.origin)) { //skip cross-origin requests
		evt.respondWith(
			caches.match(evt.request).then(cachedResource => {
				if (cachedResource) {
					return cachedResource;
				} else {
					return fetch(evt.request);
				}
			})
		);
	}
});