import type { LabProject } from "./project-engine.js"
import { saveProject } from "./project-engine.js"

interface HistoryEntry {
  snapshot: string
  description: string
}

export class Session {
  project: LabProject | null = null
  projectPath: string | null = null
  private undoStack: HistoryEntry[] = []
  private redoStack: HistoryEntry[] = []
  private _modified = false

  get modified(): boolean { return this._modified }

  hasProject(): boolean { return this.project !== null }

  getProject(): LabProject {
    if (!this.project) throw new Error("No project loaded. Use 'project new' or 'project open' first.")
    return this.project
  }

  setProject(project: LabProject, path: string | null): void {
    this.project = project
    this.projectPath = path
    this.undoStack = []
    this.redoStack = []
    this._modified = false
  }

  snapshot(description: string): void {
    if (!this.project) return
    this.undoStack.push({ snapshot: JSON.stringify(this.project), description })
    if (this.undoStack.length > 50) this.undoStack.shift()
    this.redoStack = []
    this._modified = true
  }

  undo(): string {
    if (this.undoStack.length === 0) throw new Error("Nothing to undo.")
    if (!this.project) throw new Error("No project loaded.")
    this.redoStack.push({ snapshot: JSON.stringify(this.project), description: "redo" })
    const entry = this.undoStack.pop()!
    this.project = JSON.parse(entry.snapshot)
    this._modified = true
    return entry.description
  }

  redo(): string {
    if (this.redoStack.length === 0) throw new Error("Nothing to redo.")
    if (!this.project) throw new Error("No project loaded.")
    this.undoStack.push({ snapshot: JSON.stringify(this.project), description: "undo" })
    const entry = this.redoStack.pop()!
    this.project = JSON.parse(entry.snapshot)
    this._modified = true
    return entry.description
  }

  save(path?: string): string {
    if (!this.project) throw new Error("No project loaded.")
    const savePath = path ?? this.projectPath
    if (!savePath) throw new Error("No save path specified. Provide a path or open an existing project.")
    saveProject(this.project, savePath)
    this.projectPath = savePath
    this._modified = false
    return savePath
  }

  info(): Record<string, unknown> {
    return {
      hasProject: this.hasProject(),
      projectPath: this.projectPath,
      modified: this._modified,
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
    }
  }
}
