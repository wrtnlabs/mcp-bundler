'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const isNewlinesBetweenOption = require('./is-newlines-between-option.js')
let validateNewlinesBetweenInsideGroups = ({ groups }) => {
  let isPreviousElementNewlinesBetween = false
  for (let groupElement of groups) {
    if (!isNewlinesBetweenOption.isNewlinesBetweenOption(groupElement)) {
      isPreviousElementNewlinesBetween = false
      continue
    }
    if (isPreviousElementNewlinesBetween) {
      throw new Error("Consecutive 'newlinesBetween' objects are not allowed")
    }
    isPreviousElementNewlinesBetween = true
  }
}
exports.validateNewlinesBetweenInsideGroups =
  validateNewlinesBetweenInsideGroups
