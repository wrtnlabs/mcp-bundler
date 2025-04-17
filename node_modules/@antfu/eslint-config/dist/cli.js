// src/cli/index.ts
import process5 from "node:process";
import * as p5 from "@clack/prompts";
import c5 from "ansis";
import { cac } from "cac";

// package.json
var version = "4.12.0";

// src/cli/run.ts
import fs3 from "node:fs";
import path4 from "node:path";
import process4 from "node:process";
import * as p4 from "@clack/prompts";
import c4 from "ansis";

// src/cli/constants.ts
import c from "ansis";
var vscodeSettingsString = `
  // Disable the default formatter, use eslint instead
  "prettier.enable": false,
  "editor.formatOnSave": false,

  // Auto fix
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },

  // Silent the stylistic rules in you IDE, but still auto fix them
  "eslint.rules.customizations": [
    { "rule": "style/*", "severity": "off", "fixable": true },
    { "rule": "format/*", "severity": "off", "fixable": true },
    { "rule": "*-indent", "severity": "off", "fixable": true },
    { "rule": "*-spacing", "severity": "off", "fixable": true },
    { "rule": "*-spaces", "severity": "off", "fixable": true },
    { "rule": "*-order", "severity": "off", "fixable": true },
    { "rule": "*-dangle", "severity": "off", "fixable": true },
    { "rule": "*-newline", "severity": "off", "fixable": true },
    { "rule": "*quotes", "severity": "off", "fixable": true },
    { "rule": "*semi", "severity": "off", "fixable": true }
  ],

  // Enable eslint for all supported languages
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "html",
    "markdown",
    "json",
    "json5",
    "jsonc",
    "yaml",
    "toml",
    "xml",
    "gql",
    "graphql",
    "astro",
    "svelte",
    "css",
    "less",
    "scss",
    "pcss",
    "postcss"
  ]
`;
var frameworkOptions = [
  {
    label: c.green("Vue"),
    value: "vue"
  },
  {
    label: c.cyan("React"),
    value: "react"
  },
  {
    label: c.red("Svelte"),
    value: "svelte"
  },
  {
    label: c.magenta("Astro"),
    value: "astro"
  },
  {
    label: c.cyan("Solid"),
    value: "solid"
  },
  {
    label: c.blue("Slidev"),
    value: "slidev"
  }
];
var frameworks = frameworkOptions.map(({ value }) => value);
var extraOptions = [
  {
    hint: "Use external formatters (Prettier and/or dprint) to format files that ESLint cannot handle yet (.css, .html, etc)",
    label: c.red("Formatter"),
    value: "formatter"
  },
  {
    label: c.cyan("UnoCSS"),
    value: "unocss"
  }
];
var extra = extraOptions.map(({ value }) => value);
var dependenciesMap = {
  astro: [
    "eslint-plugin-astro",
    "astro-eslint-parser"
  ],
  formatter: [
    "eslint-plugin-format"
  ],
  formatterAstro: [
    "prettier-plugin-astro"
  ],
  react: [
    "@eslint-react/eslint-plugin",
    "eslint-plugin-react-hooks",
    "eslint-plugin-react-refresh"
  ],
  slidev: [
    "prettier-plugin-slidev"
  ],
  solid: [
    "eslint-plugin-solid"
  ],
  svelte: [
    "eslint-plugin-svelte",
    "svelte-eslint-parser"
  ],
  unocss: [
    "@unocss/eslint-plugin"
  ],
  vue: []
};

// src/cli/stages/update-eslint-files.ts
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import * as p from "@clack/prompts";
import c2 from "ansis";
import parse from "parse-gitignore";

// src/cli/utils.ts
import { execSync } from "node:child_process";
function isGitClean() {
  try {
    execSync("git diff-index --quiet HEAD --");
    return true;
  } catch {
    return false;
  }
}
function getEslintConfigContent(mainConfig, additionalConfigs) {
  return `
import antfu from '@antfu/eslint-config'

export default antfu({
${mainConfig}
}${additionalConfigs?.map((config) => `,{
${config}
}`)})
`.trimStart();
}

