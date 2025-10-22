/**
 * Format for the downloaded swagger file
 */
export type SwaggerFormat = 'json' | 'yaml';

/**
 * Configuration for a single API source
 */
export interface SourceConfig {
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
export interface Config {
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
export interface NormalizedSource {
    name: string;
    input: string;
    output: string; // Full path: baseOutput/name
    format: SwaggerFormat;
}