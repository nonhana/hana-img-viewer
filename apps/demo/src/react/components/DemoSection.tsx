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
    <section id={id} className="flex scroll-mt-22 flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] tracking-[0.18em] text-ink uppercase">{index}</span>
        {apis.map(api => (
          <code
            key={api}
            className="
              rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
              text-ink-strong
            "
          >
            {api}
          </code>
        ))}
      </p>
      <h2 className="text-[28px]">
        <span className="font-normal text-hana-blue-200"># </span>
        {title}
      </h2>
      <p className="max-w-160 text-[15.5px]">{description}</p>
      <div className="
        mt-2.5 grid grid-cols-1 items-stretch gap-5
        min-[861px]:grid-cols-2
      "
      >
        {children}
      </div>
    </section>
  )
}