// src/cli/stages/update-eslint-files.ts
async function updateEslintFiles(result) {
  const cwd = process.cwd();
  const pathESLintIgnore = path.join(cwd, ".eslintignore");
  const pathPackageJSON = path.join(cwd, "package.json");
  const pkgContent = await fsp.readFile(pathPackageJSON, "utf-8");
  const pkg = JSON.parse(pkgContent);
  const configFileName = pkg.type === "module" ? "eslint.config.js" : "eslint.config.mjs";
  const pathFlatConfig = path.join(cwd, configFileName);
  const eslintIgnores = [];
  if (fs.existsSync(pathESLintIgnore)) {
    p.log.step(c2.cyan`Migrating existing .eslintignore`);
    const content = await fsp.readFile(pathESLintIgnore, "utf-8");
    const parsed = parse(content);
    const globs = parsed.globs();
    for (const glob of globs) {
      if (glob.type === "ignore")
        eslintIgnores.push(...glob.patterns);
      else if (glob.type === "unignore")
        eslintIgnores.push(...glob.patterns.map((pattern) => `!${pattern}`));
    }
  }
  const configLines = [];
  if (eslintIgnores.length)
    configLines.push(`ignores: ${JSON.stringify(eslintIgnores)},`);
  if (result.extra.includes("formatter"))
    configLines.push(`formatters: true,`);
  if (result.extra.includes("unocss"))
    configLines.push(`unocss: true,`);
  for (const framework of result.frameworks)
    configLines.push(`${framework}: true,`);
  const mainConfig = configLines.map((i) => `  ${i}`).join("\n");
  const additionalConfig = [];
  const eslintConfigContent = getEslintConfigContent(mainConfig, additionalConfig);
  await fsp.writeFile(pathFlatConfig, eslintConfigContent);
  p.log.success(c2.green`Created ${configFileName}`);
  const files = fs.readdirSync(cwd);
  const legacyConfig = [];
  files.forEach((file) => {
    if (/eslint|prettier/.test(file) && !/eslint\.config\./.test(file))
      legacyConfig.push(file);
  });
  if (legacyConfig.length)
    p.note(c2.dim(legacyConfig.join(", ")), "You can now remove those files manually");
}

// src/cli/stages/update-package-json.ts
import fsp2 from "node:fs/promises";
import path2 from "node:path";
import process2 from "node:process";
import * as p2 from "@clack/prompts";
import c3 from "ansis";

// src/cli/constants-generated.ts
var versionsMap = {
  "@eslint-react/eslint-plugin": "^1.43.0",
  "@unocss/eslint-plugin": "^66.0.0",
  "astro-eslint-parser": "^1.2.2",
  "eslint": "^9.24.0",
  "eslint-plugin-astro": "^1.3.1",
  "eslint-plugin-format": "^1.0.1",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.19",
  "eslint-plugin-solid": "^0.14.5",
  "eslint-plugin-svelte": "^3.5.1",
  "prettier-plugin-astro": "^0.14.1",
  "prettier-plugin-slidev": "^1.0.5",
  "svelte-eslint-parser": "^1.1.2"
};

// src/cli/stages/update-package-json.ts
async function updatePackageJson(result) {
  const cwd = process2.cwd();
  const pathPackageJSON = path2.join(cwd, "package.json");
  p2.log.step(c3.cyan`Bumping @antfu/eslint-config to v${version}`);
  const pkgContent = await fsp2.readFile(pathPackageJSON, "utf-8");
  const pkg = JSON.parse(pkgContent);
  pkg.devDependencies ??= {};
  pkg.devDependencies["@antfu/eslint-config"] = `^${version}`;
  pkg.devDependencies.eslint ??= versionsMap.eslint;
  const addedPackages = [];
  if (result.extra.length) {
    result.extra.forEach((item) => {
      switch (item) {
        case "formatter":
          [
            ...dependenciesMap.formatter,
            ...result.frameworks.includes("astro") ? dependenciesMap.formatterAstro : []
          ].forEach((f) => {
            if (!f)
              return;
            pkg.devDependencies[f] = versionsMap[f];
            addedPackages.push(f);
          });
          break;
        case "unocss":
          dependenciesMap.unocss.forEach((f) => {
            pkg.devDependencies[f] = versionsMap[f];
            addedPackages.push(f);
          });
          break;
      }
    });
  }
  for (const framework of result.frameworks) {
    const deps = dependenciesMap[framework];
    if (deps) {
      deps.forEach((f) => {
        pkg.devDependencies[f] = versionsMap[f];
        addedPackages.push(f);
      });
    }
  }
  if (addedPackages.length)
    p2.note(c3.dim(addedPackages.join(", ")), "Added packages");
  await fsp2.writeFile(pathPackageJSON, JSON.stringify(pkg, null, 2));
  p2.log.success(c3.green`Changes wrote to package.json`);
}

