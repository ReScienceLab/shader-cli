import type { Command } from "commander"
import type { Session } from "../core/session.js"
import { success, error } from "../utils/output.js"
import * as path from "node:path"
import * as fs from "node:fs"

const DEFAULT_RUNTIME = "https://shader-lab.rescience.dev/tools/shader-lab"

function resolveRuntime(program: Command): string {
  const opts = program.opts()
  return opts.runtime
    ?? process.env.SHADER_LAB_RUNTIME_URL
    ?? DEFAULT_RUNTIME
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
  const pw = await loadPlaywright()

  const downloadDir = path.dirname(path.resolve(opts.outputPath))
  fs.mkdirSync(downloadDir, { recursive: true })

  const browser = await pw.chromium.launch({
    headless: false,
    args: [
      "--enable-unsafe-webgpu",
      "--enable-features=Vulkan",
      "--use-angle=metal",
      "--window-position=-2400,-2400",
      "--window-size=1,1",
    ],
  })

  try {
    const context = await browser.newContext({ acceptDownloads: true })
    const page = await context.newPage()

    console.log(`  Loading runtime: ${runtimeUrl}`)
    await page.goto(runtimeUrl, { waitUntil: "networkidle" })
    await page.waitForTimeout(3000)

    await page.evaluate((json: string) => {
      const projectFile = JSON.parse(json)
      const { useLayerStore, useTimelineStore, useEditorStore } = (window as any).__SHADER_LAB_STORES__ ?? {}
      if (useLayerStore) {
        useLayerStore.getState().replaceState(
          projectFile.layers,
          projectFile.selectedLayerId,
          null
        )
      }
      if (useTimelineStore) {
        useTimelineStore.getState().replaceState({
          currentTime: 0,
          duration: projectFile.timeline.duration,
          isPlaying: true,
          loop: projectFile.timeline.loop,
          selectedKeyframeId: null,
          selectedTrackId: null,
          tracks: projectFile.timeline.tracks,
        })
      }
      if (useEditorStore && projectFile.sceneConfig) {
        useEditorStore.getState().updateSceneConfig(projectFile.sceneConfig)
        useEditorStore.getState().setOutputSize(
          projectFile.composition.width,
          projectFile.composition.height
        )
      }
    }, projectJson)

    await page.waitForTimeout(2000)

    if (opts.format === "png") {
      const downloadPromise = page.waitForEvent("download", { timeout: 30000 })
      await page.evaluate((_time: number) => {
        const exportBtn = document.querySelector('button[aria-label="Export"]') as HTMLButtonElement
        exportBtn?.click()
        setTimeout(() => {
          const imgTab = [...document.querySelectorAll("button")].find(b => b.textContent?.trim() === "image")
          imgTab?.click()
          setTimeout(() => {
            const exportPng = [...document.querySelectorAll("button")].find(b => b.textContent?.includes("Export PNG"))
            exportPng?.click()
          }, 500)
        }, 1000)
      }, opts.time)
      const download = await downloadPromise
      await download.saveAs(opts.outputPath)
    } else {
      const downloadPromise = page.waitForEvent("download", { timeout: 120000 })
      await page.evaluate((format: string) => {
        const exportBtn = document.querySelector('button[aria-label="Export"]') as HTMLButtonElement
        exportBtn?.click()
        setTimeout(() => {
          const videoTab = [...document.querySelectorAll("button")].find(b => b.textContent?.trim() === "video")
          videoTab?.click()
          setTimeout(() => {
            if (format === "mp4") {
              const mp4Btn = [...document.querySelectorAll("button")].find(b => b.textContent?.trim() === "MP4")
              mp4Btn?.click()
            }
            setTimeout(() => {
              const btn = [...document.querySelectorAll("button")].find(
                b => b.textContent?.includes("Export WEBM") || b.textContent?.includes("Export MP4")
              )
              btn?.click()
            }, 500)
          }, 500)
        }, 1000)
      }, opts.format)
      const download = await downloadPromise
      await download.saveAs(opts.outputPath)
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

        console.log(`  Exporting ${opts.format.toUpperCase()} video...`)
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
        console.log("  Exporting PNG...")
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
