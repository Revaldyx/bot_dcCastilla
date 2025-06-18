// Simple fetch polyfill for Node.js compatibility

let fetchFunction;

try {
    // Try to use built-in fetch (Node.js 18+)
    if (typeof globalThis.fetch !== 'undefined') {
        fetchFunction = globalThis.fetch;
    } else if (typeof global.fetch !== 'undefined') {
        fetchFunction = global.fetch;
    } else {
        // Fallback to node-fetch for older Node.js versions
        const nodeFetch = require('node-fetch');
        fetchFunction = nodeFetch.default || nodeFetch;
    }
} catch (error) {
    console.warn('No fetch implementation available:', error.message);
    fetchFunction = null;
}

module.exports = {
    fetch: fetchFunction,
    isAvailable: fetchFunction !== null
};
