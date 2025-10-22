"use client"

import { AppSidebar } from "../../components/ui/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"

export default function BiLayout({ children }) {
  return (
    <SidebarProvider className="!bg-white">
      <AppSidebar />
      <SidebarInset>
        <header className="!bg-white flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">BI</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Business Intelligence
              <span className="mx-2 text-muted-foreground">/</span>
              <span className="text-primary">Reports</span>
            </h1>
          </div>
        </header>
        
        <main className="!bg-white flex-1 p-4">
          <div className="space-y-8 !bg-white">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}


