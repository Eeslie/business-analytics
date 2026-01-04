"use client"

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, User, LogOut } from "lucide-react";
import { Sidebar, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "./sidebar";
import { employeeDashboard } from "../../lib/utils/page-route";
import { useAuth } from "../../hooks/use-auth";

export function AppSidebar() {
    const { claims, loading } = useAuth();
    const { open } = useSidebar();
    const pathName = usePathname();
    const router = useRouter();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        // Get user from localStorage
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("auth_user");
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch (e) {
                    console.error("Error parsing user data:", e);
                }
            }
        }
    }, []);
    
    const handleLogout = () => {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token");
        router.push("/");
    };
    
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
                className="rounded-full shadow-6xl !bg-black !text-white hover:!bg-gray-800 absolute z-50 right-[-28px] top-[47%] -translate-x-1/2 -translate-y-1/2 [&_svg]:text-white"
            />
            <SidebarContent 
                className={`rounded-md bg-gradient-to-b from-green-50 to-emerald-50 border-r-green-200 border-0 flex flex-col`}
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center py-6 px-4">
                    <Link 
                        className="flex flex-col items-center space-y-3 group"
                        href="/"
                    >
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
                                                isItemActive(item.href) ? 'bg-green-200 text-green-800' : 'text-black'
                                            }`}
                                        >
                                            <div className="flex gap-2 pl-4 justify-between w-full">
                                                <div className="flex gap-2">
                                                    <item.icon className={`w-4 h-4 ${isItemActive(item.href) ? 'text-green-800' : 'text-black'}`} />
                                                    {open && <span className={isItemActive(item.href) ? 'text-green-800' : 'text-black'}>{item.title}</span>}
                                                </div>
                                                {open && (
                                                    expandedItems.includes(item.title) ? 
                                                        <ChevronDown className={`w-4 h-4 ${isItemActive(item.href) ? 'text-green-800' : 'text-black'}`} /> : 
                                                        <ChevronRight className={`w-4 h-4 ${isItemActive(item.href) ? 'text-green-800' : 'text-black'}`} />
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
                
                {/* User Info & Logout at Bottom */}
                {user && (
                    <div className="mt-auto border-t border-green-200 pt-4 pb-4 px-4">
                        <div className={`flex ${open ? 'flex-col space-y-3' : 'flex-col items-center space-y-2'}`}>
                            <div className={`flex items-center ${open ? 'space-x-2' : 'flex-col space-y-1'}`}>
                                <User className={`${open ? 'w-4 h-4' : 'w-5 h-5'} text-[#00704A]`} />
                                {open && (
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-black truncate">{user.email}</div>
                                        <div className="text-xs text-gray-600 capitalize">{user.role}</div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className={`flex items-center ${open ? 'justify-start space-x-2' : 'justify-center'} text-red-600 hover:text-red-700 transition-colors text-sm font-medium`}
                                title="Logout"
                            >
                                <LogOut className={`${open ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                {open && <span>[→ Logout]</span>}
                            </button>
                        </div>
                    </div>
                )}
            </SidebarContent>
        </Sidebar>
    )
}