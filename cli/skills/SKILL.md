# Shader Lab CLI — Agent Skill Definition

## Overview
CLI harness for Shader Lab (https://github.com/basementstudio/shader-lab). Creates, edits, and exports WebGPU shader compositions from the terminal. All project/layer/scene operations are instant (pure JSON). Export triggers a headless Chrome with WebGPU for rendering.

## Installation
```bash
cd shader-lab/cli
bun install
# For export functionality:
bunx playwright install chromium
```

## Quick Start
```bash
# Enter REPL
bun run src/index.ts

# One-shot with preset
bun run src/index.ts -- preset apply crt-text --text "My Text" -o my.lab
bun run src/index.ts -- --project my.lab export video -o output.webm
```

## Command Groups

### project (5 commands)
| Command | Description | Key Options |
|---------|-------------|-------------|
| `project new` | Create new project | `--name`, `--width`, `--height`, `-o` |
| `project open <path>` | Open .lab file | |
| `project save [path]` | Save current project | |
| `project info` | Show project summary | |
| `project json` | Print raw JSON | |

### layer (10 commands)
| Command | Description | Key Options |
|---------|-------------|-------------|
| `layer add <type>` | Add layer | `-n`, `-p key=value...`, `--at` |
| `layer remove <index>` | Remove layer | |
| `layer reorder <from> <to>` | Move layer | |
| `layer set <index> [key] [val]` | Set param | `-p key=value...` |
| `layer list` | List all layers | |
| `layer info <index>` | Show layer details | |
| `layer hide <index>` | Hide layer | |
| `layer show <index>` | Show layer | |
| `layer types` | List available types | |
| `layer params <type>` | Show type parameters | |

**Source layer types:** text, gradient, image, video, custom-shader, live
**Effect layer types:** crt, dithering, ascii, pattern, halftone, ink, particle-grid, pixelation, pixel-sorting, posterize, threshold, directional-blur, smear, fluted-glass, plotter, circuit-bent, slice, edge-detect, displacement-map, chromatic-aberration

### scene (3 commands)
| Command | Description | Key Options |
|---------|-------------|-------------|
| `scene set <key> <val>` | Set scene config | backgroundColor, brightness, contrast, etc. |
| `scene info` | Show scene config | |
| `scene aspect <preset>` | Set aspect ratio | screen, 16:9, 9:16, 4:3, 1:1, custom |

### timeline (4 commands)
| Command | Description | Key Options |
|---------|-------------|-------------|
| `timeline duration <sec>` | Set duration | |
| `timeline loop` | Toggle loop | `--on`, `--off` |
| `timeline info` | Show timeline info | |
| `timeline keyframe add` | Add keyframe | `<layer> <time> <prop> <val> -i smooth` |

### export (3 commands) — requires Chrome + WebGPU
| Command | Description | Key Options |
|---------|-------------|-------------|
| `export video` | Export WebM/MP4 | `-o`, `--format`, `--quality`, `--fps`, `--duration` |
| `export image` | Export PNG | `-o`, `--quality`, `--time` |
| `export project` | Export .lab file | `-o` |

### preset (2 commands)
| Command | Description | Key Options |
|---------|-------------|-------------|
| `preset list` | List presets | |
| `preset apply <name>` | Apply preset | `--text`, `-o`, `--width`, `--height` |

**Built-in presets:** crt-text, neon-glow, ascii-art, halftone-print, pixel-sort, circuit-bent

## Global Options
- `--json` — JSON output for agent consumption
- `--project <path>` — Load project file before command execution

## REPL Commands
Enter REPL with `bun run src/index.ts` (no arguments). Extra commands: `help`, `undo`, `redo`, `quit`.

## Typical Workflows

### Create CRT text animation
```bash
shader-lab preset apply crt-text --text "ReScience Lab" -o scene.lab
shader-lab --project scene.lab export video -o output.webm
```

### Build from scratch
```bash
shader-lab project new -o my.lab
shader-lab --project my.lab layer add gradient -p preset=neon-glow -p animate=true
shader-lab --project my.lab layer add text -p "text=Hello World" -p fontSize=201
shader-lab --project my.lab layer add dithering -p algorithm=bayer-4x4
shader-lab --project my.lab layer add crt -p bloomEnabled=true
shader-lab --project my.lab export video -o hello.webm --fps 60 --quality high
```

### Agent JSON workflow
```bash
shader-lab --json layer types
shader-lab --json layer params crt
shader-lab --json --project my.lab layer set 2 -p bloomIntensity=3.0 -p glitchIntensity=0.5
shader-lab --json --project my.lab project info
```

## Notes
- Project/layer/scene/timeline commands are instant (pure JSON, no browser)
- Export commands launch headless Chrome with WebGPU (requires `bun run dev` in shader-lab root or CLI auto-starts it)
- Auto-saves project after one-shot commands when `--project` is used
- Supports undo/redo in REPL mode
