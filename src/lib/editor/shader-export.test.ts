import { describe, expect, it } from "bun:test"
import {
  buildShaderExportConfig,
  validateShaderExportSupport,
} from "@/lib/editor/shader-export"
import { buildShaderExportArtifact } from "@/lib/editor/shader-export-artifact"
import {
  generateShaderExportSnippet,
  sanitizeShaderExportComponentName,
} from "@/lib/editor/shader-export-snippet"
import type { EditorAsset, EditorLayer } from "@/types/editor"

const baseAsset: EditorAsset = {
  createdAt: "2026-03-24T00:00:00.000Z",
  duration: null,
  error: null,
  fileName: "hero image.png",
  id: "asset-image-1",
  kind: "image",
  mimeType: "image/png",
  sizeBytes: 1024,
  status: "ready",
  url: "https://example.com/hero-image.png",
  width: 1920,
  height: 1080,
}

const imageLayer: EditorLayer = {
  assetId: baseAsset.id,
  blendMode: "normal",
  compositeMode: "filter",
  expanded: true,
  hue: 0,
  id: "layer-image-1",
  kind: "source",
  locked: false,
  name: "Hero Image",
  opacity: 1,
  params: {
    exposure: 1.25,
  },
  runtimeError: null,
  saturation: 1,
  type: "image",
  visible: true,
}

const customShaderLayer: EditorLayer = {
  assetId: null,
  blendMode: "screen",
  compositeMode: "filter",
  expanded: true,
  hue: 0.15,
  id: "layer-shader-1",
  kind: "source",
  locked: false,
  name: "Custom Glow",
  opacity: 0.9,
  params: {
    entryExport: "mainSketch",
    gain: 0.75,
    sourceCode: "export const mainSketch = () => vec3(1.0)",
    sourceFileName: "custom glow.ts",
    sourceMode: "paste",
    sourceRevision: 3,
  },
  runtimeError: null,
  saturation: 0.85,
  type: "custom-shader",
  visible: true,
}

describe("shader export", () => {
  it("builds a runtime config with asset placeholders and inline custom shader source", () => {
    const config = buildShaderExportConfig({
      assets: [baseAsset],
      composition: {
        height: 1080,
        width: 1920,
      },
      layers: [imageLayer, customShaderLayer],
      timeline: {
        duration: 6,
        loop: true,
        tracks: [
          {
            binding: {
              kind: "layer",
              label: "Opacity",
              property: "opacity",
              valueType: "number",
            },
            enabled: true,
            id: "track-1",
            interpolation: "linear",
            keyframes: [
              {
                id: "kf-1",
                time: 0,
                value: 0.25,
              },
              {
                id: "kf-2",
                time: 2,
                value: 1,
              },
            ],
            layerId: imageLayer.id,
          },
        ],
      },
    })

    expect(config.composition).toEqual({
      height: 1080,
      width: 1920,
    })
    expect(config.layers[0]).toMatchObject({
      asset: {
        fileName: "hero image.png",
        kind: "image",
        src: "/replace/image/hero-image.png",
      },
      id: imageLayer.id,
      params: {
        exposure: 1.25,
      },
      type: "image",
    })
    expect(config.layers[1]).toMatchObject({
      id: customShaderLayer.id,
      params: {
        gain: 0.75,
      },
      sketch: {
        code: "export const mainSketch = () => vec3(1.0)",
        entryExport: "mainSketch",
        fileName: "custom glow.ts",
        mode: "inline",
      },
      type: "custom-shader",
    })
    expect(config.timeline.tracks).toHaveLength(1)
  })

  it("reports unsupported and invalid layers before building config", () => {
    const issues = validateShaderExportSupport(
      [
        {
          ...imageLayer,
          assetId: null,
        },
        {
          ...customShaderLayer,
          params: {
            ...customShaderLayer.params,
            sourceCode: "   ",
          },
        },
        {
          ...imageLayer,
          id: "layer-blur-1",
          kind: "effect",
          name: "Blur Layer",
          params: {},
          type: "blur",
        },
      ],
      [],
    )

    expect(issues.map((issue) => issue.message)).toEqual([
      'Layer "Hero Image" requires a linked image asset before export.',
      'Layer "Custom Glow" requires custom shader source before export.',
      'Layer "Blur Layer" uses "blur", which is not supported by shader export yet.',
    ])
  })

  it("generates a sanitized component snippet for the exported config", () => {
    const config = buildShaderExportConfig({
      assets: [baseAsset],
      composition: {
        height: 1080,
        width: 1920,
      },
      layers: [imageLayer],
      timeline: {
        duration: 6,
        loop: false,
        tracks: [],
      },
    })

    const snippet = generateShaderExportSnippet(config, "2026 hero shader!")

    expect(snippet).toContain(
      'import { ShaderLabComposition, type ShaderLabConfig } from "@shader-lab/react"',
    )
    expect(snippet).toContain("export function ExportedShader() {")
    expect(snippet).toContain('"src": "/replace/image/hero-image.png"')
  })

  it("builds a downloadable artifact with component, config, and readme files", () => {
    const config = buildShaderExportConfig({
      assets: [baseAsset],
      composition: {
        height: 1080,
        width: 1920,
      },
      layers: [imageLayer],
      timeline: {
        duration: 6,
        loop: false,
        tracks: [],
      },
    })

    const artifact = buildShaderExportArtifact(config, "hero export")

    expect(artifact.componentName).toBe("HeroExport")
    expect(artifact.componentFileName).toBe("HeroExport.tsx")
    expect(artifact.configFileName).toBe("shader-lab.config.json")
    expect(artifact.readmeFileName).toBe("README.md")
    expect(artifact.assetPlaceholders).toEqual([
      {
        fileName: "hero image.png",
        kind: "image",
        src: "/replace/image/hero-image.png",
      },
    ])
    expect(artifact.files.map((file) => file.fileName)).toEqual([
      "HeroExport.tsx",
      "shader-lab.config.json",
      "README.md",
    ])
  })

  it("sanitizes invalid component names consistently", () => {
    expect(sanitizeShaderExportComponentName("2026 hero shader!")).toBe(
      "ExportedShader",
    )
    expect(sanitizeShaderExportComponentName("hero shader")).toBe("HeroShader")
  })
})
