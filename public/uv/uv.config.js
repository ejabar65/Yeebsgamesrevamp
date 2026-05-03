if (self.LibcurlTransport && self.LibcurlTransport.LibcurlClient) {
    self.LibcurlTransport = self.LibcurlTransport.LibcurlClient;
}

self.__uv$config = {
    prefix: '/uv/service/',
    bare: 'https://bare.benroberts.dev/',
    encodeUrl: (url) => { return url ? Ultraviolet.codec.xor.encode(url) : url; },
    decodeUrl: (url) => { return url ? Ultraviolet.codec.xor.decode(url) : url; },
    handler: '/uv/uv.handler.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    transport: self.LibcurlTransport,
};
