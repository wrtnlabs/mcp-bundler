import * as jsoncParser from 'jsonc-eslint-parser';
import * as yamlParser from 'yaml-eslint-parser';
import fs, { existsSync, readFileSync } from 'node:fs';
import { findUpSync } from 'find-up-simple';
import { dirname, basename, normalize, resolve } from 'pathe';
import { parsePnpmWorkspaceYaml } from 'pnpm-workspace-yaml';
import { globSync } from 'tinyglobby';

const name = "eslint-plugin-pnpm";
const version = "0.3.1";

const blobUrl = "https://github.com/antfu/eslint-plugin-pnpm/blob/main/src/rules/";
function RuleCreator(urlCreator) {
  return function createNamedRule({
    name,
    meta,
    ...rule
  }) {
    return createRule({
      meta: {
        ...meta,
        docs: {
          ...meta.docs,
          url: urlCreator(name)
        }
      },
      ...rule
    });
  };
}
function createRule({
  create,
  defaultOptions,
  meta
}) {
  return {
    create: (context) => {
      const optionsWithDefault = context.options.map((options, index) => {
        return {
          ...defaultOptions[index] || {},
          ...options || {}
        };
      });
      return create(context, optionsWithDefault);
    },
    defaultOptions,
    meta
  };
}
const createEslintRule = RuleCreator(
  (ruleName) => `${blobUrl}${ruleName}.test.ts`
);

function getPackageJsonRootNode(context) {
  if (!context.filename.endsWith("package.json"))
    return;
  const ast = context.sourceCode.ast;
  const root = ast.body[0];
  if (root.expression.type === "JSONObjectExpression")
    return root.expression;
}
function* iterateDependencies(context, fields) {
  const root = getPackageJsonRootNode(context);
  if (!root)
    return;
  for (const fieldName of fields) {
    const path = fieldName.split(".");
    let node = root;
    for (let i = 0; i < path.length; i++) {
      const item = node.properties.find((property) => property.key.type === "JSONLiteral" && property.key.value === path[i]);
      if (!item?.value || item.value.type !== "JSONObjectExpression") {
        node = void 0;
        break;
      }
      node = item.value;
    }
    if (!node || node === root)
      continue;
    for (const property of node.properties) {
      if (property.value.type !== "JSONLiteral" || property.key.type !== "JSONLiteral")
        continue;
      if (typeof property.value.value !== "string")
        continue;
      const packageName = String(property.key.value);
      const specifier = String(property.value.value);
      yield {
        packageName,
        specifier,
        property
      };
    }
  }
}

function findPnpmWorkspace(sourceFile) {
  return findUpSync("pnpm-workspace.yaml", {
    cwd: dirname(sourceFile)
  });
}
function readPnpmWorkspace(filepath) {
  const content = fs.readFileSync(filepath, "utf-8");
  const workspace = parsePnpmWorkspaceYaml(content);
  let queueTimer;
  const queue = [];
  const write = () => {
    fs.writeFileSync(filepath, workspace.toString());
  };
  const hasQueue = () => queueTimer != null;
  const queueChange = (fn, order) => {
    if (order === "pre")
      queue.unshift(fn);
    else
      queue.push(fn);
    if (queueTimer != null)
      clearTimeout(queueTimer);
    queueTimer = setTimeout(() => {
      queueTimer = void 0;
      const clone = [...queue];
      queue.length = 0;
      for (const fn2 of clone)
        fn2(workspace);
      if (workspace.hasChanged())
        write();
    }, 1e3);
  };
  return {
    filepath,
    lastRead: Date.now(),
    ...workspace,
    hasQueue,
    queueChange
  };
}

const WORKSPACE_CACHE_TIME = 1e4;
const workspaces = {};
function getPnpmWorkspace(sourcePath) {
  const workspacePath = findPnpmWorkspace(sourcePath);
  if (!workspacePath)
    throw new Error("pnpm-workspace.yaml not found");
  let workspace = workspaces[workspacePath];
  if (workspace && !workspace.hasQueue() && Date.now() - workspace.lastRead > WORKSPACE_CACHE_TIME) {
    workspaces[workspacePath] = void 0;
    workspace = void 0;
  }
  if (!workspace) {
    workspace = readPnpmWorkspace(workspacePath);
    workspaces[workspacePath] = workspace;
  }
  return workspace;
}

