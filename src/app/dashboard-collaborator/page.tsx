
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Users,
  Package,
  ClipboardList,
  ChefHat,
  BarChart,
  Map,
  Utensils,
  Settings,
  Home,
} from 'lucide-react';

interface UserPermissions {
  [key: string]: boolean;
}

interface UserData {
  nombre: string;
  permissions?: UserPermissions;
}

const allModules = [
  { key: 'dashboard', href: '/dashboard-collaborator', label: 'Dashboard', icon: Home, color: 'bg-blue-500' },
  { key: 'orders', href: '/orders', label: 'Orders', icon: ClipboardList, color: 'bg-yellow-500' },
  { key: 'menu', href: '/dashboard-admin/menu', label: 'Menu & Recipes', icon: Utensils, color: 'bg-red-500' },
  { key: 'staff', href: '/dashboard-admin/employees', label: 'Staff', icon: Users, color: 'bg-teal-500' },
  { key: 'inventory', href: '/dashboard-admin/inventory', label: 'Inventory', icon: Package, color: 'bg-orange-500' },
  { key: 'kitchen', href: '/kitchen', label: 'Kitchen', icon: ChefHat, color: 'bg-gray-500' },
  { key: 'reports', href: '/dashboard-admin/reports', label: 'Reports', icon: BarChart, color: 'bg-green-500' },
  { key: 'map', href: '/dashboard-admin/map', label: 'Digital Map', icon: Map, color: 'bg-purple-500' },
  { key: 'settings', href: '/dashboard-admin/settings', label: 'Settings', icon: Settings, color: 'bg-slate-600' },
];


export default function CollaboratorDashboard() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchUserData = async () => {
        if (user) {
            setIsLoading(true);
            const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                setUserData(data as UserData);
            } else {
                 const legacyQ = query(collection(db, "usuarios"), where("email", "==", user.email));
                 const legacySnapshot = await getDocs(legacyQ);
                 if(!legacySnapshot.empty) {
                    const legacyData = legacySnapshot.docs[0].data();
                    setUserData(legacyData as UserData);
                 }
            }
            setIsLoading(false);
        }
    };
    fetchUserData();
  }, [user]);

  const enabledModules = allModules.filter(module => {
    if (module.key === 'dashboard') return true;
    return userData?.permissions?.[module.key];
  });


  if (loading || isLoading || !user) {
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
            <CardTitle className="text-3xl font-bold font-headline">{t('Collaborator Dashboard')}</CardTitle>
            <CardDescription>{t('Access your daily tasks and information.')}</CardDescription>
        </CardHeader>
      </Card>
      
      {enabledModules.length > 0 ? (
          <Card className="bg-card/65 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{t('Available Modules')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {enabledModules.map((item) => (
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
      ) : (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>{t('No modules have been assigned to you. Please contact your administrator.')}</p>
            </CardContent>
        </Card>
      )}

    </AdminLayout>
  );
}
