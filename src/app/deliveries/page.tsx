
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DeliveryBoard } from '@/components/deliveries/delivery-board';
import { DeliveryOrderForm } from '@/components/deliveries/delivery-order-form';

export default function DeliveriesPage() {
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const { t } = useTranslation();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

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

  if (!restaurantId) {
    return <AdminLayout><div>{t('Loading...')}</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <DndProvider backend={HTML5Backend}>
        <Card className="mb-6 bg-card/65 backdrop-blur-lg">
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Truck className="h-8 w-8" /> {t('Delivery Management')}
                    </CardTitle>
                    <CardDescription>
                        {t('Manage your home delivery orders.')}
                    </CardDescription>
                </div>
                 <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-accent hover:bg-accent/90">
                          <PlusCircle className="mr-2 h-4 w-4" /> {t('Create Delivery Order')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{t('New Delivery Order')}</DialogTitle>
                            <DialogDescription>{t("Enter the customer's details and select the items for the order.")}</DialogDescription>
                        </DialogHeader>
                        <DeliveryOrderForm restaurantId={restaurantId} onSuccess={() => setIsOrderModalOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
        </Card>
        
        <DeliveryBoard restaurantId={restaurantId} />

      </DndProvider>
    </AdminLayout>
  );
}
