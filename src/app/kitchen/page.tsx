
'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { KitchenOrderCard, Order } from '@/components/kitchen/order-card';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getRestaurantIdForCurrentUser } from '@/lib/users';

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
        // If there's no restaurant ID yet, we don't query.
        // We could even set loading to false if we are sure there will be no ID.
        if (!user) setIsLoading(false);
        return;
    };

    const q = query(
      collection(db, 'orders'), 
      where('restaurantId', '==', restaurantId),
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
    try {
      const orderRef = doc(db, 'orders', orderId);
      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder) return;
      
      const updatedItems = currentOrder.items.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      );

      await updateDoc(orderRef, { items: updatedItems });

    } catch (error) {
       toast({ variant: 'destructive', title: t('Error'), description: t('Could not update item status.') });
    }
  };

  const handleOrderReady = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'ready_for_pickup' });
      toast({ title: t('Order Ready'), description: t('The order is now ready for pickup.') });
    } catch (error) {
       toast({ variant: 'destructive', title: t('Error'), description: t('Could not mark the order as ready.') });
    }
  };

  return (
    <AdminLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
         <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl font-bold font-headline mb-4">{t('Kitchen is Clear!')}</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              {t('There are no pending orders at the moment.')}
            </p>
          </div>
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
