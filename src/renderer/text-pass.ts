import {
  float,
  type TSLNode,
  texture as tslTexture,
  uv,
  vec2,
  vec4,
} from "three/tsl"
import * as THREE from "three/webgpu"
import {
  getCompositionFrame,
  getCenteredCropFrame,
  intersectCompositionFrames,
} from "@/lib/editor/composition"
import {
  normalizeTextFontWeight,
  resolveTextFontFamily,
} from "@/lib/editor/text-fonts"
import { PassNode } from "@/renderer/pass-node"
import type {
  LayerParameterValues,
  SceneConfig,
  TextAnchor,
} from "@/types/editor"

type Node = TSLNode
type HorizontalAnchor = "left" | "center" | "right"
type VerticalAnchor = "top" | "center" | "bottom"

type TextMetrics = {
  ascent: number
  descent: number
}

type GlyphLayout = {
  advance: number
  char: string
  x: number
}

function resolveTextAnchor(value: unknown): TextAnchor {
  switch (value) {
    case "top-left":
    case "top-center":
    case "top-right":
    case "center-left":
    case "center":
    case "center-right":
    case "bottom-left":
    case "bottom-center":
    case "bottom-right":
      return value
    default:
      return "center"
  }
}

function resolveOffset(value: unknown): [number, number] {
  return Array.isArray(value) && value.length === 2
    ? [value[0] ?? 0, value[1] ?? 0]
    : [0, 0]
}

function getAnchorPlacement(anchor: TextAnchor): {
  horizontal: HorizontalAnchor
  vertical: VerticalAnchor
} {
  switch (anchor) {
    case "top-left":
      return { horizontal: "left", vertical: "top" }
    case "top-center":
      return { horizontal: "center", vertical: "top" }
    case "top-right":
      return { horizontal: "right", vertical: "top" }
    case "center-left":
      return { horizontal: "left", vertical: "center" }
    case "center-right":
      return { horizontal: "right", vertical: "center" }
    case "bottom-left":
      return { horizontal: "left", vertical: "bottom" }
    case "bottom-center":
      return { horizontal: "center", vertical: "bottom" }
    case "bottom-right":
      return { horizontal: "right", vertical: "bottom" }
    default:
      return { horizontal: "center", vertical: "center" }
  }
}

function getTextMetrics(
  context: CanvasRenderingContext2D,
  text: string,
  fontSize: number
): TextMetrics {
  const measured = context.measureText(text)
  const fallbackAscent = fontSize * 0.78
  const fallbackDescent = fontSize * 0.22

  return {
    ascent:
      measured.actualBoundingBoxAscent > 0
        ? measured.actualBoundingBoxAscent
        : fallbackAscent,
    descent:
      measured.actualBoundingBoxDescent > 0
        ? measured.actualBoundingBoxDescent
        : fallbackDescent,
  }
}

export class TextPass extends PassNode {
  private readonly placeholder: THREE.Texture
  private textureNode: Node
  private textTexture: THREE.CanvasTexture | null = null
  private canvas: HTMLCanvasElement | null = null
  private width = 1
  private height = 1
  private logicalWidth = 1
  private logicalHeight = 1
  private compositionAspect: SceneConfig["compositionAspect"] = "screen"
  private compositionWidth = 1920
  private compositionHeight = 1080
  private outputCropAspectRatio: number | null = null
  private params: LayerParameterValues = {}
  private dirty = true

  constructor(layerId: string) {
    super(layerId)
    this.placeholder = new THREE.Texture()
    this.textureNode = tslTexture(
      this.placeholder,
      vec2(uv().x, float(1).sub(uv().y))
    )
    this.rebuildEffectNode()
  }

  override render(
    renderer: THREE.WebGPURenderer,
    inputTexture: THREE.Texture,
    outputTarget: THREE.WebGLRenderTarget,
    time: number,
    delta: number
  ): void {
    if (!this.textTexture || this.dirty) {
      this.rebuildTextTexture()
    }

    this.textureNode.value = this.textTexture ?? this.placeholder
    super.render(renderer, inputTexture, outputTarget, time, delta)
  }

  override updateParams(params: LayerParameterValues): void {
    this.params = params
    this.dirty = true
  }

  override resize(width: number, height: number): void {
    this.width = Math.max(1, width)
    this.height = Math.max(1, height)
    this.dirty = true
  }

  override updateLogicalSize(width: number, height: number): void {
    this.logicalWidth = Math.max(1, width)
    this.logicalHeight = Math.max(1, height)
    this.dirty = true
  }

  override updateSceneConfig(config: SceneConfig): boolean {
    if (
      config.compositionAspect === this.compositionAspect &&
      config.compositionWidth === this.compositionWidth &&
      config.compositionHeight === this.compositionHeight
    ) {
      return false
    }

    this.compositionAspect = config.compositionAspect
    this.compositionWidth = config.compositionWidth
    this.compositionHeight = config.compositionHeight
    this.dirty = true
    return true
  }

