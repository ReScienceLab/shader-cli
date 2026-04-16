import type { Command } from "commander"
import type { Session } from "../core/session.js"
import { output, success, error } from "../utils/output.js"
import * as crypto from "node:crypto"

export function registerTimelineCommands(program: Command, session: Session): void {
  const tl = program.command("timeline").description("Timeline & animation")

  tl.command("duration")
    .description("Set timeline duration")
    .argument("<seconds>", "Duration in seconds")
    .action((seconds) => {
      try {
        session.snapshot("Set duration")
        session.getProject().timeline.duration = parseFloat(seconds)
        success(`Duration: ${seconds}s`)
      } catch (e: any) {
        error(e.message)
      }
    })

  tl.command("loop")
    .description("Toggle loop mode")
    .option("--on", "Enable loop")
    .option("--off", "Disable loop")
    .action((opts) => {
      try {
        session.snapshot("Toggle loop")
        const loop = opts.on ? true : opts.off ? false : !session.getProject().timeline.loop
        session.getProject().timeline.loop = loop
        success(`Loop: ${loop ? "on" : "off"}`)
      } catch (e: any) {
        error(e.message)
      }
    })

  tl.command("info")
    .description("Show timeline info")
    .action(() => {
      try {
        const t = session.getProject().timeline
        output({
          duration: t.duration,
          loop: t.loop,
          trackCount: t.tracks.length,
          tracks: t.tracks.map(tr => ({
            id: tr.id,
            layerId: tr.layerId,
            binding: tr.binding.label,
            interpolation: tr.interpolation,
            keyframeCount: tr.keyframes.length,
          })),
        })
      } catch (e: any) {
        error(e.message)
      }
    })

  const kf = tl.command("keyframe").description("Keyframe operations")

  kf.command("add")
    .description("Add a keyframe")
    .argument("<layer-index>", "Layer index")
    .argument("<time>", "Time in seconds")
    .argument("<property>", "Property to animate (param key or opacity/hue/saturation)")
    .argument("<value>", "Value at this keyframe")
    .option("-i, --interpolation <mode>", "Interpolation: linear|smooth|step", "smooth")
    .action((layerIndex, time, property, value, opts) => {
      try {
        const project = session.getProject()
        const idx = parseInt(layerIndex)
        const layer = project.layers[idx]
        if (!layer) { error(`Layer ${idx} not found.`); return }

        session.snapshot(`Add keyframe at ${time}s`)

        let parsedValue: unknown = value
        if (value === "true") parsedValue = true
        else if (value === "false") parsedValue = false
        else if (/^-?\d+(\.\d+)?$/.test(value)) parsedValue = parseFloat(value)

        const topLevel = ["opacity", "hue", "saturation", "visible"]
        const bindingKind = topLevel.includes(property) ? "layer" : "param"

        let track = project.timeline.tracks.find(
          t => t.layerId === layer.id &&
          ((bindingKind === "layer" && t.binding.property === property) ||
           (bindingKind === "param" && t.binding.key === property))
        )

        if (!track) {
          track = {
            binding: bindingKind === "layer"
              ? { kind: "layer", label: property, property, valueType: typeof parsedValue === "boolean" ? "boolean" : "number" }
              : { kind: "param", label: property, key: property, valueType: typeof parsedValue === "boolean" ? "boolean" : "number" },
            enabled: true,
            id: crypto.randomUUID(),
            interpolation: opts.interpolation as "linear" | "smooth" | "step",
            keyframes: [],
            layerId: layer.id,
          }
          project.timeline.tracks.push(track)
        }

        track.keyframes.push({
          id: crypto.randomUUID(),
          time: parseFloat(time),
          value: parsedValue,
        })
        track.keyframes.sort((a, b) => a.time - b.time)

        success(`Keyframe: layer[${idx}].${property} = ${value} at ${time}s`)
      } catch (e: any) {
        error(e.message)
      }
    })
}
