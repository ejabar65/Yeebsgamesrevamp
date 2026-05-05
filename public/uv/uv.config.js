/* eslint-disable no-undef */
self.__uv$config = {
    prefix: '/uv/service/',
    bare: 'https://bare.benroberts.com/', // Cloudflare friendly public bare server
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: '/uv/uv.handler.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
};
