# Build

The root `package.json` pins pnpm 11.22.0. Install dependencies from the repository root with `pnpm install`.

## Root Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev:vue` | Start the Vue demo against `packages/vue/src`. |
| `pnpm dev:react` | Start the React demo against `packages/react/src`. |
| `pnpm build:vue` | Build only `hana-img-viewer`. |
| `pnpm build:react` | Build only `hana-img-viewer-react`. |
| `pnpm build` | Run all workspace `build` scripts serially; this builds both libraries and both demos. |
| `pnpm lint` / `pnpm lint:fix` | Check or fix the repository with the root ESLint configuration. |
| `pnpm typecheck` | Type-check both UI libraries and root contract adapters. |
| `pnpm test:unit` | Run the core tests and both UI-library pure unit suites. |
| `pnpm test:contract` | Run governance plus all registered React/Vue B1-B13 contracts. |
| `pnpm test:dist` | Fresh-build both UI libraries and run the shared B14 distribution projects. |
| `pnpm test` | Run root unit and contract suites. |
| `pnpm changeset status` | Inspect the pending release set without changing versions or publishing. |

The root `typecheck` script does not cover the core package or demos. Run their scripts explicitly when they are in scope:

```sh
pnpm -F hana-img-viewer-core typecheck
pnpm -F hana-img-viewer-demo-vue typecheck
pnpm -F hana-img-viewer-demo-react typecheck
```

## Generated Output

- `packages/vue/dist/` and `packages/react/dist/` are generated ESM library outputs. Each build emits `index.js`, `index.js.map`, extracted `style.css`, and declarations.
- The Vue build externalizes `vue`; the React build externalizes `react`, `react-dom`, and `react/jsx-runtime`. Both builds enable source maps and disable CSS code splitting.
- `packages/core` has no build script. It is a private workspace source package whose runtime imports are bundled into both UI outputs.
- `apps/vue-demo/dist/` and `apps/react-demo/dist/` are demo build outputs. Development demos resolve their corresponding library source, so they do not validate packaged `dist` files.
- Do not edit generated `dist/` files. Change source or build configuration and rebuild instead.

## Release Automation

- `.github/workflows/release.yml` uses Changesets only to create or update the version/changelog PR.
- Merging that PR triggers `publish-vue.yml` and/or `publish-react.yml` according to which public package manifest changed.
- Each publish workflow rebuilds and validates only its framework, packs a tarball, publishes through npm, then creates the package-scoped tag and GitHub release.
- The workflows are idempotent around npm, tags, and GitHub releases and can be rerun manually on `main`.
- npm Trusted Publisher configuration must use the exact publish workflow filename. The first React release requires the temporary `NPM_TOKEN` bootstrap secret described in `.changeset/README.md`.
