
'use client';
import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RestaurantForm } from '@/components/dashboard/restaurant-form';
import { useTranslation } from 'react-i18next';


export default function CreateRestaurantPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-800 flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8" /> {t('Register Restaurant')}
          </h1>
          <p className="text-gray-600">{t('Add a new restaurant and its administrator to the system.')}</p>
        </div>
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Go Back')}
        </Button>
      </div>
      <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
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

    
