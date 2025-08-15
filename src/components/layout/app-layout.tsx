
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Cog,
  LayoutDashboard,
  LogOut,
  Map,
  Users,
  User,
  PanelLeft,
  Home,
  Package,
  Soup,
  UtensilsCrossed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TacoIcon } from '@/components/icons/logo';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { TablesIcon } from '@/components/icons/tables';
import { InventoryIcon } from '@/components/icons/inventory';

const navItems = [
  { href: '/dashboard-am', label: 'Dashboard', icon: Home },
  { href: '/orders', label: 'Pedidos', icon: ClipboardList },
  { href: '/map', label: 'Mesas', icon: TablesIcon },
  { href: '/menu', label: 'Menú', icon: BookOpen },
  { href: '/employees', label: 'Empleados', icon: Users },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/inventory', label: 'Inventario', icon: InventoryIcon },
  { href: '/recipes', label: 'Recetas', icon: Soup },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/50 backdrop-blur-lg px-4 md:px-6 z-20">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/dashboard-am"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <TacoIcon className="h-8 w-8 text-primary" />
            <span className="font-headline text-xl">TLACUALLI</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground ${
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/dashboard-am"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <TacoIcon className="h-6 w-6" />
                <span >Tlacualli</span>
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-xl px-3 py-2 ${
                    pathname === item.href
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground'
                  } transition-all hover:text-foreground`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 relative">
        {children}
      </main>
    </div>
  );
}
