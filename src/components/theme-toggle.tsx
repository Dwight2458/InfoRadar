"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme !== "light"
  return (
    <Button
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
      variant="outline"
      size="sm"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="min-w-20 justify-start"
    >
      {dark ? <Moon /> : <Sun />}
      {dark ? "深色" : "浅色"}
    </Button>
  )
}
