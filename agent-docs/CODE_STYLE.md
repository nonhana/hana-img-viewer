# Code Style

## Automated Rules

- The root ESLint configuration is the only formatter and linter. It uses `@antfu/eslint-config` for Vue, React, JSX accessibility, TypeScript, JavaScript, Markdown, YAML, and pnpm files.
- Use `pnpm lint` to check and `pnpm lint:fix` to format. The repository has no separate formatter; do not add one for routine changes.
- Production source under `packages/vue/src`, `packages/react/src`, and `packages/core/src` enforces function expressions and arrow functions through `func-style`.
- React rules apply to `packages/react` and `apps/react-demo`; the configuration disables React rules for other TypeScript and JavaScript files. JSX accessibility checks remain enabled.
- Tests may use non-null assertions; production source may not rely on that test-only override.

## TypeScript and Imports

- All packages extend the strict root TypeScript baseline, including unused-symbol checks, forced module detection, bundler resolution, isolated modules, and no emit.
- Use `@/*` only for imports within the current UI package's `src`. Use package names for cross-package imports and preserve the dependency direction in [`PACKAGES.md`](./PACKAGES.md).
- Keep public types in each UI package's `src/public-types.ts` and exports in `src/index.ts`; do not expose internal module types accidentally.
