"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useAssetStore, useTimelineStore } from "@/store"
import {
  applyLabProjectFile,
  parseLabProjectFile,
  type LabProjectFile,
} from "@/lib/editor/project-file"
import { DEFAULT_SCENE_CONFIG } from "@/types/editor"

interface PresetLayer {
  type: string
  params: Record<string, unknown>
}

interface PresetDef {
  layers: PresetLayer[]
  timeline?: { duration: number; loop: boolean }
}

const PRESETS: Record<string, PresetDef> = {
  "crt-text": {
    layers: [
      { type: "crt", params: { crtMode: "slot-mask", cellSize: 6, bloomEnabled: true, bloomIntensity: 1.93 } },
      { type: "dithering", params: { algorithm: "bayer-4x4", colorMode: "source", pixelSize: 2 } },
      { type: "text", params: { text: "shader-lab", fontSize: 201, fontWeight: 800, letterSpacing: -0.1, textColor: "#ffffff", backgroundColor: "#000000" } },
      { type: "pattern", params: { preset: "bars", cellSize: 8, bloomEnabled: true, bloomIntensity: 8 } },
      { type: "gradient", params: { preset: "neon-glow", animate: true, motionAmount: 0.81, motionSpeed: 2, tonemapMode: "totos" } },
    ],
    timeline: { duration: 8, loop: true },
  },
  "neon-glow": {
    layers: [
      { type: "ink", params: { blurPasses: 15, crispBlend: 0.9, bloomEnabled: true, bloomIntensity: 7 } },
      { type: "text", params: { text: "shader-lab", fontSize: 160, fontWeight: 900, textColor: "#ffffff", backgroundColor: "#000000" } },
      { type: "gradient", params: { preset: "neon-glow", animate: true, motionAmount: 0.5, motionSpeed: 1.5 } },
    ],
    timeline: { duration: 6, loop: true },
  },
  "ascii-art": {
    layers: [
      { type: "ascii", params: { cellSize: 10, charset: "dense", colorMode: "source", bloomEnabled: true, bloomIntensity: 2 } },
      { type: "text", params: { text: "shader-lab", fontSize: 180, fontWeight: 800 } },
      { type: "gradient", params: { preset: "aurora", animate: true, motionAmount: 0.3 } },
    ],
    timeline: { duration: 8, loop: true },
  },
  "halftone-print": {
    layers: [
      { type: "halftone", params: { colorMode: "cmyk", shape: "circle", spacing: 5, dotSize: 1 } },
      { type: "text", params: { text: "shader-lab", fontSize: 200, fontWeight: 900 } },
      { type: "gradient", params: { preset: "sunset", animate: true, motionAmount: 0.4 } },
    ],
    timeline: { duration: 6, loop: true },
  },
  "pixel-sort": {
    layers: [
      { type: "pixel-sorting", params: { threshold: 0.3, direction: "horizontal", mode: "luma", range: 0.5 } },
      { type: "text", params: { text: "shader-lab", fontSize: 180, fontWeight: 800 } },
      { type: "gradient", params: { preset: "deep-ocean", animate: true, motionAmount: 0.6 } },
    ],
    timeline: { duration: 8, loop: true },
  },
  "circuit-bent": {
    layers: [
      { type: "circuit-bent", params: { linePitch: 6, lineThickness: 0.5, scrollSpeed: 3 } },
      { type: "text", params: { text: "shader-lab", fontSize: 190, fontWeight: 800 } },
      { type: "gradient", params: { preset: "neon-glow", animate: true, motionAmount: 0.4 } },
    ],
    timeline: { duration: 8, loop: true },
  },
}

const LAYER_KINDS: Record<string, "source" | "effect"> = {
  text: "source", gradient: "source", image: "source", video: "source",
  "custom-shader": "source", live: "source",
}

function buildLayerFromDef(def: PresetLayer, textOverride?: string): LabProjectFile["layers"][number] {
  const params = { ...def.params }
  if (textOverride && def.type === "text") params.text = textOverride
  const kind = LAYER_KINDS[def.type] ?? "effect"
  const isTextMask = def.type === "text" && kind === "source"

  return {
    assetId: null,
    blendMode: "normal",
    compositeMode: isTextMask ? "mask" : "filter",
    expanded: false,
    hue: 0,
    id: crypto.randomUUID(),
    kind,
    locked: false,
    maskConfig: isTextMask
      ? { invert: false, mode: "stencil", source: "luminance" }
      : { invert: false, mode: "multiply", source: "luminance" },
    name: def.type.charAt(0).toUpperCase() + def.type.slice(1).replace(/-./g, m => " " + m[1]!.toUpperCase()),
    opacity: 1,
    params,
    runtimeError: null,
    saturation: 1,
    type: def.type,
    visible: true,
  } as LabProjectFile["layers"][number]
}

