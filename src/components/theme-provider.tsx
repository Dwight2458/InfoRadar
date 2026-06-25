"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  mounted: boolean
  setTheme: (theme: Theme) => void
}

const storageKey = "inforadar-theme:v1"
const legacyStorageKey = "inforadar-theme"
const ThemeContext = createContext<ThemeContextValue | null>(null)

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light" || value === "system"
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme
}

function applyResolvedTheme(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle("dark", resolvedTheme === "dark")
  root.style.colorScheme = resolvedTheme
}

function readStoredTheme(defaultTheme: Theme): Theme {
  try {
    const storedTheme = window.localStorage.getItem(storageKey)
    if (isTheme(storedTheme)) return storedTheme

    const legacyTheme = window.localStorage.getItem(legacyStorageKey)
    if (!isTheme(legacyTheme)) return defaultTheme

    window.localStorage.setItem(storageKey, legacyTheme)
    window.localStorage.removeItem(legacyStorageKey)
    return legacyTheme
  } catch {
    return defaultTheme
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(resolveTheme(defaultTheme))
  const [mounted, setMounted] = useState(false)

  const applyTheme = useCallback((nextTheme: Theme) => {
    const nextResolvedTheme = resolveTheme(nextTheme)
    applyResolvedTheme(nextResolvedTheme)
    setThemeState(nextTheme)
    setResolvedTheme(nextResolvedTheme)
  }, [])

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return
      applyTheme(readStoredTheme(defaultTheme))
      setMounted(true)
    })

    return () => {
      cancelled = true
    }
  }, [applyTheme, defaultTheme])

  useEffect(() => {
    if (theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const nextResolvedTheme = getSystemTheme()
      applyResolvedTheme(nextResolvedTheme)
      setResolvedTheme(nextResolvedTheme)
    }

    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [theme])

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      try {
        window.localStorage.setItem(storageKey, nextTheme)
      } catch {
        // Theme persistence is best-effort. UI state still updates if storage is unavailable.
      }
      applyTheme(nextTheme)
    },
    [applyTheme],
  )

  const value = useMemo(
    () => ({ theme, resolvedTheme, mounted, setTheme }),
    [theme, resolvedTheme, mounted, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)

  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return value
}