const RULE_NAME$4 = "json-enforce-catalog";
const DEFAULT_FIELDS$1 = [
  "dependencies",
  "devDependencies"
];
const enforceCatalog = createEslintRule({
  name: RULE_NAME$4,
  meta: {
    type: "layout",
    docs: {
      description: 'Enforce using "catalog:" in `package.json`'
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          allowedProtocols: {
            type: "array",
            description: "Allowed protocols in specifier to not be converted to catalog",
            items: {
              type: "string"
            }
          },
          autofix: {
            type: "boolean",
            description: "Whether to autofix the linting error",
            default: true
          },
          defaultCatalog: {
            type: "string",
            description: "Default catalog to use when moving version to catalog with autofix"
          },
          reuseExistingCatalog: {
            type: "boolean",
            description: "Whether to reuse existing catalog when moving version to catalog with autofix",
            default: true
          },
          conflicts: {
            type: "string",
            description: "Strategy to handle conflicts when adding packages to catalogs",
            enum: ["new-catalog", "overrides", "error"],
            default: "new-catalog"
          },
          fields: {
            type: "array",
            description: "Fields to check for catalog",
            items: { type: "string" },
            default: DEFAULT_FIELDS$1
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      expectCatalog: 'Expect to use catalog instead of plain specifier, got "{{specifier}}" for package "{{packageName}}".'
    }
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const {
      allowedProtocols = ["workspace", "link", "file"],
      defaultCatalog = "default",
      autofix = true,
      reuseExistingCatalog = true,
      conflicts = "new-catalog",
      fields = DEFAULT_FIELDS$1
    } = options || {};
    for (const { packageName, specifier, property } of iterateDependencies(context, fields)) {
      if (specifier.startsWith("catalog:"))
        continue;
      if (allowedProtocols?.some((p) => specifier.startsWith(p)))
        continue;
      const workspace = getPnpmWorkspace(context.filename);
      if (!workspace)
        return {};
      let targetCatalog = reuseExistingCatalog ? workspace.getPackageCatalogs(packageName)[0] || defaultCatalog : defaultCatalog;
      const resolvedConflicts = workspace.hasSpecifierConflicts(
        targetCatalog,
        packageName,
        specifier
      );
      let shouldFix = autofix;
      if (conflicts === "error") {
        if (resolvedConflicts.conflicts) {
          shouldFix = false;
        }
      }
      if (conflicts === "new-catalog" && resolvedConflicts.conflicts) {
        targetCatalog = resolvedConflicts.newCatalogName;
      }
      context.report({
        node: property.value,
        messageId: "expectCatalog",
        data: {
          specifier,
          packageName
        },
        fix: shouldFix ? (fixer) => {
          workspace.queueChange(() => {
            workspace.setPackage(targetCatalog, packageName, specifier);
          });
          return fixer.replaceText(
            property.value,
            targetCatalog === "default" ? JSON.stringify("catalog:") : JSON.stringify(`catalog:${targetCatalog}`)
          );
        } : void 0
      });
    }
    return {};
  }
});

const RULE_NAME$3 = "json-prefer-workspace-settings";
const preferWorkspaceSettings = createEslintRule({
  name: RULE_NAME$3,
  meta: {
    type: "layout",
    docs: {
      description: "Prefer having pnpm settings in `pnpm-workspace.yaml` instead of `package.json`. This would requires pnpm v10.6+, see https://github.com/orgs/pnpm/discussions/9037."
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          autofix: {
            type: "boolean",
            description: "Whether to autofix the linting error",
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      unexpectedPnpmSettings: "Unexpected pnpm settings in package.json, should move to pnpm-workspace.yaml"
    }
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const {
      autofix = true
    } = options || {};
    const root = getPackageJsonRootNode(context);
    if (!root)
      return {};
    const pnpmNode = root.properties.find((property) => property.key.type === "JSONLiteral" && property.key.value === "pnpm");
    if (!pnpmNode)
      return {};
    const workspace = getPnpmWorkspace(context.filename);
    if (!workspace)
      return {};
    context.report({
      node: pnpmNode,
      messageId: "unexpectedPnpmSettings",
      fix: autofix ? (fixer) => {
        const json = JSON.parse(context.sourceCode.text);
        const pnpmSettings = json.pnpm;
        const flatValueParis = [];
        function traverse(value, paths) {
          if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            for (const key in value) {
              traverse(value[key], [...paths, key]);
            }
          } else {
            flatValueParis.push([paths, value]);
          }
        }
        traverse(pnpmSettings, []);
        workspace.queueChange(() => {
          for (const [paths, value] of flatValueParis) {
            workspace.setPath(paths, value);
          }
        });
        let start = pnpmNode.range[0];
        let end = pnpmNode.range[1];
        const before = context.sourceCode.getTokenBefore(pnpmNode);
        if (before)
          start = before.range[1];
        const after = context.sourceCode.getTokenAfter(pnpmNode);
        if (after?.type === "Punctuator" && after.value === ",")
          end = after.range[1];
        return fixer.removeRange([start, end]);
      } : void 0
    });
    return {};
  }
});

const RULE_NAME$2 = "json-valid-catalog";
const DEFAULT_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "resolutions",
  "overrides",
  "pnpm.overrides"
];
const validCatalog = createEslintRule({
  name: RULE_NAME$2,
  meta: {
    type: "layout",
    docs: {
      description: "Enforce using valid catalog in `package.json`"
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          autoInsert: {
            type: "boolean",
            description: "Whether to auto insert to catalog if missing",
            default: true
          },
          autoInsertDefaultSpecifier: {
            type: "string",
            description: "Default specifier to use when auto inserting to catalog",
            default: "^0.0.0"
          },
          autofix: {
            type: "boolean",
            description: "Whether to autofix the linting error",
            default: true
          },
          enforceNoConflict: {
            type: "boolean",
            description: "Whether to enforce no conflicts when adding packages to catalogs (will create version-specific catalogs)",
            default: true
          },
          fields: {
            type: "array",
            description: "Fields to check for catalog",
            default: DEFAULT_FIELDS
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      invalidCatalog: 'Catalog "{{specifier}}" for package "{{packageName}}" is not defined in `pnpm-workspace.yaml`.'
    }
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const {
      autoInsert = true,
      autofix = true,
      autoInsertDefaultSpecifier = "^0.0.0",
      fields = DEFAULT_FIELDS
    } = options || {};
    for (const { packageName, specifier, property } of iterateDependencies(context, fields)) {
      if (!specifier.startsWith("catalog:"))
        continue;
      const workspace = getPnpmWorkspace(context.filename);
      if (!workspace)
        return {};
      const currentCatalog = specifier.replace(/^catalog:/, "").trim() || "default";
      const existingCatalogs = workspace.getPackageCatalogs(packageName);
      if (!existingCatalogs.includes(currentCatalog)) {
        context.report({
          node: property.value,
          messageId: "invalidCatalog",
          data: {
            specifier,
            packageName
          },
          fix: !autofix || !autoInsert && !existingCatalogs.length ? void 0 : (fixer) => {
            let catalog = existingCatalogs[0];
            if (!catalog && autoInsert) {
              catalog = currentCatalog;
              workspace.queueChange(() => {
                workspace.setPackage(catalog, packageName, autoInsertDefaultSpecifier);
              }, "pre");
            }
            return fixer.replaceText(
              property.value,
              catalog === "default" ? JSON.stringify("catalog:") : JSON.stringify(`catalog:${catalog}`)
            );
          }
        });
      }
    }
    return {};
  }
});

const rules$2 = {
  "json-enforce-catalog": enforceCatalog,
  "json-valid-catalog": validCatalog,
  "json-prefer-workspace-settings": preferWorkspaceSettings
};

const RULE_NAME$1 = "yaml-no-duplicate-catalog-item";
const noDuplicateCatalogItem = createEslintRule({
  name: RULE_NAME$1,
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unused catalogs in `pnpm-workspace.yaml`"
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          allow: {
            type: "array",
            items: { type: "string" }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      duplicateCatalogItem: 'Catalog item "{{name}}" is already defined in the "{{existingCatalog}}" catalog. You may want to remove one of them.'
    }
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    if (basename(context.filename) !== "pnpm-workspace.yaml")
      return {};
    const workspace = getPnpmWorkspace(context.filename);
    if (!workspace || normalize(workspace.filepath) !== normalize(context.filename))
      return {};
    if (workspace.hasChanged() || workspace.hasQueue())
      return {};
    const { allow = [] } = options;
    workspace.setContent(context.sourceCode.text);
    const json = workspace.toJSON() || {};
    const exists = /* @__PURE__ */ new Map();
    const catalogs = {
      ...json.catalogs,
      default: json.catalog
    };
    const doc = workspace.getDocument();
    for (const [catalog, object] of Object.entries(catalogs)) {
      if (!object)
        continue;
      for (const key of Object.keys(object)) {
        if (allow.includes(key))
          continue;
        if (exists.has(key)) {
          const existingCatalog = exists.get(key);
          const node = doc.getIn(catalog === "default" ? ["catalog", key] : ["catalogs", catalog, key], true);
          const start = context.sourceCode.getLocFromIndex(node.range[0]);
          const end = context.sourceCode.getLocFromIndex(node.range[1]);
          context.report({
            loc: {
              start,
              end
            },
            messageId: "duplicateCatalogItem",
            data: {
              name: key,
              currentCatalog: catalog,
              existingCatalog
            }
          });
        } else {
          exists.set(key, catalog);
        }
      }
    }
    return {};
  }
});

