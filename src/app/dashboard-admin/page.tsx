
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Users,
  Package,
  ClipboardList,
  ChefHat,
  Truck,
  BarChart,
  Map,
  Utensils,
  Settings,
  Loader2,
} from 'lucide-react';

const modules = [
  { href: '/orders', icon: ClipboardList, label: 'Orders', color: 'bg-yellow-500' },
  { href: '/dashboard-admin/menu', icon: Utensils, label: 'Menu & Recipes', color: 'bg-red-500' },
  { href: '/dashboard-admin/employees', icon: Users, label: 'Staff', color: 'bg-teal-500' },
  { href: '/dashboard-admin/inventory', icon: Package, label: 'Inventory', color: 'bg-orange-500' },
  { href: '/kitchen', icon: ChefHat, label: 'Kitchen', color: 'bg-gray-500' },
  { href: '/dashboard-admin/reports', icon: BarChart, label: 'Reports', color: 'bg-green-500' },
  { href: '/dashboard-admin/map', icon: Map, label: 'Digital Map', color: 'bg-purple-500' },
  { href: '/dashboard-admin/settings', icon: Settings, label: 'Settings', color: 'bg-slate-600' },
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <AdminLayout>
      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">{t('Administrator Dashboard')}</CardTitle>
          <p className="text-muted-foreground">{t("Manage your restaurant's operations.")}</p>
        </CardHeader>
      </Card>
      <Card className="bg-card/65 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('Modules')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {modules.map((item) => (
                <Link href={item.href} key={item.href}>
                    <Card className={`hover:scale-105 transition-transform duration-200 ease-in-out group ${item.color} text-white overflow-hidden`}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{t(item.label)}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-6">
                            <item.icon className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-200 ease-in-out" strokeWidth={1.5}/>
                        </CardContent>
                    </Card>
                </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

    