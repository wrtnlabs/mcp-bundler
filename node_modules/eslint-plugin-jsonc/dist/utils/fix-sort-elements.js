"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixForSorting = fixForSorting;
const eslint_utils_1 = require("@eslint-community/eslint-utils");
function* fixForSorting(fixer, sourceCode, target, to) {
    const targetInfo = calcTargetInfo(sourceCode, target);
    const toPrevInfo = getPrevElementInfo(sourceCode, to);
    if (toPrevInfo.comma &&
        toPrevInfo.last.range[1] <= toPrevInfo.comma.range[0]) {
        yield fixer.removeRange(toPrevInfo.comma.range);
    }
    let insertRange = [
        toPrevInfo.last.range[1],
        toPrevInfo.last.range[1],
    ];
    const toBeforeNextToken = sourceCode.getTokenAfter(toPrevInfo.last, {
        includeComments: true,
    });
    if (toBeforeNextToken.loc.start.line - toPrevInfo.last.loc.end.line > 1) {
        const offset = sourceCode.getIndexFromLoc({
            line: toBeforeNextToken.loc.start.line - 1,
            column: 0,
        });
        insertRange = [offset, offset];
    }
    yield fixer.insertTextAfterRange(insertRange, targetInfo.insertCode);
    for (const removeRange of targetInfo.removeRanges) {
        yield fixer.removeRange(removeRange);
    }
}
function calcTargetInfo(sourceCode, target) {
    const nodeEndIndex = target.node
        ? getLastTokenOfNode(sourceCode, target.node).range[1]
        : target.after.range[0];
    const endInfo = getElementEndInfo(sourceCode, target);
    const prevInfo = getPrevElementInfo(sourceCode, target);
    let insertCode;
    const removeRanges = [];
    if (prevInfo.comma && prevInfo.last.range[1] <= prevInfo.comma.range[0]) {
        insertCode = `${sourceCode.text.slice(prevInfo.last.range[1], prevInfo.comma.range[0])}${sourceCode.text.slice(prevInfo.comma.range[1], nodeEndIndex)}`;
        removeRanges.push([prevInfo.last.range[1], prevInfo.comma.range[0]], [prevInfo.comma.range[1], nodeEndIndex]);
    }
    else {
        insertCode = sourceCode.text.slice(prevInfo.last.range[1], nodeEndIndex);
        removeRanges.push([prevInfo.last.range[1], nodeEndIndex]);
    }
    const hasTrailingComma = endInfo.comma && endInfo.comma.range[1] <= endInfo.last.range[1];
    if (!hasTrailingComma) {
        insertCode += ",";
        if (prevInfo.comma) {
            removeRanges.push(prevInfo.comma.range);
        }
    }
    insertCode += sourceCode.text.slice(nodeEndIndex, endInfo.last.range[1]);
    removeRanges.push([nodeEndIndex, endInfo.last.range[1]]);
    return {
        insertCode,
        removeRanges,
    };
}
function getFirstTokenOfNode(sourceCode, node) {
    let token = sourceCode.getFirstToken(node);
    let target = token;
    while ((target = sourceCode.getTokenBefore(token)) &&
        (0, eslint_utils_1.isOpeningParenToken)(target)) {
        token = target;
    }
    return token;
}
function getLastTokenOfNode(sourceCode, node) {
    let token = sourceCode.getLastToken(node);
    let target = token;
    while ((target = sourceCode.getTokenAfter(token)) &&
        (0, eslint_utils_1.isClosingParenToken)(target)) {
        token = target;
    }
    return token;
}
function getElementEndInfo(sourceCode, target) {
    const afterToken = target.node
        ? sourceCode.getTokenAfter(getLastTokenOfNode(sourceCode, target.node))
        : target.after;
    if ((0, eslint_utils_1.isNotCommaToken)(afterToken)) {
        return {
            comma: null,
            nextElement: null,
            last: getLastTokenWithTrailingComments(sourceCode, target),
        };
    }
    const comma = afterToken;
    const nextElement = sourceCode.getTokenAfter(afterToken);
    if ((0, eslint_utils_1.isCommaToken)(nextElement)) {
        return {
            comma,
            nextElement: null,
            last: comma,
        };
    }
    if ((0, eslint_utils_1.isClosingBraceToken)(nextElement) || (0, eslint_utils_1.isClosingBracketToken)(nextElement)) {
        return {
            comma,
            nextElement: null,
            last: getLastTokenWithTrailingComments(sourceCode, target),
        };
    }
    const node = target.node;
    if (node && node.loc.end.line === nextElement.loc.start.line) {
        return {
            comma,
            nextElement,
            last: comma,
        };
    }
    if (node &&
        node.loc.end.line < comma.loc.start.line &&
        comma.loc.end.line < nextElement.loc.start.line) {
        return {
            comma,
            nextElement,
            last: comma,
        };
    }
    return {
        comma,
        nextElement,
        last: getLastTokenWithTrailingComments(sourceCode, target),
    };
}
function getLastTokenWithTrailingComments(sourceCode, target) {
    if (!target.node) {
        return sourceCode.getTokenBefore(target.after, {
            includeComments: true,
        });
    }
    const node = target.node;
    let last = getLastTokenOfNode(sourceCode, node);
    let after;
    while ((after = sourceCode.getTokenAfter(last, {
        includeComments: true,
    })) &&
        ((0, eslint_utils_1.isCommentToken)(after) || (0, eslint_utils_1.isCommaToken)(after)) &&
        node.loc.end.line === after.loc.end.line) {
        last = after;
    }
    return last;
}
function getPrevElementInfo(sourceCode, target) {
    const beforeToken = target.node
        ? sourceCode.getTokenBefore(getFirstTokenOfNode(sourceCode, target.node))
        : target.before;
    if ((0, eslint_utils_1.isNotCommaToken)(beforeToken)) {
        return {
            comma: null,
            prevElement: null,
            last: beforeToken,
        };
    }
    const comma = beforeToken;
    const prevElement = sourceCode.getTokenBefore(beforeToken);
    if ((0, eslint_utils_1.isCommaToken)(prevElement)) {
        return {
            comma,
            prevElement: null,
            last: comma,
        };
    }
    const endInfo = getElementEndInfo(sourceCode, { node: prevElement });
    return {
        comma: endInfo.comma,
        prevElement,
        last: endInfo.last,
    };
}
