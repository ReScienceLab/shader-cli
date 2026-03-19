import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentPropsWithoutRef, ElementType } from "react"
import { cn } from "@/shared/lib/cn"
import s from "./typography.module.css"

const typographyVariants = cva(s.typography, {
  variants: {
    variant: {
      display: "type-display",
      heading: "type-heading",
      title: "type-title",
      body: "type-body",
      label: "type-label",
      caption: "type-caption",
      overline: "type-overline",
      monoMd: "type-mono-md",
      monoSm: "type-mono-sm",
      monoXs: "type-mono-xs",
    },
    tone: {
      primary: s.primary,
      secondary: s.secondary,
      tertiary: s.tertiary,
      muted: s.muted,
      disabled: s.disabled,
      onLight: s.onLight,
    },
    align: {
      left: s.left,
      center: s.center,
      right: s.right,
    },
  },
  defaultVariants: {
    variant: "body",
    tone: "primary",
    align: "left",
  },
})

type TypographyProps<T extends ElementType> = {
  as?: T
} & VariantProps<typeof typographyVariants> &
  Omit<ComponentPropsWithoutRef<T>, "as" | "color">

export function Typography<T extends ElementType = "p">({
  as,
  className,
  variant,
  tone,
  align,
  ...props
}: TypographyProps<T>) {
  const Component = as ?? "p"

  return (
    <Component
      className={cn(typographyVariants({ variant, tone, align }), className)}
      {...props}
    />
  )
}
