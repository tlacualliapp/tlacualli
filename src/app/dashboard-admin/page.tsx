
'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building, Edit, Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { AdminRestaurantForm } from '@/components/dashboard/admin-restaurant-form';
import { getRestaurantIdForUser } from '@/lib/users';
import { useTranslation } from 'react-i18next';


export default function AdminDashboard() {
  const [user, loadingAuth] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      getRestaurantIdForUser(user.uid).then(id => {
        setRestaurantId(id);
      });
    }
  }, [user]);

  useEffect(() => {
    if (restaurantId) {
      const restaurantRef = doc(db, 'restaurantes', restaurantId);
      const unsubscribe = onSnapshot(restaurantRef, (doc) => {
        if (doc.exists()) {
          setRestaurant({ id: doc.id, ...doc.data() });
        } else {
          console.error("No such restaurant!");
          setRestaurant(null);
        }
        setLoadingData(false);
      });
      return () => unsubscribe();
    } else if (!loadingAuth) {
        setLoadingData(false);
    }
  }, [restaurantId, loadingAuth]);

  const isLoading = loadingAuth || loadingData;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t('Administrator Dashboard')}</h1>
          <p className="text-muted-foreground">{t("Manage your restaurant's operations.")}</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('Welcome, Administrator!')}</CardTitle>
            <Building className="h-6 w-6 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t("Here you can manage your menu, employees, and view reports for your restaurant.")}</p>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{t('Restaurant Information')}</CardTitle>
                    <CardDescription>{t("View and update your restaurant details.")}</CardDescription>
                </div>
                 <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!restaurant}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('Edit Information')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{t('Edit Restaurant Information')}</DialogTitle>
                            <DialogDescription>
                                {t("Update your restaurant's details. Click save when you're done.")}
                            </DialogDescription>
                        </DialogHeader>
                        {restaurant && <AdminRestaurantForm restaurant={restaurant} onSuccess={() => setIsFormModalOpen(false)} />}
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : restaurant ? (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div className="font-semibold">{t('Restaurant Name')}:</div>
                        <div>{restaurant.restaurantName}</div>
                        <div className="font-semibold">{t('Social Reason')}:</div>
                        <div>{restaurant.socialReason}</div>
                        <div className="font-semibold">{t('Style')}:</div>
                        <div>{restaurant.style}</div>
                        <div className="font-semibold">{t('Address')}:</div>
                        <div>{`${restaurant.address}, ${restaurant.municipality}, ${restaurant.state}`}</div>
                        <div className="font-semibold">{t('Phone')}:</div>
                        <div>{restaurant.phone}</div>
                        <div className="font-semibold">{t('Email')}:</div>
                        <div>{restaurant.email}</div>
                        <div className="font-semibold">{t('RFC')}:</div>
                        <div>{restaurant.rfc}</div>
                    </dl>
                ) : (
                    <p className="text-muted-foreground">{t('No restaurant associated with this account.')}</p>
                )}
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
