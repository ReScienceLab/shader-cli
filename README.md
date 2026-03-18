# Shader Lab

A Next.js starter adapted to a feature-first shader editor layout.

## Scripts

| Command | Description |
| --- | --- |
| `bun dev` | Start the development server |
| `bun dev:https` | Start the development server with HTTPS |
| `bun build` | Generate styles and build for production |
| `bun generate` | Scaffold routes and components in the new structure |
| `bun lint` | Run Biome |
| `bun typecheck` | Run TypeScript checks |

## Project Structure

```text
public/
  assets/
  models/
  textures/

src/
  app/
    globals.css
    layout.tsx
    page.tsx
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

scripts/
```

## Notes

- App Router lives under `src/app`.
- Shared primitives and helpers live under `src/shared`.
- Editor-specific code belongs under `src/features/editor`.
- Global state lives under `src/store`.
- Style generation writes to `src/shared/styles/css`.