function buildProjectFromPreset(
  presetName: string,
  overrides: {
    text?: string
    fontSize?: number
    textColor?: string
    duration?: number
    width?: number
    height?: number
  }
): LabProjectFile {
  const preset = PRESETS[presetName]
  if (!preset) throw new Error(`Unknown preset: ${presetName}`)

  const layers = preset.layers.map(def => {
    const layer = buildLayerFromDef(def, overrides.text)
    if (def.type === "text") {
      if (overrides.fontSize) layer.params.fontSize = overrides.fontSize
      if (overrides.textColor) layer.params.textColor = overrides.textColor
    }
    return layer
  })

  const width = overrides.width ?? 1920
  const height = overrides.height ?? 1080

  return {
    assets: [],
    composition: { width, height },
    exportedAt: new Date().toISOString(),
    format: "shader-lab",
    layers,
    sceneConfig: {
      ...DEFAULT_SCENE_CONFIG,
      compositionWidth: width,
      compositionHeight: height,
    },
    selectedLayerId: null,
    timeline: {
      duration: overrides.duration ?? preset.timeline?.duration ?? 8,
      loop: preset.timeline?.loop ?? true,
      tracks: [],
    },
    version: 2,
  }
}

function buildProjectFromLayers(
  layersJson: string,
  overrides: {
    text?: string
    fontSize?: number
    textColor?: string
    duration?: number
    width?: number
    height?: number
  }
): LabProjectFile {
  const layerDefs = JSON.parse(layersJson) as PresetLayer[]
  const layers = layerDefs.map(def => {
    const layer = buildLayerFromDef(def, overrides.text)
    if (def.type === "text") {
      if (overrides.fontSize) layer.params.fontSize = overrides.fontSize
      if (overrides.textColor) layer.params.textColor = overrides.textColor
    }
    return layer
  })

  const width = overrides.width ?? 1920
  const height = overrides.height ?? 1080

  return {
    assets: [],
    composition: { width, height },
    exportedAt: new Date().toISOString(),
    format: "shader-lab",
    layers,
    sceneConfig: {
      ...DEFAULT_SCENE_CONFIG,
      compositionWidth: width,
      compositionHeight: height,
    },
    selectedLayerId: null,
    timeline: {
      duration: overrides.duration ?? 8,
      loop: true,
      tracks: [],
    },
    version: 2,
  }
}

export function UrlParamsLoader() {
  const searchParams = useSearchParams()
  const appliedRef = useRef(false)

  useEffect(() => {
    if (appliedRef.current) return
    const preset = searchParams.get("preset")
    const project = searchParams.get("project")
    const layers = searchParams.get("layers")
    if (!preset && !project && !layers) return
    appliedRef.current = true

    const text = searchParams.get("text") ?? undefined
    const fontSize = searchParams.get("fontSize") ? Number(searchParams.get("fontSize")) : undefined
    const textColor = searchParams.get("textColor") ? `#${searchParams.get("textColor")}` : undefined
    const duration = searchParams.get("duration") ? Number(searchParams.get("duration")) : undefined
    const width = searchParams.get("width") ? Number(searchParams.get("width")) : undefined
    const height = searchParams.get("height") ? Number(searchParams.get("height")) : undefined
    const autoplay = searchParams.get("autoplay") === "true"

    // Small delay to let the editor initialize
    const timer = setTimeout(() => {
      try {
        let projectFile: LabProjectFile

        const overrides: {
          text?: string
          fontSize?: number
          textColor?: string
          duration?: number
          width?: number
          height?: number
        } = {}
        if (text !== undefined) overrides.text = text
        if (fontSize !== undefined) overrides.fontSize = fontSize
        if (textColor !== undefined) overrides.textColor = textColor
        if (duration !== undefined) overrides.duration = duration
        if (width !== undefined) overrides.width = width
        if (height !== undefined) overrides.height = height

        if (project) {
          const decoded = atob(project)
          projectFile = parseLabProjectFile(decoded)
        } else if (preset) {
          projectFile = buildProjectFromPreset(preset, overrides)
        } else if (layers) {
          const decoded = atob(layers)
          projectFile = buildProjectFromLayers(decoded, overrides)
        } else {
          return
        }

        applyLabProjectFile(projectFile, useAssetStore.getState().assets)

        if (autoplay) {
          useTimelineStore.getState().setPlaying(true)
        }
      } catch (e) {
        console.error("[shader-cli] Failed to apply URL params:", e)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [searchParams])

  return null
}
