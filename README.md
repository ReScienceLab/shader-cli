# shader-cli

> Agent-native CLI for [Shader Lab](https://github.com/basementstudio/shader-lab) — create, stack, and export WebGPU shader compositions from the terminal.

<p align="center">
  <video src="https://github.com/ReScienceLab/shader-cli/raw/main/public/demos/rescience-lab-hero.webm" autoplay loop muted playsinline width="800"></video>
</p>

<p align="center">
  <em>"ReScience Lab" + "npm i -g @resciencelab/shader-cli" — CRT Composite TV effect, generated entirely from the CLI</em>
</p>

<details>
<summary>CLI commands used to generate the above</summary>

```bash
shader-cli project new -o scene.lab
shader-cli --project scene.lab layer add crt \
  -p crtMode=composite-tv -p cellSize=4 -p scanlineIntensity=0.3 \
  -p flickerIntensity=0.15 -p glitchIntensity=0.2 -p glitchSpeed=3 \
  -p bloomEnabled=true -p bloomIntensity=1.5 -p barrelDistortion=0.1 \
  -p vignetteIntensity=0.6
shader-cli --project scene.lab layer add text \
  -p "text=ReScience Lab" -p fontSize=190 -p fontWeight=800 -p "textColor=#e0e0e0"
shader-cli --project scene.lab layer add gradient \
  -p preset=sunset -p animate=true -p motionAmount=0.5 -p tonemapMode=cinematic
shader-cli --project scene.lab timeline duration 6
shader-cli --project scene.lab export video -o output.webm
```
</details>

---

This is a fork of [basement.studio's Shader Lab](https://github.com/basementstudio/shader-lab) with an added **CLI harness** that makes the shader editor fully controllable from the command line. All project editing is instant (pure JSON). Video/image export uses headless Chrome with WebGPU.

## Quick Start

### Install via npm (recommended)

```bash
# Install globally
npm i -g @resciencelab/shader-cli

# One-time setup for video export (installs Playwright + Chromium)
shader-cli setup

# Create a CRT text animation
shader-cli preset apply crt-text --text "Hello World" -o scene.lab
shader-cli --project scene.lab export video -o output.webm
```

Or use with `npx` (no install):

```bash
npx @resciencelab/shader-cli preset apply crt-text --text "Hello" -o scene.lab
```

### Install from source

```bash
git clone https://github.com/ReScienceLab/shader-cli.git
cd shader-cli/cli && npm install && npm run build && npm link
```

**Runtime:** Export commands use [shader-lab.rescience.dev](https://shader-lab.rescience.dev/tools/shader-lab) by default. Override with `--runtime http://localhost:3000` for local development.

## CLI Commands

### Project Management
```bash
shader-cli project new [--name "Name"] [--width 1920] [--height 1080] [-o out.lab]
shader-cli project open <path.lab>
shader-cli project save [path]
shader-cli project info
shader-cli project json
```

### Layer Operations
```bash
shader-cli layer add <type> [-n "Name"] [-p key=value ...]
shader-cli layer remove <index>
shader-cli layer reorder <from> <to>
shader-cli layer set <index> <key> <value>
shader-cli layer set <index> -p key=value ...    # batch set
shader-cli layer list
shader-cli layer info <index>
shader-cli layer hide/show <index>
shader-cli layer types                           # list all 26 layer types
shader-cli layer params <type>                   # show parameters for a type
```

### Scene Configuration
```bash
shader-cli scene set <key> <value>    # backgroundColor, brightness, contrast, etc.
shader-cli scene info
shader-cli scene aspect <preset>      # screen | 16:9 | 9:16 | 1:1 | custom
```

### Timeline & Animation
```bash
shader-cli timeline duration <seconds>
shader-cli timeline loop --on/--off
shader-cli timeline keyframe add <layer> <time> <property> <value> [-i smooth]
shader-cli timeline info
```

### Export (requires Playwright + Chrome with WebGPU)
```bash
shader-cli export video [-o out.webm] [--format webm|mp4] [--quality standard] [--fps 30]
shader-cli export image [-o out.png] [--quality standard] [--time 0]
shader-cli export project [-o out.lab]
```

### Presets
```bash
shader-cli preset list
shader-cli preset apply <name> [--text "Text"] [-o out.lab]
```

### Setup
```bash
shader-cli setup    # Install Playwright + Chromium for video export
```

## Built-in Presets

| Preset | Description | Layers |
|--------|-------------|--------|
| `crt-text` | Retro CRT monitor with dithering, pattern, and gradient | 5 |
| `neon-glow` | Glowing neon text with ink bleed | 3 |
| `ascii-art` | ASCII art style with gradient | 3 |
| `halftone-print` | CMYK halftone printing effect | 3 |
| `pixel-sort` | Pixel sorting glitch effect | 3 |
| `circuit-bent` | Scanline circuit-bent CRT look | 3 |

## Layer Types

**Source layers:** text, gradient, image, video, custom-shader, live

**Effect layers:** crt, dithering, ascii, pattern, halftone, ink, particle-grid, pixelation, pixel-sorting, posterize, threshold, directional-blur, smear, fluted-glass, plotter, circuit-bent, slice, edge-detect, displacement-map, chromatic-aberration

## Example Workflows

### Build from scratch
```bash
shader-cli project new -o my.lab
shader-cli --project my.lab layer add gradient -p preset=neon-glow -p animate=true
shader-cli --project my.lab layer add text -p "text=ReScience Lab" -p fontSize=201
shader-cli --project my.lab layer add dithering -p algorithm=bayer-4x4
shader-cli --project my.lab layer add crt -p bloomEnabled=true
shader-cli --project my.lab export video -o output.webm
```

### Agent JSON mode
```bash
shader-cli --json layer types
shader-cli --json layer params crt
shader-cli --json --project my.lab layer set 2 -p bloomIntensity=3.0
shader-cli --json --project my.lab project info
```

### REPL mode
```bash
shader-cli
# Enters interactive shell with undo/redo support
```

## Architecture

```
shader-cli/
├── cli/                    # CLI harness (this fork's addition)
│   ├── src/
│   │   ├── index.ts        # Entry + REPL
│   │   ├── commands/       # project, layer, scene, timeline, export, preset
│   │   ├── core/           # project-engine, layer-registry, session
│   │   └── utils/          # output formatting, REPL
│   └── skills/SKILL.md     # Agent skill definition
├── src/                    # Shader Lab editor (upstream)
│   ├── app/                # Next.js App Router
│   ├── components/         # Editor UI
│   ├── lib/                # Config, export logic
│   └── renderer/           # WebGPU shader passes
└── packages/
    └── shader-lab-react/   # @basementstudio/shader-lab runtime
```

**Key design:** All project/layer/scene/timeline commands are pure JSON operations (millisecond-level). Only `export` commands launch a browser with WebGPU for rendering.

## Requirements

- [Node.js](https://nodejs.org/) >= 18
- Chrome/Chromium with WebGPU support (for export — installed automatically via `shader-cli setup`)

## Runtime

Export commands render via a hosted Shader Lab instance at [shader-lab.rescience.dev](https://shader-lab.rescience.dev/tools/shader-lab). No local server needed.

To use a local instance instead:
```bash
shader-cli --runtime http://localhost:3000/tools/shader-lab --project scene.lab export video -o out.webm
```

## Credits

- **Shader Lab** by [basement.studio](https://basement.studio/) — the underlying shader editor and `@basementstudio/shader-lab` runtime
- **CLI-Anything** by [HKUDS](https://github.com/HKUDS/CLI-Anything) — inspiration for the agent harness architecture

## License

[Apache-2.0](LICENSE.md) — same as upstream Shader Lab.
