#!/usr/bin/env node
import {
  SwaggerDownloader,
  loadConfig,
  normalizeConfig
} from "./chunk-PRMEMQVW.mjs";

// src/cli.ts
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
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
