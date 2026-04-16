import * as readline from "node:readline"
import type { Command } from "commander"
import type { Session } from "../core/session.js"
import { isJsonMode } from "./output.js"

const CYAN = "\x1b[38;5;80m"
const BOLD = "\x1b[1m"
const DIM = "\x1b[2m"
const RESET = "\x1b[0m"
const GRAY = "\x1b[90m"
const RED_ACCENT = "\x1b[38;5;196m"

function printBanner(): void {
  const lines = [
    `${DIM}╭──────────────────────────────────────────╮${RESET}`,
    `${DIM}│${RESET} ${CYAN}${BOLD}◆${RESET}  ${CYAN}${BOLD}shader-lab${RESET} ${DIM}·${RESET} ${RED_ACCENT}${BOLD}CLI${RESET}                      ${DIM}│${RESET}`,
    `${DIM}│${RESET}    ${DIM}v0.1.0${RESET}                               ${DIM}│${RESET}`,
    `${DIM}│${RESET}                                          ${DIM}│${RESET}`,
    `${DIM}│${RESET}    ${DIM}Type help for commands, quit to exit${RESET}  ${DIM}│${RESET}`,
    `${DIM}╰──────────────────────────────────────────╯${RESET}`,
  ]
  for (const l of lines) console.log(l)
}

function getPrompt(session: Session): string {
  const parts: string[] = [`${CYAN}◆${RESET} `]
  parts.push(`${RED_ACCENT}${BOLD}shader-lab${RESET}`)

  if (session.hasProject()) {
    const name = session.projectPath
      ? session.projectPath.split("/").pop()?.replace(".lab", "") ?? "project"
      : "untitled"
    const mod = session.modified ? "*" : ""
    parts.push(` ${DIM}[${RESET}${name}${mod}${DIM}]${RESET}`)
  }

  parts.push(` ${GRAY}❯${RESET} `)
  return parts.join("")
}

export function startRepl(session: Session, program: Command): void {
  if (!isJsonMode()) printBanner()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPrompt(session),
  })

  rl.prompt()

  rl.on("line", async (line) => {
    const input = line.trim()
    if (!input) { rl.setPrompt(getPrompt(session)); rl.prompt(); return }

    if (input === "quit" || input === "exit" || input === "q") {
      if (session.modified && !isJsonMode()) {
        console.log(`  ${DIM}Unsaved changes discarded.${RESET}`)
      }
      rl.close()
      return
    }

    if (input === "help") {
      console.log(`
  ${CYAN}${BOLD}Project${RESET}     project new | open | save | info | json
  ${CYAN}${BOLD}Layers${RESET}      layer add | remove | set | list | info | types | params
  ${CYAN}${BOLD}Scene${RESET}       scene set | info | aspect
  ${CYAN}${BOLD}Timeline${RESET}    timeline duration | loop | info | keyframe add
  ${CYAN}${BOLD}Export${RESET}      export video | image | project
  ${CYAN}${BOLD}Presets${RESET}     preset list | apply
  ${CYAN}${BOLD}Session${RESET}     undo | redo
  ${CYAN}${BOLD}Misc${RESET}        help | quit
`)
      rl.setPrompt(getPrompt(session)); rl.prompt(); return
    }

    if (input === "undo") {
      try { const d = session.undo(); console.log(`  Undid: ${d}`) }
      catch (e: any) { console.error(`  ${e.message}`) }
      rl.setPrompt(getPrompt(session)); rl.prompt(); return
    }

    if (input === "redo") {
      try { const d = session.redo(); console.log(`  Redid: ${d}`) }
      catch (e: any) { console.error(`  ${e.message}`) }
      rl.setPrompt(getPrompt(session)); rl.prompt(); return
    }

    try {
      const args = ["node", "shader-lab", ...parseArgs(input)]
      await program.parseAsync(args)
    } catch (e: any) {
      if (!isJsonMode()) console.error(`  \x1b[31m${e.message}\x1b[0m`)
    }

    rl.setPrompt(getPrompt(session))
    rl.prompt()
  })

  rl.on("close", () => {
    if (!isJsonMode()) console.log(`\n  ${DIM}Goodbye.${RESET}`)
    process.exit(0)
  })
}

function parseArgs(input: string): string[] {
  const args: string[] = []
  let current = ""
  let inQuote: string | null = null

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inQuote) {
      if (ch === inQuote) { inQuote = null }
      else { current += ch }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch
    } else if (ch === " " || ch === "\t") {
      if (current) { args.push(current); current = "" }
    } else {
      current += ch
    }
  }
  if (current) args.push(current)
  return args
}
