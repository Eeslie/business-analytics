"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Zap, 
  Shield, 
  Lock, 
  Coffee,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  {
    id: "overview",
    title: "Overview",
    href: "/bi",
    icon: BarChart3,
    description: "Dashboard & Analytics"
  },
  {
    id: "standard-custom",
    title: "Standard & Custom",
    href: "/bi/standard-custom",
    icon: BarChart3,
    description: "Report Generation"
  },
  {
    id: "real-time",
    title: "Real-Time",
    href: "/bi/real-time",
    icon: Zap,
    description: "Live Analytics"
  },
  {
    id: "compliance",
    title: "Compliance",
    href: "/bi/compliance",
    icon: Shield,
    description: "Regulatory Reports"
  },
  {
    id: "access",
    title: "Access & Security",
    href: "/bi/access",
    icon: Lock,
    description: "Role Management"
  }
];

export function TopNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-green-200 shadow-none sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo & Brand - Left Side */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#00704A] flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4C9 4 6 6 6 9C6 12 9 14 12 14C15 14 18 12 18 9C18 6 15 4 12 4ZM12 16C8 16 4 18 4 22H20C20 18 16 16 12 16Z"
                  fill="white"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-[#00704A] whitespace-nowrap">Starbucks BI Business Intelligence</h1>
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center space-x-2 flex-1 justify-center mx-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? "bg-[#00704A] text-white"
                      : "text-black hover:bg-green-50 hover:text-[#00704A]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.title}</span>
                </Link>
              );
            })}
          </nav>


          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-black hover:bg-green-50 hover:text-green-800 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-green-200 py-4">
            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-green-800 text-white"
                        : "text-black hover:bg-green-50 hover:text-green-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs opacity-75">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
              
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
