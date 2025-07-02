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
    requiredRole: 'admin', // Admin only - removed color for consistency
  },
];

function Sidebar() {
  const pathname = usePathname();
  const [businessName, setBusinessName] = useState('LEWA HOSPITALITY');
  const { hasPermission } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Role hierarchy check function
  const hasRolePermission = (requiredRole: UserRole): boolean => {
    if (!requiredRole) return true;

    // Define role hierarchy
    const roleHierarchy: Record<UserRole, number> = {
      staff: 1,
      manager: 2,
      admin: 3,
    };

    try {
      const userRole = hasPermission('admin') ? 'admin'
        : hasPermission('manager') ? 'manager'
          : 'staff';

      return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  // Filter routes based on user role with proper hierarchy
  const routes = allRoutes.filter((route) => {
    if (!route.requiredRole) return true;
    return hasRolePermission(route.requiredRole);
  });

  // Fallback routes for when permission system fails
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

  // Use filtered routes if available, otherwise use fallback
  const displayRoutes = routes.length > 0 ? routes : fallbackRoutes;

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Load business settings
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
        setBusinessName('LEWA HOSPITALITY'); // Fallback
      }
    }
    loadBusinessName();
  }, []);

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex h-full flex-col px-3 py-4">
      {/* Logo/Brand */}
      <Link
        href="/"
        className="mb-6 flex items-center px-2 py-2 rounded-lg hover:bg-accent transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary flex-shrink-0" />
          <span className="text-xl font-bold truncate">{businessName}</span>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {displayRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
              pathname === route.href
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <route.icon className={cn('mr-3 h-5 w-5 flex-shrink-0', route.color)} />
            <span className="truncate">{route.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-auto p-2 text-xs text-muted-foreground border-t">
          <div>Routes: {displayRoutes.length}</div>
          <div>Role: {hasPermission('admin') ? 'Admin' : hasPermission('manager') ? 'Manager' : 'Staff'}</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className={cn(
          "fixed top-4 left-4 z-50 md:hidden bg-card border p-2 rounded-lg shadow-lg transition-all",
          mobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        type="button"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <div className="fixed left-0 top-0 h-full w-64 bg-card shadow-xl">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 bg-muted hover:bg-muted/80 p-2 rounded-full transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              type="button"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            {/* Sidebar content */}
            <div className="h-full overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;