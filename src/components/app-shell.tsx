"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Database, Gauge, Layers3, Radar, Settings2, UserRound } from "lucide-react"

import { FetchAllButton } from "@/components/fetch-all-button"
import { CurrentTime } from "@/components/current-time"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const navigation = [
  { href: "/", label: "首页总览", icon: Gauge },
  { href: "/items", label: "信息流", icon: Activity },
  { href: "/sources", label: "信息源", icon: Layers3 },
  { href: "/jobs", label: "采集任务", icon: Database },
]

function pageTitle(pathname: string) {
  if (pathname.startsWith("/items/")) return "信息详情"
  return navigation.find((item) => item.href === pathname)?.label ?? "InfoRadar"
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider style={{ "--sidebar-width": "11.75rem" } as React.CSSProperties}>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border/80">
        <SidebarHeader className="h-[68px] justify-center border-b border-sidebar-border/70 px-4">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden font-semibold text-sidebar-foreground">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/70 text-primary shadow-[0_0_16px_-4px_var(--primary)]">
              <Radar className="size-4.5" />
            </span>
            <span className="text-base tracking-tight group-data-[collapsible=icon]:hidden">InfoRadar</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="p-2.5 pt-3">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
                      tooltip={item.label}
                      className="h-10 px-3"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-3 pb-3">
          <SidebarSeparator className="mx-0" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="设置" className="h-9">
                <Settings2 />
                <span>设置</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="本地用户" className="h-10">
                <span className="flex size-7 items-center justify-center rounded-full border border-border bg-muted font-mono text-xs">
                  <UserRound className="size-3.5" />
                </span>
                <span>Local Analyst</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-border/75 bg-background/90 px-4 backdrop-blur-xl md:px-5">
          <SidebarTrigger />
          <h1 className="text-lg font-medium tracking-tight">{pageTitle(pathname)}</h1>
          <div className="ml-auto flex items-center gap-2">
            <CurrentTime />
            <ThemeToggle />
            <FetchAllButton />
          </div>
        </header>
        <div className="min-w-0 flex-1 p-3 md:p-5">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
