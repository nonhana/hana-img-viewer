/**
 * Public component emits.
 */
export interface HanaImgViewerEmits {
  /**
   * Controlled open-state sync.
   */
  (e: 'update:open', value: boolean): void
  /**
   * Fired when the viewer becomes visibly open on the client.
   */
  (e: 'open'): void
  /**
   * Fired when the viewer finishes closing.
   */
  (e: 'close'): void
  /**
   * Fired when the enhancement source is ready and active.
   */
  (e: 'load', event: Event): void
  /**
   * Fired when the enhancement source fails.
   */
  (e: 'error', event: Event): void
}
