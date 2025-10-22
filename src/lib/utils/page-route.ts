import { HandCoins, ShoppingBasket, BarChart3, Zap, Shield, Lock } from "lucide-react";

export const employeeDashboard = [
    { 
        title: 'Procurement', 
        icon: ShoppingBasket,
        href: '/procurement',
    },
    {
        title: "Business Analytics",
        icon: HandCoins,
        href: '/bi',
        children: [
            {
                title: "Overview",
                icon: BarChart3,
                href: '/bi'
            },
            {
                title: "Standard & Custom",
                icon: BarChart3,
                href: '/bi/standard-custom'
            },
            {
                title: "Real-Time",
                icon: Zap,
                href: '/bi/real-time'
            },
            {
                title: "Compliance",
                icon: Shield,
                href: '/bi/compliance'
            },
            {
                title: "Access & Security",
                icon: Lock,
                href: '/bi/access'
            }
        ]
    }
]