  override updateOutputCropAspectRatio(ratio: number | null): boolean {
    if (ratio === this.outputCropAspectRatio) {
      return false
    }

    this.outputCropAspectRatio = ratio
    this.dirty = true
    return true
  }

  override dispose(): void {
    this.textTexture?.dispose()
    this.placeholder.dispose()
    super.dispose()
  }

  protected override buildEffectNode(): Node {
    if (!this.textureNode) {
      return vec4(float(0), float(0), float(0), float(0))
    }

    return vec4(this.textureNode.rgb, this.textureNode.a)
  }

  private rebuildTextTexture(): void {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas")
    }

    const canvas = this.canvas
    canvas.width = this.width
    canvas.height = this.height
    const context = canvas.getContext("2d")

    if (!context) {
      return
    }

    const scaleFactor = this.width / this.logicalWidth

    const text =
      typeof this.params.text === "string" && this.params.text.length > 0
        ? this.params.text
        : "basement.studio"
    const baseFontSize =
      typeof this.params.fontSize === "number"
        ? Math.max(48, this.params.fontSize)
        : 280
    const fontSize = Math.round(baseFontSize * scaleFactor)
    const fontFamilyValue =
      typeof this.params.fontFamily === "string"
        ? this.params.fontFamily
        : "display-serif"
    const fontWeight =
      typeof this.params.fontWeight === "number" ? this.params.fontWeight : 700
    const letterSpacing =
      typeof this.params.letterSpacing === "number"
        ? this.params.letterSpacing
        : -0.02
    const fontFamily = resolveTextFontFamily(fontFamilyValue)
    const normalizedFontWeight = normalizeTextFontWeight(
      fontFamilyValue,
      fontWeight
    )
    const textColor =
      typeof this.params.textColor === "string"
        ? this.params.textColor
        : "#ffffff"
    const backgroundColor =
      typeof this.params.backgroundColor === "string"
        ? this.params.backgroundColor
        : "#000000"
    const backgroundAlpha =
      typeof this.params.backgroundAlpha === "number"
        ? Math.max(0, Math.min(1, this.params.backgroundAlpha))
        : 1
    const anchor = resolveTextAnchor(this.params.anchor)
    const offset = resolveOffset(this.params.offset)
    const { horizontal, vertical } = getAnchorPlacement(anchor)

    context.clearRect(0, 0, this.width, this.height)
    context.fillStyle = backgroundColor
    context.globalAlpha = backgroundAlpha
    context.fillRect(0, 0, this.width, this.height)
    context.globalAlpha = 1
    context.fillStyle = textColor
    context.textAlign = "left"
    context.textBaseline = "alphabetic"
    context.font = `${normalizedFontWeight} ${fontSize}px ${fontFamily}`

    const lineHeight =
      typeof this.params.lineHeight === "number"
        ? this.params.lineHeight
        : 1.3
    const lines = text.split("\n")

    type LineLayout = {
      glyphs: GlyphLayout[]
      visualLeft: number
      visualRight: number
      metrics: TextMetrics
      lineFontSize: number
    }

    function layoutLine(
      ctx: CanvasRenderingContext2D,
      line: string,
      lineFontSize: number,
      lineLetterSpacing: number
    ): LineLayout {
      ctx.font = `${normalizedFontWeight} ${lineFontSize}px ${fontFamily}`
      const characters = [...line]
      const spacing = lineFontSize * lineLetterSpacing
      const glyphs: GlyphLayout[] = []
      let vLeft = Number.POSITIVE_INFINITY
      let vRight = Number.NEGATIVE_INFINITY
      let cursorX = 0

      for (const [index, char] of characters.entries()) {
        const m = ctx.measureText(char)
        const advance = m.width
        const glyphLeft = cursorX - Math.max(0, m.actualBoundingBoxLeft)
        const glyphRight =
          cursorX + Math.max(m.actualBoundingBoxRight, advance)

        glyphs.push({ advance, char, x: cursorX })
        vLeft = Math.min(vLeft, glyphLeft)
        vRight = Math.max(vRight, glyphRight)
        cursorX += advance

        if (index < characters.length - 1) {
          cursorX += spacing
        }
      }

      if (!Number.isFinite(vLeft)) {
        vLeft = 0
        vRight = 0
      }

      return {
        glyphs,
        lineFontSize,
        metrics: getTextMetrics(ctx, line.length > 0 ? line : "M", lineFontSize),
        visualLeft: vLeft,
        visualRight: vRight,
      }
    }

