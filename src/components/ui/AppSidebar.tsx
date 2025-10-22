"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Sidebar, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "./sidebar";
import { employeeDashboard } from "../../lib/utils/page-route";
import { useAuth } from "../../hooks/use-auth";

export function AppSidebar() {
    const { claims, loading } = useAuth();
    const { open } = useSidebar();
    const pathName = usePathname();
    if (pathName === '/auth') return null;
    let route: any[] = employeeDashboard;
    
    return (
        <Sidebar
            collapsible="icon"
        >
            <SidebarTrigger 
                className="rounded-full shadow-6xl bg-white absolute z-50 right-[-28px] top-[47%] -translate-x-1/2 -translate-y-1/2"
            />
            <SidebarContent 
                className={`rounded-md bg-cover border-r-green-100 border-0`}
                style={{ backgroundImage: "url(/images/sidebar_bg.svg)" }}
            >
                <Link 
                    className="text-center aspect-auto"
                    href="/"
                >
                    <Image
                        src="/svg/logo1.svg"
                        alt="Papiverse Logo"
                        width={open ? 50 : 30}
                        height={open ? 50 : 30}
                        className="mx-auto mt-4"
                    />
                    <div className="text-orange-900 font-extrabold">{ claims.role }</div>
                </Link>
                <SidebarMenu className={`mt-4 ${!open && "flex-center"}`}>
                    {route?.map((item, i) => (
                        <Link 
                            href={ item.href } 
                            className={`group/collapsible w-full hover:bg-slate-50 rounded-md ${!open && 'flex-center'}`} 
                            key={ i }
                        >
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex gap-2 pl-4">
                                    <item.icon className="w-4 h-4" />
                                    { item.title }
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </Link>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    )
}