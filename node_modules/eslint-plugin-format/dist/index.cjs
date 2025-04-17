'use strict';

const parserPlain = require('eslint-parser-plain');
const node_path = require('node:path');
const eslintFormattingReporter = require('eslint-formatting-reporter');
const synckit = require('synckit');
const node_url = require('node:url');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function _interopNamespaceCompat(e) {
  if (e && typeof e === 'object' && 'default' in e) return e;
  const n = Object.create(null);
  if (e) {
    for (const k in e) {
      n[k] = e[k];
    }
  }
  n.default = e;
  return n;
}

const parserPlain__namespace = /*#__PURE__*/_interopNamespaceCompat(parserPlain);

const dirWorkers = node_url.fileURLToPath(new URL("../workers", (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href))));

let format$1;
const dprint = {
  meta: {
    type: "layout",
    docs: {
      description: "Use dprint to format code",
      category: "Stylistic"
    },
    fixable: "whitespace",
    schema: [
      {
        type: "object",
        properties: {
          language: {
            type: "string",
            required: true
          },
          languageOptions: {
            type: "object"
          }
        },
        additionalProperties: true
      }
    ],
    messages: eslintFormattingReporter.messages
  },
  create(context) {
    if (!format$1)
      format$1 = synckit.createSyncFn(node_path.join(dirWorkers, "dprint.cjs"));
    return {
      Program() {
        const sourceCode = context.sourceCode.text;
        try {
          const formatted = format$1(sourceCode, context.filename, context.options[0] || {});
          eslintFormattingReporter.reportDifferences(context, sourceCode, formatted);
        } catch (error) {
          console.error(error);
          context.report({
            loc: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: 0 }
            },
            message: `Failed to format the code: ${error}`
          });
        }
      }
    };
  }
};

let format;
const prettier = {
  meta: {
    type: "layout",
    docs: {
      description: "Use Prettier to format code",
      category: "Stylistic"
    },
    fixable: "whitespace",
    schema: [
      {
        type: "object",
        properties: {
          parser: {
            type: "string",
            required: true
          }
        },
        additionalProperties: true
      }
    ],
    messages: eslintFormattingReporter.messages
  },
  create(context) {
    if (!format)
      format = synckit.createSyncFn(node_path.join(dirWorkers, "prettier.cjs"));
    return {
      Program() {
        const sourceCode = context.sourceCode.text;
        try {
          const formatted = format(sourceCode, {
            filepath: context.filename,
            ...context.options[0] || {}
          });
          eslintFormattingReporter.reportDifferences(context, sourceCode, formatted);
        } catch (err) {
          if (!(err instanceof SyntaxError)) {
            context.report({
              loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 0 }
              },
              message: "Failed to format the code"
            });
            return;
          }
          let message = `Parsing error: ${err.message}`;
          const error = err;
          if (error.codeFrame)
            message = message.replace(`
${error.codeFrame}`, "");
          if (error.loc)
            message = message.replace(/ \(\d+:\d+\)$/, "");
          context.report({ message, loc: error.loc });
        }
      }
    };
  }
};

const index = {
  parserPlain: parserPlain__namespace,
  rules: {
    prettier,
    dprint
  }
};

module.exports = index;