// src/cli/stages/update-vscode-settings.ts
import fs2 from "node:fs";
import fsp3 from "node:fs/promises";
import path3 from "node:path";
import process3 from "node:process";
import * as p3 from "@clack/prompts";
import { green } from "ansis";
async function updateVscodeSettings(result) {
  const cwd = process3.cwd();
  if (!result.updateVscodeSettings)
    return;
  const dotVscodePath = path3.join(cwd, ".vscode");
  const settingsPath = path3.join(dotVscodePath, "settings.json");
  if (!fs2.existsSync(dotVscodePath))
    await fsp3.mkdir(dotVscodePath, { recursive: true });
  if (!fs2.existsSync(settingsPath)) {
    await fsp3.writeFile(settingsPath, `{${vscodeSettingsString}}
`, "utf-8");
    p3.log.success(green`Created .vscode/settings.json`);
  } else {
    let settingsContent = await fsp3.readFile(settingsPath, "utf8");
    settingsContent = settingsContent.trim().replace(/\s*\}$/, "");
    settingsContent += settingsContent.endsWith(",") || settingsContent.endsWith("{") ? "" : ",";
    settingsContent += `${vscodeSettingsString}}
`;
    await fsp3.writeFile(settingsPath, settingsContent, "utf-8");
    p3.log.success(green`Updated .vscode/settings.json`);
  }
}

// src/cli/run.ts
async function run(options = {}) {
  const argSkipPrompt = !!process4.env.SKIP_PROMPT || options.yes;
  const argTemplate = options.frameworks?.map((m) => m?.trim()).filter(Boolean);
  const argExtra = options.extra?.map((m) => m?.trim()).filter(Boolean);
  if (fs3.existsSync(path4.join(process4.cwd(), "eslint.config.js"))) {
    p4.log.warn(c4.yellow`eslint.config.js already exists, migration wizard exited.`);
    return process4.exit(1);
  }
  let result = {
    extra: argExtra ?? [],
    frameworks: argTemplate ?? [],
    uncommittedConfirmed: false,
    updateVscodeSettings: true
  };
  if (!argSkipPrompt) {
    result = await p4.group({
      uncommittedConfirmed: () => {
        if (argSkipPrompt || isGitClean())
          return Promise.resolve(true);
        return p4.confirm({
          initialValue: false,
          message: "There are uncommitted changes in the current repository, are you sure to continue?"
        });
      },
      frameworks: ({ results }) => {
        const isArgTemplateValid = typeof argTemplate === "string" && !!frameworks.includes(argTemplate);
        if (!results.uncommittedConfirmed || isArgTemplateValid)
          return;
        const message = !isArgTemplateValid && argTemplate ? `"${argTemplate}" isn't a valid template. Please choose from below: ` : "Select a framework:";
        return p4.multiselect({
          message: c4.reset(message),
          options: frameworkOptions,
          required: false
        });
      },
      extra: ({ results }) => {
        const isArgExtraValid = argExtra?.length && !argExtra.filter((element) => !extra.includes(element)).length;
        if (!results.uncommittedConfirmed || isArgExtraValid)
          return;
        const message = !isArgExtraValid && argExtra ? `"${argExtra}" isn't a valid extra util. Please choose from below: ` : "Select a extra utils:";
        return p4.multiselect({
          message: c4.reset(message),
          options: extraOptions,
          required: false
        });
      },
      updateVscodeSettings: ({ results }) => {
        if (!results.uncommittedConfirmed)
          return;
        return p4.confirm({
          initialValue: true,
          message: "Update .vscode/settings.json for better VS Code experience?"
        });
      }
    }, {
      onCancel: () => {
        p4.cancel("Operation cancelled.");
        process4.exit(0);
      }
    });
    if (!result.uncommittedConfirmed)
      return process4.exit(1);
  }
  await updatePackageJson(result);
  await updateEslintFiles(result);
  await updateVscodeSettings(result);
  p4.log.success(c4.green`Setup completed`);
  p4.outro(`Now you can update the dependencies by run ${c4.blue("pnpm install")} and run ${c4.blue("eslint --fix")}
`);
}

// src/cli/index.ts
function header() {
  console.log("\n");
  p5.intro(`${c5.green`@antfu/eslint-config `}${c5.dim`v${version}`}`);
}
var cli = cac("@antfu/eslint-config");
cli.command("", "Run the initialization or migration").option("--yes, -y", "Skip prompts and use default values", { default: false }).option("--template, -t <template>", "Use the framework template for optimal customization: vue / react / svelte / astro", { type: [] }).option("--extra, -e <extra>", "Use the extra utils: formatter / perfectionist / unocss", { type: [] }).action(async (args) => {
  header();
  try {
    await run(args);
  } catch (error) {
    p5.log.error(c5.inverse.red(" Failed to migrate "));
    p5.log.error(c5.red`✘ ${String(error)}`);
    process5.exit(1);
  }
});
cli.help();
cli.version(version);
cli.parse();
