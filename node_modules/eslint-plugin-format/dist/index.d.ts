import * as eslint from 'eslint';
import { ESLint, Linter } from 'eslint';
import * as parserPlain from 'eslint-parser-plain';

interface ESLintPluginFormat extends ESLint.Plugin {
    parserPlain: Linter.Parser;
}
declare const _default: {
    parserPlain: typeof parserPlain;
    rules: {
        prettier: {
            meta: {
                type: "layout";
                docs: {
                    description: string;
                    category: string;
                };
                fixable: "whitespace";
                schema: {
                    type: "object";
                    properties: {
                        parser: {
                            type: "string";
                            required: true;
                        };
                    };
                    additionalProperties: true;
                }[];
                messages: {
                    insert: string;
                    delete: string;
                    replace: string;
                };
            };
            create(context: eslint.Rule.RuleContext): {
                Program(): void;
            };
        };
        dprint: {
            meta: {
                type: "layout";
                docs: {
                    description: string;
                    category: string;
                };
                fixable: "whitespace";
                schema: {
                    type: "object";
                    properties: {
                        language: {
                            type: "string";
                            required: true;
                        };
                        languageOptions: {
                            type: "object";
                        };
                    };
                    additionalProperties: true;
                }[];
                messages: {
                    insert: string;
                    delete: string;
                    replace: string;
                };
            };
            create(context: eslint.Rule.RuleContext): {
                Program(): void;
            };
        };
    };
};

export { type ESLintPluginFormat, _default as default };
