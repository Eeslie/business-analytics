"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import SidebarLogo from "../images/sidebarlogo.svg";
import { Sidebar, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "./sidebar";
import { employeeDashboard } from "../../lib/utils/page-route";
import { useAuth } from "../../hooks/use-auth";

export function AppSidebar() {
    const { claims, loading } = useAuth();
    const { open } = useSidebar();
    const pathName = usePathname();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    
    if (pathName === '/auth') return null;
    let route: any[] = employeeDashboard;

    const toggleExpanded = (itemId: string) => {
        setExpandedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const isItemActive = (href: string) => {
        if (href === '/bi') {
            return pathName === '/bi';
        }
        return pathName.startsWith(href);
    };
    
    return (
        <Sidebar
            collapsible="icon"
        >
            <SidebarTrigger 
                className="rounded-full shadow-6xl bg-white absolute z-50 right-[-28px] top-[47%] -translate-x-1/2 -translate-y-1/2"
            />
            <SidebarContent 
                className={`rounded-md bg-gradient-to-b from-green-50 to-emerald-50 border-r-green-200 border-0`}
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center py-6 px-4">
                    <Link 
                        className="flex flex-col items-center space-y-3 group"
                        href="/"
                    >
                        <div className="relative">
                            <Image
                                src={SidebarLogo}
                                alt="Starbucks BI Logo"
                                width={open ? 60 : 40}
                                height={open ? 60 : 40}
                                className="transition-all duration-300 group-hover:scale-105"
                            />
                        </div>
                        {open && (
                            <div className="text-center">
                                <div className="text-lg font-bold text-green-800">Starbucks BI</div>
                                <div className="text-xs text-orange-900 font-semibold">{ claims.role }</div>
                            </div>
                        )}
                    </Link>
                </div>
                <SidebarMenu className={`mt-2 ${!open && "flex-center"}`}>
                    {route?.map((item, i) => (
                        <div key={i}>
                            {item.children ? (
                                <div>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton 
                                            onClick={() => toggleExpanded(item.title)}
                                            className={`group/collapsible w-full hover:bg-green-100 rounded-md ${!open && 'flex-center'} ${
                                                isItemActive(item.href) ? 'bg-green-200' : ''
                                            }`}
                                        >
                                            <div className="flex gap-2 pl-4 justify-between w-full">
                                                <div className="flex gap-2">
                                                    <item.icon className="w-4 h-4" />
                                                    {open && <span>{item.title}</span>}
                                                </div>
                                                {open && (
                                                    expandedItems.includes(item.title) ? 
                                                        <ChevronDown className="w-4 h-4" /> : 
                                                        <ChevronRight className="w-4 h-4" />
                                                )}
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    
                                    {open && expandedItems.includes(item.title) && (
                                        <div className="ml-4 mt-1 space-y-1">
                                            {item.children.map((child, childIndex) => (
                                                <Link 
                                                    href={child.href} 
                                                    className={`group/collapsible w-full hover:bg-green-100 rounded-md flex items-center ${
                                                        isItemActive(child.href) ? 'bg-green-200 text-green-800' : 'text-black'
                                                    }`} 
                                                    key={childIndex}
                                                >
                                                    <SidebarMenuItem>
                                                        <SidebarMenuButton className="flex gap-2 pl-4">
                                                            <child.icon className="w-4 h-4" />
                                                            <span>{child.title}</span>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link 
                                    href={item.href} 
                                    className={`group/collapsible w-full hover:bg-green-100 rounded-md ${!open && 'flex-center'} ${
                                        isItemActive(item.href) ? 'bg-green-200 text-green-800' : 'text-black'
                                    }`} 
                                >
                                    <SidebarMenuItem>
                                        <SidebarMenuButton className="flex gap-2 pl-4">
                                            <item.icon className="w-4 h-4" />
                                            {open && <span>{item.title}</span>}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </Link>
                            )}
                        </div>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    )
}