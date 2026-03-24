import type { ShaderLabConfig } from "@shader-lab/react"
import {
  generateShaderExportSnippet,
  sanitizeShaderExportComponentName,
} from "@/lib/editor/shader-export-snippet"

export interface ShaderExportArtifactFile {
  content: string
  fileName: string
  mimeType: string
}

export interface ShaderExportArtifact {
  assetPlaceholders: {
    fileName: string
    kind: "image" | "video"
    src: string
  }[]
  componentFileName: string
  componentName: string
  configFileName: string
  files: ShaderExportArtifactFile[]
  readmeFileName: string
}

const CONFIG_FILE_NAME = "shader-lab.config.json"
const README_FILE_NAME = "README.md"

export function buildShaderExportArtifact(
  config: ShaderLabConfig,
  componentName: string,
): ShaderExportArtifact {
  const safeComponentName = sanitizeShaderExportComponentName(componentName)
  const componentFileName = `${safeComponentName}.tsx`
  const configFileName = CONFIG_FILE_NAME
  const readmeFileName = README_FILE_NAME
  const assetPlaceholders = collectAssetPlaceholders(config)
  const componentSource = generateShaderExportSnippet(config, safeComponentName)
  const serializedConfig = `${JSON.stringify(config, null, 2)}\n`
  const readme = buildShaderExportReadme({
    assetPlaceholders,
    componentFileName,
    componentName: safeComponentName,
    configFileName,
  })

  return {
    assetPlaceholders,
    componentFileName,
    componentName: safeComponentName,
    configFileName,
    files: [
      {
        content: componentSource,
        fileName: componentFileName,
        mimeType: "text/plain;charset=utf-8",
      },
      {
        content: serializedConfig,
        fileName: configFileName,
        mimeType: "application/json;charset=utf-8",
      },
      {
        content: readme,
        fileName: readmeFileName,
        mimeType: "text/markdown;charset=utf-8",
      },
    ],
    readmeFileName,
  }
}

function collectAssetPlaceholders(config: ShaderLabConfig) {
  return config.layers.flatMap((layer) => {
    if (!layer.asset) {
      return []
    }

    return [
      {
        fileName: layer.asset.fileName ?? "asset",
        kind: layer.asset.kind,
        src: layer.asset.src,
      },
    ]
  })
}

function buildShaderExportReadme({
  assetPlaceholders,
  componentFileName,
  componentName,
  configFileName,
}: {
  assetPlaceholders: {
    fileName: string
    kind: "image" | "video"
    src: string
  }[]
  componentFileName: string
  componentName: string
  configFileName: string
}): string {
  const placeholderSection =
    assetPlaceholders.length === 0
      ? "- No image or video assets are required by this export."
      : assetPlaceholders
          .map(
            (asset) =>
              `- ${asset.kind}: replace \`${asset.src}\` with your real \`${asset.fileName}\` asset path`,
          )
          .join("\n")

  return [
    "# Shader Lab Export",
    "",
    "This export contains the minimum files needed to move the current composition into another React app.",
    "",
    "## Files",
    "",
    `- \`${componentFileName}\`: React component wrapper for the exported composition`,
    `- \`${configFileName}\`: Serialized Shader Lab config`,
    "",
    "## Usage",
    "",
    "1. Install the runtime with `bun add @shader-lab/react`.",
    `2. Add \`${componentFileName}\` to your app and render \`${componentName}\`.`,
    `3. If you prefer loading config separately, import \`${configFileName}\` and pass it to \`<ShaderLabComposition />\`.`,
    "",
    "## Asset Placeholders",
    "",
    placeholderSection,
    "",
  ].join("\n")
}
