import { createHash } from 'node:crypto';
export function hashify(value, hash) {
    hash ??= createHash('sha256');
    if (Array.isArray(value)) {
        hashArray(value, hash);
    }
    else if (value instanceof Object) {
        hashObject(value, hash);
    }
    else {
        hash.update(JSON.stringify(value) || 'undefined');
    }
    return hash;
}
export function hashArray(array, hash) {
    hash ??= createHash('sha256');
    hash.update('[');
    for (const element of array) {
        hashify(element, hash);
        hash.update(',');
    }
    hash.update(']');
    return hash;
}
export function hashObject(object, hash) {
    hash ??= createHash('sha256');
    hash.update('{');
    for (const key of Object.keys(object).sort()) {
        hash.update(JSON.stringify(key));
        hash.update(':');
        hashify(object[key], hash);
        hash.update(',');
    }
    hash.update('}');
    return hash;
}
//# sourceMappingURL=hash.js.map