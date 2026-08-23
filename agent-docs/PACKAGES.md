# Packages

The repository contains three library packages and two private demos. Library packages have independent public surfaces and semantic versions.

## Ownership

| Path | Package | Responsibility |
| --- | --- | --- |
| `packages/vue` | `hana-img-viewer` | Vue 3 library and Vue-only behavior. |
| `packages/react` | `hana-img-viewer-react` | React 19 library and React-only behavior. |
| `packages/core` | `hana-img-viewer-core` | Framework-independent utilities and types used by the UI libraries. |
| `apps/vue-demo` | `hana-img-viewer-demo-vue` | Private Vue source consumer. |
| `apps/react-demo` | `hana-img-viewer-demo-react` | Private React source consumer. |

## Dependency Direction

- Each demo depends only on its matching UI library and must not publish library code.
- Both UI libraries depend on `hana-img-viewer-core` through `workspace:*`.
- Core must remain framework-independent. React and Vue lifecycle, gesture ownership, animation ownership, and effects remain in their respective UI packages.
- A UI library must not depend on the other UI library, and packages must not depend on apps.
- Move code into core only after both production libraries genuinely share the same framework-independent contract; physical symmetry is not a goal.

## Versioning and Releases

`.changeset/config.json` keeps `fixed` and `linked` empty, ignores both demos, and uses patch updates for internal dependency changes. Do not force Vue, React, and core onto one version or release one package merely because another changed.

Package manifests and unconsumed `.changeset/*.md` files are the release-state authority. Inspect both before selecting a bump or describing the next release. Creating or consuming changesets, changing versions, publishing, tagging, pushing, and creating releases require explicit authorization; routine validation may use `pnpm changeset status`.
