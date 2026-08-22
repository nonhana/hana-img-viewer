/**
 * Public component emits.
 */
export interface HanaImgViewerEmits {
  (e: 'update:open', value: boolean): void
  (e: 'open'): void
  (e: 'close'): void
  (e: 'load', event: Event): void
  (e: 'error', event: Event): void
}
