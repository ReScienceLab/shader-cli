import type { Command } from "commander"
import type { Session } from "../core/session.js"
import { success, error } from "../utils/output.js"
import { Spinner, ProgressBar } from "../utils/spinner.js"
import * as path from "node:path"
import * as fs from "node:fs"

const DEFAULT_RUNTIME = "https://shader-lab.rescience.dev/tools/shader-lab"

function resolveRuntime(program: Command): string {
  const opts = program.opts()
  return opts.runtime
    ?? process.env.SHADER_LAB_RUNTIME_URL
    ?? DEFAULT_RUNTIME
}

function buildRuntimeUrl(baseUrl: string, projectJson: string): string {
  const encoded = Buffer.from(projectJson).toString("base64")
  const sep = baseUrl.includes("?") ? "&" : "?"
  return `${baseUrl}${sep}project=${encodeURIComponent(encoded)}&autoplay=true`
}

async function loadPlaywright() {
  try {
    return await import("playwright")
  } catch {
    throw new Error(
      "Playwright is required for export but not installed.\n" +
      "Run: shader-cli setup\n" +
      "Or:  npm install playwright && npx playwright install chromium"
    )
  }
}

async function renderWithPlaywright(
  projectJson: string,
  runtimeUrl: string,
  opts: {
    format: "webm" | "mp4" | "png"
    outputPath: string
    quality: string
    fps: number
    duration: number
    time: number
  }
): Promise<string> {
  const sp1 = new Spinner("Starting Playwright").spin()
  const pw = await loadPlaywright()
  sp1.succeed("Playwright ready")

  const downloadDir = path.dirname(path.resolve(opts.outputPath))
  fs.mkdirSync(downloadDir, { recursive: true })

  const sp2 = new Spinner("Launching Chrome (WebGPU)").spin()
  const browser = await pw.chromium.launch({
    headless: false,
    channel: "chrome",
    args: [
      "--enable-unsafe-webgpu",
      "--enable-features=Vulkan",
      "--use-angle=metal",
    ],
  })
  sp2.succeed("Chrome ready")

  try {
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1920, height: 1080 },
    })
    const page = await context.newPage()

    const project = JSON.parse(projectJson)
    const layerCount = project.layers?.length ?? 0

    let hostname: string
    try { hostname = new URL(runtimeUrl).hostname } catch { hostname = runtimeUrl }
    const sp3 = new Spinner(`Loading ${hostname} (${layerCount} layers)`).spin()
    const fullUrl = buildRuntimeUrl(runtimeUrl, projectJson)
    await page.goto(fullUrl, { waitUntil: "networkidle" })
    // Wait for URL params loader to apply project (1.5s delay in component + render time)
    await page.waitForTimeout(5000)
    sp3.succeed("Runtime loaded & project injected")

    if (opts.format === "png") {
      const sp5 = new Spinner("Exporting PNG").spin()

      // Open export dialog using Playwright locator
      await page.locator('button[aria-label="Export"]').first().click()
      await page.waitForTimeout(1500)

      const downloadPromise = page.waitForEvent("download", { timeout: 30000 })
      // Click image tab (default, but ensure)
      await page.getByRole("button", { name: "image", exact: true }).click()
      await page.waitForTimeout(500)
      // Click Export PNG
      await page.getByRole("button", { name: "Export PNG" }).click()

      const download = await downloadPromise
      sp5.succeed("PNG captured")

      const sp6 = new Spinner(`Saving to ${path.basename(opts.outputPath)}`).spin()
      await download.saveAs(opts.outputPath)
      sp6.succeed(`Saved ${path.basename(opts.outputPath)}`)
    } else {
      const formatLabel = opts.format.toUpperCase()
      const expectedMs = opts.duration * 1000 * 2
      const pb = new ProgressBar(`Recording ${formatLabel}`, expectedMs)
      const spRec = new Spinner(`Recording ${formatLabel} (${opts.duration}s @ ${opts.fps}fps)`).spin()

      // Open export dialog
      await page.locator('button[aria-label="Export"]').first().click()
      await page.waitForTimeout(1500)

      const downloadPromise = page.waitForEvent("download", { timeout: 120000 })
      // Click video tab
      await page.getByRole("button", { name: "video", exact: true }).click()
      await page.waitForTimeout(500)
      // Select format if MP4
      if (opts.format === "mp4") {
        await page.getByRole("button", { name: "MP4", exact: true }).click()
        await page.waitForTimeout(300)
      }
      // Click Export WEBM / Export MP4
      await page.getByRole("button", { name: `Export ${formatLabel}` }).click()

      const recStart = Date.now()
      const tick = setInterval(() => pb.update(Date.now() - recStart), 200)
      const download = await downloadPromise
      clearInterval(tick)
      pb.done()
      spRec.succeed(`Recording complete`)

      const sp6 = new Spinner(`Saving to ${path.basename(opts.outputPath)}`).spin()
      await download.saveAs(opts.outputPath)
      sp6.succeed(`Saved ${path.basename(opts.outputPath)}`)
    }

    return opts.outputPath
  } finally {
    await browser.close()
  }
}

