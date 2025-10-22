// src/config.ts
import path from "path";
function defineConfig(config) {
  return config;
}
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

export {
  defineConfig,
  normalizeConfig,
  loadConfig,
  SwaggerDownloader
};
