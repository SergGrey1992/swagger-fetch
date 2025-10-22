# @serg-grey/swagger-fetch

> 🚀 Simple CLI tool for downloading Swagger/OpenAPI documentation

[![npm version](https://img.shields.io/npm/v/@serg-grey/swagger-fetch.svg)](https://www.npmjs.com/package/@serg-grey/swagger-fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

**Created by Sergey Grey** | [GitHub](https://github.com/serg-grey)

## 📋 Requirements

- Node.js >= 18.0.0 (for native fetch support)

## ✨ Features

- 📥 Download Swagger/OpenAPI docs from any URL
- 📦 Support for multiple API sources
- 📄 Output formats: JSON or YAML
- 🎯 TypeScript support
- ⚡ Fast and simple
- 🪶 Zero external HTTP dependencies (uses native fetch)
- 🛠️ Minimal package size (~100KB)

## 📦 Installation
```bash
npm install -D @serg-grey/swagger-fetch
```

## 🚀 Quick Start

### 1. Create config file

Create `swagger-fetch.config.ts` in your project root:
```typescript
import { defineConfig } from '@serg-grey/swagger-fetch';

export default defineConfig({
  baseOutput: 'src/services',
  sources: [
    {
      name: 'my-api',
      input: 'https://api.example.com/v1/swagger.json',
    },
  ],
});
```

### 2. Add script to package.json
```json
{
  "scripts": {
    "swagger:download": "swagger-fetch download"
  }
}
```

### 3. Run
```bash
npm run swagger:download
```

Result:
```
src/services/
└── my-api/
    └── swagger.json
```

## 📚 Configuration

### Simple Configuration
```typescript
import { defineConfig } from '@serg-grey/swagger-fetch';

export default defineConfig({
  baseOutput: 'src/services',
  sources: [
    {
      name: 'petstore',
      input: 'https://petstore.swagger.io/v2/swagger.json',
    },
  ],
});
```

### Multiple APIs
```typescript
import { defineConfig } from '@serg-grey/swagger-fetch';

export default defineConfig({
  baseOutput: 'src/services',
  sources: [
    {
      name: 'users-api',
      input: 'https://api.example.com/users/swagger.json',
      format: 'json', // default
    },
    {
      name: 'payments-api',
      input: 'https://api.example.com/payments/swagger.json',
      format: 'yaml',
    },
  ],
});
```

## 🎯 API Reference

### `defineConfig(config: Config)`

Defines the configuration for swagger-fetch.

#### Config

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `baseOutput` | `string` | ✅ | Base directory for output files |
| `sources` | `SourceConfig[]` | ✅ | Array of API sources |

#### SourceConfig

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `name` | `string` | ✅ | - | Unique name (used as folder name) |
| `input` | `string` | ✅ | - | Swagger/OpenAPI URL |
| `format` | `'json' \| 'yaml'` | ❌ | `'json'` | Output file format |

## 🛠️ CLI Commands
```bash
# Download swagger docs
swagger-fetch download

# Use custom config file
swagger-fetch download --config custom-config.ts

# Show help
swagger-fetch --help

# Show version
swagger-fetch --version
```

## 💡 Examples

### With Next.js
```typescript
// swagger-fetch.config.ts
import { defineConfig } from '@serg-grey/swagger-fetch';

export default defineConfig({
  baseOutput: 'src/lib/api',
  sources: [
    {
      name: 'backend',
      input: 'https://api.myapp.com/v1/openapi.json',
    },
  ],
});
```
```json
// package.json
{
  "scripts": {
    "swagger:download": "swagger-fetch download",
    "predev": "npm run swagger:download",
    "dev": "next dev"
  }
}
```

### Microservices
```typescript
import { defineConfig } from '@serg-grey/swagger-fetch';

export default defineConfig({
  baseOutput: 'src/api/specs',
  sources: [
    { name: 'user-service', input: 'https://users.api.com/swagger.json' },
    { name: 'order-service', input: 'https://orders.api.com/swagger.json' },
    { name: 'payment-service', input: 'https://payments.api.com/swagger.json' },
  ],
});
```

Result:
```
src/api/specs/
├── user-service/
│   └── swagger.json
├── order-service/
│   └── swagger.json
└── payment-service/
    └── swagger.json
```

### Different Formats
```typescript
import { defineConfig } from '@serg-grey/swagger-fetch';

export default defineConfig({
  baseOutput: 'src/services',
  sources: [
    {
      name: 'api-json',
      input: 'https://api.example.com/swagger.json',
      format: 'json',
    },
    {
      name: 'api-yaml',
      input: 'https://api.example.com/swagger.json',
      format: 'yaml',
    },
  ],
});
```

## 🤝 Integration

Works great with code generators like:

- **OpenAPI Generator** - Generate TypeScript clients
- **Swagger Codegen** - Generate API clients
```json
{
  "scripts": {
    "swagger:download": "swagger-fetch download"
  }
}
```

## 📝 License

MIT © [Sergey Grey](https://github.com/serg-grey)

## 🙏 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

## 📮 Support

- 🐛 [Report a bug](https://github.com/serg-grey/swagger-fetch/issues)
- 💡 [Request a feature](https://github.com/serg-grey/swagger-fetch/issues)

---

Made with ❤️ by **Sergey Grey**