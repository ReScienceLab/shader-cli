const FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]

export class Spinner {
  private interval?: NodeJS.Timeout
  private frame = 0
  private start = Date.now()
  private text = ""
  private isTty: boolean

  constructor(text: string) {
    this.text = text
    this.isTty = process.stderr.isTTY ?? false
  }

  spin(): this {
    if (!this.isTty) {
      process.stderr.write(`  ${this.text}...\n`)
      return this
    }
    this.start = Date.now()
    this.interval = setInterval(() => {
      const f = FRAMES[this.frame++ % FRAMES.length]!
      process.stderr.write(`\r  \x1b[36m${f}\x1b[0m ${this.text}...`)
    }, 80)
    return this
  }

  update(text: string): void {
    this.text = text
  }

  succeed(text?: string): void {
    if (this.interval) clearInterval(this.interval)
    const elapsed = ((Date.now() - this.start) / 1000).toFixed(1)
    if (this.isTty) process.stderr.write("\r\x1b[K")
    process.stderr.write(`  \x1b[32m✓\x1b[0m ${text ?? this.text} \x1b[90m(${elapsed}s)\x1b[0m\n`)
  }

  fail(text?: string): void {
    if (this.interval) clearInterval(this.interval)
    if (this.isTty) process.stderr.write("\r\x1b[K")
    process.stderr.write(`  \x1b[31m✗\x1b[0m ${text ?? this.text}\n`)
  }
}

export class ProgressBar {
  private width = 20
  private isTty: boolean
  private start = Date.now()

  constructor(private _label: string, private total: number) {
    this.isTty = process.stderr.isTTY ?? false
  }

  update(current: number): void {
    if (!this.isTty) return
    const ratio = Math.min(current / this.total, 1)
    const filled = Math.round(this.width * ratio)
    const bar = "\u25B0".repeat(filled) + "\u25B1".repeat(this.width - filled)
    const elapsed = (Date.now() - this.start) / 1000
    const eta = elapsed > 0.5 && ratio > 0 ? Math.max(0, (elapsed / ratio) - elapsed) : NaN
    const etaStr = isFinite(eta) ? ` \x1b[90m· ETA ${eta.toFixed(0)}s\x1b[0m` : ""
    process.stderr.write(`\r  ${bar} ${(ratio * 100).toFixed(0)}%${etaStr}  `)
  }

  done(): void {
    if (this.isTty) process.stderr.write("\r\x1b[K")
  }
}
