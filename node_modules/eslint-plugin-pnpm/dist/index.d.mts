import { ESLint, Linter } from 'eslint';

declare const plugin: ESLint.Plugin;
declare const configs: {
    recommended: Linter.Config<Linter.RulesRecord>[];
    json: Linter.Config<Linter.RulesRecord>[];
    yaml: Linter.Config<Linter.RulesRecord>[];
};

export { configs, plugin as default, plugin };
