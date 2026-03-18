#!/usr/bin/env bun

import * as p from "@clack/prompts"
import { createDir } from "./utils"

const COMPONENT_TARGETS = {
  "shared-ui": {
    baseDir: "src/shared/ui",
    importPath: "@/shared/ui",
    label: "Shared UI",
  },
  "editor-components": {
    baseDir: "src/features/editor/components",
    importPath: "@/features/editor/components",
    label: "Editor Components",
  },
  timeline: {
    baseDir: "src/features/editor/timeline",
    importPath: "@/features/editor/timeline",
    label: "Timeline Components",
  },
} as const

type ComponentTarget = keyof typeof COMPONENT_TARGETS

interface ComponentOptions {
  client?: boolean
  target: ComponentTarget
}

export interface ComponentConfig {
  name: string
  options: ComponentOptions
}

export const promptComponentConfig = async (): Promise<ComponentConfig> => {
  const target = await p.select({
    message: "Where should this component live?",
    options: [
      {
        value: "shared-ui",
        label: "Shared UI",
        hint: "Reusable primitives available across the app",
      },
      {
        value: "editor-components",
        label: "Editor Components",
        hint: "Feature-specific editor components",
      },
      {
        value: "timeline",
        label: "Timeline Components",
        hint: "Timeline and sequencing UI",
      },
    ],
  })

  if (p.isCancel(target)) {
    p.cancel("Component generation cancelled")
    process.exit(0)
  }

  const name = await p.text({
    message: "What should the component be called?",
    placeholder: "shader-panel, timeline-track, toolbar-button",
    validate: (value) => {
      if (!value) return "Component name is required"
      if (!/^[a-z][a-z0-9-]*$/.test(value)) {
        return "Component name must be kebab-case (lowercase with hyphens)"
      }
      return undefined
    },
  })

  if (p.isCancel(name)) {
    p.cancel("Component generation cancelled")
    process.exit(0)
  }

  const client = await p.confirm({
    message: "Should this be a client component ('use client')?",
    initialValue: false,
  })

  if (p.isCancel(client)) {
    p.cancel("Component generation cancelled")
    process.exit(0)
  }

  return {
    name,
    options: {
      client,
      target,
    },
  }
}

const toPascalCase = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

const toCamelCase = (value: string) => {
  const pascal = toPascalCase(value)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

const getComponentTemplate = (componentName: string, client: boolean) => {
  const pascalName = toPascalCase(componentName)
  const camelName = toCamelCase(componentName)
  const directive = client ? '"use client"\n\n' : ""

  return `${directive}import { cva, type VariantProps } from "class-variance-authority"
import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import s from "./${componentName}.module.css"

const ${camelName}Variants = cva("bg-secondary text-primary", {
  variants: {
    variant: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface ${pascalName}Props
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ${camelName}Variants> {
  children?: ReactNode
}

export function ${pascalName}({
  children,
  className,
  variant,
  ...props
}: ${pascalName}Props) {
  return (
    <div className={cn(s.${camelName}, ${camelName}Variants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}
`
}

const getCssTemplate = (componentName: string) => {
  const camelName = toCamelCase(componentName)

  return `.${camelName} {
  display: block;
}
`
}

const updateBarrelExport = async (
  target: ComponentTarget,
  componentName: string
): Promise<void> => {
  const { baseDir } = COMPONENT_TARGETS[target]
  const barrelPath = `${baseDir}/index.ts`
  const exportLine = `export { ${toPascalCase(componentName)} } from "./${componentName}"`

  const barrelFile = Bun.file(barrelPath)
  if (!(await barrelFile.exists())) {
    await Bun.write(barrelPath, `${exportLine}\n`)
    return
  }

  const contents = await barrelFile.text()
  if (contents.includes(exportLine)) {
    return
  }

  await Bun.write(barrelPath, `${contents.trimEnd()}\n${exportLine}\n`)
}

export const createComponent = async (
  componentName: string,
  options: ComponentOptions
): Promise<void> => {
  const s = p.spinner()

  if (!/^[a-z][a-z0-9-]*$/.test(componentName)) {
    throw new Error("Component name must be kebab-case (lowercase with hyphens)")
  }

  const target = COMPONENT_TARGETS[options.target]
  const componentDir = `${target.baseDir}/${componentName}`

  try {
    s.start(`Generating ${target.label} component "${componentName}"`)

    await createDir(componentDir)
    await Bun.write(
      `${componentDir}/index.tsx`,
      getComponentTemplate(componentName, options.client ?? false)
    )
    await Bun.write(
      `${componentDir}/${componentName}.module.css`,
      getCssTemplate(componentName)
    )

    await updateBarrelExport(options.target, componentName)

    s.stop(`Component "${componentName}" generated successfully`)

    p.log.success("Created files:")
    p.log.message(`  📄 ${componentDir}/index.tsx`)
    p.log.message(`  🎨 ${componentDir}/${componentName}.module.css`)
    p.note(
      `Next steps:\n  1. Customize ${componentDir}/index.tsx\n  2. Style ${componentDir}/${componentName}.module.css\n  3. Import with \`${target.importPath}/${componentName}\``
    )
  } catch (error) {
    s.stop(`Failed to create component "${componentName}"`)
    throw error instanceof Error ? error : new Error(String(error))
  }
}
