"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { businessSettingsApi } from "@/lib/db"
import {
  Calendar,
  ClipboardList,
  Home,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Utensils,
} from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-500",
  },
  {
    label: "Bookings",
    icon: Calendar,
    href: "/bookings",
    color: "text-violet-500",
  },
  {
    label: "Point of Sale",
    icon: ShoppingCart,
    href: "/pos",
    color: "text-pink-700",
  },
  {
    label: "Spa Services",
    icon: ClipboardList,
    href: "/services/spa",
    color: "text-orange-500",
  },
  {
    label: "Restaurant Menu",
    icon: Utensils,
    href: "/services/restaurant",
    color: "text-emerald-500",
  },
  {
    label: "Inventory",
    icon: Package,
    href: "/inventory",
    color: "text-green-500",
  },
  {
    label: "Customers",
    icon: Users,
    href: "/customers",
    color: "text-blue-500",
  },
  {
    label: "Staff",
    icon: Users,
    href: "/staff",
    color: "text-yellow-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [businessName, setBusinessName] = useState("Spa & Bistro")

  useEffect(() => {
    async function loadBusinessName() {
      try {
        const defaultSettings = {
          businessName: "Spa & Bistro",
          address: "123 Relaxation Ave, Serenity, CA 90210",
          phone: "(555) 123-4567",
          email: "info@spaandbistro.com",
          website: "www.spaandbistro.com",
          taxRate: "8.5",
          openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
        }
        
        const settings = await businessSettingsApi.getSettings(defaultSettings)
        setBusinessName(settings.businessName || "Spa & Bistro")
      } catch (error) {
        console.error("Error loading business settings:", error)
      }
    }

    loadBusinessName()
  }, [])

  return (
    <div className="hidden border-r bg-card md:block md:w-64">
      <div className="flex h-full flex-col px-3 py-4">
        <Link href="/" className="flex items-center px-2 py-2 mb-6">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{businessName}</span>
          </div>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                pathname === route.href ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <route.icon className={cn("mr-3 h-5 w-5", route.color)} />
              {route.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
