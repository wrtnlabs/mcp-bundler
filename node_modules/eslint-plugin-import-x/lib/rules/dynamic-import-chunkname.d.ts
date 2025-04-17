export interface Options {
    allowEmpty?: boolean;
    importFunctions?: readonly string[];
    webpackChunknameFormat?: string;
}
export type MessageId = 'leadingComment' | 'blockComment' | 'paddedSpaces' | 'webpackComment' | 'chunknameFormat' | 'webpackEagerModeNoChunkName' | 'webpackRemoveEagerMode' | 'webpackRemoveChunkName';
declare const _default: import("@typescript-eslint/utils/ts-eslint").RuleModule<MessageId, [(Options | undefined)?], import("../utils/create-rule.ts").ImportXPluginDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
export default _default;
