'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let getCustomGroupsCompareOptions = (options, groupNumber) => {
  var _a, _b
  let { customGroups, fallbackSort, groups, order, type } = options
  if (Array.isArray(customGroups)) {
    let group = groups[groupNumber]
    let customGroup =
      typeof group === 'string'
        ? customGroups.find(currentGroup => group === currentGroup.groupName)
        : null
    if (customGroup) {
      fallbackSort = {
        type:
          ((_a = customGroup.fallbackSort) == null ? void 0 : _a.type) ??
          fallbackSort.type,
      }
      let fallbackOrder =
        ((_b = customGroup.fallbackSort) == null ? void 0 : _b.order) ??
        fallbackSort.order
      if (fallbackOrder) {
        fallbackSort.order = fallbackOrder
      }
      order = customGroup.order ?? order
      type = customGroup.type ?? type
    }
  }
  return {
    fallbackSort,
    order,
    type,
  }
}
let buildGetCustomGroupOverriddenOptionsFunction = options => groupNumber => ({
  options: getCustomGroupOverriddenOptions({
    groupNumber,
    options,
  }),
})
let getCustomGroupOverriddenOptions = ({ groupNumber, options }) => ({
  ...options,
  ...getCustomGroupsCompareOptions(options, groupNumber),
})
exports.buildGetCustomGroupOverriddenOptionsFunction =
  buildGetCustomGroupOverriddenOptionsFunction
exports.getCustomGroupOverriddenOptions = getCustomGroupOverriddenOptions
exports.getCustomGroupsCompareOptions = getCustomGroupsCompareOptions
