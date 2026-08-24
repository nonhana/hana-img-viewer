import type { ServerAdapter } from '../../contracts/server/adapter'
import { renderToString } from 'react-dom/server'
import HanaImgViewer from '@/index'

export const reactServerAdapter: ServerAdapter = {
  async render(caseOptions) {
    const props = {
      src: caseOptions.src,
      defaultOpen: caseOptions.visibility === 'local-open' ? true : undefined,
      open: caseOptions.visibility === 'external-open' ? true : undefined,
    }
    return renderToString(<HanaImgViewer {...props} />)
  },
}
