import type { CSSProperties } from "react"

const fonts = {
  sans: "--geist-sans",
  mono: "--geist-mono",
} as const

const typography: TypeStyles = {
  "type-display": {
    "font-family": "var(--ds-font-sans)",
    "font-style": "normal",
    "font-weight": 700,
    "line-height": "48px",
    "letter-spacing": "-0.03em",
    "font-size": 48,
  },
  "type-heading": {
    "font-family": "var(--ds-font-sans)",
    "font-style": "normal",
    "font-weight": 600,
    "line-height": "29px",
    "letter-spacing": "-0.02em",
    "font-size": 24,
  },
  "type-title": {
    "font-family": "var(--ds-font-sans)",
    "font-style": "normal",
    "font-weight": 500,
    "line-height": "20px",
    "letter-spacing": "-0.01em",
    "font-size": 16,
  },
  "type-body": {
    "font-family": "var(--ds-font-sans)",
    "font-style": "normal",
    "font-weight": 500,
    "line-height": "16px",
    "letter-spacing": "-0.01em",
    "font-size": 13,
  },
  "type-label": {
    "font-family": "var(--ds-font-sans)",
    "font-style": "normal",
    "font-weight": 400,
    "line-height": "16px",
    "letter-spacing": "0em",
    "font-size": 12,
  },
  "type-caption": {
    "font-family": "var(--ds-font-sans)",
    "font-style": "normal",
    "font-weight": 400,
    "line-height": "14px",
    "letter-spacing": "0em",
    "font-size": 11,
  },
  "type-overline": {
    "font-family": "var(--ds-font-sans)",
    "font-style": "normal",
    "font-weight": 500,
    "line-height": "12px",
    "letter-spacing": "0.06em",
    "font-size": 10,
    "text-transform": "uppercase",
  },
  "type-mono-md": {
    "font-family": "var(--ds-font-mono)",
    "font-style": "normal",
    "font-weight": 400,
    "line-height": "16px",
    "letter-spacing": "0em",
    "font-size": 13,
  },
  "type-mono-sm": {
    "font-family": "var(--ds-font-mono)",
    "font-style": "normal",
    "font-weight": 400,
    "line-height": "14px",
    "letter-spacing": "0em",
    "font-size": 11,
  },
  "type-mono-xs": {
    "font-family": "var(--ds-font-mono)",
    "font-style": "normal",
    "font-weight": 400,
    "line-height": "12px",
    "letter-spacing": "0em",
    "font-size": 10,
  },
} as const

export { fonts, typography }

// UTIL TYPES
type TypeStyles = Record<
  string,
  {
    "font-family": string
    "font-style": CSSProperties["fontStyle"]
    "font-weight": CSSProperties["fontWeight"]
    "line-height":
      | CSSProperties["lineHeight"]
      | {
          mobile: CSSProperties["lineHeight"]
          desktop: CSSProperties["lineHeight"]
        }
    "letter-spacing":
      | CSSProperties["letterSpacing"]
      | {
          mobile: CSSProperties["letterSpacing"]
          desktop: CSSProperties["letterSpacing"]
        }
    "font-feature-settings"?: string
    "text-transform"?: CSSProperties["textTransform"]
    "font-size": number | { mobile: number; desktop: number }
  }
>
