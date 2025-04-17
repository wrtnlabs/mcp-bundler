import * as parserPlain from 'eslint-parser-plain';
import { join } from 'node:path';
import { messages, reportDifferences } from 'eslint-formatting-reporter';
import { createSyncFn } from 'synckit';
import { fileURLToPath } from 'node:url';

const dirWorkers = fileURLToPath(new URL("../workers", import.meta.url));

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
    messages
  },
  create(context) {
    if (!format$1)
      format$1 = createSyncFn(join(dirWorkers, "dprint.cjs"));
    return {
      Program() {
        const sourceCode = context.sourceCode.text;
        try {
          const formatted = format$1(sourceCode, context.filename, context.options[0] || {});
          reportDifferences(context, sourceCode, formatted);
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
    messages
  },
  create(context) {
    if (!format)
      format = createSyncFn(join(dirWorkers, "prettier.cjs"));
    return {
      Program() {
        const sourceCode = context.sourceCode.text;
        try {
          const formatted = format(sourceCode, {
            filepath: context.filename,
            ...context.options[0] || {}
          });
          reportDifferences(context, sourceCode, formatted);
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
  parserPlain,
  rules: {
    prettier,
    dprint
  }
};

export { index as default };
