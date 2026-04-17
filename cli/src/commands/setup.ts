import type { Command } from "commander"
import { execSync } from "node:child_process"
import { success, error } from "../utils/output.js"

export function registerSetupCommand(program: Command): void {
  program
    .command("setup")
    .description("Install Playwright + Chromium for video/image export")
    .action(() => {
      try {
        console.log("Installing Playwright...")
        execSync("npm install playwright@latest", { stdio: "inherit" })
        console.log("Installing Chromium browser...")
        execSync("npx playwright install chromium", { stdio: "inherit" })
        success("Setup complete. You can now use 'shader-cli export' commands.")
      } catch (e: any) {
        error(`Setup failed: ${e.message}`)
        console.log("\nManual install:")
        console.log("  npm install playwright")
        console.log("  npx playwright install chromium")
        process.exit(1)
      }
    })
}
