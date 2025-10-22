#!/usr/bin/env node

// src/cli.ts
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";

// src/config.ts
import path from "path";
function normalizeConfig(config) {
  return config.sources.map((source) => ({
    name: source.name,
    input: source.input,
    output: path.join(config.baseOutput, source.name),
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
      const fullPath = path.resolve(process.cwd(), p);
      const config = await import(fullPath);
      return config.default || config;
    } catch (err) {
      continue;
    }
  }
  throw new Error("Config file not found. Create swagger-fetch.config.ts in your project root.");
}

// src/downloader.ts
import fs from "fs/promises";
import path2 from "path";
import yaml from "js-yaml";
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
      await fs.mkdir(source.output, { recursive: true });
      const filename = `swagger.${source.format}`;
      const filepath = path2.join(source.output, filename);
      let content;
      if (source.format === "yaml") {
        content = yaml.dump(swagger, {
          indent: 2,
          lineWidth: -1,
          // Don't wrap lines
          noRefs: true
          // Don't use references
        });
      } else {
        content = JSON.stringify(swagger, null, 2);
      }
      await fs.writeFile(filepath, content, "utf-8");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save file: ${error.message}`);
      }
      throw error;
    }
  }
};

// src/cli.ts
var program = new Command();
program.name("swagger-fetch").description("Download Swagger/OpenAPI documentation - by Sergey Grey").version("1.0.0");
program.command("download").alias("d").description("Download swagger documentation from configured sources").option("-c, --config <path>", "Path to config file").action(async (options) => {
  try {
    console.log(chalk.blue.bold("\n\u{1F680} Swagger Fetch"));
    console.log(chalk.gray("   by Sergey Grey\n"));
    const config = await loadConfig(options.config);
    const sources = normalizeConfig(config);
    if (sources.length === 0) {
      console.log(chalk.yellow("\u26A0\uFE0F  No sources configured"));
      return;
    }
    console.log(chalk.gray(`\u{1F4E6} Found ${sources.length} API source(s)
`));
    const downloader = new SwaggerDownloader();
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    for (const source of sources) {
      const spinner = ora({
        text: `Downloading ${chalk.cyan(source.name)}`,
        color: "cyan"
      }).start();
      try {
        await downloader.download(source);
        spinner.succeed(
          chalk.green(
            `Downloaded ${chalk.bold(source.name)} \u2192 ${chalk.gray(
              `${source.output}/swagger.${source.format}`
            )}`
          )
        );
        results.success++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        spinner.fail(
          chalk.red(`Failed to download ${chalk.bold(source.name)}`)
        );
        console.error(chalk.red(`   ${errorMessage}
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
        chalk.green.bold(
          `\u2705 All done! Downloaded ${results.success} API(s)`
        )
      );
    } else {
      console.log(
        chalk.yellow.bold(
          `\u26A0\uFE0F  Completed with errors: ${results.success} succeeded, ${results.failed} failed`
        )
      );
      if (results.errors.length > 0) {
        console.log(chalk.gray("\nFailed sources:"));
        results.errors.forEach(({ source, error }) => {
          console.log(chalk.red(`  \u2022 ${source}: ${error}`));
        });
      }
    }
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(
      chalk.red.bold("\n\u274C Error:"),
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
});
program.parse();
