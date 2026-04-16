import type { Command } from "commander"
import type { Session } from "../core/session.js"
import { createProject, addLayer } from "../core/project-engine.js"
import { output, success, error } from "../utils/output.js"

interface Preset {
  name: string
  description: string
  layers: { type: string; params: Record<string, unknown> }[]
  timeline?: { duration: number; loop: boolean }
}

const PRESETS: Record<string, Preset> = {
  "crt-text": {
    name: "CRT Text",
    description: "Retro CRT monitor text with dithering, pattern, and gradient",
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
    name: "Neon Glow",
    description: "Glowing neon text with ink bleed and gradient",
    layers: [
      { type: "ink", params: { blurPasses: 15, crispBlend: 0.9, bloomEnabled: true, bloomIntensity: 7 } },
      { type: "text", params: { text: "shader-lab", fontSize: 160, fontWeight: 900, textColor: "#ffffff", backgroundColor: "#000000" } },
      { type: "gradient", params: { preset: "neon-glow", animate: true, motionAmount: 0.5, motionSpeed: 1.5 } },
    ],
    timeline: { duration: 6, loop: true },
  },
  "ascii-art": {
    name: "ASCII Art",
    description: "ASCII art style with gradient background",
    layers: [
      { type: "ascii", params: { cellSize: 10, charset: "dense", colorMode: "source", bloomEnabled: true, bloomIntensity: 2 } },
      { type: "text", params: { text: "shader-lab", fontSize: 180, fontWeight: 800 } },
      { type: "gradient", params: { preset: "aurora", animate: true, motionAmount: 0.3 } },
    ],
    timeline: { duration: 8, loop: true },
  },
  "halftone-print": {
    name: "Halftone Print",
    description: "CMYK halftone printing effect",
    layers: [
      { type: "halftone", params: { colorMode: "cmyk", shape: "circle", spacing: 5, dotSize: 1 } },
      { type: "text", params: { text: "shader-lab", fontSize: 200, fontWeight: 900 } },
      { type: "gradient", params: { preset: "sunset", animate: true, motionAmount: 0.4 } },
    ],
    timeline: { duration: 6, loop: true },
  },
  "pixel-sort": {
    name: "Pixel Sort",
    description: "Pixel sorting glitch effect",
    layers: [
      { type: "pixel-sorting", params: { threshold: 0.3, direction: "horizontal", mode: "luma", range: 0.5 } },
      { type: "text", params: { text: "shader-lab", fontSize: 180, fontWeight: 800 } },
      { type: "gradient", params: { preset: "deep-ocean", animate: true, motionAmount: 0.6 } },
    ],
    timeline: { duration: 8, loop: true },
  },
  "circuit-bent": {
    name: "Circuit Bent",
    description: "Scanline circuit-bent CRT look",
    layers: [
      { type: "circuit-bent", params: { linePitch: 6, lineThickness: 0.5, scrollSpeed: 3 } },
      { type: "text", params: { text: "shader-lab", fontSize: 190, fontWeight: 800 } },
      { type: "gradient", params: { preset: "neon-glow", animate: true, motionAmount: 0.4 } },
    ],
    timeline: { duration: 8, loop: true },
  },
}

export function registerPresetCommands(program: Command, session: Session): void {
  const preset = program.command("preset").description("Built-in effect presets")

  preset.command("list")
    .description("List available presets")
    .action(() => {
      const data = Object.entries(PRESETS).map(([key, p]) => ({
        key, name: p.name, description: p.description, layers: p.layers.length,
      }))
      output({ presets: data })
    })

  preset.command("apply")
    .description("Apply a preset to create a new project")
    .argument("<name>", "Preset name")
    .option("-t, --text <text>", "Override text content")
    .option("-o, --output <path>", "Save path")
    .option("-w, --width <n>", "Width", "1920")
    .option("-h, --height <n>", "Height", "1080")
    .action((name, opts) => {
      try {
        const p = PRESETS[name]
        if (!p) { error(`Unknown preset: "${name}". Use 'preset list' to see options.`); return }

        const project = createProject({ width: parseInt(opts.width), height: parseInt(opts.height) })
        if (p.timeline) {
          project.timeline.duration = p.timeline.duration
          project.timeline.loop = p.timeline.loop
        }

        for (const layerDef of p.layers) {
          const params = { ...layerDef.params }
          if (opts.text && layerDef.type === "text") {
            params.text = opts.text
          }
          addLayer(project, layerDef.type, params)
        }

        session.setProject(project, opts.output ?? null)
        if (opts.output) session.save(opts.output)

        success(`Applied preset: ${p.name} (${project.layers.length} layers)`)
        if (opts.text) success(`Text: "${opts.text}"`)
      } catch (e: any) {
        error(e.message)
      }
    })
}