const RULE_NAME = "yaml-no-unused-catalog-item";
const noUnusedCatalogItem = createEslintRule({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unused catalogs in `pnpm-workspace.yaml`"
    },
    fixable: "code",
    schema: [],
    messages: {
      unusedCatalogItem: 'Catalog item "{{catalogItem}}" is not used in any package.json.'
    }
  },
  defaultOptions: [],
  create(context) {
    if (basename(context.filename) !== "pnpm-workspace.yaml")
      return {};
    const workspace = getPnpmWorkspace(context.filename);
    if (!workspace || normalize(workspace.filepath) !== normalize(context.filename))
      return {};
    if (workspace.hasChanged() || workspace.hasQueue())
      return {};
    workspace.setContent(context.sourceCode.text);
    const parsed = workspace.toJSON() || {};
    const root = resolve(dirname(context.filename));
    const entries = /* @__PURE__ */ new Map();
    const doc = workspace.getDocument();
    const catalogs = {
      default: doc.getIn(["catalog"])
    };
    for (const item of doc.getIn(["catalogs"])?.items || [])
      catalogs[String(item.key)] = item.value;
    for (const [catalog, map] of Object.entries(catalogs)) {
      if (!map)
        continue;
      for (const item of map.items) {
        entries.set(`${String(item.key)}:${catalog}`, item);
      }
    }
    for (const [packageName, specifier] of Object.entries(parsed.overrides || {})) {
      if (specifier.startsWith("catalog:")) {
        const catalog = specifier.slice(8) || "default";
        entries.delete(`${packageName}:${catalog}`);
      }
    }
    if (entries.size === 0)
      return {};
    const dirs = parsed.packages ? globSync(parsed.packages, {
      cwd: root,
      dot: false,
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/dist/**",
        "**/dist/**"
      ],
      absolute: true,
      expandDirectories: false,
      onlyDirectories: true
    }) : [];
    dirs.push(root);
    const packages = dirs.map((dir) => resolve(dir, "package.json")).filter((x) => existsSync(x)).sort();
    const FIELDS = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
      "overrides",
      "resolutions",
      "pnpm.overrides"
    ];
    for (const path of packages) {
      const pkg = JSON.parse(readFileSync(path, "utf-8"));
      for (const field of FIELDS) {
        const map = getObjectPath(pkg, field.split("."));
        if (!map)
          continue;
        for (const [name, value] of Object.entries(map)) {
          if (!value.startsWith("catalog:"))
            continue;
          const catalog = value.slice(8) || "default";
          const key = `${name}:${catalog}`;
          entries.delete(key);
        }
      }
    }
    if (entries.size > 0) {
      for (const [key, value] of Array.from(entries.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
        const start = context.sourceCode.getLocFromIndex(value.key.range[0]);
        const end = context.sourceCode.getLocFromIndex(value.value.range.at(-1));
        context.report({
          loc: {
            start,
            end
          },
          messageId: "unusedCatalogItem",
          data: { catalogItem: key }
        });
      }
    }
    return {};
  }
});
function getObjectPath(obj, path) {
  let current = obj;
  for (const key of path) {
    current = current[key];
    if (!current)
      return void 0;
  }
  return current;
}

const rules$1 = {
  "yaml-no-unused-catalog-item": noUnusedCatalogItem,
  "yaml-no-duplicate-catalog-item": noDuplicateCatalogItem
};

const rules = {
  ...rules$2,
  ...rules$1
};

const plugin = {
  meta: {
    name,
    version
  },
  rules
};
const configsJson = [
  {
    name: "pnpm/package.json",
    files: [
      "package.json",
      "**/package.json"
    ],
    languageOptions: {
      parser: jsoncParser
    },
    plugins: {
      pnpm: plugin
    },
    rules: {
      "pnpm/json-enforce-catalog": "error",
      "pnpm/json-valid-catalog": "error",
      "pnpm/json-prefer-workspace-settings": "error"
    }
  }
];
const configsYaml = [
  {
    name: "pnpm/pnpm-workspace-yaml",
    files: ["pnpm-workspace.yaml"],
    languageOptions: {
      parser: yamlParser
    },
    plugins: {
      pnpm: plugin
    },
    rules: {
      "pnpm/yaml-no-unused-catalog-item": "error",
      "pnpm/yaml-no-duplicate-catalog-item": "error"
    }
  }
];
const configs = {
  recommended: [
    ...configsJson
    // Yaml support is still experimental
    // ...configsYaml,
  ],
  json: configsJson,
  yaml: configsYaml
};
plugin.configs = configs;

export { configs, plugin as default, plugin };
