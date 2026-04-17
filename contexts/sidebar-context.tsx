"use client"

import * as React from "react"

export interface SidebarConfig {
  variant: "sidebar" | "floating" | "inset"
  collapsible: "offcanvas" | "icon" | "none"
  side: "left" | "right"
}

export interface SidebarContextValue {
  config: SidebarConfig
  updateConfig: (config: Partial<SidebarConfig>) => void
  setConfigOption: <K extends keyof SidebarConfig>(
    key: K,
    value: SidebarConfig[K]
  ) => void
  resetConfig: () => void
}

const SIDEBAR_CONFIG_STORAGE_KEY = "sidebar_config"

export const SIDEBAR_VARIANT_OPTIONS: Array<{
  label: string
  value: SidebarConfig["variant"]
}> = [
  { label: "Sidebar", value: "sidebar" },
  { label: "Floating", value: "floating" },
  { label: "Inset", value: "inset" },
]

export const SIDEBAR_COLLAPSIBLE_OPTIONS: Array<{
  label: string
  value: SidebarConfig["collapsible"]
}> = [
  { label: "Offcanvas", value: "offcanvas" },
  { label: "Icon", value: "icon" },
  { label: "None", value: "none" },
]

export const SIDEBAR_SIDE_OPTIONS: Array<{
  label: string
  value: SidebarConfig["side"]
}> = [
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
]

export const DEFAULT_SIDEBAR_CONFIG: SidebarConfig = {
  variant: "inset",
  collapsible: "offcanvas",
  side: "left",
}

function normalizeConfig(config: Partial<SidebarConfig>): SidebarConfig {
  const variant =
    config.variant === "sidebar" || config.variant === "floating" || config.variant === "inset"
      ? config.variant
      : DEFAULT_SIDEBAR_CONFIG.variant

  const collapsible =
    config.collapsible === "offcanvas" ||
    config.collapsible === "icon" ||
    config.collapsible === "none"
      ? config.collapsible
      : DEFAULT_SIDEBAR_CONFIG.collapsible

  const side =
    config.side === "left" || config.side === "right"
      ? config.side
      : DEFAULT_SIDEBAR_CONFIG.side

  return { variant, collapsible, side }
}

export const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<SidebarConfig>(DEFAULT_SIDEBAR_CONFIG)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_CONFIG_STORAGE_KEY)
      if (!stored) return

      const parsed = JSON.parse(stored) as Partial<SidebarConfig>
      setConfig(normalizeConfig(parsed))
    } catch {
      setConfig(DEFAULT_SIDEBAR_CONFIG)
    }
  }, [])

  const updateConfig = React.useCallback((newConfig: Partial<SidebarConfig>) => {
    setConfig((prev) => {
      const next = normalizeConfig({ ...prev, ...newConfig })
      window.localStorage.setItem(SIDEBAR_CONFIG_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const setConfigOption = React.useCallback(
    <K extends keyof SidebarConfig>(key: K, value: SidebarConfig[K]) => {
      updateConfig({ [key]: value } as Partial<SidebarConfig>)
    },
    [updateConfig]
  )

  const resetConfig = React.useCallback(() => {
    setConfig(DEFAULT_SIDEBAR_CONFIG)
    window.localStorage.setItem(
      SIDEBAR_CONFIG_STORAGE_KEY,
      JSON.stringify(DEFAULT_SIDEBAR_CONFIG)
    )
  }, [])

  return (
    <SidebarContext.Provider value={{ config, updateConfig, setConfigOption, resetConfig }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarConfig() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarConfig must be used within a SidebarConfigProvider")
  }
  return context
}
