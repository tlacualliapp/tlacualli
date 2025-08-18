
'use client';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MenuTable } from '@/components/menu/menu-table';


export default function MenuPage() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

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
       <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">
              {t('Menu Management')}
            </CardTitle>
            <CardDescription>{t('Manage your categories, items, and recipes.')}</CardDescription>
        </CardHeader>
      </Card>
      
      <Card className="bg-card/65 backdrop-blur-lg">
        <CardContent className="p-4 md:p-6">
            {restaurantId ? <MenuTable restaurantId={restaurantId} /> : <p>{t('Loading...')}</p>}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
