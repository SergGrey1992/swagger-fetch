import { Config, NormalizedSource, SourceConfig } from './types';
import path from 'path';

/**
 * Define swagger-fetch configuration
 * @param config Configuration object
 * @returns The same config (for type inference)
 *
 * @example
 * ```ts
 * import { defineConfig } from '@serg-grey/swagger-fetch';
 *
 * export default defineConfig({
 *   baseOutput: 'src/services',
 *   sources: [
 *     { name: 'api', input: 'https://api.example.com/swagger.json' }
 *   ]
 * });
 * ```
 */
export function defineConfig(config: Config): Config {
    return config;
}

/**
 * Normalize configuration for internal use
 */
export function normalizeConfig(config: Config): NormalizedSource[] {
    return config.sources.map((source: SourceConfig) => ({
        name: source.name,
        input: source.input,
        output: path.join(config.baseOutput, source.name),
        format: source.format || 'json', // Default to json
    }));
}

/**
 * Load configuration from file
 */
export async function loadConfig(configPath?: string): Promise<Config> {
    const defaultPaths = [
        'swagger-fetch.config.ts',
        'swagger-fetch.config.js',
        'swagger-fetch.config.mjs',
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

    throw new Error('Config file not found. Create swagger-fetch.config.ts in your project root.');
}