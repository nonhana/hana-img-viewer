export interface DistributionDescriptor {
  packageDir: string
  expectedArtifacts: string[]
  expectedPackage: {
    dependencies: Record<string, string>
    exports: Record<string, unknown>
    files: string[]
    main: string
    module: string
    sideEffects: boolean | string[]
    types: string
    peerDependencies: Record<string, string>
    publishConfig: Record<string, unknown>
  }
  runtimeExportNames: string[]
  requiredDeclarationNames: string[]
  forbiddenDeclarationNames: string[]
  forbiddenRuntimeFragments: string[]
}

export interface DistributionAdapter {
  descriptor: DistributionDescriptor
}
