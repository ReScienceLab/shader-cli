import { Command } from "commander"
import { Session } from "./core/session.js"
import { openProject } from "./core/project-engine.js"
import { setJsonMode } from "./utils/output.js"
import { registerProjectCommands } from "./commands/project.js"
import { registerLayerCommands } from "./commands/layer.js"
import { registerSceneCommands } from "./commands/scene.js"
import { registerTimelineCommands } from "./commands/timeline.js"
import { registerExportCommands } from "./commands/export.js"
import { registerPresetCommands } from "./commands/preset.js"
import { startRepl } from "./utils/repl.js"

const session = new Session()

const program = new Command()
  .name("shader-lab")
  .description("CLI harness for Shader Lab — agent-native shader composition")
  .version("0.1.0")
  .option("--json", "Output as JSON (agent-friendly)")
  .option("--project <path>", "Open a .lab project file")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts()
    if (opts.json) setJsonMode(true)
    if (opts.project && !session.hasProject()) {
      session.setProject(openProject(opts.project), opts.project)
    }
  })

registerProjectCommands(program, session)
registerLayerCommands(program, session)
registerSceneCommands(program, session)
registerTimelineCommands(program, session)
registerExportCommands(program, session)
registerPresetCommands(program, session)

const isRepl = process.argv.length <= 2 ||
  (process.argv.length === 3 && (process.argv[2] === "--json" || process.argv[2] === "--help"))

if (isRepl) {
  startRepl(session, program)
} else {
  program.parseAsync(process.argv).then(() => {
    if (session.modified && session.projectPath) {
      try { session.save() } catch { /* ignore */ }
    }
  })
}
