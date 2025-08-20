
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Loader2, PlusCircle, Printer, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table as TableType } from '../map/table-item';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  status: 'open' | 'sent' | 'paid';
}

interface OrderDetailsProps {
  restaurantId: string;
  table: TableType;
  onAddItems: () => void;
}

export const OrderDetails = ({ restaurantId, table, onAddItems }: OrderDetailsProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    // This is a placeholder for fetching real order data.
    // In a real app, you would query the 'orders' collection.
    setIsLoading(true);
    // Simulating an existing order for occupied tables
    if (table.status === 'occupied' || table.status === 'billing') {
      setOrder({
        id: 'mock-order-123',
        items: [
          { id: 'item-1', name: 'Volcano Tacos', quantity: 2, price: 25 },
          { id: 'item-2', name: 'Classic Margarita', quantity: 1, price: 12 },
          { id: 'item-3', name: 'Aztec Burger', quantity: 1, price: 15, notes: 'Sin cebolla' },
        ],
        subtotal: 77,
        status: table.status === 'billing' ? 'sent' : 'open',
      });
    } else {
      setOrder(null);
    }
    setIsLoading(false);
  }, [table]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!order) {
    return (
         <div className="p-6 flex flex-col h-full items-center justify-center text-center">
             <p className="text-muted-foreground mb-4">{t('No active order for this table.')}</p>
             <Button onClick={onAddItems}>
                 <PlusCircle className="mr-2 h-4 w-4"/>
                 {t('Start New Order')}
             </Button>
         </div>
    )
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-2xl font-bold font-headline mb-4">{t('Order Summary')}: {t('Table')} {table.name}</h2>
      
      <ScrollArea className="flex-grow pr-4 -mr-4 mb-4">
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.id}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.quantity}x {item.name}</p>
                   {item.notes && <p className="text-xs text-muted-foreground">- {item.notes}</p>}
                </div>
                <p className="font-mono">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator className="my-4" />

      <div className="space-y-2 text-lg">
        <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Subtotal')}</span>
            <span className="font-bold font-mono">${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Taxes (16%)')}</span>
            <span className="font-bold font-mono">${(order.subtotal * 0.16).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-xl">
            <span>{t('Total')}</span>
            <span className="font-mono">${(order.subtotal * 1.16).toFixed(2)}</span>
        </div>
      </div>

       <div className="mt-6 space-y-2">
            <Button size="lg" className="w-full bg-accent hover:bg-accent/90" onClick={onAddItems}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('Add More Items')}
            </Button>
            <Button size="lg" variant="outline" className="w-full">
                <CircleDollarSign className="mr-2 h-4 w-4" />
                {t('Go to Payment')}
            </Button>
             <Button size="lg" variant="outline" className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                {t('Print Pre-ticket')}
            </Button>
      </div>

    </div>
  );
};

    