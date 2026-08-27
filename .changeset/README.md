# Changesets

This repository keeps one Changesets ledger for two independently released public packages:

- `hana-img-viewer` for Vue;
- `hana-img-viewer-react` for React.

`hana-img-viewer-core` and both demos are private workspace packages. Do not select them in a changeset.

## Add release intent

Run `pnpm changeset` from the repository root and select only the public package whose consumer-facing release is being described. A shared behavior implemented by both frameworks needs one Vue changeset and one React changeset so that each package keeps its own version and changelog entry.

Use an empty changeset for repository-only work that intentionally publishes neither package:

```sh
pnpm changeset --empty
```

## Release flow

1. Merge implementation changes and their changesets into `main`.
2. `.github/workflows/release.yml` creates or updates the aggregated Changesets release PR. This workflow changes versions and changelogs but never publishes to npm.
3. Review and merge the release PR when the listed package releases are ready.
4. A changed `packages/vue/package.json` triggers `publish-vue.yml`; a changed `packages/react/package.json` triggers `publish-react.yml`.
5. Each publish workflow runs its own typecheck, behavior contracts, distribution contract, npm publish, package tag, and GitHub release. Either workflow can be rerun independently with `workflow_dispatch` on `main`.

## npm trusted publishing

Configure npm Trusted Publishers with the exact workflow filenames:

- `hana-img-viewer`: `publish-vue.yml`;
- `hana-img-viewer-react`: `publish-react.yml`.

The `hana-img-viewer-react@0.0.0` bootstrap release has been published, so subsequent React releases use OIDC through `publish-react.yml` and do not require an `NPM_TOKEN` GitHub Actions secret.
