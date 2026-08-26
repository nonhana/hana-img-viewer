import type { ReactNode } from 'react'

interface DemoSectionProps {
  id: string
  index: string
  title: string
  apis: string[]
  description: ReactNode
  children: ReactNode
}

export default function DemoSection({
  id,
  index,
  title,
  apis,
  description,
  children,
}: DemoSectionProps) {
  return (
    <section id={id} className="demo-section">
      <p className="demo-section__eyebrow">
        <span className="demo-meta">{index}</span>
        {apis.map(api => (
          <code key={api} className="demo-code-inline">{api}</code>
        ))}
      </p>
      <h2 className="demo-section__title">{title}</h2>
      <p className="demo-section__desc">{description}</p>
      <div className="demo-section__grid">{children}</div>
    </section>
  )
}
