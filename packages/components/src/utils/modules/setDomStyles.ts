import type { CSSProperties } from 'vue'

function setStyles(el: HTMLElement, styles: CSSProperties) {
  Object.assign(el.style, styles)
}

export { setStyles }