    // Layout first line at full fontSize, subsequent lines auto-shrink to fit
    const maxLineWidth = this.width * 0.9
    const lineLayouts: LineLayout[] = []
    for (const [i, line] of lines.entries()) {
      if (i === 0) {
        lineLayouts.push(layoutLine(context, line, fontSize, letterSpacing))
      } else {
        // Try at fontSize first, shrink if too wide
        let trySize = fontSize
        let layout = layoutLine(context, line, trySize, letterSpacing)
        const lineWidth = layout.visualRight - layout.visualLeft
        if (lineWidth > maxLineWidth && lineWidth > 0) {
          trySize = Math.max(
            Math.round(fontSize * 0.3),
            Math.round(trySize * (maxLineWidth / lineWidth))
          )
          layout = layoutLine(context, line, trySize, letterSpacing)
        }
        lineLayouts.push(layout)
      }
    }

    // Restore font for metrics consistency
    context.font = `${normalizedFontWeight} ${fontSize}px ${fontFamily}`

    const sceneCropFrame = getCompositionFrame(
      {
        backgroundColor,
        brightness: 0,
        channelMixer: {
          bb: 1,
          bg: 0,
          br: 0,
          gb: 0,
          gg: 1,
          gr: 0,
          rb: 0,
          rg: 0,
          rr: 1,
        },
        clampMax: 1,
        clampMin: 0,
        colorMap: null,
        compositionAspect: this.compositionAspect,
        compositionHeight: this.compositionHeight,
        compositionWidth: this.compositionWidth,
        contrast: 0,
        invert: false,
        quantizeLevels: 256,
      },
      {
        height: this.logicalHeight,
        width: this.logicalWidth,
      }
    )
    const renderCropFrame = getCenteredCropFrame(
      {
        height: this.height,
        width: this.width,
      },
      this.outputCropAspectRatio
    )
    const scaleFactorY = this.height / this.logicalHeight
    const combinedCropFrame = intersectCompositionFrames(
      {
        height: sceneCropFrame.height * scaleFactorY,
        width: sceneCropFrame.width * scaleFactor,
        x: sceneCropFrame.x * scaleFactor,
        y: sceneCropFrame.y * scaleFactorY,
      },
      renderCropFrame
    )
    const cropX = combinedCropFrame.x
    const cropY = combinedCropFrame.y
    const cropWidth = combinedCropFrame.width
    const cropHeight = combinedCropFrame.height

    let anchorX = cropX + cropWidth * 0.5
    if (horizontal === "left") {
      anchorX = cropX
    } else if (horizontal === "right") {
      anchorX = cropX + cropWidth
    }

    let anchorY = cropY + cropHeight * 0.5
    if (vertical === "top") {
      anchorY = cropY
    } else if (vertical === "bottom") {
      anchorY = cropY + cropHeight
    }

    const offsetX = offset[0] * cropWidth
    const offsetY = offset[1] * cropHeight

    const totalBlockHeight = lineLayouts.reduce((sum, l, i) => {
      return i === 0 ? 0 : sum + l.lineFontSize * lineHeight
    }, 0)

    let cumulativeY = -totalBlockHeight * 0.5
    for (const layout of lineLayouts) {
      context.font = `${normalizedFontWeight} ${layout.lineFontSize}px ${fontFamily}`

      let startX = anchorX + offsetX - (layout.visualLeft + layout.visualRight) * 0.5
      if (horizontal === "left") {
        startX = anchorX + offsetX - layout.visualLeft
      } else if (horizontal === "right") {
        startX = anchorX + offsetX - layout.visualRight
      }

      let baselineY =
        anchorY - offsetY + cumulativeY +
        (layout.metrics.ascent - layout.metrics.descent) * 0.5
      if (vertical === "top") {
        baselineY = anchorY - offsetY + cumulativeY + layout.metrics.ascent
      } else if (vertical === "bottom") {
        baselineY = anchorY - offsetY + cumulativeY - layout.metrics.descent
      }

      for (const glyph of layout.glyphs) {
        context.fillText(glyph.char, startX + glyph.x, baselineY)
      }

      cumulativeY += layout.lineFontSize * lineHeight
    }

    if (!this.textTexture) {
      this.textTexture = new THREE.CanvasTexture(canvas)
      this.textTexture.flipY = false
      this.textTexture.generateMipmaps = false
      this.textTexture.magFilter = THREE.LinearFilter
      this.textTexture.minFilter = THREE.LinearFilter
      this.textTexture.wrapS = THREE.ClampToEdgeWrapping
      this.textTexture.wrapT = THREE.ClampToEdgeWrapping
      this.textTexture.colorSpace = THREE.SRGBColorSpace
    } else {
      this.textTexture.image = canvas
    }

    this.textTexture.needsUpdate = true
    this.dirty = false
  }
}
