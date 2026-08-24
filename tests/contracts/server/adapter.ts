export type ServerVisibility = 'closed' | 'local-open' | 'external-open'

export interface ServerRenderCase {
  src: string
  visibility: ServerVisibility
}

export interface ServerAdapter {
  render: (caseOptions: ServerRenderCase) => Promise<string>
}
