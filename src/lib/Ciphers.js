function applyCipher(method, buffer, key, ...params) {
    switch (method) {
        case 'GLOBAL_XOR_CIPHER': GlobalXorCipher(buffer, key, ...params);
            break;
        default: throw new Error(`Unsupported cipher method: ${method}`);
    }
}

function GlobalXorCipher(buffer, key, pos) {
    buffer.forEach((v, k) => {
        buffer[k] ^= key[(pos + k) & (key.length - 1)];
    });
}

module.exports = {
    applyCipher
};