"use client"

import type { HTMLAttributes } from "react"
import { Theme } from "@/shared/providers/theme-provider"
import { cn } from "@/shared/lib/cn"
import type { ThemeName } from "@/shared/styles/config"
import { Footer } from "./footer"
import { Header } from "./header"

interface WrapperProps extends HTMLAttributes<HTMLDivElement> {
  theme?: ThemeName
}

export function Wrapper({
  children,
  theme = "dark",
  className,
  ...props
}: WrapperProps) {
  return (
    <Theme theme={theme} global>
      <Header />
      <main
        id="main-content"
        className={cn("relative flex grow flex-col", className)}
        {...props}
      >
        {children}
      </main>
      <Footer />
    </Theme>
  )
}
