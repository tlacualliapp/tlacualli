
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { DeliveryColumn } from './delivery-column';
import { DeliveryCard, Order } from './delivery-card';


const statuses: Order['status'][] = ['new', 'preparing', 'delivering', 'delivered'];

interface DeliveryBoardProps {
  restaurantId: string;
}

export const DeliveryBoard = ({ restaurantId }: DeliveryBoardProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!restaurantId) return;

    const ordersQuery = query(
        collection(db, `restaurantes/${restaurantId}/orders`), 
        where('type', '==', 'delivery')
    );
    const unsubscribe = onSnapshot(ordersQuery, snapshot => {
      const ordersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .filter(order => order.status !== 'cancelled');
      setOrders(ordersData);
      setIsLoading(false);
    }, error => {
      console.error("Error fetching delivery orders:", error);
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not load delivery orders.') });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, t, toast]);
  
  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, orderId);
      await updateDoc(orderRef, { status: newStatus });
      toast({ title: t('Order Updated'), description: t('The order status has been changed to {{status}}.', { status: t(newStatus) }) });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not update order status.') });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statuses.map(status => (
        <DeliveryColumn key={status} status={status} onDrop={handleStatusChange}>
          {orders
            .filter(order => order.status === status)
            .sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0))
            .map(order => (
              <DeliveryCard key={order.id} order={order} />
            ))}
        </DeliveryColumn>
      ))}
    </div>
  );
};
