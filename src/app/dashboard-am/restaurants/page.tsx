
'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UtensilsCrossed, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RestaurantForm } from '@/components/dashboard/restaurant-form';
import { useTranslation } from 'react-i18next';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function CreateRestaurantPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
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


  if (loading || !isAuthorized) {
      return (
        <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
  }
  
  return (
    <AppLayout>
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                    <UtensilsCrossed className="h-8 w-8" /> {t('Register Restaurant')}
                    </CardTitle>
                    <CardDescription>{t('Add a new restaurant and its administrator to the system.')}</CardDescription>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('Go Back')}
                </Button>
            </CardHeader>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>{t('Restaurant Information')}</CardTitle>
            </CardHeader>
            <CardContent>
                <RestaurantForm onSuccess={() => router.push('/dashboard-am')} />
            </CardContent>
        </Card>
    </AppLayout>
  );
}
