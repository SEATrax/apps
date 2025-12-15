# Build System Fix for Next.js 16 + Panna SDK

## Problem

Next.js 16 defaults to using Turbopack for builds, but the Panna SDK (via WalletConnect/thirdweb dependencies) includes pino logging which has test files and non-standard modules that Turbopack cannot process. This causes build failures with errors like:

```
Turbopack build failed with 30 errors:
./node_modules/thread-stream/test/ts.test.ts
Missing module type
./node_modules/thread-stream/LICENSE
Unknown module type
```

## Root Cause

The issue stems from the dependency chain:
```
panna-sdk → thirdweb → @walletconnect/sign-client → pino → thread-stream
```

The `thread-stream` package includes test files, shell scripts, and LICENSE files that Turbopack tries to process as JavaScript modules, causing build failures.

## Solution

Force Next.js to use webpack instead of Turbopack for production builds.

### Implementation

1. **Updated package.json build script:**
   ```json
   {
     "scripts": {
       "build": "next build --webpack",
       "build:turbo": "next build"
     }
   }
   ```

2. **Updated next.config.ts:**
   ```typescript
   const nextConfig: NextConfig = {
     // Force webpack usage instead of turbopack to avoid compatibility issues
     // Use --webpack flag in build command instead of experimental config
     
     webpack: (config, { isServer }) => {
       // Existing webpack config for handling fallbacks and null-loader rules
       // ...
     },
     transpilePackages: ['panna-sdk', 'thirdweb'],
   };
   ```

### Benefits

- ✅ Production builds work reliably
- ✅ All Panna SDK functionality preserved
- ✅ Development still uses default Next.js 16 behavior
- ✅ Maintains compatibility with existing webpack rules
- ✅ Fallback option available if needed (`npm run build:turbo`)

### Warnings

The build will show warnings about missing optional dependencies (like `pino-pretty`), but these are non-critical and don't affect functionality:

```
Module not found: Can't resolve 'pino-pretty'
```

These warnings are expected and can be safely ignored as they're for optional logging features not used in production.

## Alternative Solutions Attempted

1. **Turbopack configuration** - Next.js 16 doesn't have stable Turbopack configuration options for ignoring files
2. **Module exclusion** - Difficult to exclude specific files without breaking the entire dependency chain
3. **Dependency replacement** - Would require major changes to Panna SDK integration

## Future Considerations

- Monitor Next.js updates for better Turbopack configuration options
- Consider migrating to alternative wallet connection libraries if Turbopack compatibility becomes critical
- The `--webpack` flag may become deprecated in future Next.js versions, requiring alternative solutions

## Usage

```bash
# Production build (uses webpack)
npm run build

# Development
npm run dev

# Force Turbopack (for testing)
npm run build:turbo
```