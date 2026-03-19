import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import s from "./button.module.css"

const buttonVariants = cva(s.button, {
  variants: {
    variant: {
      primary: s.primary,
      secondary: s.secondary,
      ghost: s.ghost,
      neutral: s.neutral,
    },
    size: {
      compact: s.compact,
      default: s.default,
    },
    fullWidth: {
      true: s.fullWidth,
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "default",
  },
})

type CommonButtonProps = {
  children?: ReactNode
} & VariantProps<typeof buttonVariants>

type ButtonProps = CommonButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">

export function Button({
  children,
  className,
  fullWidth,
  size,
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
