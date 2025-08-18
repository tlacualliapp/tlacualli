
'use client';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Users,
  Package,
  BookOpen,
  ClipboardList,
  ChefHat,
  Truck,
  BarChart,
  Map,
  Utensils,
} from 'lucide-react';

const modules = [
  { href: '/orders', icon: ClipboardList, label: 'Orders', color: 'bg-yellow-500' },
  { href: '/menu', icon: Utensils, label: 'Menu', color: 'bg-red-500' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes', color: 'bg-blue-500' },
  { href: '/employees', icon: Users, label: 'Staff', color: 'bg-teal-500' },
  { href: '/dashboard-admin/inventory', icon: Package, label: 'Inventory', color: 'bg-orange-500' },
  { href: '/kitchen', icon: ChefHat, label: 'Kitchen', color: 'bg-gray-500' },
  { href: '/deliveries', icon: Truck, label: 'Deliveries', color: 'bg-indigo-500' },
  { href: '/reports', icon: BarChart, label: 'Reports', color: 'bg-green-500' },
  { href: '/map', icon: Map, label: 'Digital Map', color: 'bg-purple-500' },
];

export default function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <AdminLayout>
      <Card className="bg-card/65 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">{t('Administrator Dashboard')}</CardTitle>
          <p className="text-muted-foreground">{t("Manage your restaurant's operations.")}</p>
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
