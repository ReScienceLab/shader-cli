import type { Command } from "commander"
import type { Session } from "../core/session.js"
import { saveProject } from "../core/project-engine.js"
import { success, error } from "../utils/output.js"
import * as path from "node:path"
import * as fs from "node:fs"
import { spawn, execSync } from "node:child_process"

const SHADER_LAB_ROOT = path.resolve(import.meta.dirname ?? __dirname, "..", "..")

async function waitForServer(url: string, timeoutMs = 15000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch { /* not ready */ }
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

function findDevServer(): boolean {
  try {
    const res = execSync("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000", { timeout: 3000 })
    return res.toString().trim() === "200"
  } catch {
    return false
  }
}

async function renderWithPlaywright(
  projectJson: string,
  opts: {
    format: "webm" | "mp4" | "png"
    outputPath: string
    quality: string
    fps: number
    duration: number
    time: number
  }
): Promise<string> {
  let pw: typeof import("playwright")
  try {
    pw = await import("playwright")
  } catch {
    throw new Error("Playwright is required for export. Install with: bun add playwright && bunx playwright install chromium")
  }

  let serverProcess: ReturnType<typeof spawn> | null = null
  const serverRunning = findDevServer()

  if (!serverRunning) {
    console.log("  Starting dev server...")
    serverProcess = spawn("bun", ["run", "dev"], {
      cwd: SHADER_LAB_ROOT,
      stdio: "ignore",
      detached: true,
    })
    const ready = await waitForServer("http://localhost:3000", 20000)
    if (!ready) {
      serverProcess?.kill()
      throw new Error("Dev server failed to start. Run 'bun run dev' manually in the shader-lab directory.")
    }
  }

  const downloadDir = path.dirname(path.resolve(opts.outputPath))
  fs.mkdirSync(downloadDir, { recursive: true })

  const browser = await pw.chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--enable-unsafe-webgpu",
      "--enable-features=Vulkan",
      "--use-angle=metal",
      "--enable-gpu",
      "--ignore-gpu-blocklist",
    ],
  })

  try {
    const context = await browser.newContext({ acceptDownloads: true })
    const page = await context.newPage()

    await page.goto("http://localhost:3000/tools/shader-lab", { waitUntil: "networkidle" })
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
      await page.evaluate((time: number) => {
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
              const exportBtn = [...document.querySelectorAll("button")].find(
                b => b.textContent?.includes("Export WEBM") || b.textContent?.includes("Export MP4")
              )
              exportBtn?.click()
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
    if (serverProcess) {
      try { process.kill(-serverProcess.pid!, "SIGTERM") } catch { /* ignore */ }
    }
  }
}

export function registerExportCommands(program: Command, session: Session): void {
  const exp = program.command("export").description("Export project (requires Chrome + WebGPU)")

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

        const tmpPath = path.join(SHADER_LAB_ROOT, ".cli-export-temp.lab")
        saveProject(project, tmpPath)

        console.log(`  Exporting ${opts.format.toUpperCase()} video...`)
        const projectJson = JSON.stringify(project)
        const outputPath = await renderWithPlaywright(projectJson, {
          format: opts.format,
          outputPath: path.resolve(opts.output),
          quality: opts.quality,
          fps: parseInt(opts.fps),
          duration: project.timeline.duration,
          time: 0,
        })

        try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }

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
        console.log("  Exporting PNG...")
        const projectJson = JSON.stringify(project)
        const outputPath = await renderWithPlaywright(projectJson, {
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
