'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const getGroupNumber = require('./get-group-number.js')
const sortNodes = require('./sort-nodes.js')
let sortNodesByGroups = ({
  ignoreEslintDisabledNodes,
  getOptionsByGroupNumber,
  isNodeIgnoredForGroup,
  isNodeIgnored,
  groups,
  nodes,
}) => {
  let nodesByNonIgnoredGroupNumber = {}
  let ignoredNodeIndices = []
  for (let [index, sortingNode] of nodes.entries()) {
    if (
      (sortingNode.isEslintDisabled && ignoreEslintDisabledNodes) ||
      (isNodeIgnored == null ? void 0 : isNodeIgnored(sortingNode))
    ) {
      ignoredNodeIndices.push(index)
      continue
    }
    let groupNumber = getGroupNumber.getGroupNumber(groups, sortingNode)
    nodesByNonIgnoredGroupNumber[groupNumber] ??
      (nodesByNonIgnoredGroupNumber[groupNumber] = [])
    nodesByNonIgnoredGroupNumber[groupNumber].push(sortingNode)
  }
  let sortedNodes = []
  for (let groupNumber of Object.keys(nodesByNonIgnoredGroupNumber).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    let { fallbackSortNodeValueGetter, nodeValueGetter, options } =
      getOptionsByGroupNumber(Number(groupNumber))
    let nodesToPush = nodesByNonIgnoredGroupNumber[Number(groupNumber)]
    let groupIgnoredNodes = new Set(
      nodesToPush.filter(node =>
        isNodeIgnoredForGroup == null
          ? void 0
          : isNodeIgnoredForGroup(node, options),
      ),
    )
    sortedNodes.push(
      ...sortNodes.sortNodes({
        isNodeIgnored: node => groupIgnoredNodes.has(node),
        ignoreEslintDisabledNodes: false,
        fallbackSortNodeValueGetter,
        nodes: nodesToPush,
        nodeValueGetter,
        options,
      }),
    )
  }
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex])
  }
  return sortedNodes
}
exports.sortNodesByGroups = sortNodesByGroups