export function registerExportCommands(program: Command, session: Session): void {
  const exp = program.command("export").description("Export project (requires Playwright + Chrome with WebGPU)")

  exp.command("video")
    .description("Export video (WebM or MP4)")
    .option("-o, --output <path>", "Output file path", "output.webm")
    .option("-f, --format <fmt>", "Format: webm|mp4", "webm")
    .option("-q, --quality <q>", "Quality: draft|standard|high|ultra", "standard")
    .option("--fps <n>", "Frames per second", "30")
    .option("--duration <n>", "Duration in seconds (overrides project)")
    .action(async (opts) => {
      try {
        const project = session.getProject()
        if (opts.duration) project.timeline.duration = parseFloat(opts.duration)
        const runtimeUrl = resolveRuntime(program)
        const projectJson = JSON.stringify(project)
        const outputPath = await renderWithPlaywright(projectJson, runtimeUrl, {
          format: opts.format,
          outputPath: path.resolve(opts.output),
          quality: opts.quality,
          fps: parseInt(opts.fps),
          duration: project.timeline.duration,
          time: 0,
        })

        const stat = fs.statSync(outputPath)
        const sizeMB = (stat.size / 1024 / 1024).toFixed(1)
        success(`Exported: ${outputPath} (${sizeMB} MB, ${project.composition.width}x${project.composition.height}, ${opts.fps}fps, ${project.timeline.duration}s)`)
      } catch (e: any) {
        error(e.message)
      }
    })

  exp.command("image")
    .description("Export still image (PNG)")
    .option("-o, --output <path>", "Output file path", "output.png")
    .option("-q, --quality <q>", "Quality: draft|standard|high|ultra", "standard")
    .option("--time <n>", "Frame time in seconds", "0")
    .action(async (opts) => {
      try {
        const project = session.getProject()
        const runtimeUrl = resolveRuntime(program)
        const projectJson = JSON.stringify(project)
        const outputPath = await renderWithPlaywright(projectJson, runtimeUrl, {
          format: "png",
          outputPath: path.resolve(opts.output),
          quality: opts.quality,
          fps: 30,
          duration: project.timeline.duration,
          time: parseFloat(opts.time),
        })
        const stat = fs.statSync(outputPath)
        const sizeKB = (stat.size / 1024).toFixed(0)
        success(`Exported: ${outputPath} (${sizeKB} KB)`)
      } catch (e: any) {
        error(e.message)
      }
    })

  exp.command("project")
    .description("Export project as .lab file")
    .option("-o, --output <path>", "Output path", "export.lab")
    .action((opts) => {
      try {
        session.save(opts.output)
        success(`Project exported: ${opts.output}`)
      } catch (e: any) {
        error(e.message)
      }
    })
}
