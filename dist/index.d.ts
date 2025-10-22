/**
 * Format for the downloaded swagger file
 */
type SwaggerFormat = 'json' | 'yaml';
/**
 * Configuration for a single API source
 */
interface SourceConfig {
    /**
     * Unique name for this API source
     * Will be used as the folder name: baseOutput/name/
     */
    name: string;
    /**
     * URL to the swagger/openapi documentation
     * @example 'https://api.example.com/v1/swagger.json'
     */
    input: string;
    /**
     * Output format for the downloaded file
     * @default 'json'
     */
    format?: SwaggerFormat;
}
/**
 * Main configuration for swagger-fetch
 */
interface Config {
    /**
     * Base output directory where all API folders will be created
     * @example 'src/services'
     */
    baseOutput: string;
    /**
     * Array of API sources to download
     */
    sources: SourceConfig[];
}
/**
 * Normalized source configuration used internally
 */
interface NormalizedSource {
    name: string;
    input: string;
    output: string;
    format: SwaggerFormat;
}

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
declare function defineConfig(config: Config): Config;

/**
 * Swagger downloader class
 * Handles downloading and saving swagger documentation
 */
declare class SwaggerDownloader {
    private readonly TIMEOUT;
    /**
     * Download swagger documentation for a single source
     */
    download(source: NormalizedSource): Promise<void>;
    /**
     * Fetch swagger from remote URL using native fetch
     */
    private fetchSwagger;
    /**
     * Save swagger to file system
     */
    private save;
}

export { type Config, type NormalizedSource, type SourceConfig, SwaggerDownloader, type SwaggerFormat, defineConfig };
