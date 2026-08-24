import type { ServerAdapter } from '../../contracts/server/adapter'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { HanaImgViewer } from '@/index'

export const vueServerAdapter: ServerAdapter = {
  async render(caseOptions) {
    const app = createSSRApp({
      render: () => h(HanaImgViewer, {
        src: caseOptions.src,
        open: caseOptions.visibility !== 'closed',
      }),
    })
    return renderToString(app)
  },
}
