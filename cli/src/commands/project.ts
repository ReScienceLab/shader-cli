import type { Command } from "commander"
import type { Session } from "../core/session.js"
import { createProject, openProject, getProjectInfo } from "../core/project-engine.js"
import { output, success, error } from "../utils/output.js"

export function registerProjectCommands(program: Command, session: Session): void {
  const proj = program.command("project").description("Project management")

  proj.command("new")
    .description("Create a new project")
    .option("-n, --name <name>", "Project name", "untitled")
    .option("-w, --width <n>", "Width", "1920")
    .option("-h, --height <n>", "Height", "1080")
    .option("-o, --output <path>", "Save path")
    .action((opts) => {
      const p = createProject({ name: opts.name, width: parseInt(opts.width), height: parseInt(opts.height) })
      session.setProject(p, opts.output ?? null)
      if (opts.output) session.save(opts.output)
      success(`Created project: ${opts.name} (${p.composition.width}x${p.composition.height})`)
    })

  proj.command("open")
    .description("Open an existing .lab project")
    .argument("<path>", "Path to .lab file")
    .action((path) => {
      try {
        const p = openProject(path)
        session.setProject(p, path)
        success(`Opened: ${path} (${p.layers.length} layers)`)
      } catch (e: any) {
        error(e.message)
      }
    })

  proj.command("save")
    .description("Save the current project")
    .argument("[path]", "Save path (optional)")
    .action((path) => {
      try {
        const saved = session.save(path)
        success(`Saved to: ${saved}`)
      } catch (e: any) {
        error(e.message)
      }
    })

  proj.command("info")
    .description("Show project information")
    .action(() => {
      try {
        output(getProjectInfo(session.getProject()))
      } catch (e: any) {
        error(e.message)
      }
    })

  proj.command("json")
    .description("Print raw project JSON")
    .action(() => {
      try {
        console.log(JSON.stringify(session.getProject(), null, 2))
      } catch (e: any) {
        error(e.message)
      }
    })
}
