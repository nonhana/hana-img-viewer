import { HanaImgViewer } from 'hana-img-viewer-react'
import { useState } from 'react'

import GithubSVG from '../GithubSVG'

const demoImg1 = 'https://pixiv-r2.caelum.moe/121909597.png'
const demoImg1Preview = 'https://pixiv-r2.caelum.moe/121909597.png?preview=1'
const demoImg2 = 'https://pixiv-r2.caelum.moe/129115891.png'

export default function Previewer() {
  const [open, setOpen] = useState(false)

  return (
    <div className="wrapper">
      <a
        className="icon"
        href="https://github.com/nonhana/hana-img-viewer"
        target="_blank"
        rel="noreferrer"
      >
        <GithubSVG />
      </a>
      <div className="image">
        <HanaImgViewer
          src={demoImg1}
          previewSrc={demoImg1Preview}
          alt={demoImg1}
          open={open}
          onOpenChange={setOpen}
        />
        <div className="status">
          <div>
            Open state:
            {String(open)}
          </div>
          <div>
            `previewSrc` replaces the visible image silently after opening
          </div>
        </div>
      </div>
      <div className="image image-spaced">
        <HanaImgViewer src={demoImg2} alt={demoImg2} />
      </div>
    </div>
  )
}
