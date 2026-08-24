export const contractManifest = {
  B1: 'dom',
  B2: 'dom',
  B3: 'dom',
  B4: 'dom',
  B5: 'dom',
  B6: 'dom',
  B7: 'dom',
  B8: 'dom',
  B9: 'dom',
  B10: 'dom',
  B11: 'dom',
  B12: 'dom',
  B13: ['server', 'hydration'],
  B14: 'distribution',
} as const

export type ContractId = keyof typeof contractManifest

export const contractIds = Object.keys(contractManifest) as ContractId[]
