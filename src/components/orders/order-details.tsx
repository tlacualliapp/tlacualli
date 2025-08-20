
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, serverTimestamp, addDoc, runTransaction, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Loader2, PlusCircle, Printer, CircleDollarSign, Send, ChefHat, XCircle, MinusCircle, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  subAccountId: string;
}

interface SubAccount {
  id: string;
  name: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  status: 'open' | 'preparing' | 'paid';
  sentToKitchenAt?: Timestamp;
  subaccounts: SubAccount[];
}

interface OrderDetailsProps {
  restaurantId: string;
  orderId: string;
  tableName: string;
  onAddItems: (subAccountId: string) => void;
  onOrderClosed: () => void;
}

export const OrderDetails = ({ restaurantId, orderId, tableName, onAddItems, onOrderClosed }: OrderDetailsProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const { toast } = useToast();


  useEffect(() => {
    if (!orderId) {
        setIsLoading(false);
        setOrder(null);
        return;
    };
    
    setIsLoading(true);
    const orderRef = doc(db, "orders", orderId);
    
    const unsubscribe = onSnapshot(orderRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const initialOrder = { id: docSnapshot.id, ...data } as Order;
            if (!initialOrder.subaccounts || initialOrder.subaccounts.length === 0) {
              initialOrder.subaccounts = [{ id: 'main', name: t('General') }];
            }
             if (initialOrder.items) {
                initialOrder.items.forEach(item => {
                    if (!item.subAccountId) {
                        item.subAccountId = 'main';
                    }
                });
            }
            setOrder(initialOrder);
        } else {
            setOrder(null);
            console.warn(`Order with ID ${orderId} not found.`);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching order:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [orderId, t]);


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
        toast({ title: t('Order Sent'), description: t('The order has been sent to the kitchen.')});
    } catch(e) {
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not send the order.')});
    }
  }
  
  const handleCloseOrder = async () => {
    if(!order) return;
    
    try {
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, { status: 'paid' });
        
        toast({ title: t('Order Closed'), description: `${t('Table')} ${tableName} ${t('is now')} ${t('available')}.`});
        onOrderClosed();

    } catch(e) {
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not close the order.')});
    }
  }

  const handleRemoveItem = async (itemToRemove: OrderItem) => {
    if (!order) return;
    const orderRef = doc(db, 'orders', order.id);

    try {
        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                throw new Error("Order does not exist!");
            }

            let currentItems: OrderItem[] = orderDoc.data().items || [];
            let updatedItems = [...currentItems];

            const itemIndex = updatedItems.findIndex(i => i.id === itemToRemove.id && i.subAccountId === itemToRemove.subAccountId);
            if (itemIndex > -1) {
                if (updatedItems[itemIndex].quantity > 1) {
                    updatedItems[itemIndex].quantity -= 1;
                } else {
                    updatedItems.splice(itemIndex, 1);
                }
            }

            const newSubtotal = updatedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
            transaction.update(orderRef, { items: updatedItems, subtotal: newSubtotal });
        });

        toast({
            title: t('Item Removed'),
            description: t('The item has been updated in the order.'),
        });

        if (order.status === 'preparing') {
             toast({
                variant: 'destructive',
                title: t('Kitchen Notified'),
                description: t('Item removed from order in preparation: {{itemName}}', { itemName: itemToRemove.name }),
            });
        }

    } catch (error) {
        console.error("Error removing item:", error);
        toast({ variant: "destructive", title: t("Error"), description: t("Could not remove the item.") });
    }
  };

  const handleCancelOrder = async () => {
    if(!order) return;
    try {
        await deleteDoc(doc(db, 'orders', order.id));
        toast({ title: t('Order Cancelled'), description: t('The order has been completely removed.') });
        
        if (order.status === 'preparing') {
             toast({
                variant: 'destructive',
                title: t('Kitchen Notified'),
                description: t('Order for table {{tableName}} has been cancelled.', { tableName: tableName }),
            });
        }
        
        onOrderClosed();
    } catch(error) {
        toast({ variant: "destructive", title: t("Error"), description: t("Could not cancel the order.") });
    }
  }

  const handleAddSubAccount = async () => {
    if (!order) return;
    const orderRef = doc(db, 'orders', order.id);
    const newSubAccount: SubAccount = {
      id: `sub_${Date.now()}`,
      name: `${t('Diner')} ${order.subaccounts.length + 1}`
    };
    try {
      await updateDoc(orderRef, {
        subaccounts: [...order.subaccounts, newSubAccount]
      });
      toast({ title: t('Sub-account added') });
    } catch (error) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not add sub-account.') });
    }
  };

  const handleRemoveSubAccount = async (subAccountId: string) => {
    if (!order) return;
    
    const itemsInSubAccount = order.items.filter(item => item.subAccountId === subAccountId);
    if (itemsInSubAccount.length > 0) {
      toast({
        variant: 'destructive',
        title: t('Cannot Delete'),
        description: t('This sub-account has items and cannot be deleted.'),
      });
      return;
    }

    const orderRef = doc(db, 'orders', order.id);
    const updatedSubAccounts = order.subaccounts.filter(sa => sa.id !== subAccountId);

    try {
      await updateDoc(orderRef, {
        subaccounts: updatedSubAccounts
      });
      toast({ title: t('Sub-account removed') });
    } catch (error) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not remove sub-account.') });
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!order) {
    return (
         <div className="p-6 flex flex-col h-full items-center justify-center text-center">
             <p className="text-muted-foreground mb-4">{t('No active order for this item.')}</p>
         </div>
    )
  }

  const getSubAccountTotal = (subAccountId: string) => {
    return order.items
      .filter(item => item.subAccountId === subAccountId)
      .reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };
  
  const getItemsForSubAccount = (subAccountId: string) => {
     return order.items.filter(item => item.subAccountId === subAccountId);
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold font-headline">{t('Order Summary')}: {tableName}</h2>
         {order.status === 'preparing' && (
            <div className="flex items-center gap-2 text-sm font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                <ChefHat className="h-4 w-4" />
                <span>{elapsedTime}</span>
            </div>
        )}
      </div>
      
      <ScrollArea className="flex-grow pr-4 -mr-4 mb-4">
        <Accordion type="multiple" defaultValue={order.subaccounts.map(sa => sa.id)} className="w-full">
          {order.subaccounts.map(subAccount => {
            const itemsInSubAccount = getItemsForSubAccount(subAccount.id);
            const isSubAccountEmpty = itemsInSubAccount.length === 0;

            return (
            <AccordionItem value={subAccount.id} key={subAccount.id}>
              <AccordionTrigger>
                <div className="flex justify-between items-center w-full pr-4 group">
                    <span className="flex items-center">{subAccount.name}</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono">${getSubAccountTotal(subAccount.id).toFixed(2)}</span>
                        {isSubAccountEmpty && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); handleRemoveSubAccount(subAccount.id); }}
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-4">
                  {itemsInSubAccount.map(item => (
                    <div key={`${item.id}-${item.subAccountId}`} className="flex justify-between items-center group">
                        <div>
                          <p className="font-semibold">{item.quantity}x {item.name}</p>
                           {item.notes && <p className="text-xs text-muted-foreground">- {item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="font-mono">${(item.price * item.quantity).toFixed(2)}</p>
                            {(order.status === 'open' || order.status === 'preparing') && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveItem(item)}>
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </div>
                  ))}
                  <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => onAddItems(subAccount.id)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> {t('Add Item')}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          )})}
        </Accordion>
      </ScrollArea>
      
      <div className="flex items-center justify-center my-2">
          <Button variant="outline" onClick={handleAddSubAccount}>
              <Users className="mr-2 h-4 w-4" /> {t('Split Account')}
          </Button>
      </div>

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
            {order.status === 'open' && (
                 <Button size="lg" className="w-full" onClick={handleSendToKitchen} disabled={!order.items || order.items.length === 0}>
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
            
            <div className="grid grid-cols-2 gap-2">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button size="lg" variant="destructive" className="w-full">
                            <XCircle className="mr-2 h-4 w-4" />
                            {t('Cancel Order')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('This action will permanently delete the current order. This cannot be undone.')}
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>{t('Go Back')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90">{t('Yes, cancel order')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="lg" variant="secondary" className="w-full">
                            {t('Close Order')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>{t('Finalize and Close Order')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('This will mark the order as paid and update the table status. This action cannot be undone.')}
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCloseOrder}>{t('Yes, close order')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
      </div>

    </div>
  );
};
