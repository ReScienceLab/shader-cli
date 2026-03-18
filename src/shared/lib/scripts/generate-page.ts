#!/usr/bin/env bun

import * as p from "@clack/prompts"
import { createDir } from "./utils"

interface PageOptions {
  theme?: "dark" | "light"
  css?: boolean
}

export interface PageConfig {
  name: string
  options: PageOptions
}

export const promptPageConfig = async (): Promise<PageConfig> => {
  const name = await p.text({
    message: "What should the route be called?",
    placeholder: "about, playground, gallery",
    validate: (value) => {
      if (!value) return "Route name is required"
      if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value)) {
        return "Route name must start with a letter and contain only letters, numbers, hyphens, and underscores"
      }
      return undefined
    },
  })

  if (p.isCancel(name)) {
    p.cancel("Page generation cancelled")
    process.exit(0)
  }

  const theme = await p.select({
    message: "Choose a theme for the route",
    options: [
      { value: "dark", label: "Dark", hint: "Default editor theme" },
      { value: "light", label: "Light", hint: "Light surface theme" },
    ],
    initialValue: "dark",
  })

  if (p.isCancel(theme)) {
    p.cancel("Page generation cancelled")
    process.exit(0)
  }

  const includeCss = await p.confirm({
    message: "Include a CSS module file?",
    initialValue: false,
  })

  if (p.isCancel(includeCss)) {
    p.cancel("Page generation cancelled")
    process.exit(0)
  }

  return {
    name,
    options: {
      theme: theme as "dark" | "light",
      css: includeCss,
    },
  }
}

const generatePageContent = (pageName: string, options: PageOptions): string => {
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1)
  const { theme = "dark" } = options

  return `import type { Metadata } from "next"
import { Wrapper } from "@/shared/ui/layout/wrapper"

export const metadata: Metadata = {
  title: "${title}",
  description: "${title} page description",
}

export default function ${title}Page() {
  return (
    <Wrapper theme="${theme}">
      <section className="px-safe py-24">
        <div className="max-w-3xl">
          <h1 className="font-semibold text-4xl">${title}</h1>
          <p className="mt-4 text-secondary/70">Replace this with your route content.</p>
        </div>
      </section>
    </Wrapper>
  )
}
`
}

export const createPage = async (
  pageName: string,
  options: PageOptions
): Promise<void> => {
  const s = p.spinner()

  try {
    const pageDir = `src/app/${pageName}`
    const componentsDir = `${pageDir}/_components`

    s.start(`Creating route structure for "${pageName}"`)

    await createDir(pageDir)
    await createDir(componentsDir)
    await Bun.write(`${componentsDir}/.gitkeep`, "")

    await Bun.write(`${pageDir}/page.tsx`, generatePageContent(pageName, options))

    if (options.css) {
      await Bun.write(
        `${pageDir}/${pageName}.module.css`,
        `/* ${pageName}.module.css */\n\n.container {\n  /* Add your styles here */\n}\n`
      )
    }

    s.stop(`Route "${pageName}" generated successfully`)

    p.log.success("Generated files:")
    p.log.message(`  📄 ${pageDir}/page.tsx`)
    p.log.message(`  📁 ${componentsDir}/`)
    if (options.css) {
      p.log.message(`  🎨 ${pageDir}/${pageName}.module.css`)
    }

    p.note(
      `Next steps:\n  1. Customize ${pageDir}/page.tsx\n  2. Add local route components to ${componentsDir}/\n  3. Visit /${pageName} in the browser`
    )
  } catch (error) {
    s.stop(`Failed to generate route "${pageName}"`)
    throw error
  }
}
