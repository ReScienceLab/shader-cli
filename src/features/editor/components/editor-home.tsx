import {
  AVAILABLE_SCRIPTS,
  EDITOR_STARTER_VERSION,
  FEATURE_HIGHLIGHTS,
  PROJECT_STRUCTURE,
  TECH_STACK,
} from "@/features/editor/config/editor-home"
import { Wrapper } from "@/shared/ui/layout/wrapper"
import { Link } from "@/shared/ui/link"
import { colors } from "@/shared/styles/colors"
import { breakpoints, layout } from "@/shared/styles/layout.mjs"

export function EditorHome() {
  return (
    <Wrapper theme="dark">
      <section className="flex min-h-[80vh] flex-col justify-center px-safe pt-header-height">
        <div className="max-w-3xl">
          <p className="font-mono text-contrast text-sm uppercase tracking-wider">
            Shader Lab Starter v{EDITOR_STARTER_VERSION}
          </p>
          <h1 className="mt-4 font-semibold text-4xl leading-tight tracking-tight md:text-6xl">
            Feature-first shader workspace
          </h1>
          <p className="mt-6 max-w-xl text-lg text-secondary/70">
            The Basement starter is now organized around an editor feature,
            shared application primitives, and asset folders prepared for shaders,
            models, and textures.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 font-mono text-sm uppercase">
            <Link
              href="https://github.com/basementstudio/next-starter/generate"
              className="bg-secondary px-6 py-3 text-primary transition-opacity hover:opacity-80"
            >
              Use this template
            </Link>
            <Link
              href="https://github.com/basementstudio/next-starter"
              className="border border-secondary/30 px-6 py-3 transition-colors hover:border-secondary"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      <section className="px-safe py-24">
        <h2 className="font-mono text-contrast text-sm uppercase tracking-wider">
          Tech Stack
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TECH_STACK.map((tech) => (
            <div
              key={tech.name}
              className="border border-secondary/10 p-6 transition-colors hover:border-secondary/30"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-lg">{tech.name}</span>
                <span className="font-mono text-contrast text-sm">
                  v{tech.version}
                </span>
              </div>
              <p className="mt-2 text-secondary/60 text-sm">
                {tech.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-safe py-24">
        <h2 className="font-mono text-contrast text-sm uppercase tracking-wider">
          Feature Layout
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_HIGHLIGHTS.map((feature) => (
            <div key={feature.title}>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="mt-2 text-secondary/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-safe py-24">
        <h2 className="font-mono text-contrast text-sm uppercase tracking-wider">
          Design Tokens
        </h2>

        <div className="mt-8">
          <h3 className="font-mono text-secondary/60 text-xs uppercase">
            Colors
          </h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(colors).map(([name, value]) => (
              <div key={name} className="flex items-center gap-2">
                <div
                  className="size-8 rounded border border-secondary/20"
                  style={{ backgroundColor: value }}
                />
                <div className="font-mono text-xs">
                  <div className="text-secondary">{name}</div>
                  <div className="text-secondary/40">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="font-mono text-secondary/60 text-xs uppercase">
            Breakpoints
          </h3>
          <div className="mt-4 flex flex-wrap gap-4">
            {Object.entries(breakpoints).map(([name, value]) => (
              <div
                key={name}
                className="border border-secondary/10 px-4 py-2 font-mono text-sm"
              >
                <span className="text-secondary">{name}</span>
                <span className="ml-2 text-secondary/40">{value}px</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="font-mono text-secondary/60 text-xs uppercase">
            Grid System
          </h3>
          <div className="mt-4 flex gap-8 font-mono text-sm">
            <div>
              <span className="text-secondary/40">Mobile:</span>{" "}
              <span className="text-secondary">{layout.columns.mobile} columns</span>
            </div>
            <div>
              <span className="text-secondary/40">Desktop:</span>{" "}
              <span className="text-secondary">{layout.columns.desktop} columns</span>
            </div>
            <div>
              <span className="text-secondary/40">Gap:</span>{" "}
              <span className="text-secondary">{layout.gap.desktop}px</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-safe py-24">
        <h2 className="font-mono text-contrast text-sm uppercase tracking-wider">
          Available Scripts
        </h2>
        <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_SCRIPTS.map((script) => (
            <div
              key={script.cmd}
              className="flex items-center justify-between border border-secondary/10 px-4 py-3 font-mono text-sm"
            >
              <code className="text-secondary">{script.cmd}</code>
              <span className="text-secondary/40">{script.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-safe py-24">
        <h2 className="font-mono text-contrast text-sm uppercase tracking-wider">
          Project Structure
        </h2>
        <div className="mt-8 max-w-2xl border border-secondary/10 bg-secondary/5 p-6 font-mono text-sm leading-relaxed">
          <pre className="text-secondary/80">{PROJECT_STRUCTURE}</pre>
        </div>
      </section>
    </Wrapper>
  )
}
