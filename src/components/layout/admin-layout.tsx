
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Users,
  User,
  PanelLeft,
  Home,
  Sun,
  Moon,
  Laptop,
  Languages,
  KeyRound,
  Loader2,
  Package,
  BookOpen,
  ClipboardList,
  ChefHat,
  Truck,
  BarChart,
  Map,
  Utensils
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TacoIcon } from '@/components/icons/logo';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { auth } from '@/lib/firebase';
import { updatePassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import '@/app/i18n'; 

const navItems = [
  { href: '/dashboard-admin', label: 'Dashboard', icon: Home },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/menu', label: 'Menu', icon: Utensils },
  { href: '/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/employees', label: 'Staff', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/reports', label: 'Reports', icon: BarChart },
  { href: '/map', label: 'Digital Map', icon: Map },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);


  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Passwords do not match.'),
      });
      return;
    }
    if (newPassword.length < 6) {
       toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Password must be at least 6 characters long.'),
      });
      return;
    }

    setIsUpdatingPassword(true);
    const user = auth.currentUser;
    if (user) {
      try {
        await updatePassword(user, newPassword);
        toast({
          title: t('Success'),
          description: t('Password updated successfully.'),
        });
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordModalOpen(false);
      } catch (error) {
         toast({
          variant: 'destructive',
          title: t('Error updating password'),
          description: t('This operation is sensitive and requires recent authentication. Please log out and log back in to change your password.'),
        });
        console.error("Error updating password:", error);
      } finally {
        setIsUpdatingPassword(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
          <div className="flex h-16 items-center border-b px-6">
             <Link
                href="/dashboard-admin"
                className="flex items-center gap-2 font-semibold"
              >
                <TacoIcon className="h-8 w-8 text-primary" />
                <span className="font-headline text-xl">TLACUALLI</span>
            </Link>
          </div>
           <nav className="flex-1 overflow-y-auto px-4 py-4">
                <div className="grid items-start gap-1">
                    {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                        pathname === item.href ? 'bg-muted text-primary' : ''
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.label)}
                    </Link>
                  ))}
                </div>
           </nav>
        </aside>

        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline" className="sm:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">{t('Toggle Menu')}</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="sm:max-w-xs">
                         <SheetTitle className="sr-only">{t('Menu')}</SheetTitle>
                        <nav className="grid gap-6 text-lg font-medium">
                        <Link
                            href="/dashboard-admin"
                            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                        >
                            <TacoIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                            <span className="sr-only">Tlacualli</span>
                        </Link>
                        {navItems.map((item) => (
                            <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground ${
                                pathname === item.href ? 'text-foreground' : ''
                            }`}
                            >
                            <item.icon className="h-5 w-5" />
                            {t(item.label)}
                            </Link>
                        ))}
                        </nav>
                    </SheetContent>
                </Sheet>
                 <div className="relative ml-auto flex-1 md:grow-0">
                    {/* Optional: Can add a search bar here */}
                 </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                            <User className="h-5 w-5" />
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
                        <DropdownMenuItem onSelect={() => setIsPasswordModalOpen(true)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            <span>{t('Change Password')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/login">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{t('Log out')}</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
             <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                {children}
            </main>
        </div>


      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('Change Password')}</DialogTitle>
            <DialogDescription>
              {t("Enter your new password below. After saving, you will be logged out for security.")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                {t('New Password')}
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirm-password" className="text-right">
                {t('Confirm Password')}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={handlePasswordChange} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('Save Changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
