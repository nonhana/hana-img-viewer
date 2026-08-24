# Packages

The repository contains two public libraries, one private shared implementation package, and two private demos. The Vue and React libraries have independent public surfaces, semantic versions, and publish workflows.

## Ownership

| Path | Package | Responsibility |
| --- | --- | --- |
| `packages/vue` | `hana-img-viewer` | Vue 3 library and Vue-only behavior. |
| `packages/react` | `hana-img-viewer-react` | React 19 library and React-only behavior. |
| `packages/core` | `hana-img-viewer-core` | Private framework-independent utilities and types bundled into both UI libraries. |
| `apps/vue-demo` | `hana-img-viewer-demo-vue` | Private Vue source consumer. |
| `apps/react-demo` | `hana-img-viewer-demo-react` | Private React source consumer. |

## Dependency Direction

- Each demo depends only on its matching UI library and must not publish library code.
- Both UI libraries use `hana-img-viewer-core` as a `workspace:*` development dependency. Their builds inline core; published manifests must not expose it as a runtime dependency.
- Core must remain framework-independent. React and Vue lifecycle, gesture ownership, animation ownership, and effects remain in their respective UI packages.
- A UI library must not depend on the other UI library, and packages must not depend on apps.
- Move code into core only after both production libraries genuinely share the same framework-independent contract; physical symmetry is not a goal.
- Root test adapters may import each matching UI package's public source seam for dev-time contract evidence. They are not workspace packages, runtime dependencies, or published files.

## Versioning and Releases

`.changeset/config.json` keeps `fixed` and `linked` empty and ignores core plus both demos. Do not force Vue and React onto one version or release one package merely because the other changed.

The repository uses one Changesets ledger and one aggregated release PR. Publishing remains package-specific: `publish-vue.yml` and `publish-react.yml` run separate validation, npm publish, tag, and GitHub release paths. A shared behavior implemented by both frameworks therefore needs separate Vue and React changeset entries.

Public package manifests and unconsumed `.changeset/*.md` files are the release-state authority. Inspect both before selecting a bump or describing the next release. Creating or consuming changesets, changing versions, publishing, tagging, pushing, and creating releases require explicit authorization; routine validation may use `pnpm changeset status`.
