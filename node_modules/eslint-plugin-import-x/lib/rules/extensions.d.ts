declare const modifierValues: readonly ["always", "ignorePackages", "never"];
export type Modifier = (typeof modifierValues)[number];
export type ModifierByFileExtension = Partial<Record<string, Modifier>>;
export interface OptionsItemWithPatternProperty {
    ignorePackages?: boolean;
    checkTypeImports?: boolean;
    pattern: ModifierByFileExtension;
}
export interface OptionsItemWithoutPatternProperty {
    ignorePackages?: boolean;
    checkTypeImports?: boolean;
}
export type Options = [] | [Modifier] | [Modifier, OptionsItemWithoutPatternProperty] | [Modifier, OptionsItemWithPatternProperty] | [Modifier, ModifierByFileExtension] | [ModifierByFileExtension];
export interface NormalizedOptions {
    defaultConfig?: Modifier;
    pattern?: Record<string, Modifier>;
    ignorePackages?: boolean;
    checkTypeImports?: boolean;
}
export type MessageId = 'missing' | 'missingKnown' | 'unexpected';
declare const _default: import("@typescript-eslint/utils/ts-eslint").RuleModule<MessageId, Options, import("../utils/create-rule.ts").ImportXPluginDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
export default _default;
