import type { LabProject, EditorLayer, TimelineTrack, SceneConfig } from "./project-engine.js"

export type ParamType = "number" | "boolean" | "color" | "text" | "select" | "vec2" | "vec3"

export interface ParamDef {
  key: string
  label: string
  type: ParamType
  defaultValue: unknown
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: string }[]
  group?: string
}

export interface LayerTypeDef {
  type: string
  defaultName: string
  kind: "source" | "effect"
  params: ParamDef[]
}

const LAYER_DEFS: Record<string, LayerTypeDef> = {
  text: {
    type: "text", defaultName: "Text", kind: "source",
    params: [
      { key: "text", label: "Text", type: "text", defaultValue: "shader-lab" },
      { key: "fontSize", label: "Font Size", type: "number", defaultValue: 48, min: 48, max: 600, step: 1 },
      { key: "fontFamily", label: "Font", type: "select", defaultValue: "sans", options: [{ label: "Display Serif", value: "display-serif" }, { label: "Mono", value: "mono" }, { label: "Sans", value: "sans" }, { label: "Impact", value: "impact" }] },
      { key: "fontWeight", label: "Weight", type: "number", defaultValue: 700, min: 300, max: 900, step: 100 },
      { key: "letterSpacing", label: "Letter Spacing", type: "number", defaultValue: -0.05, min: -0.2, max: 0.3, step: 0.01 },
      { key: "textColor", label: "Text Color", type: "color", defaultValue: "#ffffff" },
      { key: "backgroundColor", label: "Background", type: "color", defaultValue: "#000000" },
    ],
  },
  gradient: {
    type: "gradient", defaultName: "Gradient", kind: "source",
    params: [
      { key: "preset", label: "Preset", type: "select", defaultValue: "custom", options: [{ label: "Custom", value: "custom" }, { label: "Forest", value: "aurora" }, { label: "Ember", value: "sunset" }, { label: "Abyss", value: "deep-ocean" }, { label: "Violet", value: "neon-glow" }] },
      { key: "activePoints", label: "Active Points", type: "number", defaultValue: 3, min: 2, max: 5, step: 1 },
      { key: "point1Color", label: "Point 1 Color", type: "color", defaultValue: "#0E0C0C" },
      { key: "point1Position", label: "Point 1 Position", type: "vec2", defaultValue: [-0.82, -0.62] },
      { key: "point1Weight", label: "Point 1 Weight", type: "number", defaultValue: 0.42, min: 0, max: 3, step: 0.01 },
      { key: "point2Color", label: "Point 2 Color", type: "color", defaultValue: "#C1FF00" },
      { key: "point2Position", label: "Point 2 Position", type: "vec2", defaultValue: [0.22, 0.72] },
      { key: "point2Weight", label: "Point 2 Weight", type: "number", defaultValue: 1.55, min: 0, max: 3, step: 0.01 },
      { key: "point3Color", label: "Point 3 Color", type: "color", defaultValue: "#B2DAD5" },
      { key: "point3Position", label: "Point 3 Position", type: "vec2", defaultValue: [0.88, -0.26] },
      { key: "point3Weight", label: "Point 3 Weight", type: "number", defaultValue: 0.64, min: 0, max: 3, step: 0.01 },
      { key: "noiseType", label: "Noise", type: "select", defaultValue: "simplex", options: [{ label: "Simplex", value: "simplex" }, { label: "Perlin", value: "perlin" }, { label: "Value", value: "value" }, { label: "Voronoi", value: "voronoi" }, { label: "Ridge", value: "ridge" }, { label: "Turbulence", value: "turbulence" }] },
      { key: "noiseSeed", label: "Seed", type: "number", defaultValue: 0, min: 0, max: 100, step: 0.1 },
      { key: "warpAmount", label: "Warp Amount", type: "number", defaultValue: 0.64, min: 0, max: 1, step: 0.01 },
      { key: "warpScale", label: "Warp Scale", type: "number", defaultValue: 5.56, min: 0.1, max: 6, step: 0.01 },
      { key: "animate", label: "Animate", type: "boolean", defaultValue: true },
      { key: "motionAmount", label: "Motion Amount", type: "number", defaultValue: 0, min: 0, max: 1, step: 0.01 },
      { key: "motionSpeed", label: "Motion Speed", type: "number", defaultValue: 0.2, min: 0, max: 2, step: 0.01 },
      { key: "tonemapMode", label: "Tonemap", type: "select", defaultValue: "reinhard", options: [{ label: "None", value: "none" }, { label: "ACES", value: "aces" }, { label: "Reinhard", value: "reinhard" }, { label: "Toto's", value: "totos" }, { label: "Cinematic", value: "cinematic" }] },
      { key: "grainAmount", label: "Grain", type: "number", defaultValue: 0.08, min: 0, max: 1, step: 0.01 },
      { key: "vignetteStrength", label: "Vignette Strength", type: "number", defaultValue: 0.12, min: 0, max: 1, step: 0.01 },
    ],
  },
  image: { type: "image", defaultName: "Image", kind: "source", params: [
    { key: "fitMode", label: "Fit", type: "select", defaultValue: "cover", options: [{ label: "Cover", value: "cover" }, { label: "Contain", value: "contain" }] },
    { key: "scale", label: "Scale", type: "number", defaultValue: 1, min: 0.25, max: 4, step: 0.01 },
    { key: "offset", label: "Offset", type: "vec2", defaultValue: [0, 0] },
  ]},
  video: { type: "video", defaultName: "Video", kind: "source", params: [
    { key: "fitMode", label: "Fit", type: "select", defaultValue: "cover", options: [{ label: "Cover", value: "cover" }, { label: "Contain", value: "contain" }] },
    { key: "scale", label: "Scale", type: "number", defaultValue: 1, min: 0.25, max: 4, step: 0.01 },
    { key: "offset", label: "Offset", type: "vec2", defaultValue: [0, 0] },
    { key: "playbackRate", label: "Playback Rate", type: "number", defaultValue: 1, min: 0.25, max: 4, step: 0.05 },
  ]},
  "custom-shader": { type: "custom-shader", defaultName: "Custom Shader", kind: "source", params: [
    { key: "effectMode", label: "Effect Mode", type: "boolean", defaultValue: false },
    { key: "sourceCode", label: "Source Code", type: "text", defaultValue: "" },
    { key: "entryExport", label: "Entry Export", type: "text", defaultValue: "sketch" },
  ]},
  live: { type: "live", defaultName: "Live Camera", kind: "source", params: [
    { key: "facingMode", label: "Camera", type: "select", defaultValue: "user", options: [{ label: "Front", value: "user" }, { label: "Back", value: "environment" }] },
    { key: "mirror", label: "Mirror", type: "boolean", defaultValue: true },
  ]},
  crt: {
    type: "crt", defaultName: "CRT", kind: "effect",
    params: [
      { key: "crtMode", label: "Mode", type: "select", defaultValue: "slot-mask", options: [{ label: "Slot-Mask Monitor", value: "slot-mask" }, { label: "Aperture-Grille Monitor", value: "aperture-grille" }, { label: "Composite TV", value: "composite-tv" }] },
      { key: "cellSize", label: "Mask Scale", type: "number", defaultValue: 3, min: 3, max: 32, step: 1 },
      { key: "scanlineIntensity", label: "Scanline Intensity", type: "number", defaultValue: 0.17, min: 0, max: 1, step: 0.01 },
      { key: "maskIntensity", label: "Mask Intensity", type: "number", defaultValue: 1, min: 0, max: 1, step: 0.01 },
      { key: "barrelDistortion", label: "Barrel Distortion", type: "number", defaultValue: 0.15, min: 0, max: 0.3, step: 0.001, group: "Distortion" },
      { key: "chromaticAberration", label: "Convergence", type: "number", defaultValue: 2, min: 0, max: 2, step: 0.01, group: "Distortion" },
      { key: "beamFocus", label: "Beam Focus", type: "number", defaultValue: 0.58, min: 0, max: 1, step: 0.01, group: "Phosphor" },
      { key: "brightness", label: "Brightness", type: "number", defaultValue: 1.2, min: 0.5, max: 100, step: 0.01, group: "Phosphor" },
      { key: "highlightDrive", label: "Highlight Drive", type: "number", defaultValue: 1, min: 1, max: 100, step: 0.01, group: "Phosphor" },
      { key: "highlightThreshold", label: "Highlight Threshold", type: "number", defaultValue: 0.62, min: 0, max: 1, step: 0.01, group: "Phosphor" },
      { key: "shoulder", label: "Shoulder", type: "number", defaultValue: 0.25, min: 0, max: 4, step: 0.01, group: "Phosphor" },
      { key: "chromaRetention", label: "Chroma Retention", type: "number", defaultValue: 1.15, min: 0, max: 2, step: 0.01, group: "Phosphor" },
      { key: "shadowLift", label: "Shadow Lift", type: "number", defaultValue: 0.16, min: 0, max: 1, step: 0.01, group: "Phosphor" },
      { key: "persistence", label: "Persistence", type: "number", defaultValue: 0.18, min: 0, max: 1, step: 0.01, group: "Phosphor" },
      { key: "vignetteIntensity", label: "Vignette", type: "number", defaultValue: 0.45, min: 0, max: 1, step: 0.01, group: "Distortion" },
      { key: "flickerIntensity", label: "Flicker", type: "number", defaultValue: 0.2, min: 0, max: 0.2, step: 0.01, group: "Noise" },
      { key: "glitchIntensity", label: "Glitch", type: "number", defaultValue: 0.13, min: 0, max: 1, step: 0.01, group: "Noise" },
      { key: "glitchSpeed", label: "Glitch Speed", type: "number", defaultValue: 5, min: 0.1, max: 5, step: 0.1, group: "Noise" },
      { key: "bloomEnabled", label: "Bloom", type: "boolean", defaultValue: true, group: "Bloom" },
      { key: "bloomIntensity", label: "Bloom Intensity", type: "number", defaultValue: 1.93, min: 0, max: 8, step: 0.01, group: "Bloom" },
      { key: "bloomThreshold", label: "Bloom Threshold", type: "number", defaultValue: 0, min: 0, max: 1, step: 0.01, group: "Bloom" },
      { key: "bloomRadius", label: "Bloom Radius", type: "number", defaultValue: 8, min: 0, max: 24, step: 0.25, group: "Bloom" },
      { key: "bloomSoftness", label: "Bloom Softness", type: "number", defaultValue: 0.31, min: 0, max: 1, step: 0.01, group: "Bloom" },
    ],
  },
  dithering: {
    type: "dithering", defaultName: "Dithering", kind: "effect",
    params: [
      { key: "preset", label: "Preset", type: "select", defaultValue: "custom", options: [{ label: "Custom", value: "custom" }, { label: "Game Boy", value: "gameboy" }] },
      { key: "algorithm", label: "Algorithm", type: "select", defaultValue: "bayer-4x4", options: [{ label: "Bayer 2x2", value: "bayer-2x2" }, { label: "Bayer 4x4", value: "bayer-4x4" }, { label: "Bayer 8x8", value: "bayer-8x8" }, { label: "Noise", value: "noise" }] },
      { key: "colorMode", label: "Color Mode", type: "select", defaultValue: "source", options: [{ label: "Monochrome", value: "monochrome" }, { label: "Source Color", value: "source" }, { label: "Duo Tone", value: "duo-tone" }] },
      { key: "monoColor", label: "Color", type: "color", defaultValue: "#f5f5f0" },
      { key: "pixelSize", label: "Pixel Size", type: "number", defaultValue: 1, min: 1, max: 24, step: 1 },
      { key: "spread", label: "Strength", type: "number", defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
      { key: "levels", label: "Levels", type: "number", defaultValue: 4, min: 2, max: 16, step: 1 },
      { key: "chromaticSplit", label: "Chromatic Split", type: "boolean", defaultValue: false },
    ],
  },
  ascii: {
    type: "ascii", defaultName: "ASCII", kind: "effect",
    params: [
      { key: "cellSize", label: "Cell Size", type: "number", defaultValue: 12, min: 4, max: 48, step: 1 },
      { key: "charset", label: "Charset", type: "select", defaultValue: "light", options: [{ label: "Light", value: "light" }, { label: "Dense", value: "dense" }, { label: "Blocks", value: "blocks" }, { label: "Hatching", value: "hatching" }, { label: "Binary", value: "binary" }, { label: "Custom", value: "custom" }] },
      { key: "colorMode", label: "Color Mode", type: "select", defaultValue: "monochrome", options: [{ label: "Source", value: "source" }, { label: "Monochrome", value: "monochrome" }] },
      { key: "monoColor", label: "Tint", type: "color", defaultValue: "#f5f5f0" },
      { key: "invert", label: "Invert", type: "boolean", defaultValue: false },
      { key: "bloomEnabled", label: "Bloom", type: "boolean", defaultValue: false },
      { key: "bloomIntensity", label: "Bloom Intensity", type: "number", defaultValue: 1.25, min: 0, max: 8, step: 0.01 },
    ],
  },
  pattern: {
    type: "pattern", defaultName: "Pattern", kind: "effect",
    params: [
      { key: "cellSize", label: "Cell Size", type: "number", defaultValue: 12, min: 4, max: 48, step: 1 },
      { key: "preset", label: "Preset", type: "select", defaultValue: "bars", options: [{ label: "Bars", value: "bars" }, { label: "Candles", value: "candles" }, { label: "Shapes", value: "shapes" }] },
      { key: "colorMode", label: "Color Mode", type: "select", defaultValue: "source", options: [{ label: "Source", value: "source" }, { label: "Quantized", value: "quantized" }, { label: "Monochrome", value: "monochrome" }, { label: "Custom", value: "custom" }] },
      { key: "monoColor", label: "Tint", type: "color", defaultValue: "#f5f5f0" },
      { key: "bgOpacity", label: "Background", type: "number", defaultValue: 0, min: 0, max: 1, step: 0.01 },
      { key: "invert", label: "Invert", type: "boolean", defaultValue: false },
      { key: "bloomEnabled", label: "Bloom", type: "boolean", defaultValue: false },
      { key: "bloomIntensity", label: "Bloom Intensity", type: "number", defaultValue: 1.25, min: 0, max: 8, step: 0.01 },
    ],
  },
  halftone: {
    type: "halftone", defaultName: "Halftone", kind: "effect",
    params: [
      { key: "colorMode", label: "Color Mode", type: "select", defaultValue: "cmyk", options: [{ label: "Source", value: "source" }, { label: "Monochrome", value: "monochrome" }, { label: "Duotone", value: "duotone" }, { label: "Custom", value: "custom" }, { label: "CMYK", value: "cmyk" }] },
      { key: "shape", label: "Shape", type: "select", defaultValue: "circle", options: [{ label: "Circle", value: "circle" }, { label: "Square", value: "square" }, { label: "Diamond", value: "diamond" }, { label: "Line", value: "line" }] },
      { key: "spacing", label: "Spacing", type: "number", defaultValue: 5, min: 2, max: 48, step: 1 },
      { key: "dotSize", label: "Dot Size", type: "number", defaultValue: 1, min: 0.1, max: 3, step: 0.01 },
      { key: "angle", label: "Angle", type: "number", defaultValue: 28, min: 0, max: 360, step: 1 },
      { key: "contrast", label: "Contrast", type: "number", defaultValue: 1, min: 0, max: 2, step: 0.01 },
      { key: "softness", label: "Softness", type: "number", defaultValue: 0.25, min: 0, max: 1, step: 0.01 },
    ],
  },
  ink: {
    type: "ink", defaultName: "Ink", kind: "effect",
    params: [
      { key: "blurPasses", label: "Trail Passes", type: "number", defaultValue: 13, min: 1, max: 20, step: 1 },
      { key: "crispBlend", label: "Text Clarity", type: "number", defaultValue: 0.81, min: 0, max: 1, step: 0.01 },
      { key: "blurStrength", label: "Bleed Strength", type: "number", defaultValue: 0.044, min: 0.001, max: 0.08, step: 0.001 },
      { key: "coreColor", label: "Core Color", type: "color", defaultValue: "#fffde8" },
      { key: "midColor", label: "Mid Color", type: "color", defaultValue: "#FFA700" },
      { key: "edgeColor", label: "Edge Color", type: "color", defaultValue: "#7192F1" },
      { key: "backgroundColor", label: "Background", type: "color", defaultValue: "#000000" },
      { key: "bloomEnabled", label: "Bloom", type: "boolean", defaultValue: true },
      { key: "bloomIntensity", label: "Bloom Intensity", type: "number", defaultValue: 6.19, min: 0, max: 8, step: 0.01 },
    ],
  },
  "particle-grid": {
    type: "particle-grid", defaultName: "Particle Grid", kind: "effect",
    params: [
      { key: "gridResolution", label: "Resolution", type: "number", defaultValue: 256, min: 32, max: 512, step: 4 },
      { key: "pointSize", label: "Point Size", type: "number", defaultValue: 4, min: 1, max: 32, step: 1 },
      { key: "displacement", label: "Displacement", type: "number", defaultValue: 0.1, min: -2, max: 2, step: 0.01 },
      { key: "backgroundColor", label: "Background", type: "color", defaultValue: "#000000" },
      { key: "noiseAmount", label: "Noise Amount", type: "number", defaultValue: 0, min: 0, max: 2, step: 0.01 },
      { key: "noiseSpeed", label: "Noise Speed", type: "number", defaultValue: 0.5, min: 0, max: 3, step: 0.01 },
    ],
  },
  pixelation: {
    type: "pixelation", defaultName: "Pixelation", kind: "effect",
    params: [
      { key: "cellSize", label: "Cell Size", type: "number", defaultValue: 8, min: 2, max: 64, step: 1 },
      { key: "aspectRatio", label: "Aspect Ratio", type: "number", defaultValue: 1, min: 0.25, max: 4, step: 0.05 },
    ],
  },
  "pixel-sorting": {
    type: "pixel-sorting", defaultName: "Pixel Sorting", kind: "effect",
    params: [
      { key: "threshold", label: "Threshold", type: "number", defaultValue: 0.25, min: 0, max: 1, step: 0.01 },
      { key: "upperThreshold", label: "Upper Threshold", type: "number", defaultValue: 1, min: 0, max: 1, step: 0.01 },
      { key: "direction", label: "Direction", type: "select", defaultValue: "horizontal", options: [{ label: "Horizontal", value: "horizontal" }, { label: "Vertical", value: "vertical" }] },
      { key: "mode", label: "Mode", type: "select", defaultValue: "luma", options: [{ label: "Luma", value: "luma" }, { label: "Hue", value: "hue" }, { label: "Saturation", value: "saturation" }] },
      { key: "reverse", label: "Reverse", type: "boolean", defaultValue: false },
      { key: "range", label: "Range", type: "number", defaultValue: 0.3, min: 0, max: 1, step: 0.01 },
    ],
  },
  posterize: {
    type: "posterize", defaultName: "Posterize", kind: "effect",
    params: [
      { key: "levels", label: "Levels", type: "number", defaultValue: 5, min: 2, max: 16, step: 1 },
      { key: "gamma", label: "Gamma", type: "number", defaultValue: 1, min: 0.4, max: 2.5, step: 0.01 },
      { key: "mode", label: "Mode", type: "select", defaultValue: "rgb", options: [{ label: "RGB", value: "rgb" }, { label: "Luma", value: "luma" }] },
    ],
  },
  threshold: {
    type: "threshold", defaultName: "Threshold", kind: "effect",
    params: [
      { key: "threshold", label: "Threshold", type: "number", defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
      { key: "softness", label: "Softness", type: "number", defaultValue: 0.02, min: 0, max: 0.2, step: 0.001 },
      { key: "noise", label: "Noise", type: "number", defaultValue: 0.08, min: 0, max: 0.3, step: 0.001 },
      { key: "invert", label: "Invert", type: "boolean", defaultValue: false },
    ],
  },
  "directional-blur": {
    type: "directional-blur", defaultName: "Directional Blur", kind: "effect",
    params: [
      { key: "mode", label: "Mode", type: "select", defaultValue: "linear", options: [{ label: "Linear", value: "linear" }, { label: "Radial", value: "radial" }] },
      { key: "strength", label: "Strength", type: "number", defaultValue: 18, min: 0, max: 96, step: 0.5 },
      { key: "samples", label: "Samples", type: "number", defaultValue: 8, min: 1, max: 16, step: 1 },
      { key: "angle", label: "Angle", type: "number", defaultValue: 0, min: 0, max: 360, step: 1 },
    ],
  },
  smear: {
    type: "smear", defaultName: "Progressive Blur", kind: "effect",
    params: [
      { key: "angle", label: "Angle", type: "number", defaultValue: 0, min: 0, max: 360, step: 1 },
      { key: "start", label: "Start", type: "number", defaultValue: 0.25, min: 0, max: 1, step: 0.01 },
      { key: "end", label: "End", type: "number", defaultValue: 0.75, min: 0, max: 1, step: 0.01 },
      { key: "strength", label: "Strength", type: "number", defaultValue: 24, min: 0, max: 64, step: 1 },
      { key: "samples", label: "Samples", type: "number", defaultValue: 12, min: 4, max: 32, step: 1 },
    ],
  },
  "fluted-glass": {
    type: "fluted-glass", defaultName: "Fluted Glass", kind: "effect",
    params: [
      { key: "preset", label: "Preset", type: "select", defaultValue: "architectural", options: [{ label: "Architectural", value: "architectural" }, { label: "Painterly", value: "painterly" }] },
      { key: "frequency", label: "Frequency", type: "number", defaultValue: 20, min: 2, max: 100, step: 1 },
      { key: "amplitude", label: "Amplitude", type: "number", defaultValue: 0.02, min: 0, max: 0.1, step: 0.001 },
      { key: "angle", label: "Angle", type: "number", defaultValue: 0, min: 0, max: 360, step: 1 },
    ],
  },
  plotter: {
    type: "plotter", defaultName: "Plotter", kind: "effect",
    params: [
      { key: "colorMode", label: "Color", type: "select", defaultValue: "ink", options: [{ label: "Ink", value: "ink" }, { label: "Source", value: "source" }] },
      { key: "gap", label: "Gap", type: "number", defaultValue: 12, min: 10, max: 120, step: 1 },
      { key: "weight", label: "Weight", type: "number", defaultValue: 1.5, min: 0.5, max: 5, step: 0.1 },
      { key: "angle", label: "Angle", type: "number", defaultValue: 90, min: 0, max: 180, step: 1 },
      { key: "crosshatch", label: "Crosshatch", type: "boolean", defaultValue: true },
      { key: "threshold", label: "Threshold", type: "number", defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
      { key: "wobble", label: "Wobble", type: "number", defaultValue: 0.3, min: 0, max: 1, step: 0.01 },
      { key: "paperColor", label: "Paper Color", type: "color", defaultValue: "#f5f0e8" },
      { key: "inkColor", label: "Ink Color", type: "color", defaultValue: "#1a1a1a" },
    ],
  },
  "circuit-bent": {
    type: "circuit-bent", defaultName: "Circuit Bent", kind: "effect",
    params: [
      { key: "colorMode", label: "Color Mode", type: "select", defaultValue: "source", options: [{ label: "Source", value: "source" }, { label: "Monochrome", value: "monochrome" }] },
      { key: "linePitch", label: "Pitch", type: "number", defaultValue: 6.4, min: 2, max: 48, step: 0.1 },
      { key: "lineThickness", label: "Thickness", type: "number", defaultValue: 0.5, min: 0.5, max: 8, step: 0.1 },
      { key: "lineAngle", label: "Angle", type: "number", defaultValue: 0, min: 0, max: 180, step: 1 },
      { key: "scrollSpeed", label: "Scroll Speed", type: "number", defaultValue: 4, min: 0, max: 4, step: 0.01 },
    ],
  },
  slice: {
    type: "slice", defaultName: "Slice", kind: "effect",
    params: [
      { key: "amount", label: "Amount", type: "number", defaultValue: 180, min: 0, max: 480, step: 1 },
      { key: "sliceHeight", label: "Slice Height", type: "number", defaultValue: 28, min: 2, max: 240, step: 1 },
      { key: "blockWidth", label: "Block Width", type: "number", defaultValue: 120, min: 8, max: 640, step: 1 },
      { key: "density", label: "Density", type: "number", defaultValue: 0.58, min: 0, max: 1, step: 0.01 },
      { key: "speed", label: "Speed", type: "number", defaultValue: 0.2, min: 0, max: 2, step: 0.01 },
      { key: "direction", label: "Direction", type: "select", defaultValue: "right", options: [{ label: "Right", value: "right" }, { label: "Left", value: "left" }, { label: "Both", value: "both" }] },
    ],
  },
  "edge-detect": {
    type: "edge-detect", defaultName: "Edge Detect", kind: "effect",
    params: [
      { key: "threshold", label: "Threshold", type: "number", defaultValue: 0.1, min: 0, max: 1, step: 0.01 },
      { key: "strength", label: "Strength", type: "number", defaultValue: 1, min: 0.1, max: 5, step: 0.1 },
      { key: "invert", label: "Invert", type: "boolean", defaultValue: false },
      { key: "colorMode", label: "Color", type: "select", defaultValue: "overlay", options: [{ label: "Overlay", value: "overlay" }, { label: "Mono", value: "mono" }, { label: "Source", value: "source" }] },
    ],
  },
  "displacement-map": {
    type: "displacement-map", defaultName: "Displacement Map", kind: "effect",
    params: [
      { key: "strength", label: "Strength", type: "number", defaultValue: 20, min: 0, max: 200, step: 1 },
      { key: "direction", label: "Direction", type: "select", defaultValue: "both", options: [{ label: "Both", value: "both" }, { label: "Horizontal", value: "horizontal" }, { label: "Vertical", value: "vertical" }] },
      { key: "channel", label: "Channel", type: "select", defaultValue: "luminance", options: [{ label: "Luminance", value: "luminance" }, { label: "Red", value: "red" }, { label: "Green", value: "green" }, { label: "Blue", value: "blue" }] },
      { key: "midpoint", label: "Midpoint", type: "number", defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    ],
  },
  "chromatic-aberration": {
    type: "chromatic-aberration", defaultName: "Chromatic Aberration", kind: "effect",
    params: [
      { key: "intensity", label: "Intensity", type: "number", defaultValue: 5, min: 0, max: 50, step: 0.5 },
      { key: "direction", label: "Direction", type: "select", defaultValue: "radial", options: [{ label: "Radial", value: "radial" }, { label: "Horizontal", value: "horizontal" }, { label: "Vertical", value: "vertical" }] },
      { key: "center", label: "Center", type: "vec2", defaultValue: [0.5, 0.5] },
    ],
  },
}

export function getLayerDef(type: string): LayerTypeDef | undefined {
  return LAYER_DEFS[type]
}

export function getAllLayerTypes(): string[] {
  return Object.keys(LAYER_DEFS)
}

export function getSourceLayerTypes(): string[] {
  return Object.entries(LAYER_DEFS).filter(([_, d]) => d.kind === "source").map(([k]) => k)
}

export function getEffectLayerTypes(): string[] {
  return Object.entries(LAYER_DEFS).filter(([_, d]) => d.kind === "effect").map(([k]) => k)
}

export function getDefaultParams(type: string): Record<string, unknown> {
  const def = LAYER_DEFS[type]
  if (!def) return {}
  const params: Record<string, unknown> = {}
  for (const p of def.params) {
    params[p.key] = structuredClone(p.defaultValue)
  }
  return params
}

export { LAYER_DEFS }
