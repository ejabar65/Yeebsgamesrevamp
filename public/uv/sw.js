importScripts('uv.bundle.js');
importScripts('libcurl.js');
if (self.LibcurlTransport && self.LibcurlTransport.LibcurlClient) {
    self.LibcurlTransport = self.LibcurlTransport.LibcurlClient;
}
importScripts('uv.config.js');
importScripts('uv.sw.js');

const sw = new UVServiceWorker();

self.addEventListener('fetch', (event) => {
    event.respondWith(sw.fetch(event));
});
