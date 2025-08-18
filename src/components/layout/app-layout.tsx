
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Users,
  User,
  PanelLeft,
  Home,
  UtensilsCrossed,
  Sun,
  Moon,
  Laptop,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { TacoIcon } from '@/components/icons/logo';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import '@/app/i18n'; // Import the i18n configuration

const navItems = [
  { href: '/dashboard-am', label: 'Dashboard', icon: Home },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-lg px-4 md:px-6 z-20">
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
              {t(item.label)}
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
                <TacoIcon className="h-6 w-6 text-primary" />
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
                  {t(item.label)}
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
              <DropdownMenuLabel>{t('My Account')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>{t('Theme')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>{t('Light')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>{t('Dark')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Laptop className="mr-2 h-4 w-4" />
                      <span>{t('System')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
               <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Languages className="mr-2 h-4 w-4" />
                  <span>{t('Language')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => changeLanguage('en')}>
                      <span>English</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLanguage('es')}>
                      <span>Español</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('Log out')}</span>
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
