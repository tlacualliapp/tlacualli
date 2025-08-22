
'use client';

import React, { useState, useEffect } from 'react';
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
  ClipboardList,
  ChefHat,
  Truck,
  BarChart,
  Map,
  Utensils,
  Settings
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
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/lib/firebase';
import { updatePassword } from 'firebase/auth';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from '@/hooks/use-toast';
import '@/app/i18n'; 

const allNavItems = [
  { key: 'dashboard', href: '/dashboard-admin', label: 'Dashboard', icon: Home },
  { key: 'orders', href: '/orders', label: 'Orders', icon: ClipboardList },
  { key: 'menu', href: '/dashboard-admin/menu', label: 'Menu & Recipes', icon: Utensils },
  { key: 'staff', href: '/dashboard-admin/employees', label: 'Staff', icon: Users },
  { key: 'inventory', href: '/dashboard-admin/inventory', label: 'Inventory', icon: Package },
  { key: 'kitchen', href: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { key: 'deliveries', href: '/deliveries', label: 'Deliveries', icon: Truck },
  { key: 'reports', href: '/dashboard-admin/reports', label: 'Reports', icon: BarChart },
  { key: 'map', href: '/dashboard-admin/map', label: 'Digital Map', icon: Map },
  { key: 'settings', href: '/dashboard-admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, loading] = useAuthState(auth);
  const { setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [navItems, setNavItems] = useState(allNavItems);

   useEffect(() => {
    const fetchPermissions = async () => {
      if (user) {
        // Find user document by uid first
        let userDocRef;
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          userDocRef = querySnapshot.docs[0].ref;
        } else {
          // Fallback for users who might not have UID stored (e.g. older records)
          const legacyQ = query(collection(db, "usuarios"), where("email", "==", user.email));
          const legacySnapshot = await getDocs(legacyQ);
          if(!legacySnapshot.empty) {
            userDocRef = legacySnapshot.docs[0].ref;
          }
        }
        
        if (userDocRef) {
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Administrator (Profile 1) has all permissions
            if (userData.perfil === '1') {
              setNavItems(allNavItems);
            } else if (userData.permissions) {
              const allowedItems = allNavItems.filter(item => userData.permissions[item.key]);
              setNavItems(allowedItems);
            } else {
              setNavItems([]); // No permissions set, show nothing
            }
          }
        }
      }
    };
    if (!loading) {
      fetchPermissions();
    }
  }, [user, loading]);


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
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await updatePassword(currentUser, newPassword);
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
    <div 
      className="relative flex min-h-screen w-full flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/background.png')" }}
    >
      <div className="absolute inset-0 bg-black/10"></div>
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card/65 backdrop-blur-lg px-4 md:px-6 z-20">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/dashboard-admin"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <TacoIcon className="h-8 w-8 text-primary" />
            <span className="sr-only">Tlacualli</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground ${
                pathname === item.href ? 'text-foreground font-semibold' : 'text-muted-foreground'
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
              <span className="sr-only">{t('Toggle navigation menu')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetTitle className="sr-only">{t('Menu')}</SheetTitle>
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/dashboard-admin"
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
                <span className="sr-only">{t('Toggle user menu')}</span>
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
        </div>
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-8 md:gap-8 md:p-8 relative z-10">
        {children}
      </main>

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
