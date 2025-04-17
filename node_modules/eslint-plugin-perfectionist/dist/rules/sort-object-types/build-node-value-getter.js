'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let buildNodeValueGetter = sortBy =>
  sortBy === 'value' ? node => node.value ?? '' : null
exports.buildNodeValueGetter = buildNodeValueGetter
