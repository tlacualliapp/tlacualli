
'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ChefHat, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { KitchenOrderCard, Order } from '@/components/kitchen/order-card';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getRestaurantIdForCurrentUser } from '@/lib/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const id = await getRestaurantIdForCurrentUser();
        setRestaurantId(id);
      }
    };
    fetchRestaurantId();
  }, [user]);

  useEffect(() => {
    if (!restaurantId) {
        if (!user) setIsLoading(false);
        return;
    };

    const q = query(
      collection(db, `restaurantes/${restaurantId}/orders`), 
      where('status', 'in', ['preparing', 'ready_for_pickup'])
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .sort((a, b) => (a.sentToKitchenAt?.toMillis() || 0) - (b.sentToKitchenAt?.toMillis() || 0));
      
      setOrders(ordersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching kitchen orders:", error);
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not load kitchen orders.') });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, t, toast, user]);

  const handleItemStatusChange = async (orderId: string, itemId: string, newStatus: 'pending' | 'preparing' | 'ready') => {
    if (!restaurantId) return;

    try {
      const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, orderId);
      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder) return;
      
      const updatedItems = currentOrder.items.map((item, index) => 
        `${item.id}-${index}` === itemId ? { ...item, status: newStatus } : item
      );

      const allItemsReady = updatedItems.every(item => item.status === 'ready');
      
      const updatePayload: { items: typeof updatedItems, status?: 'ready_for_pickup'} = { items: updatedItems };

      if (allItemsReady) {
        updatePayload.status = 'ready_for_pickup';
      }

      await updateDoc(orderRef, updatePayload);
      
      if(allItemsReady) {
         toast({ title: t('Order Ready'), description: t('The order is now ready for pickup.') });
      }

    } catch (error) {
       toast({ variant: 'destructive', title: t('Error'), description: t('Could not update item status.') });
    }
  };

  const handleOrderReady = async (orderId: string) => {
    if (!restaurantId) return;
    try {
      const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, orderId);
      await updateDoc(orderRef, { status: 'ready_for_pickup' });
      toast({ title: t('Order Ready'), description: t('The order is now ready for pickup.') });
    } catch (error) {
       toast({ variant: 'destructive', title: t('Error'), description: t('Could not mark the order as ready.') });
    }
  };

  return (
    <AdminLayout>
      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <ChefHat className="h-8 w-8" /> {t('Kitchen Management')}
            </CardTitle>
            <CardDescription>{t('View and manage incoming orders in real-time.')}</CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
         <Card className="bg-card/65 backdrop-blur-lg">
            <CardContent className="flex flex-col items-center justify-center text-center p-16">
                <h1 className="text-4xl font-bold font-headline mb-4">{t('Kitchen is Clear!')}</h1>
                <p className="text-lg text-muted-foreground max-w-md">
                {t('There are no pending orders at the moment.')}
                </p>
            </CardContent>
         </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {orders.map(order => (
                <KitchenOrderCard 
                    key={order.id} 
                    order={order} 
                    onItemStatusChange={handleItemStatusChange}
                    onOrderReady={handleOrderReady}
                />
            ))}
        </div>
      )}
    </AdminLayout>
  );
}
