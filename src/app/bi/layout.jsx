"use client"

import { AppSidebar } from "../../components/ui/AppSidebar"
import { TopNavigation } from "../../components/ui/TopNavigation"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"

export default function BiLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <SidebarProvider className="!bg-white">
        <AppSidebar />
        <SidebarInset>
          {/* Top Navigation Header */}
          <TopNavigation />
          
          {/* Main Content */}
          <main className="flex-1 p-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-8">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}


