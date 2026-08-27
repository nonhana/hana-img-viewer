export interface DemoSsrEntry {
  framework: string
  html: string
  htmlPath: string
  ssrPath: string
  hydrationPath: string
}

export interface DemoEntries {
  htmlFiles: string[]
  clientInputs: Record<string, string>
  ssrEntries: DemoSsrEntry[]
  expectedBundles: string[]
}

export function discoverDemoEntries(rootDir: string): DemoEntries
