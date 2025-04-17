'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const validateNewlinesBetweenInsideGroups = require('./validate-newlines-between-inside-groups.js')
const validateNoDuplicatedGroups = require('./validate-no-duplicated-groups.js')
let validateGeneratedGroupsConfiguration = ({
  selectors,
  modifiers,
  options,
}) => {
  let availableCustomGroupNames = new Set(
    Array.isArray(options.customGroups)
      ? options.customGroups.map(customGroup => customGroup.groupName)
      : Object.keys(options.customGroups),
  )
  let invalidGroups = options.groups
    .flat()
    .filter(group => typeof group === 'string')
    .filter(
      group =>
        !isPredefinedGroup(selectors, modifiers, group) &&
        !availableCustomGroupNames.has(group),
    )
  if (invalidGroups.length > 0) {
    throw new Error(`Invalid group(s): ${invalidGroups.join(', ')}`)
  }
  validateNoDuplicatedGroups.validateNoDuplicatedGroups(options)
  validateNewlinesBetweenInsideGroups.validateNewlinesBetweenInsideGroups(
    options,
  )
}
let isPredefinedGroup = (allSelectors, allModifiers, input) => {
  if (input === 'unknown') {
    return true
  }
  let singleWordSelector = input.split('-').at(-1)
  if (!singleWordSelector) {
    return false
  }
  let twoWordsSelector = input.split('-').slice(-2).join('-')
  let isTwoWordSelectorValid = allSelectors.includes(twoWordsSelector)
  if (!allSelectors.includes(singleWordSelector) && !isTwoWordSelectorValid) {
    return false
  }
  let modifiers = input.split('-').slice(0, isTwoWordSelectorValid ? -2 : -1)
  return (
    new Set(modifiers).size === modifiers.length &&
    modifiers.every(modifier => allModifiers.includes(modifier))
  )
}
exports.validateGeneratedGroupsConfiguration =
  validateGeneratedGroupsConfiguration
