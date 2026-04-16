import type { Command } from "commander"
import type { Session } from "../core/session.js"
import { addLayer, removeLayer, reorderLayer, setLayerParam } from "../core/project-engine.js"
import { getAllLayerTypes, getSourceLayerTypes, getEffectLayerTypes, getLayerDef, LAYER_DEFS } from "../core/layer-registry.js"
import { output, success, error } from "../utils/output.js"

function parseParamValue(raw: string): unknown {
  if (raw === "true") return true
  if (raw === "false") return false
  if (/^-?\d+(\.\d+)?$/.test(raw)) return parseFloat(raw)
  if (raw.startsWith("[") || raw.startsWith("{")) {
    try { return JSON.parse(raw) } catch { /* fall through */ }
  }
  return raw
}

function parseParamPairs(pairs: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const pair of pairs) {
    const eq = pair.indexOf("=")
    if (eq === -1) throw new Error(`Invalid param format: "${pair}". Use key=value.`)
    const key = pair.slice(0, eq)
    const val = pair.slice(eq + 1)
    result[key] = parseParamValue(val)
  }
  return result
}

export function registerLayerCommands(program: Command, session: Session): void {
  const layer = program.command("layer").description("Layer operations")

  layer.command("add")
    .description("Add a layer")
    .argument("<type>", "Layer type (use 'layer types' to list)")
    .option("-n, --name <name>", "Layer name")
    .option("-p, --param <kv...>", "Parameters as key=value pairs")
    .option("--at <index>", "Insert position")
    .action((type, opts) => {
      try {
        const project = session.getProject()
        session.snapshot(`Add layer: ${type}`)
        const overrides = opts.param ? parseParamPairs(opts.param) : {}
        const l = addLayer(project, type, overrides, {
          name: opts.name,
          insertAt: opts.at !== undefined ? parseInt(opts.at) : undefined,
        })
        success(`Added ${l.kind} layer: ${l.name} [${project.layers.indexOf(l)}] (${type})`)
      } catch (e: any) {
        error(e.message)
      }
    })

  layer.command("remove")
    .description("Remove a layer by index")
    .argument("<index>", "Layer index")
    .action((index) => {
      try {
        session.snapshot(`Remove layer ${index}`)
        const removed = removeLayer(session.getProject(), parseInt(index))
        success(`Removed: ${removed.name} (${removed.type})`)
      } catch (e: any) {
        error(e.message)
      }
    })

  layer.command("reorder")
    .description("Move a layer from one position to another")
    .argument("<from>", "From index")
    .argument("<to>", "To index")
    .action((from, to) => {
      try {
        session.snapshot(`Reorder ${from} -> ${to}`)
        reorderLayer(session.getProject(), parseInt(from), parseInt(to))
        success(`Moved layer ${from} to ${to}`)
      } catch (e: any) {
        error(e.message)
      }
    })

  layer.command("set")
    .description("Set layer parameter(s)")
    .argument("<index>", "Layer index")
    .argument("[key]", "Parameter key")
    .argument("[value]", "Parameter value")
    .option("-p, --param <kv...>", "Batch set as key=value pairs")
    .action((index, key, value, opts) => {
      try {
        const idx = parseInt(index)
        const project = session.getProject()
        session.snapshot(`Set layer ${idx}`)
        if (opts.param) {
          const pairs = parseParamPairs(opts.param)
          for (const [k, v] of Object.entries(pairs)) {
            setLayerParam(project, idx, k, v)
          }
          success(`Set ${Object.keys(pairs).length} params on layer ${idx}`)
        } else if (key && value !== undefined) {
          setLayerParam(project, idx, key, parseParamValue(value))
          success(`Set layer ${idx} ${key} = ${value}`)
        } else {
          error("Provide key+value or use -p key=value")
        }
      } catch (e: any) {
        error(e.message)
      }
    })

  layer.command("list")
    .description("List all layers in the project")
    .action(() => {
      try {
        const layers = session.getProject().layers
        if (layers.length === 0) {
          output({ layers: [] }, "  No layers.")
          return
        }
        const data = layers.map((l, i) => ({
          index: i, name: l.name, type: l.type, kind: l.kind,
          visible: l.visible, opacity: l.opacity,
        }))
        output({ layers: data })
      } catch (e: any) {
        error(e.message)
      }
    })

  layer.command("info")
    .description("Show layer details")
    .argument("<index>", "Layer index")
    .action((index) => {
      try {
        const layer = session.getProject().layers[parseInt(index)]
        if (!layer) { error(`Layer ${index} not found.`); return }
        output({
          index: parseInt(index), name: layer.name, type: layer.type, kind: layer.kind,
          visible: layer.visible, opacity: layer.opacity, hue: layer.hue,
          saturation: layer.saturation, blendMode: layer.blendMode,
          compositeMode: layer.compositeMode, params: layer.params,
        })
      } catch (e: any) {
        error(e.message)
      }
    })

  layer.command("hide")
    .description("Hide a layer")
    .argument("<index>", "Layer index")
    .action((index) => {
      try {
        session.snapshot(`Hide layer ${index}`)
        setLayerParam(session.getProject(), parseInt(index), "visible", false)
        success(`Layer ${index} hidden`)
      } catch (e: any) {
        error(e.message)
      }
    })

  layer.command("show")
    .description("Show a layer")
    .argument("<index>", "Layer index")
    .action((index) => {
      try {
        session.snapshot(`Show layer ${index}`)
        setLayerParam(session.getProject(), parseInt(index), "visible", true)
        success(`Layer ${index} visible`)
      } catch (e: any) {
        error(e.message)
      }
    })

  layer.command("types")
    .description("List all available layer types")
    .action(() => {
      const sources = getSourceLayerTypes()
      const effects = getEffectLayerTypes()
      output({ source: sources, effect: effects })
    })

  layer.command("params")
    .description("Show parameters for a layer type")
    .argument("<type>", "Layer type")
    .action((type) => {
      const def = getLayerDef(type)
      if (!def) { error(`Unknown layer type: "${type}"`); return }
      const params = def.params.map(p => ({
        key: p.key, type: p.type, default: p.defaultValue,
        ...(p.min !== undefined ? { min: p.min } : {}),
        ...(p.max !== undefined ? { max: p.max } : {}),
        ...(p.options ? { options: p.options.map(o => o.value).join("|") } : {}),
        ...(p.group ? { group: p.group } : {}),
      }))
      output({ type: def.type, kind: def.kind, name: def.defaultName, params })
    })
}
