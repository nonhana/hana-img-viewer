import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HanaImgViewer from '@/index'

describe('[react-interface/R1] public interface', () => {
  it('supports defaultOpen and callback-only uncontrolled usage', async () => {
    const onOpenChange = vi.fn()
    const view = render(
      <HanaImgViewer src="thumb.jpg" defaultOpen onOpenChange={onOpenChange} />,
    )

    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.click(document.querySelector('.hana-img-viewer-backdrop')!)
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull())
    expect(onOpenChange).toHaveBeenLastCalledWith(false)

    fireEvent.click(document.querySelector('.hana-img-viewer-thumbnail')!)
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    view.unmount()
  })
})
