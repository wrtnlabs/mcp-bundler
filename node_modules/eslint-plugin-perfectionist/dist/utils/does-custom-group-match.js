'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const matches = require('./matches.js')
let doesCustomGroupMatch = props => {
  if ('anyOf' in props.customGroup) {
    return props.customGroup.anyOf.some(subgroup =>
      doesSingleCustomGroupMatch({
        ...props,
        customGroup: subgroup,
      }),
    )
  }
  return doesSingleCustomGroupMatch({
    ...props,
    customGroup: props.customGroup,
  })
}
let doesSingleCustomGroupMatch = ({
  elementValue,
  customGroup,
  elementName,
  decorators,
  selectors,
  modifiers,
}) => {
  if (
    customGroup.selector &&
    !(selectors == null ? void 0 : selectors.includes(customGroup.selector))
  ) {
    return false
  }
  if (customGroup.modifiers) {
    for (let modifier of customGroup.modifiers) {
      if (!(modifiers == null ? void 0 : modifiers.includes(modifier))) {
        return false
      }
    }
  }
  if ('elementNamePattern' in customGroup && customGroup.elementNamePattern) {
    let matchesElementNamePattern = matches.matches(
      elementName,
      customGroup.elementNamePattern,
    )
    if (!matchesElementNamePattern) {
      return false
    }
  }
  if ('elementValuePattern' in customGroup && customGroup.elementValuePattern) {
    let matchesElementValuePattern = matches.matches(
      elementValue ?? '',
      customGroup.elementValuePattern,
    )
    if (!matchesElementValuePattern) {
      return false
    }
  }
  if (
    'decoratorNamePattern' in customGroup &&
    customGroup.decoratorNamePattern
  ) {
    let decoratorPattern = customGroup.decoratorNamePattern
    let matchesDecoratorNamePattern =
      decorators == null
        ? void 0
        : decorators.some(decorator =>
            matches.matches(decorator, decoratorPattern),
          )
    if (!matchesDecoratorNamePattern) {
      return false
    }
  }
  return true
}
exports.doesCustomGroupMatch = doesCustomGroupMatch
