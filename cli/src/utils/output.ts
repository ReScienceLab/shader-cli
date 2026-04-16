let jsonMode = false

export function setJsonMode(v: boolean): void { jsonMode = v }
export function isJsonMode(): boolean { return jsonMode }

export function output(data: unknown, message?: string): void {
  if (jsonMode) {
    console.log(JSON.stringify(data, null, 2))
  } else {
    if (message) console.log(message)
    if (data && typeof data === "object") {
      prettyPrint(data as Record<string, unknown>)
    }
  }
}

export function success(msg: string): void {
  if (jsonMode) {
    console.log(JSON.stringify({ status: "ok", message: msg }))
  } else {
    console.log(`  \x1b[32m\x1b[1m✓\x1b[0m \x1b[32m${msg}\x1b[0m`)
  }
}

export function error(msg: string): void {
  if (jsonMode) {
    console.log(JSON.stringify({ status: "error", message: msg }))
  } else {
    console.error(`  \x1b[31m\x1b[1m✗\x1b[0m \x1b[31m${msg}\x1b[0m`)
  }
}

function prettyPrint(obj: Record<string, unknown>, indent = 0): void {
  const prefix = "  ".repeat(indent + 1)
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      console.log(`${prefix}\x1b[90m${k}:\x1b[0m`)
      prettyPrint(v as Record<string, unknown>, indent + 1)
    } else if (Array.isArray(v)) {
      console.log(`${prefix}\x1b[90m${k}:\x1b[0m`)
      for (const item of v) {
        if (item && typeof item === "object") {
          const summary = Object.entries(item).map(([ik, iv]) => `${ik}=${iv}`).join(", ")
          console.log(`${prefix}  \x1b[37m- ${summary}\x1b[0m`)
        } else {
          console.log(`${prefix}  \x1b[37m- ${item}\x1b[0m`)
        }
      }
    } else {
      console.log(`${prefix}\x1b[90m${k}:\x1b[0m \x1b[37m${v}\x1b[0m`)
    }
  }
}
