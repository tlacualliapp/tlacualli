
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Loader2, PlusCircle, Printer, CircleDollarSign, Send, ChefHat, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table as TableType } from '../map/table-item';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';

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
  status: 'open' | 'preparing' | 'paid';
  sentToKitchenAt?: Timestamp;
}

interface OrderDetailsProps {
  restaurantId: string;
  table: TableType;
  onAddItems: () => void;
  onOrderClosed: () => void;
}

export const OrderDetails = ({ restaurantId, table, onAddItems, onOrderClosed }: OrderDetailsProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [isCloseOrderModalOpen, setIsCloseOrderModalOpen] = useState(false);
  const [newTableStatus, setNewTableStatus] = useState<'available' | 'reserved' | 'dirty'>('available');
  const { toast } = useToast();


  useEffect(() => {
    if (!restaurantId || !table.id) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    const q = query(collection(db, "orders"), where("tableId", "==", table.id), where("status", "!=", "paid"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const orderDoc = snapshot.docs[0];
            setOrder({ id: orderDoc.id, ...orderDoc.data() } as Order);
        } else {
            setOrder(null);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching order:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, table.id]);


  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (order?.status === 'preparing' && order.sentToKitchenAt) {
      const sentTime = order.sentToKitchenAt.toDate().getTime();
      timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const difference = now - sentTime;
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setElapsedTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [order]);
  
  const handleSendToKitchen = async () => {
    if (!order || !restaurantId) return;
    try {
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
            status: 'preparing',
            sentToKitchenAt: serverTimestamp(),
        });
        const tableRef = doc(db, `restaurantes/${restaurantId}/rooms/${table.roomId}/tables`, table.id);
        await updateDoc(tableRef, { status: 'preparing' });
        toast({ title: t('Order Sent'), description: t('The order has been sent to the kitchen.')});
    } catch(e) {
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not send the order.')});
    }
  }
  
  const handleCloseOrder = async () => {
    if(!restaurantId || !table.id) return;
    
    try {
        const tableRef = doc(db, `restaurantes/${restaurantId}/rooms/${table.roomId}/tables`, table.id);
        await updateDoc(tableRef, { status: newTableStatus });
        
        if (order) {
            const orderRef = doc(db, 'orders', order.id);
            // Here you might want to move the order to a historical collection
            // instead of deleting it. For now, we'll delete.
            await deleteDoc(orderRef);
        }
        
        toast({ title: t('Order Closed'), description: `${t('Table')} ${table.name} ${t('is now')} ${t(newTableStatus)}.`});
        setIsCloseOrderModalOpen(false);
        onOrderClosed();

    } catch(e) {
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not close the order.')});
    }
  }


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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold font-headline">{t('Order Summary')}: {t('Table')} {table.name}</h2>
         {order.status === 'preparing' && (
            <div className="flex items-center gap-2 text-sm font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                <ChefHat className="h-4 w-4" />
                <span>{elapsedTime}</span>
            </div>
        )}
      </div>
      
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
            {order.status === 'open' && (
                 <Button size="lg" className="w-full" onClick={handleSendToKitchen}>
                    <Send className="mr-2 h-4 w-4" />
                    {t('Send to Kitchen')}
                </Button>
            )}
            <Button size="lg" variant="outline" className="w-full">
                <CircleDollarSign className="mr-2 h-4 w-4" />
                {t('Go to Payment')}
            </Button>
            <Button size="lg" variant="outline" className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                {t('Print Pre-ticket')}
            </Button>
            <Button size="lg" variant="destructive" className="w-full" onClick={() => setIsCloseOrderModalOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                {t('Close Order')}
            </Button>
      </div>

       <AlertDialog open={isCloseOrderModalOpen} onOpenChange={setIsCloseOrderModalOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>{t('Close Order and Free Table')}</AlertDialogTitle>
            <AlertDialogDescription>
                {t('Select the new status for the table after closing this order.')}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <RadioGroup defaultValue="available" onValueChange={(v: 'available' | 'reserved' | 'dirty') => setNewTableStatus(v)}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="available" id="r1" />
                        <Label htmlFor="r1">{t('Available')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dirty" id="r2" />
                        <Label htmlFor="r2">{t('Dirty')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reserved" id="r3" />
                        <Label htmlFor="r3">{t('Reserved')}</Label>
                    </div>
                </RadioGroup>
            </div>
            <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseOrder}>{t('Confirm')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </div>
  );
};
