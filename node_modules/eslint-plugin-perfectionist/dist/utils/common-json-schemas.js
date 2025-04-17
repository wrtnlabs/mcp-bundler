'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let typeJsonSchema = {
  enum: ['alphabetical', 'natural', 'line-length', 'custom', 'unsorted'],
  description: 'Specifies the sorting method.',
  type: 'string',
}
let orderJsonSchema = {
  description:
    'Determines whether the sorted items should be in ascending or descending order.',
  enum: ['asc', 'desc'],
  type: 'string',
}
let alphabetJsonSchema = {
  description: 'Alphabet to use for the `custom` sort type.',
  type: 'string',
}
let localesJsonSchema = {
  oneOf: [
    {
      type: 'string',
    },
    {
      items: {
        type: 'string',
      },
      type: 'array',
    },
  ],
  description: 'Specifies the sorting locales.',
}
let ignoreCaseJsonSchema = {
  description: 'Controls whether sorting should be case-sensitive or not.',
  type: 'boolean',
}
let specialCharactersJsonSchema = {
  description:
    'Controls how special characters should be handled before sorting.',
  enum: ['remove', 'trim', 'keep'],
  type: 'string',
}
let buildFallbackSortJsonSchema = ({ additionalProperties } = {}) => ({
  properties: {
    order: orderJsonSchema,
    type: typeJsonSchema,
    ...additionalProperties,
  },
  description: 'Fallback sort order.',
  type: 'object',
})
let buildCommonJsonSchemas = ({ additionalFallbackSortProperties } = {}) => ({
  fallbackSort: buildFallbackSortJsonSchema(additionalFallbackSortProperties),
  specialCharacters: specialCharactersJsonSchema,
  ignoreCase: ignoreCaseJsonSchema,
  alphabet: alphabetJsonSchema,
  locales: localesJsonSchema,
  order: orderJsonSchema,
  type: typeJsonSchema,
})
let commonJsonSchemas = buildCommonJsonSchemas()
let newlinesBetweenJsonSchema = {
  description: 'Specifies how new lines should be handled between groups.',
  enum: ['ignore', 'always', 'never'],
  type: 'string',
}
let groupsJsonSchema = {
  items: {
    oneOf: [
      {
        type: 'string',
      },
      {
        items: {
          type: 'string',
        },
        type: 'array',
      },
      {
        properties: {
          newlinesBetween: newlinesBetweenJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
  },
  description: 'Specifies the order of the groups.',
  type: 'array',
}
let customGroupsJsonSchema = {
  additionalProperties: {
    oneOf: [
      {
        type: 'string',
      },
      {
        items: {
          type: 'string',
        },
        type: 'array',
      },
    ],
  },
  description: 'Specifies custom groups.',
  type: 'object',
}
let singleRegexJsonSchema = {
  oneOf: [
    {
      properties: {
        pattern: {
          type: 'string',
        },
        flags: {
          type: 'string',
        },
      },
      additionalProperties: false,
      // https://github.com/azat-io/eslint-plugin-perfectionist/pull/490#issuecomment-2720969705
      // Uncomment the code below in the next major version (v5)
      // To uncomment: required: ['pattern'],
      type: 'object',
    },
    {
      type: 'string',
    },
  ],
  description: 'Regular expression.',
}
let regexJsonSchema = {
  oneOf: [
    {
      items: singleRegexJsonSchema,
      type: 'array',
    },
    singleRegexJsonSchema,
  ],
  description: 'Regular expression.',
}
let allowedPartitionByCommentJsonSchemas = [
  {
    type: 'boolean',
  },
  regexJsonSchema,
]
let partitionByCommentJsonSchema = {
  oneOf: [
    ...allowedPartitionByCommentJsonSchemas,
    {
      properties: {
        block: {
          oneOf: allowedPartitionByCommentJsonSchemas,
        },
        line: {
          oneOf: allowedPartitionByCommentJsonSchemas,
        },
      },
      additionalProperties: false,
      type: 'object',
    },
  ],
  description:
    'Allows to use comments to separate members into logical groups.',
}
let partitionByNewLineJsonSchema = {
  description:
    'Allows to use newlines to separate the nodes into logical groups.',
  type: 'boolean',
}
let buildUseConfigurationIfJsonSchema = ({ additionalProperties } = {}) => ({
  properties: {
    allNamesMatchPattern: regexJsonSchema,
    ...additionalProperties,
  },
  additionalProperties: false,
  type: 'object',
})
let buildCommonCustomGroupJsonSchemas = ({
  additionalFallbackSortProperties,
} = {}) => ({
  newlinesInside: {
    description:
      'Specifies how new lines should be handled between members of the custom group.',
    enum: ['always', 'never'],
    type: 'string',
  },
  fallbackSort: buildFallbackSortJsonSchema({
    additionalProperties: additionalFallbackSortProperties,
  }),
  groupName: {
    description: 'Custom group name.',
    type: 'string',
  },
  order: orderJsonSchema,
  type: typeJsonSchema,
})
let buildCustomGroupsArrayJsonSchema = ({
  additionalFallbackSortProperties,
  singleCustomGroupJsonSchema,
}) => ({
  items: {
    oneOf: [
      {
        properties: {
          ...buildCommonCustomGroupJsonSchemas({
            additionalFallbackSortProperties,
          }),
          anyOf: {
            items: {
              properties: {
                ...singleCustomGroupJsonSchema,
              },
              description: 'Custom group.',
              additionalProperties: false,
              type: 'object',
            },
            type: 'array',
          },
        },
        description: 'Custom group block.',
        additionalProperties: false,
        type: 'object',
      },
      {
        properties: {
          ...buildCommonCustomGroupJsonSchemas({
            additionalFallbackSortProperties,
          }),
          ...singleCustomGroupJsonSchema,
        },
        description: 'Custom group.',
        additionalProperties: false,
        type: 'object',
      },
    ],
  },
  description: 'Specifies custom groups.',
  type: 'array',
})
let buildCustomGroupModifiersJsonSchema = modifiers => ({
  items: {
    enum: modifiers,
    type: 'string',
  },
  description: 'Modifier filters.',
  type: 'array',
})
let buildCustomGroupSelectorJsonSchema = selectors => ({
  description: 'Selector filter.',
  enum: selectors,
  type: 'string',
})
exports.buildCommonJsonSchemas = buildCommonJsonSchemas
exports.buildCustomGroupModifiersJsonSchema =
  buildCustomGroupModifiersJsonSchema
exports.buildCustomGroupSelectorJsonSchema = buildCustomGroupSelectorJsonSchema
exports.buildCustomGroupsArrayJsonSchema = buildCustomGroupsArrayJsonSchema
exports.buildUseConfigurationIfJsonSchema = buildUseConfigurationIfJsonSchema
exports.commonJsonSchemas = commonJsonSchemas
exports.customGroupsJsonSchema = customGroupsJsonSchema
exports.groupsJsonSchema = groupsJsonSchema
exports.newlinesBetweenJsonSchema = newlinesBetweenJsonSchema
exports.partitionByCommentJsonSchema = partitionByCommentJsonSchema
exports.partitionByNewLineJsonSchema = partitionByNewLineJsonSchema
exports.regexJsonSchema = regexJsonSchema
