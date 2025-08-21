
'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, Users, UtensilsCrossed } from 'lucide-react';
import { DailyAccessChart } from '@/components/dashboard/daily-access-chart';
import { RestaurantActionsChart } from '@/components/dashboard/restaurant-actions-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RestaurantsTable } from '@/components/dashboard/restaurants-table';
import { MasterUsersTable } from '@/components/dashboard/master-users-table';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer, onSnapshot, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function AdminMasterDashboard() {
  const [stats, setStats] = useState({
    restaurants: 0,
    adminMasters: 0,
    admins: 0,
    collaborators: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchInitialCounts = async () => {
        try {
            const restaurantsQuery = query(collection(db, "restaurantes"), where("status", "==", "1"));
            const usersQuery = query(collection(db, "usuarios"), where("status", "==", "1"));
            
            const [restaurantsSnapshot, usersSnapshot] = await Promise.all([
                getDocs(restaurantsQuery),
                getDocs(usersQuery)
            ]);

            let adminMasters = 0, admins = 0, collaborators = 0;
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                if (user.perfil === 'AM') adminMasters++;
                else if (user.perfil === '1') admins++;
                else if (user.perfil === '2') collaborators++;
            });

            setStats({
                restaurants: restaurantsSnapshot.size,
                adminMasters,
                admins,
                collaborators,
            });
        } catch (error) {
            console.error("Error fetching initial stats:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchInitialCounts();

    // Listener for real-time updates
    const unsubRestaurants = onSnapshot(query(collection(db, "restaurantes"), where("status", "==", "1")), (snap) => {
        setStats(s => ({...s, restaurants: snap.size}));
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

    return () => {
      unsubRestaurants();
      unsubUsers();
    }
  }, []);


  return (
    <div className="relative z-10">
      <AppLayout>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline text-gray-800">{t('Master Admin Dashboard')}</h1>
            <p className="text-gray-600">{t('Welcome to the Tlacualli main control panel.')}</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Registered Restaurants')}</CardTitle>
              <UtensilsCrossed className="h-6 w-6 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{isLoading ? '...' : stats.restaurants}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Master Admin Users')}</CardTitle>
              <Users className="h-6 w-6 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{isLoading ? '...' : stats.adminMasters}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Administrator Users')}</CardTitle>
              <Users className="h-6 w-6 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{isLoading ? '...' : stats.admins}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Collaborator Users')}</CardTitle>
              <Users className="h-6 w-6 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{isLoading ? '...' : stats.collaborators}</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4 bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <LineChart className="h-6 w-6" /> {t('Monthly Accesses')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyAccessChart />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
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
        <Card className="mt-6 bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="restaurantes">
              <TabsList className="bg-gray-200 text-gray-700">
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
    </div>
  );
}
