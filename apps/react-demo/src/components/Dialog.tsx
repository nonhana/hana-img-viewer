import { HanaImgViewer } from 'hana-img-viewer-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

// 装饰遮罩 (.dialog-mask) 的点击关闭是鼠标快捷路径：
// 键盘 Escape 由 dialog-panel 的 onKeyDown 提供，无需 mask 成为 tab stop。
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

/**
 * Minimal dialog demo mirroring the Vue example: the viewer mounts inside a
 * custom portal target rendered in a tall, scrollable dialog body.
 */
export default function Dialog() {
  const [visible, setVisible] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  return (
    <>
      <button
        type="button"
        className="example-button"
        onClick={() => setVisible(true)}
      >
        Preview inside a dialog
      </button>
      {visible
        && createPortal(
          <div
            className="dialog-mask"
            aria-hidden="true"
            onClick={() => setVisible(false)}
          >
            <div
              className="dialog-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Preview dialog"
              tabIndex={-1}
              onClick={event => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === 'Escape')
                  setVisible(false)
              }}
            >
              <h3>Scroll to the bottom to inspect the embedded viewer</h3>
              <div className="dialog-inner-scroll">
                <div className="dialog-spacer" />
                <div ref={setPortalTarget} />
                <HanaImgViewer
                  portalTarget={portalTarget}
                  src="https://pixiv-r2.caelum.moe/121909597.png"
                  alt="121909597.png"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
