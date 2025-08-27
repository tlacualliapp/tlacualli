
'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Map as MapIcon, Loader2 } from 'lucide-react';
import { MapEditor } from '@/components/map/map-editor';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTranslation } from 'react-i18next';
import { AssignmentManager } from '@/components/map/assignment-manager';
import { getCurrentUserData } from '@/lib/users';

export default function MapPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userData = await getCurrentUserData();
        if (userData) {
          setRestaurantId(userData.restauranteId);
          setUserPlan(userData.plan);
        }
      }
    };
    fetchUserData();
  }, [user]);

  if (loading || !user) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
 }

  return (
    <AdminLayout>
      <DndProvider backend={HTML5Backend}>
        <Card className="mb-6 bg-card/65 backdrop-blur-lg">
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                    <MapIcon className="h-8 w-8" /> {t('Table and Assignment Management')}
                </CardTitle>
                <CardDescription>
                    {t('Visualize your restaurant layout, manage tables, and track assignments in real-time.')}
                </CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
              <Card className="h-full">
                  <CardContent className="p-0 h-[60vh]">
                      <div className="w-full h-full bg-muted/50 border-t relative">
                          {restaurantId && userPlan ? <MapEditor restaurantId={restaurantId} userPlan={userPlan} /> : <p className="p-4">{t('Loading...')}</p>}
                      </div>
                  </CardContent>
              </Card>
          </div>
          <div className="lg:col-span-1">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {t('Assign Areas & Tables')}
                      </CardTitle>
                      <CardDescription>{t('Assign employees to specific areas and tables.')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {restaurantId && userPlan ? <AssignmentManager restaurantId={restaurantId} userPlan={userPlan} /> : <p>{t('Loading...')}</p>}
                  </CardContent>
              </Card>
          </div>
        </div>
      </DndProvider>
    </AdminLayout>
  );
}
