export const EDITOR_STARTER_VERSION = "1.0.0"

export const TECH_STACK = [
  { description: "App Router, Turbopack", name: "Next.js", version: "16.1" },
  { description: "React Compiler enabled", name: "React", version: "19" },
  { description: "Strict mode", name: "TypeScript", version: "5.9" },
  { description: "CSS-first config", name: "Tailwind CSS", version: "4" },
  { description: "Lint + Format", name: "Biome", version: "2.3" },
  { description: "Package manager", name: "Bun", version: "1.3" },
] as const

export const FEATURE_HIGHLIGHTS = [
  {
    description:
      "Feature-first editor folders for components, renderer, shaders, timeline, and utilities.",
    title: "Editor-First Structure",
  },
  {
    description:
      "Shared UI, providers, hooks, styles, and utilities separated from feature code.",
    title: "Shared Foundation",
  },
  {
    description:
      "Public asset, model, and texture directories prepared for WebGL workflows.",
    title: "Asset Ready",
  },
  {
    description:
      "Style generation, typed routes, and a strict TypeScript baseline are preserved.",
    title: "Starter Ergonomics",
  },
  {
    description:
      "Zustand store support remains isolated under src/store for app-wide state.",
    title: "State Isolation",
  },
] as const

export const AVAILABLE_SCRIPTS = [
  { cmd: "bun dev", desc: "Start development server" },
  { cmd: "bun dev:https", desc: "Start with HTTPS" },
  { cmd: "bun build", desc: "Build for production" },
  { cmd: "bun generate", desc: "Scaffold routes and components" },
  { cmd: "bun lint:fix", desc: "Fix lint issues" },
  { cmd: "bun typecheck", desc: "Type check with tsgo" },
] as const

export const PROJECT_STRUCTURE = `src/
  app/
    layout.tsx
    page.tsx
    globals.css
  features/
    editor/
      components/
      hooks/
      renderer/
      shaders/
      timeline/
      config/
      types/
      utils/
  shared/
    ui/
    hooks/
    lib/
    styles/
    types/
    constants/
    providers/
  store/
public/
  assets/
  models/
  textures/`
