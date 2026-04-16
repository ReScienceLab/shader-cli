import type { Command } from "commander"
import type { Session } from "../core/session.js"
import { setSceneConfig } from "../core/project-engine.js"
import { output, success, error } from "../utils/output.js"

export function registerSceneCommands(program: Command, session: Session): void {
  const scene = program.command("scene").description("Scene configuration")

  scene.command("set")
    .description("Set a scene config property")
    .argument("<key>", "Config key (e.g. backgroundColor, brightness)")
    .argument("<value>", "Value")
    .action((key, value) => {
      try {
        session.snapshot(`Scene set ${key}`)
        let parsed: unknown = value
        if (value === "true") parsed = true
        else if (value === "false") parsed = false
        else if (/^-?\d+(\.\d+)?$/.test(value)) parsed = parseFloat(value)
        setSceneConfig(session.getProject(), key, parsed)
        success(`Scene ${key} = ${value}`)
      } catch (e: any) {
        error(e.message)
      }
    })

  scene.command("info")
    .description("Show scene configuration")
    .action(() => {
      try {
        const p = session.getProject()
        output({
          composition: p.composition,
          sceneConfig: p.sceneConfig ?? "(default)",
        })
      } catch (e: any) {
        error(e.message)
      }
    })

  scene.command("aspect")
    .description("Set composition aspect ratio")
    .argument("<preset>", "screen|16:9|9:16|4:3|3:4|1:1|custom")
    .action((preset) => {
      try {
        session.snapshot(`Aspect ${preset}`)
        setSceneConfig(session.getProject(), "compositionAspect", preset)
        success(`Aspect: ${preset}`)
      } catch (e: any) {
        error(e.message)
      }
    })
}
