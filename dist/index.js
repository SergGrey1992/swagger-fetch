"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  SwaggerDownloader: () => SwaggerDownloader,
  defineConfig: () => defineConfig
});
module.exports = __toCommonJS(index_exports);

// src/config.ts
function defineConfig(config) {
  return config;
}

// src/downloader.ts
var import_promises = __toESM(require("fs/promises"));
var import_path = __toESM(require("path"));
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
      const filepath = import_path.default.join(source.output, filename);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SwaggerDownloader,
  defineConfig
});
