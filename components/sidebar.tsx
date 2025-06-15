"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { businessSettingsApi } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
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
} from "lucide-react";

type UserRole = "admin" | "manager" | "staff";

interface Route {
  label: string;
  icon: any;
  href: string;
  color?: string;
  requiredRole?: UserRole;
}

const allRoutes: Route[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-500",
    requiredRole: "staff", // All roles can access dashboard
  },
  {
    label: "Bookings",
    icon: Calendar,
    href: "/bookings",
    color: "text-violet-500",
    requiredRole: "manager", // Manager and admin only
  },
  {
    label: "Point of Sale",
    icon: ShoppingCart,
    href: "/pos",
    color: "text-pink-700",
    requiredRole: "staff", // All roles can access POS
  },
  {
    label: "Spa Services",
    icon: ClipboardList,
    href: "/services/spa",
    color: "text-orange-500",
    requiredRole: "manager", // Manager and admin only
  },
  {
    label: "Restaurant Menu",
    icon: Utensils,
    href: "/services/restaurant",
    color: "text-emerald-500",
    requiredRole: "manager", // Manager and admin only
  },
  {
    label: "Inventory",
    icon: Package,
    href: "/inventory",
    color: "text-green-500",
    requiredRole: "manager", // Manager and admin only
  },
  {
    label: "Customers",
    icon: Users,
    href: "/customers",
    color: "text-blue-500",
    requiredRole: "staff", // All roles can access customers
  },
  {
    label: "Staff",
    icon: Users,
    href: "/staff",
    color: "text-yellow-500",
    requiredRole: "admin", // Admin only
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    requiredRole: "admin", // All roles can access settings
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [businessName, setBusinessName] = useState("LEWA HOSPITALITY");
  const { userDetails, hasPermission } = useAuth();

  // Filter routes based on user role
  const routes = allRoutes.filter((route) => {
    if (!route.requiredRole) return true; // Route available to all
    return hasPermission(route.requiredRole);
  });

  useEffect(() => {
    async function loadBusinessName() {
      try {
        const defaultSettings = {
          businessName: "LEWA HOSPITALITY",
          address: "29 Montgomery Road, Highlands, Harare, Zimbabwe",
          phone: "(555) 123-4567",
          email: "info@lewa.co.zw",
          website: "www.lewa.co.zw",
          taxRate: "14%",
          openingHours: "Sunday-Friday: 9am-9pm\nSaturday:Closed",
        };

        const settings = await businessSettingsApi.getSettings(defaultSettings);
        setBusinessName(settings.businessName || "LEWA HOSPITALITY");
      } catch (error) {
        console.error("Error loading business settings:", error);
      }
    }
    loadBusinessName();
  }, []);

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
                pathname === route.href
                  ? "bg-accent text-accent-foreground"
                  : "transparent"
              )}
            >
              <route.icon className={cn("mr-3 h-5 w-5", route.color)} />
              {route.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
