
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, LineChart, Users, UtensilsCrossed, Loader2, CreditCard } from 'lucide-react';
import { DailyAccessChart } from '@/components/dashboard/daily-access-chart';
import { RestaurantActionsChart } from '@/components/dashboard/restaurant-actions-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RestaurantsTable } from '@/components/dashboard/restaurants-table';
import { MasterUsersTable } from '@/components/dashboard/master-users-table';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function AdminMasterDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [stats, setStats] = useState({
    restaurants: 0,
    adminMasters: 0,
    admins: 0,
    collaborators: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAuthorization = async () => {
      const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        if (userData.perfil === 'AM') {
          setIsAuthorized(true);
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    };
    checkAuthorization();
  }, [user, loading, router]);
  
  useEffect(() => {
    if (!isAuthorized) return;
    
    let prodCount = 0;
    let demoCount = 0;

    const unsubRestaurantsProd = onSnapshot(query(collection(db, "restaurantes"), where("status", "==", "1")), (snap) => {
        prodCount = snap.size;
        setStats(s => ({...s, restaurants: prodCount + demoCount }));
    });

    const unsubRestaurantsDemo = onSnapshot(query(collection(db, "restaurantes_demo"), where("status", "==", "1")), (snap) => {
        demoCount = snap.size;
        setStats(s => ({...s, restaurants: prodCount + demoCount }));
    });
    
    const unsubUsers = onSnapshot(query(collection(db, "usuarios"), where("status", "==", "1")), (snap) => {
        let adminMasters = 0, admins = 0, collaborators = 0;
        snap.forEach(doc => {
            const user = doc.data();
            if (user.perfil === 'AM') adminMasters++;
            else if (user.perfil === '1') admins++;
            else if (user.perfil === '2') collaborators++;
        });
        setStats(s => ({ ...s, adminMasters, admins, collaborators }));
    });

    setIsLoading(false);

    return () => {
      unsubRestaurantsProd();
      unsubRestaurantsDemo();
      unsubUsers();
    }
  }, [isAuthorized]);

 if (loading || isLoading || !isAuthorized) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
 }

  return (
    <AppLayout>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline">{t('Master Admin Dashboard')}</CardTitle>
                <CardDescription>{t('Welcome to the Tlacualli main control panel.')}</CardDescription>
            </CardHeader>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Registered Restaurants')}</CardTitle>
              <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stats.restaurants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Master Admin Users')}</CardTitle>
              <Users className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stats.adminMasters}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Administrator Users')}</CardTitle>
              <Users className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stats.admins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Collaborator Users')}</CardTitle>
              <Users className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stats.collaborators}</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <LineChart className="h-6 w-6" /> {t('Monthly Accesses')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyAccessChart />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <BarChart className="h-6 w-6" /> {t('Actions by Restaurant')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RestaurantActionsChart />
            </CardContent>
          </Card>
        </div>
        <Card className="mt-6">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="restaurantes">
              <TabsList>
                <TabsTrigger value="restaurantes">{t('Restaurants')}</TabsTrigger>
                <TabsTrigger value="usuarios">{t('Master Users')}</TabsTrigger>
              </TabsList>
              <TabsContent value="restaurantes">
                <RestaurantsTable />
              </TabsContent>
              <TabsContent value="usuarios">
                <MasterUsersTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
    </AppLayout>
  );
}
