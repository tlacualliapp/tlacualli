
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getRestaurantIdForCurrentUser } from '@/lib/users';
import { AdminRestaurantForm } from '@/components/dashboard/admin-restaurant-form';

interface Restaurant {
  id: string;
  restaurantName: string;
  socialReason: string;
  style: string;
  address: string;
  municipality: string;
  state: string;
  phone: string;
  email: string;
  rfc: string;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (user) {
        setIsLoading(true);
        const id = await getRestaurantIdForCurrentUser();
        setRestaurantId(id);
        if (id) {
          const restaurantRef = doc(db, 'restaurantes', id);
          const restaurantSnap = await getDoc(restaurantRef);
          if (restaurantSnap.exists()) {
            setRestaurant({ id: restaurantSnap.id, ...restaurantSnap.data() } as Restaurant);
          }
        }
        setIsLoading(false);
      }
    };
    fetchRestaurantData();
  }, [user]);

  return (
    <AdminLayout>
      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Settings className="h-8 w-8" /> {t('Restaurant Settings')}
          </CardTitle>
          <CardDescription>{t('Update your restaurant\'s information.')}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : restaurant ? (
            <AdminRestaurantForm restaurant={restaurant} />
          ) : (
            <p>{t('Restaurant data could not be loaded.')}</p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
