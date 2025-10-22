import fs from 'fs/promises';
import path from 'path';
import { NormalizedSource } from './types';
import yaml from 'js-yaml';

/**
 * Swagger downloader class
 * Handles downloading and saving swagger documentation
 */
export class SwaggerDownloader {
    private readonly TIMEOUT = 30000; // 30 seconds

    /**
     * Download swagger documentation for a single source
     */
    async download(source: NormalizedSource): Promise<void> {
        // 1. Download swagger from URL
        const swagger = await this.fetchSwagger(source);

        // 2. Save to file system
        await this.save(source, swagger);
    }

    /**
     * Fetch swagger from remote URL using native fetch
     */
    private async fetchSwagger(source: NormalizedSource): Promise<any> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

        try {
            const response = await fetch(source.input, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            // Check response status
            if (!response.ok) {
                const statusText = response.statusText || 'Unknown error';
                throw new Error(
                    `HTTP ${response.status} ${statusText}`
                );
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('application/json') && !contentType.includes('text/')) {
                throw new Error(
                    `Invalid content type: ${contentType}. Expected JSON.`
                );
            }

            // Parse JSON
            const data = await response.json() as any;

            // Basic validation - check if it looks like swagger/openapi
            if (!data.swagger && !data.openapi) {
                throw new Error(
                    'Invalid swagger format: missing "swagger" or "openapi" field'
                );
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                // Timeout error
                if (error.name === 'AbortError') {
                    throw new Error(
                        `Request timeout (${this.TIMEOUT / 1000}s)`
                    );
                }

                // Network errors
                if (error.message.includes('fetch failed')) {
                    throw new Error(
                        'Network error. Check your internet connection or URL.'
                    );
                }

                // JSON parse errors
                if (error instanceof SyntaxError) {
                    throw new Error(
                        'Invalid JSON response from server'
                    );
                }

                // Re-throw with source name prefix
                throw new Error(error.message);
            }

            throw error;
        }
    }

    /**
     * Save swagger to file system
     */
    private async save(source: NormalizedSource, swagger: any): Promise<void> {
        try {
            // Create output directory if it doesn't exist
            await fs.mkdir(source.output, { recursive: true });

            // Determine filename based on format
            const filename = `swagger.${source.format}`;
            const filepath = path.join(source.output, filename);

            // Convert content based on format
            let content: string;

            if (source.format === 'yaml') {
                content = yaml.dump(swagger, {
                    indent: 2,
                    lineWidth: -1, // Don't wrap lines
                    noRefs: true,  // Don't use references
                });
            } else {
                content = JSON.stringify(swagger, null, 2);
            }

            // Write to file
            await fs.writeFile(filepath, content, 'utf-8');
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to save file: ${error.message}`);
            }
            throw error;
        }
    }
}