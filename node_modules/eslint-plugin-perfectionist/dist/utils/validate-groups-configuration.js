'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const validateNewlinesBetweenInsideGroups = require('./validate-newlines-between-inside-groups.js')
const validateNoDuplicatedGroups = require('./validate-no-duplicated-groups.js')
const isNewlinesBetweenOption = require('./is-newlines-between-option.js')
let validateGroupsConfiguration = ({
  allowedPredefinedGroups,
  allowedCustomGroups,
  options,
}) => {
  let allowedGroupsSet = /* @__PURE__ */ new Set([
    ...allowedPredefinedGroups,
    ...allowedCustomGroups,
  ])
  let invalidGroups = []
  for (let groupElement of options.groups) {
    if (isNewlinesBetweenOption.isNewlinesBetweenOption(groupElement)) {
      continue
    }
    let groupElements = Array.isArray(groupElement)
      ? groupElement
      : [groupElement]
    for (let group of groupElements) {
      if (!allowedGroupsSet.has(group)) {
        invalidGroups.push(group)
      }
    }
  }
  if (invalidGroups.length > 0) {
    throw new Error(`Invalid group(s): ${invalidGroups.join(', ')}`)
  }
  validateNoDuplicatedGroups.validateNoDuplicatedGroups(options)
  validateNewlinesBetweenInsideGroups.validateNewlinesBetweenInsideGroups(
    options,
  )
}
exports.validateGroupsConfiguration = validateGroupsConfiguration
