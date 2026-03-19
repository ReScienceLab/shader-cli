import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import s from "./icon-button.module.css"

const iconButtonVariants = cva(s.iconButton, {
  variants: {
    variant: {
      ghost: s.ghost,
      default: s.default,
      hover: s.hover,
      active: s.active,
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

type CommonIconButtonProps = {
  children?: ReactNode
} & VariantProps<typeof iconButtonVariants>

type IconButtonProps = CommonIconButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">

export function IconButton({
  children,
  className,
  variant,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(iconButtonVariants({ variant }), className)}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
