#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli.ts
var import_commander = require("commander");
var import_chalk = __toESM(require("chalk"));
var import_ora = __toESM(require("ora"));

// src/config.ts
var import_path = __toESM(require("path"));
function normalizeConfig(config) {
  return config.sources.map((source) => ({
    name: source.name,
    input: source.input,
    output: import_path.default.join(config.baseOutput, source.name),
    format: source.format || "json"
    // Default to json
  }));
}
async function loadConfig(configPath) {
  const defaultPaths = [
    "swagger-fetch.config.ts",
    "swagger-fetch.config.js",
    "swagger-fetch.config.mjs"
  ];
  const paths = configPath ? [configPath] : defaultPaths;
  for (const p of paths) {
    try {
      const fullPath = import_path.default.resolve(process.cwd(), p);
      const config = await import(fullPath);
      return config.default || config;
    } catch (err) {
      continue;
    }
  }
  throw new Error("Config file not found. Create swagger-fetch.config.ts in your project root.");
}

// src/downloader.ts
var import_promises = __toESM(require("fs/promises"));
var import_path2 = __toESM(require("path"));
var import_js_yaml = __toESM(require("js-yaml"));
var SwaggerDownloader = class {
  TIMEOUT = 3e4;
  // 30 seconds
  /**
   * Download swagger documentation for a single source
   */
  async download(source) {
    const swagger = await this.fetchSwagger(source);
    await this.save(source, swagger);
  }
  /**
   * Fetch swagger from remote URL using native fetch
   */
  async fetchSwagger(source) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
    try {
      const response = await fetch(source.input, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json"
        }
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const statusText = response.statusText || "Unknown error";
        throw new Error(
          `HTTP ${response.status} ${statusText}`
        );
      }
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("application/json") && !contentType.includes("text/")) {
        throw new Error(
          `Invalid content type: ${contentType}. Expected JSON.`
        );
      }
      const data = await response.json();
      if (!data.swagger && !data.openapi) {
        throw new Error(
          'Invalid swagger format: missing "swagger" or "openapi" field'
        );
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(
            `Request timeout (${this.TIMEOUT / 1e3}s)`
          );
        }
        if (error.message.includes("fetch failed")) {
          throw new Error(
            "Network error. Check your internet connection or URL."
          );
        }
        if (error instanceof SyntaxError) {
          throw new Error(
            "Invalid JSON response from server"
          );
        }
        throw new Error(error.message);
      }
      throw error;
    }
  }
  /**
   * Save swagger to file system
   */
  async save(source, swagger) {
    try {
      await import_promises.default.mkdir(source.output, { recursive: true });
      const filename = `swagger.${source.format}`;
      const filepath = import_path2.default.join(source.output, filename);
      let content;
      if (source.format === "yaml") {
        content = import_js_yaml.default.dump(swagger, {
          indent: 2,
          lineWidth: -1,
          // Don't wrap lines
          noRefs: true
          // Don't use references
        });
      } else {
        content = JSON.stringify(swagger, null, 2);
      }
      await import_promises.default.writeFile(filepath, content, "utf-8");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save file: ${error.message}`);
      }
      throw error;
    }
  }
};

// src/cli.ts
var program = new import_commander.Command();
program.name("swagger-fetch").description("Download Swagger/OpenAPI documentation - by Sergey Grey").version("1.0.0");
program.command("download").alias("d").description("Download swagger documentation from configured sources").option("-c, --config <path>", "Path to config file").action(async (options) => {
  try {
    console.log(import_chalk.default.blue.bold("\n\u{1F680} Swagger Fetch"));
    console.log(import_chalk.default.gray("   by Sergey Grey\n"));
    const config = await loadConfig(options.config);
    const sources = normalizeConfig(config);
    if (sources.length === 0) {
      console.log(import_chalk.default.yellow("\u26A0\uFE0F  No sources configured"));
      return;
    }
    console.log(import_chalk.default.gray(`\u{1F4E6} Found ${sources.length} API source(s)
`));
    const downloader = new SwaggerDownloader();
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    for (const source of sources) {
      const spinner = (0, import_ora.default)({
        text: `Downloading ${import_chalk.default.cyan(source.name)}`,
        color: "cyan"
      }).start();
      try {
        await downloader.download(source);
        spinner.succeed(
          import_chalk.default.green(
            `Downloaded ${import_chalk.default.bold(source.name)} \u2192 ${import_chalk.default.gray(
              `${source.output}/swagger.${source.format}`
            )}`
          )
        );
        results.success++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        spinner.fail(
          import_chalk.default.red(`Failed to download ${import_chalk.default.bold(source.name)}`)
        );
        console.error(import_chalk.default.red(`   ${errorMessage}
`));
        results.failed++;
        results.errors.push({
          source: source.name,
          error: errorMessage
        });
      }
    }
    console.log();
    if (results.failed === 0) {
      console.log(
        import_chalk.default.green.bold(
          `\u2705 All done! Downloaded ${results.success} API(s)`
        )
      );
    } else {
      console.log(
        import_chalk.default.yellow.bold(
          `\u26A0\uFE0F  Completed with errors: ${results.success} succeeded, ${results.failed} failed`
        )
      );
      if (results.errors.length > 0) {
        console.log(import_chalk.default.gray("\nFailed sources:"));
        results.errors.forEach(({ source, error }) => {
          console.log(import_chalk.default.red(`  \u2022 ${source}: ${error}`));
        });
      }
    }
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(
      import_chalk.default.red.bold("\n\u274C Error:"),
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
});
program.parse();
