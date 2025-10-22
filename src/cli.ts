#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, normalizeConfig } from './config';
import { SwaggerDownloader } from './downloader';

const program = new Command();

program
    .name('swagger-fetch')
    .description('Download Swagger/OpenAPI documentation - by Sergey Grey')
    .version('1.0.0');

program
    .command('download')
    .alias('d')
    .description('Download swagger documentation from configured sources')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (options) => {
        try {
            console.log(chalk.blue.bold('\n🚀 Swagger Fetch'));
            console.log(chalk.gray('   by Sergey Grey\n'));

            // Load configuration
            const config = await loadConfig(options.config);
            const sources = normalizeConfig(config);

            if (sources.length === 0) {
                console.log(chalk.yellow('⚠️  No sources configured'));
                return;
            }

            console.log(chalk.gray(`📦 Found ${sources.length} API source(s)\n`));

            // Download each source
            const downloader = new SwaggerDownloader();
            const results = {
                success: 0,
                failed: 0,
                errors: [] as Array<{ source: string; error: string }>,
            };

            for (const source of sources) {
                const spinner = ora({
                    text: `Downloading ${chalk.cyan(source.name)}`,
                    color: 'cyan',
                }).start();

                try {
                    await downloader.download(source);

                    spinner.succeed(
                        chalk.green(
                            `Downloaded ${chalk.bold(source.name)} → ${chalk.gray(
                                `${source.output}/swagger.${source.format}`
                            )}`
                        )
                    );

                    results.success++;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                    spinner.fail(
                        chalk.red(`Failed to download ${chalk.bold(source.name)}`)
                    );

                    console.error(chalk.red(`   ${errorMessage}\n`));

                    results.failed++;
                    results.errors.push({
                        source: source.name,
                        error: errorMessage,
                    });
                }
            }

            // Summary
            console.log();
            if (results.failed === 0) {
                console.log(
                    chalk.green.bold(
                        `✅ All done! Downloaded ${results.success} API(s)`
                    )
                );
            } else {
                console.log(
                    chalk.yellow.bold(
                        `⚠️  Completed with errors: ${results.success} succeeded, ${results.failed} failed`
                    )
                );

                if (results.errors.length > 0) {
                    console.log(chalk.gray('\nFailed sources:'));
                    results.errors.forEach(({ source, error }) => {
                        console.log(chalk.red(`  • ${source}: ${error}`));
                    });
                }
            }

            if (results.failed > 0) {
                process.exit(1);
            }
        } catch (error) {
            console.error(
                chalk.red.bold('\n❌ Error:'),
                error instanceof Error ? error.message : 'Unknown error'
            );
            process.exit(1);
        }
    });

program.parse();