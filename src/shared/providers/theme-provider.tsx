"use client"

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import type { Themes } from "@/shared/styles/colors"
import { type ThemeName, themes } from "@/shared/styles/config"

const ThemeContext = createContext<{
  name: ThemeName
  theme: Themes[ThemeName]
  setThemeName: (theme: ThemeName) => void
}>({
  name: "light",
  theme: themes.light,
  setThemeName: () => {
    void 0
  },
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function Theme({
  children,
  theme,
  global,
}: {
  children: ReactNode
  theme: ThemeName
  global?: boolean
}) {
  const [currentTheme, setCurrentTheme] = useState(theme)

  useEffect(() => {
    setCurrentTheme(theme)
  }, [theme])

  useEffect(() => {
    if (global) {
      document.documentElement.setAttribute("data-theme", currentTheme)
    }
  }, [currentTheme, global])

  return (
    <>
      {global ? (
        <script>{`document.documentElement.setAttribute('data-theme', '${currentTheme}');`}</script>
      ) : null}
      <ThemeContext.Provider
        value={{
          name: currentTheme,
          theme: themes[currentTheme],
          setThemeName: setCurrentTheme,
        }}
      >
        {children}
      </ThemeContext.Provider>
    </>
  )
}
