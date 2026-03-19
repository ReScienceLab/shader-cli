const palettes = {
  gray: {
    50: "#F5F5F5",
    100: "#E6E6E6",
    200: "#D1D1D1",
    300: "#B0B0B0",
    400: "#8A8A8A",
    500: "#666666",
    600: "#4D4D4D",
    700: "#2D2D2D",
    800: "#121216",
  },
}

const colors = {
  black: "#000000",
  white: "#FFFFFF",
  canvas: "#080808",
  "surface-glass-panel": "rgba(18, 18, 22, 0.55)",
  "surface-glass-pill": "rgba(18, 18, 22, 0.50)",
  "surface-active": "rgba(255, 255, 255, 0.08)",
  "surface-control": "rgba(255, 255, 255, 0.06)",
  "surface-subtle": "rgba(255, 255, 255, 0.04)",
  "surface-disabled": "rgba(255, 255, 255, 0.03)",
  "text-primary": "rgba(255, 255, 255, 0.90)",
  "text-secondary": "rgba(255, 255, 255, 0.50)",
  "text-tertiary": "rgba(255, 255, 255, 0.35)",
  "text-muted": "rgba(255, 255, 255, 0.25)",
  "text-disabled": "rgba(255, 255, 255, 0.16)",
  "text-on-light": "rgba(0, 0, 0, 0.90)",
  "border-panel": "rgba(255, 255, 255, 0.10)",
  "border-panel-strong": "rgba(255, 255, 255, 0.14)",
  "border-divider": "rgba(255, 255, 255, 0.07)",
  "border-subtle": "rgba(255, 255, 255, 0.04)",
  "border-hover": "rgba(255, 255, 255, 0.12)",
  "border-active": "rgba(255, 255, 255, 0.14)",
  "border-disabled": "rgba(255, 255, 255, 0.05)",
  gray: palettes.gray[500],
} as const

const themeNames = ["light", "dark"] as const
const colorNames = ["primary", "secondary", "contrast"] as const

const themes = {
  light: {
    primary: palettes.gray[50],
    secondary: colors["text-on-light"],
    contrast: "rgba(0, 0, 0, 0.14)",
  },
  dark: {
    primary: colors.canvas,
    secondary: colors["text-primary"],
    contrast: colors["border-active"],
  },
} as const satisfies Themes

export { colors, palettes, themeNames, themes }

// UTIL TYPES
export type Themes = Record<
  (typeof themeNames)[number],
  Record<(typeof colorNames)[number], string>
>
