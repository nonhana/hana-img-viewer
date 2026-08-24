# Testing

Vitest 4 is the test runner. The core package and UI packages own pure unit tests; the repository root owns cross-framework contract evidence.

## Commands

| Scope | Command | Coverage |
| --- | --- | --- |
| Core | `pnpm -F hana-img-viewer-core test` | Framework-independent DOM, input, and math utilities. |
| Unit | `pnpm test:unit` | Core tests plus React/Vue pure transition units. |
| Contracts | `pnpm test:contract` | Governance and B1-B13 contracts for every registered adapter. |
| React contracts | `pnpm test:contract:react` | React DOM, hydration, server, and interface adapter evidence. |
| Vue contracts | `pnpm test:contract:vue` | Vue DOM, hydration, and server adapter evidence. |
| React distribution | `pnpm test:dist:react` | Fresh React build plus shared B14 distribution contract. |
| Vue distribution | `pnpm test:dist:vue` | Fresh Vue build plus shared B14 distribution contract. |

UI package `test` scripts run only their package-local unit config. Component, SSR, and distribution suites are root-owned.

## Test Ownership

- `tests/contracts/**` defines each B behavior once. `tests/adapters/<framework>/**` maps that contract to the public `@/index` source seam.
- `tests/environment/dom.setup.ts` owns deterministic geometry, animation, image, gesture, focus, and cleanup controls. Adapter `settle` owns only framework scheduling.
- Server contracts run in Node; hydration contracts run in jsdom. Distribution contracts read fresh package output through read-only descriptors.
- Package-local tests may import internal modules only for pure transition units; they must not duplicate B behavior.
- Registered adapters are conformant only when every applicable root project passes. Contract cases must not use `skip`, `todo`, `fails`, or framework branches.

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
