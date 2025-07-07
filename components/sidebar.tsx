'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { businessSettingsApi } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
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
  MessageSquare,
  Menu as MenuIcon,
  X as CloseIcon,
} from 'lucide-react';

type UserRole = 'admin' | 'manager' | 'staff';

interface Route {
  label: string;
  icon: any;
  href: string;
  color?: string;
  requiredRole?: UserRole;
}

const allRoutes: Route[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-sky-500',
    requiredRole: 'staff', // All roles can access dashboard
  },
  {
    label: 'Bookings',
    icon: Calendar,
    href: '/bookings',
    color: 'text-violet-500',
    requiredRole: 'manager', // Manager and admin only
  },
  {
    label: 'Point of Sale',
    icon: ShoppingCart,
    href: '/pos',
    color: 'text-pink-700',
    requiredRole: 'staff', // All roles can access POS
  },
  {
    label: 'Spa Services',
    icon: ClipboardList,
    href: '/services/spa',
    color: 'text-orange-500',
    requiredRole: 'manager', // Manager and admin only
  },
  {
    label: 'Restaurant Menu',
    icon: Utensils,
    href: '/services/restaurant',
    color: 'text-emerald-500',
    requiredRole: 'manager', // Manager and admin only
  },
  {
    label: 'Inventory',
    icon: Package,
    href: '/inventory',
    color: 'text-green-500',
    requiredRole: 'manager', // Manager and admin only
  },
  {
    label: 'Customers',
    icon: Users,
    href: '/customers',
    color: 'text-blue-500',
    requiredRole: 'staff', // All roles can access customers
  },
  {
    label: 'Staff',
    icon: Users,
    href: '/staff',
    color: 'text-yellow-500',
    requiredRole: 'admin', // Admin only
  },
  {
    label: 'Feedback',
    icon: MessageSquare,
    href: '/feedback',
    color: 'text-amber-500',
    requiredRole: 'manager', // Manager and admin only
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    requiredRole: 'admin', // All roles can access settings
  },
];

function Sidebar() {
  const pathname = usePathname();
  const [businessName, setBusinessName] = useState('LEWA HOSPITALITY');
  const { hasPermission } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter routes based on user role
  const routes = allRoutes.filter((route) => {
    if (!route.requiredRole) return true; // Route available to all
    return hasPermission(route.requiredRole);
  });

  // Ensure we always have at least some basic routes available
  const fallbackRoutes: Route[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'text-sky-500',
    },
    {
      label: 'Point of Sale',
      icon: ShoppingCart,
      href: '/pos',
      color: 'text-pink-700',
    },
    {
      label: 'Customers',
      icon: Users,
      href: '/customers',
      color: 'text-blue-500',
    },
  ];

  // Use filtered routes if available, otherwise use fallback routes
  const displayRoutes = routes.length > 0 ? routes : fallbackRoutes;

  // Debug logging
  console.log('Sidebar routes:', {
    allRoutes: allRoutes.length,
    filteredRoutes: routes.length,
    displayRoutes: displayRoutes.length,
    userDetails: useAuth().userDetails,
  });

  // Debug mobile sidebar state
  useEffect(() => {
    console.log('Mobile sidebar state:', { mobileOpen, displayRoutes: displayRoutes.length });
  }, [mobileOpen, displayRoutes]);

  useEffect(() => {
    async function loadBusinessName() {
      try {
        const defaultSettings = {
          businessName: 'LEWA HOSPITALITY',
          address: '29 Montgomery Road, Highlands, Harare, Zimbabwe',
          phone: '(555) 123-4567',
          email: 'info@lewa.co.zw',
          website: 'www.lewa.co.zw',
          taxRate: '14%',
          openingHours: 'Sunday-Friday: 9am-9pm\nSaturday:Closed',
        };

        const settings = await businessSettingsApi.getSettings(defaultSettings);
        setBusinessName(settings.businessName || 'LEWA HOSPITALITY');
      } catch (error) {
        console.error('Error loading business settings:', error);
      }
    }
    loadBusinessName();
  }, []);

  // Sidebar content as a function for reuse
  // Move sidebarContent inside the component so it always uses the latest displayRoutes
  function SidebarContent() {
    return (
      <div className="flex h-full flex-col px-3 py-4">
        <Link href="/" className="mb-6 flex items-center px-2 py-2" onClick={() => setMobileOpen(false)}>
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{businessName}</span>
          </div>
        </Link>
        <div className="space-y-1">
          {displayRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                pathname === route.href
                  ? 'bg-accent text-accent-foreground'
                  : 'transparent'
              )}
            >
              <route.icon className={cn('mr-3 h-5 w-5', route.color)} />
              {route.label}
            </Link>
          ))}
        </div>
        {/* Debug info for mobile */}
        <div className="mt-auto p-2 text-xs text-gray-500 md:hidden">
          Routes: {displayRoutes.length}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hamburger button for mobile */}
      {!mobileOpen && (
        <button
          className="fixed top-4 left-4 z-[100] md:hidden bg-card p-2 rounded-lg shadow-lg"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
          type="button"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      )}

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex w-full h-full pointer-events-auto">
          <div className="relative w-64 bg-card h-full shadow-lg transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto">
            <button
              className="absolute top-4 right-4 z-50 bg-muted p-2 rounded-full"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              type="button"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <div className="pt-16">
              <SidebarContent />
            </div>
          </div>
          {/* Click outside to close */}
          <div className="flex-1 h-full w-full" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden border-r bg-card md:block md:w-64 h-full">
        <SidebarContent />
      </div>
    </>
  );
}

export default Sidebar;

