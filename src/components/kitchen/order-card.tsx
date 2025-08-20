
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Check, CheckCheck, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status?: 'pending' | 'preparing' | 'ready';
}

export interface Order {
  id: string;
  tableName?: string;
  takeoutId?: string;
  items: OrderItem[];
  status: 'preparing' | 'ready_for_pickup';
  sentToKitchenAt?: Timestamp;
}

interface KitchenOrderCardProps {
  order: Order;
  onItemStatusChange: (orderId: string, itemId: string, newStatus: 'pending' | 'preparing' | 'ready') => void;
  onOrderReady: (orderId: string) => void;
}

export const KitchenOrderCard = ({ order, onItemStatusChange, onOrderReady }: KitchenOrderCardProps) => {
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    if (!order.sentToKitchenAt) return;

    const sentTime = order.sentToKitchenAt.toDate().getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = now - sentTime;
      const minutes = String(Math.floor((difference / (1000 * 60)) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((difference / 1000) % 60)).padStart(2, '0');
      setElapsedTime(`${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [order.sentToKitchenAt]);
  
  const allItemsReady = order.items.every(item => item.status === 'ready');

  return (
    <Card className={cn(
        "flex flex-col",
        order.status === 'ready_for_pickup' && 'bg-green-100 border-green-300'
    )}>
      <CardHeader className="flex flex-row justify-between items-center p-4">
        <CardTitle className="text-xl font-bold">{order.tableName || order.takeoutId}</CardTitle>
        <Badge variant="outline" className="text-sm font-mono">{elapsedTime}</Badge>
      </CardHeader>
      <CardContent className="flex-grow p-4 space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className={cn("p-2 rounded-md transition-colors", {
              'bg-yellow-100/50': item.status === 'preparing',
              'bg-green-100/50': item.status === 'ready',
          })}>
            <div className="flex justify-between items-start">
              <p className="font-semibold">{item.quantity}x {item.name}</p>
              <div className="flex items-center gap-1">
                 {item.status !== 'ready' && (
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-green-600 hover:bg-green-200"
                        onClick={() => onItemStatusChange(order.id, item.id, 'ready')}
                    >
                        <Check className="h-4 w-4"/>
                    </Button>
                 )}
              </div>
            </div>
            {item.notes && <p className="text-xs text-muted-foreground pl-1">- {item.notes}</p>}
          </div>
        ))}
      </CardContent>
      <Separator />
      <CardFooter className="p-2">
         {order.status !== 'ready_for_pickup' ? (
             <Button 
                className="w-full"
                disabled={!allItemsReady}
                onClick={() => onOrderReady(order.id)}
             >
                <CheckCheck className="mr-2"/> {t('Mark as Ready')}
            </Button>
         ) : (
             <div className="w-full text-center text-sm font-semibold text-green-700 p-2">
                {t('Waiting for pickup...')}
             </div>
         )}
      </CardFooter>
    </Card>
  );
};
