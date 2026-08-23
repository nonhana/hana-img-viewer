# Testing

Vitest 4 is the test runner. The core package uses Node unit tests; each UI package has separate unit, component, SSR, and distribution-contract configurations.

## Commands

| Scope | Command | Coverage |
| --- | --- | --- |
| Core | `pnpm -F hana-img-viewer-core test` | Framework-independent DOM, input, and math utilities. |
| React | `pnpm -F hana-img-viewer-react test` | Unit, component, and SSR suites. |
| Vue | `pnpm -F hana-img-viewer test` | Unit, component, and SSR suites. |
| React distribution | `pnpm -F hana-img-viewer-react test:dist` | Rebuild plus package metadata, runtime export, declaration, CSS, and source-map contracts. |
| Vue distribution | `pnpm -F hana-img-viewer test:dist` | Rebuild plus package metadata, runtime export, declaration, CSS, and source-map contracts. |

Use `test:unit`, `test:component`, or `test:ssr` on either UI package for a narrower run.

## Test Ownership

- React behavior is tested through `packages/react/tests/component/hana-img-viewer.component.test.tsx` and the public `@/index` seam. Direct unit coverage is reserved for the pure `viewerReducer` transitions.
- Vue behavior is tested through `packages/vue/tests/component/hana-img-viewer.component.test.ts` and the public `@/index` seam. Direct unit coverage is reserved for the pure viewer-state transitions.
- SSR suites prove thumbnail-only server output. React component coverage also exercises StrictMode hydration; Vue component coverage exercises post-mount portal ownership.
- Distribution suites are separate from each package's normal `test` script because they require fresh build output.
- Tests import Vitest APIs through each package's `tests/support/vitest.ts`. Component suites use the package-specific setup file for DOM, image, animation, gesture, and focus fakes.

Shared observable outcomes and per-framework conformance live in [`docs/behavior-spec.md`](../docs/behavior-spec.md). Prefix shared cases with `[behavior/Bx]`; React-only interface cases use `[react-interface/Rx]`. Do not mark one framework conformant from the other framework's test.

## Validation

For a full repository check, run:

```sh
pnpm lint
pnpm -F hana-img-viewer-core typecheck
pnpm typecheck
pnpm -F hana-img-viewer-demo-vue typecheck
pnpm -F hana-img-viewer-demo-react typecheck
pnpm test
pnpm build
pnpm changeset status
pnpm test:dist
```

There is no automated browser E2E suite. Use `pnpm dev:vue` or `pnpm dev:react` for a manual interaction smoke test; demos consume source aliases and are not distribution verification.
