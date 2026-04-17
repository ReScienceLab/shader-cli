import { readFileSync, writeFileSync, chmodSync } from "node:fs"

const entry = new URL("../dist/index.js", import.meta.url).pathname
const content = readFileSync(entry, "utf-8")
if (!content.startsWith("#!")) {
  writeFileSync(entry, `#!/usr/bin/env node\n${content}`)
}
chmodSync(entry, 0o755)
console.log("postbuild: shebang + chmod done")
