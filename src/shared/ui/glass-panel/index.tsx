import { cva, type VariantProps } from "class-variance-authority"
import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import s from "./glass-panel.module.css"

const glassPanelVariants = cva(s.glassPanel, {
  variants: {
    variant: {
      panel: s.panel,
      pill: s.pill,
    },
    interactive: {
      true: s.interactive,
    },
  },
  defaultVariants: {
    variant: "panel",
  },
})

interface GlassPanelProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassPanelVariants> {
  children?: ReactNode
}

export function GlassPanel({
  children,
  className,
  interactive,
  variant,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(glassPanelVariants({ variant, interactive }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
