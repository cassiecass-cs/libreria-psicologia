self.addEventListener("install", (e) => {
    console.log("Service Worker instalado correctamente");
});

self.addEventListener("fetch", (e) => {
    // Permite que la app funcione y gestione las peticiones con normalidad
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});