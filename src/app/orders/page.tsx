
'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users, Map as MapIcon } from 'lucide-react';
import { MapEditor } from '@/components/map/map-editor';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTranslation } from 'react-i18next';
import '@/app/i18n';

export default function OrdersPage() {
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setRestaurantId(userData.restauranteId);
        }
      }
    };
    fetchRestaurantId();
  }, [user]);

  return (
    <AdminLayout>
      <DndProvider backend={HTML5Backend}>
        <div className="grid gap-6 lg:grid-cols-3 h-full">
          {/* Columna Izquierda - Mapa de Mesas */}
          <div className="lg:col-span-2">
              <Card className="h-full">
                   <CardHeader>
                        <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                            <ClipboardList className="h-8 w-8" /> {t('Order Management')}
                        </CardTitle>
                        <CardDescription>
                            {t('Select a table to start an order or manage an existing one.')}
                        </CardDescription>
                    </CardHeader>
                  <CardContent className="p-0 h-[calc(100vh-220px)]">
                      <div className="w-full h-full bg-muted/50 border-t relative">
                          {restaurantId ? <MapEditor restaurantId={restaurantId} view="operational" /> : <p className="p-4">{t('Loading...')}</p>}
                      </div>
                  </CardContent>
              </Card>
          </div>
          {/* Columna Derecha - Detalles de la Orden */}
          <div className="lg:col-span-1">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {t('Order Details')}
                      </CardTitle>
                      <CardDescription>{t('Items and totals for the selected table will appear here.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100vh-220px)] flex items-center justify-center text-muted-foreground">
                      <p>{t('Select a table to begin.')}</p>
                  </CardContent>
              </Card>
          </div>
        </div>
      </DndProvider>
    </AdminLayout>
  );
}
