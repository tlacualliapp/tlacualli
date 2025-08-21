

'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, serverTimestamp, addDoc, runTransaction, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Loader2, PlusCircle, Printer, CircleDollarSign, Send, ChefHat, XCircle, MinusCircle, Users, Trash2, BellRing, Timer, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { WhatsappIcon } from '../icons/whatsapp';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  subAccountId: string;
  status?: 'pending' | 'preparing' | 'ready';
  categoryId?: string;
}

interface SubAccount {
  id: string;
  name: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  status: 'open' | 'preparing' | 'paid' | 'ready_for_pickup' | 'served';
  sentToKitchenAt?: Timestamp;
  pickupAcknowledgedAt?: Timestamp;
  subaccounts: SubAccount[];
  tableName?: string;
  takeoutId?: string;
  createdAt: Timestamp;
}

interface OrderDetailsProps {
  restaurantId: string;
  orderId: string;
  tableName: string;
  onAddItems: (subAccountId: string) => void;
  onOrderClosed: () => void;
}

const statusInfo = {
    pending: { icon: Timer, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    preparing: { icon: ChefHat, color: 'bg-purple-100 text-purple-800', label: 'Preparing' },
    ready: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Ready' },
};


export const OrderDetails = ({ restaurantId, orderId, tableName, onAddItems, onOrderClosed }: OrderDetailsProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const { toast } = useToast();
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const ticketRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!orderId || !restaurantId) {
        setIsLoading(false);
        setOrder(null);
        return;
    };
    
    setIsLoading(true);
    const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, orderId);
    
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
  }, [orderId, restaurantId, t]);


  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (order?.status === 'preparing' && order.sentToKitchenAt && !order.pickupAcknowledgedAt) {
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
    if (!order || !restaurantId || order.items.length === 0) return;
    try {
        const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, order.id);
        const itemsWithStatus = order.items.map(item => ({...item, status: 'pending'}));
        
        await updateDoc(orderRef, {
            status: 'preparing',
            sentToKitchenAt: serverTimestamp(),
            items: itemsWithStatus
        });
        toast({ title: t('Order Sent'), description: t('The order has been sent to the kitchen.')});
    } catch(e) {
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not send the order.')});
    }
  }
  
  const handleCloseOrder = async () => {
    if(!order || !restaurantId) return;
    
    try {
        const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, order.id);
        await updateDoc(orderRef, { status: 'paid' });
        
        toast({ title: t('Order Closed'), description: `${t('Table')} ${tableName} ${t('is now')} ${t('available')}.`});
        onOrderClosed();

    } catch(e) {
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not close the order.')});
    }
  }

  const handleRemoveItem = async (itemToRemove: OrderItem) => {
    if (!order || !restaurantId) return;
    const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, order.id);

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
    if(!order || !restaurantId) return;
    try {
        await deleteDoc(doc(db, `restaurantes/${restaurantId}/orders`, order.id));
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
    if (!order || !restaurantId) return;
    const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, order.id);
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
    if (!order || !restaurantId) return;
    
    const itemsInSubAccount = order.items.filter(item => item.subAccountId === subAccountId);
    if (itemsInSubAccount.length > 0) {
      toast({
        variant: 'destructive',
        title: t('Cannot Delete'),
        description: t('This sub-account has items and cannot be deleted.'),
      });
      return;
    }

    const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, order.id);
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
  
  const handleAcknowledgePickup = async () => {
    if (!order || !restaurantId) return;
    try {
        const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, order.id);
        await updateDoc(orderRef, { 
            status: 'served',
            pickupAcknowledgedAt: serverTimestamp()
        });
        toast({ title: t('Order Served'), description: t('The order has been marked as served.') });
    } catch (error) {
         toast({ variant: 'destructive', title: t('Error'), description: t('Could not update order status.') });
    }
  }
  
  const handlePrintTicket = () => {
    const printContents = ticketRef.current?.innerHTML;
    if (printContents) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      // We might need to re-initialize the component state or reload the page after this.
      // For simplicity, we just restore the content.
       window.location.reload();
    }
  };
  
  const handleSendWhatsApp = async () => {
    if (!whatsappNumber) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Please enter a phone number.') });
      return;
    }
    if (!ticketRef.current || !order) {
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not generate the bill content.') });
        return;
    }
    
    try {
        const canvas = await html2canvas(ticketRef.current, { scale: 2 });
        const pdf = new jsPDF('p', 'mm', [80, 297]); // 80mm width ticket
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, imgHeight);

        const billText = `Hola! Aquí está tu cuenta para la Mesa ${tableName}. Total: $${(order.subtotal * 1.16).toFixed(2)}. Gracias por tu visita!`;
        
        // This opens a new tab. It does not send the PDF directly, as WhatsApp Web API doesn't support that for un-saved contacts easily.
        // It pre-fills the text message. The user then has to attach the downloaded PDF.
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(billText)}&type=phone_number&app_absent=0`;
        window.open(whatsappUrl, '_blank');

        pdf.save(`cuenta-mesa-${tableName}.pdf`);
        
        toast({
        title: t('WhatsApp Ready'),
        description: t('Your PDF bill is downloading. Please attach it to the WhatsApp chat that has opened.'),
        });

        setIsBillModalOpen(false);
        setWhatsappNumber('');

    } catch (error) {
         toast({
            variant: 'destructive',
            title: t('PDF Error'),
            description: t('Could not generate the PDF for the bill.'),
        });
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

  const pendingItemsCount = order.items?.filter(item => item.status !== 'ready').length || 0;

  return (
    <>
      <div id="printable-ticket" className="hidden">
        <div ref={ticketRef} style={{ width: '302px', padding: '16px', fontFamily: 'monospace', fontSize: '12px', backgroundColor: 'white', color: 'black' }}>
          {order && (
            <>
              <h2 style={{ textAlign: 'center', fontSize: '16px', margin: '0 0 10px 0' }}>Tlacualli Restaurant</h2>
              <p style={{ textAlign: 'center', margin: '0' }}>Mesa: {tableName}</p>
              <p style={{ textAlign: 'center', margin: '0 0 10px 0' }}>Fecha: {new Date().toLocaleString()}</p>
              <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Cant. Descripción</span>
                <span>Importe</span>
              </div>
              <hr style={{ borderTop: '1px dashed black', margin: '5px 0' }} />
              {order.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA (16%):</span>
                <span>${(order.subtotal * 0.16).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
                <span>TOTAL:</span>
                <span>${(order.subtotal * 1.16).toFixed(2)}</span>
              </div>
              <p style={{ textAlign: 'center', marginTop: '15px' }}>¡Gracias por su visita!</p>
            </>
          )}
        </div>
      </div>

      <Dialog open={isBillModalOpen} onOpenChange={setIsBillModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Request Bill')}</DialogTitle>
            <DialogDescription>{t('Choose how to deliver the bill to the customer.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><WhatsappIcon className="h-5 w-5" /> {t('Send via WhatsApp')}</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="whatsapp" className="sr-only">{t('Phone Number')}</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder={t('Enter phone number')}
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
                <Button onClick={handleSendWhatsApp}>{t('Send')}</Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('This will open WhatsApp and prompt you to send the generated PDF.')}</p>
            </div>
            <Separator />
            <div className="space-y-4">
                <h3 className="font-semibold">{t('Print Ticket')}</h3>
                <Button variant="outline" className="w-full" onClick={handlePrintTicket}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t('Print Physical Ticket')}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-4 flex flex-col h-full non-printable">
        <div className="flex justify-between items-start mb-1">
          <div>
              <h2 className="text-2xl font-bold font-headline">{t('Order Summary')}: {tableName}</h2>
              {order.status === 'preparing' || order.status === 'ready_for_pickup' || order.status === 'served' ? (
                  <div className="text-sm text-muted-foreground">
                      {order.status === 'served' ? t('Order Complete') : 
                          (pendingItemsCount > 0 ? t('{{count}} items pending', { count: pendingItemsCount }) : t('All items ready'))
                      }
                  </div>
              ) : null}
          </div>
           {order.status === 'preparing' && !order.pickupAcknowledgedAt && (
              <div className="flex items-center gap-2 text-sm font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  <ChefHat className="h-4 w-4" />
                  <span>{elapsedTime}</span>
              </div>
          )}
           {order.status === 'ready_for_pickup' && (
               <div className="flex items-center gap-2 text-sm font-semibold bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full animate-pulse">
                  <BellRing className="h-4 w-4" />
                  <span>{t('Ready for pickup')}</span>
              </div>
           )}
           {order.status === 'served' && (
               <div className="flex items-center gap-2 text-sm font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t('Table Served')}</span>
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
                <div className="flex items-center w-full group">
                   <AccordionTrigger className="flex-grow p-2">
                      <div className="flex justify-between items-center w-full">
                          <span className="flex items-center">{subAccount.name}</span>
                          <span className="font-mono pr-2">${getSubAccountTotal(subAccount.id).toFixed(2)}</span>
                      </div>
                  </AccordionTrigger>
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
                <AccordionContent>
                  <div className="space-y-3 pl-4">
                    {itemsInSubAccount.map((item, index) => {
                      const status = item.status || 'pending';
                      const StatusIcon = statusInfo[status]?.icon;
                      return (
                          <div key={`${item.id}-${item.subAccountId}-${index}`} className="flex justify-between items-center group">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{item.quantity}x {item.name}</p>
                                  {order.status !== 'open' && StatusIcon && (
                                      <Badge variant="outline" className={cn("text-xs py-0.5 px-1.5 h-auto", statusInfo[status].color)}>
                                          <StatusIcon className="h-3 w-3 mr-1" />
                                          {t(statusInfo[status].label)}
                                      </Badge>
                                  )}
                                </div>
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
                      );
                    })}
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
               {order.status === 'ready_for_pickup' && (
                  <Button size="lg" className="w-full" onClick={handleAcknowledgePickup}>
                      <BellRing className="mr-2 h-4 w-4" />
                      {t('Acknowledge Pickup')}
                  </Button>
              )}
              <Button size="lg" variant="outline" className="w-full" onClick={() => setIsBillModalOpen(true)}>
                <Printer className="mr-2 h-4 w-4" />
                {t('Request Bill')}
              </Button>
               <Button size="lg" variant="outline" className="w-full">
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  {t('Go to Payment')}
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
    </>
  );
};
