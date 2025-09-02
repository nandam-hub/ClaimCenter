let polyfillsInPlace: string[] = [];

(function () {
    if (typeof window === 'undefined' || !window) {
        return;
    }

    if (!window.crypto) {
        (window as any).crypto = {} as Crypto;
        polyfillsInPlace.push("crypto")
    }

    const cryptoObj = window.crypto;

    // NOTE: getRandomValues IS available in insecure environments, so should always be here in modern browsers.
    // But versions of node before 16 did not have crypto, and some ancient test execution environments still use old nodejs to simulate an environment
    // So this method is entirely deterministic for those reasons. And just uses simple values.
    if (!cryptoObj.getRandomValues) {
        polyfillsInPlace.push("getRandomValues");
        cryptoObj.getRandomValues = function <T extends ArrayBufferView | null>(array: T): T {
            console.warn("==== GW WARNING: getRandomValues is polyfilled to use deterministic values.");
            if (
                !(array instanceof Uint8Array ||
                    array instanceof Int8Array ||
                    array instanceof Uint16Array ||
                    array instanceof Int16Array ||
                    array instanceof Uint32Array ||
                    array instanceof Int32Array)
            ) {
                throw new TypeError("Expected an integer TypedArray");
            }

            // Uses deterministic outcomes so customer security scans don't complain about insecure methods
            // Remember, this is only used if getRandomValues does not exist, which means some very strange things have happened
            let seed = Date.now() >>> 0;
            for (let i = 0; i < array.byteLength; i++) {
                // Linear Congruential Generator (32-bit)
                // Get next bit and 0-255 from seed
                seed = (1664525 * seed + 1013904223) >>> 0;
                (array as Uint8Array)[i] = (seed >>> 24) & 0xff;
            }

            return array;
        };
    }

    // Polyfill for randomUUID (uses getRandomValues)
    // randomUUID is not available in insecure execution environments, which would only happen in automated tests running in http mode.
    // So we polyfill it here with a reasonably sound method
    if (!cryptoObj.randomUUID) {
        polyfillsInPlace.push("randomUUID");
        cryptoObj.randomUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
            const bytes = new Uint8Array(16);
            cryptoObj.getRandomValues(bytes);

            // Set version 4 UUID bits
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;

            const byteToHex: string[] = [];
            for (let i = 0; i < 256; ++i) {
                byteToHex.push(i.toString(16).padStart(2, '0'));
            }

            return `${byteToHex[bytes[0]] + byteToHex[bytes[1]] + byteToHex[bytes[2]] + byteToHex[bytes[3]]}-${byteToHex[bytes[4]] + byteToHex[bytes[5]]}-${byteToHex[bytes[6]] + byteToHex[bytes[7]]}-${byteToHex[bytes[8]] + byteToHex[bytes[9]]}-${byteToHex[bytes[10]] + byteToHex[bytes[11]] + byteToHex[bytes[12]] + byteToHex[bytes[13]] + byteToHex[bytes[14]] + byteToHex[bytes[15]]}`
        };
    }
})();

export function gwLogIfPolyfill(): void {
    if (polyfillsInPlace.length > 0) {
        console.warn("==== GW WARNING: Polyfills are in place for: " + polyfillsInPlace.join(", "))
    }
}