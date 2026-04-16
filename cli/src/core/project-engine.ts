import * as fs from "node:fs"
import * as crypto from "node:crypto"
import { getLayerDef, getDefaultParams } from "./layer-registry.js"

export interface SceneConfig {
  backgroundColor: string
  compositionAspect: string
  compositionWidth: number
  compositionHeight: number
  brightness: number
  contrast: number
  invert: boolean
  channelMixer: { rr: number; rg: number; rb: number; gr: number; gg: number; gb: number; br: number; bg: number; bb: number }
  clampMin: number
  clampMax: number
  quantizeLevels: number
  colorMap: null | { stops: { position: number; color: string }[] }
}

export interface MaskConfig {
  invert: boolean
  mode: "multiply" | "stencil"
  source: "luminance" | "alpha" | "red" | "green" | "blue"
}

export interface EditorLayer {
  assetId: string | null
  blendMode: string
  compositeMode: string
  expanded: boolean
  hue: number
  id: string
  kind: "source" | "effect"
  locked: boolean
  maskConfig: MaskConfig
  name: string
  opacity: number
  params: Record<string, unknown>
  runtimeError: string | null
  saturation: number
  type: string
  visible: boolean
}

export interface TimelineKeyframe {
  id: string
  time: number
  value: unknown
}

export interface TimelineTrack {
  binding: {
    kind: string
    label: string
    property?: string
    key?: string
    valueType: string
  }
  enabled: boolean
  id: string
  interpolation: "linear" | "smooth" | "step"
  keyframes: TimelineKeyframe[]
  layerId: string
}

export interface LabProject {
  assets: { id: string; kind: string; fileName: string }[]
  composition: { width: number; height: number }
  exportedAt: string
  format: "shader-lab"
  layers: EditorLayer[]
  sceneConfig?: SceneConfig
  selectedLayerId: string | null
  timeline: { duration: number; loop: boolean; tracks: TimelineTrack[] }
  version: number
}

const DEFAULT_SCENE_CONFIG: SceneConfig = {
  backgroundColor: "#080808",
  compositionAspect: "screen",
  compositionWidth: 1920,
  compositionHeight: 1080,
  brightness: 0,
  contrast: 0,
  invert: false,
  channelMixer: { rr: 1, rg: 0, rb: 0, gr: 0, gg: 1, gb: 0, br: 0, bg: 0, bb: 1 },
  clampMin: 0,
  clampMax: 1,
  quantizeLevels: 256,
  colorMap: null,
}

const DEFAULT_MASK_CONFIG: MaskConfig = {
  invert: false,
  mode: "multiply",
  source: "luminance",
}

function uid(): string {
  return crypto.randomUUID()
}

export function createProject(opts: { name?: string; width?: number; height?: number } = {}): LabProject {
  const w = opts.width ?? 1920
  const h = opts.height ?? 1080
  return {
    assets: [],
    composition: { width: w, height: h },
    exportedAt: new Date().toISOString(),
    format: "shader-lab",
    layers: [],
    sceneConfig: { ...DEFAULT_SCENE_CONFIG, compositionWidth: w, compositionHeight: h },
    selectedLayerId: null,
    timeline: { duration: 8, loop: true, tracks: [] },
    version: 2,
  }
}

export function openProject(path: string): LabProject {
  const raw = fs.readFileSync(path, "utf-8")
  const data = JSON.parse(raw) as LabProject
  if (data.format !== "shader-lab") throw new Error("Not a Shader Lab project file.")
  if (data.version !== 1 && data.version !== 2) throw new Error(`Unsupported project version: ${data.version}`)
  return data
}

export function saveProject(project: LabProject, path: string): void {
  project.exportedAt = new Date().toISOString()
  fs.writeFileSync(path, JSON.stringify(project, null, 2), "utf-8")
}

export function addLayer(
  project: LabProject,
  type: string,
  overrides: Record<string, unknown> = {},
  options: { name?: string; insertAt?: number } = {}
): EditorLayer {
  const def = getLayerDef(type)
  if (!def) throw new Error(`Unknown layer type: "${type}". Use 'layer types' to see available types.`)

  const defaultParams = getDefaultParams(type)
  const params = { ...defaultParams }
  for (const [k, v] of Object.entries(overrides)) {
    params[k] = v
  }

  const layer: EditorLayer = {
    assetId: null,
    blendMode: "normal",
    compositeMode: def.kind === "source" ? "filter" : "filter",
    expanded: true,
    hue: 0,
    id: uid(),
    kind: def.kind,
    locked: false,
    maskConfig: { ...DEFAULT_MASK_CONFIG },
    name: options.name ?? def.defaultName,
    opacity: 1,
    params,
    runtimeError: null,
    saturation: 1,
    type,
    visible: true,
  }

  if (options.insertAt !== undefined && options.insertAt >= 0 && options.insertAt <= project.layers.length) {
    project.layers.splice(options.insertAt, 0, layer)
  } else {
    project.layers.push(layer)
  }

  project.selectedLayerId = layer.id
  return layer
}

export function removeLayer(project: LabProject, index: number): EditorLayer {
  if (index < 0 || index >= project.layers.length) {
    throw new Error(`Layer index ${index} out of range (0-${project.layers.length - 1}).`)
  }
  const [removed] = project.layers.splice(index, 1)
  project.timeline.tracks = project.timeline.tracks.filter(t => t.layerId !== removed.id)
  if (project.selectedLayerId === removed.id) {
    project.selectedLayerId = project.layers[0]?.id ?? null
  }
  return removed
}

export function reorderLayer(project: LabProject, from: number, to: number): void {
  if (from < 0 || from >= project.layers.length) throw new Error(`From index ${from} out of range.`)
  if (to < 0 || to >= project.layers.length) throw new Error(`To index ${to} out of range.`)
  const [layer] = project.layers.splice(from, 1)
  project.layers.splice(to, 0, layer)
}

export function setLayerParam(project: LabProject, index: number, key: string, value: unknown): void {
  const layer = project.layers[index]
  if (!layer) throw new Error(`Layer index ${index} out of range.`)

  const topLevelKeys = ["blendMode", "compositeMode", "opacity", "hue", "saturation", "visible", "name"]
  if (topLevelKeys.includes(key)) {
    ;(layer as any)[key] = value
  } else {
    layer.params[key] = value
  }
}

export function setSceneConfig(project: LabProject, key: string, value: unknown): void {
  if (!project.sceneConfig) project.sceneConfig = { ...DEFAULT_SCENE_CONFIG }
  if (key in project.sceneConfig) {
    ;(project.sceneConfig as any)[key] = value
  } else {
    throw new Error(`Unknown scene config key: "${key}".`)
  }
}

export function getProjectInfo(project: LabProject): Record<string, unknown> {
  return {
    format: project.format,
    version: project.version,
    composition: project.composition,
    layerCount: project.layers.length,
    layers: project.layers.map((l, i) => ({ index: i, name: l.name, type: l.type, kind: l.kind, visible: l.visible })),
    timeline: { duration: project.timeline.duration, loop: project.timeline.loop, trackCount: project.timeline.tracks.length },
  }
}
