export type ContainerOption
  = | { kind: 'body' }
    | { kind: 'pending' }
    | { kind: 'custom', element: HTMLElement }

export type VisibilityOption = { kind: 'local', initialOpen?: boolean } | { kind: 'external', open: boolean }

export interface DomMountOptions {
  src?: string
  previewSrc?: string
  alt?: string
  container?: ContainerOption
  visibility?: VisibilityOption
  enableZoom?: boolean
  minZoom?: number
  maxZoom?: number
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  trigger?: 'default' | 'custom'
}

export interface DomHandle {
  readonly host: HTMLElement
  readonly requests: readonly boolean[]
  getOrigin: () => HTMLElement | null
  getTrigger: () => HTMLElement | null
  getDialog: () => HTMLElement | null
  getBackdrop: () => HTMLElement | null
  getPreview: () => HTMLImageElement | null
  getFlipShell: () => HTMLElement | null
  update: (options: Partial<DomMountOptions>) => Promise<void>
  confirmVisibility: (open: boolean) => Promise<void>
  settle: () => Promise<void>
  unmount: () => void
}

export interface DomAdapter {
  mount: (options?: DomMountOptions) => Promise<DomHandle>
}
