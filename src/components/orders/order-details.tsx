

'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, serverTimestamp, addDoc, runTransaction, getDocs, getDoc } from 'firebase/firestore';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface OrderItem {
  id: string; // This is the menuItemId
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  subAccountId: string;
  status?: 'pending' | 'preparing' | 'ready';
  categoryId?: string;
  recipeId?: string;
  inventoryItemId?: string;
}

interface SubAccount {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  status: 'open' | 'preparing' | 'paid' | 'ready_for_pickup' | 'served' | 'cancelled';
  sentToKitchenAt?: Timestamp;
  pickupAcknowledgedAt?: Timestamp;
  subaccounts: SubAccount[];
  tableName?: string;
  takeoutId?: string;
  createdAt: Timestamp;
}

interface RestaurantDetails {
    restaurantName: string;
    address: string;
    municipality: string;
    state: string;
    phone: string;
    logoUrl?: string;
    iconUrl?: string;
    iva?: number;
}

interface OrderDetailsProps {
  restaurantId: string;
  userPlan: string;
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


export const OrderDetails = ({ restaurantId, userPlan, orderId, tableName, onAddItems, onOrderClosed }: OrderDetailsProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const { toast } = useToast();
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [printerType, setPrinterType] = useState<'thermal' | 'conventional'>('thermal');
  const [ivaRate, setIvaRate] = useState(16); // Default to 16%

  const [paymentData, setPaymentData] = useState({
    paidAmount: 0,
    tip: 0,
    paymentMethod: '',
    requiresInvoice: false,
    invoiceName: '',
    invoiceAddress: '',
    invoiceRfc: '',
    invoiceEmail: '',
  });

  const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';

  useEffect(() => {
    if (!orderId || !restaurantId) {
        setIsLoading(false);
        setOrder(null);
        return;
    };
    
    // Fetch IVA rate and restaurant details
    const fetchRestaurantData = async () => {
        try {
            const restaurantRef = doc(db, collectionName, restaurantId);
            const restaurantSnap = await getDoc(restaurantRef);
            if(restaurantSnap.exists()) {
                const data = restaurantSnap.data() as RestaurantDetails;
                setRestaurantDetails(data);
                if (data.iva) {
                    setIvaRate(data.iva);
                }
            }
        } catch (error) {
            console.error("Failed to fetch restaurant details:", error);
        }
    }
    fetchRestaurantData();

    setIsLoading(true);
    const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, orderId);
    
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
  }, [orderId, restaurantId, collectionName, t]);

  // Effect to update paidAmount when order or IVA changes
  useEffect(() => {
    if (order) {
        const total = order.subtotal * (1 + ivaRate / 100);
        setPaymentData(prev => ({ ...prev, paidAmount: total }));
    }
  }, [order, ivaRate]);


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
        const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, order.id);
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
        const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, order.id);
        
        // 1. Save payment information
        const paymentRef = collection(db, `${collectionName}/${restaurantId}/payments`);
        await addDoc(paymentRef, {
            orderId: order.id,
            ...paymentData,
            totalPaid: paymentData.paidAmount,
            orderSubtotal: order.subtotal,
            orderTotal: order.subtotal * (1 + ivaRate / 100),
            paymentDate: serverTimestamp()
        });

        // 2. Update order status
        await updateDoc(orderRef, { status: 'paid' });
        
        toast({ title: t('Order Closed'), description: t('Table {{tableName}} is now available.', {tableName: tableName})});
        setIsPaymentModalOpen(false);
        onOrderClosed();

    } catch(e) {
        console.error(e)
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not close the order.')});
    }
  }

  const handleRemoveItem = async (itemToRemove: OrderItem, itemIndex: number) => {
    if (!order || !restaurantId) return;

    if (itemToRemove.recipeId && itemToRemove.status === 'ready') {
        toast({
            variant: "destructive",
            title: t("Cannot Remove"),
            description: t("This item is already prepared and cannot be removed."),
        });
        return;
    }

    const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, order.id);

    try {
        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                throw new Error(t("Order document does not exist!"));
            }

            let currentItems: OrderItem[] = orderDoc.data().items || [];
            
            if (currentItems.length <= itemIndex) {
              throw new Error("Item index out of bounds");
            }
            
            const actualItemToRemove = currentItems[itemIndex];

            // If it's a direct inventory item, we need to update its stock
            if (!actualItemToRemove.recipeId && actualItemToRemove.inventoryItemId) {
                const inventoryItemRef = doc(db, `${collectionName}/${restaurantId}/inventoryItems`, actualItemToRemove.inventoryItemId);
                const inventoryItemDoc = await transaction.get(inventoryItemRef);
                if (inventoryItemDoc.exists()) {
                    const newStock = (inventoryItemDoc.data().currentStock || 0) + actualItemToRemove.quantity;
                    transaction.update(inventoryItemRef, { currentStock: newStock });
                }
            }

            // Remove item from order
            currentItems.splice(itemIndex, 1);
            const newSubtotal = currentItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
            transaction.update(orderRef, { items: currentItems, subtotal: newSubtotal });
        });

        toast({
            title: t('Item Removed'),
            description: t('The item has been removed from the order.'),
        });

    } catch (error) {
        console.error("Error removing item:", error);
        toast({ variant: "destructive", title: t("Error"), description: (error as Error).message || t("Could not remove the item.") });
    }
  };


  const handleCancelOrder = async () => {
    if(!order || !restaurantId) return;
    try {
        const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, order.id);
        await updateDoc(orderRef, { status: 'cancelled' });

        toast({ title: t('Order Cancelled'), description: t('The order has been marked as cancelled.') });
        
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
    const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, order.id);
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

    const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, order.id);
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
        const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, order.id);
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
    if (!order || !restaurantDetails) return;
    const ivaAmount = order.subtotal * (ivaRate / 100);
    const totalAmount = order.subtotal + ivaAmount;
    const logoUrl = restaurantDetails.logoUrl || restaurantDetails.iconUrl;

    const ticketHTML = `
      <html>
        <head>
          <title>${t('Print Ticket')}</title>
          <style>
            body { font-family: ${printerType === 'thermal' ? "'Courier New', Courier, monospace" : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"}; margin: 0; padding: 10px; background-color: #fff; color: #000; }
            .ticket { width: ${printerType === 'thermal' ? '80mm' : '100%'}; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 10px; }
            .header img { max-width: 100px; max-height: 80px; margin-bottom: 5px; }
            .header h2 { font-size: ${printerType === 'thermal' ? '18px' : '22px'}; margin: 0; }
            .header p { font-size: ${printerType === 'thermal' ? '10px' : '12px'}; margin: 1px 0; }
            table { width: 100%; border-collapse: collapse; font-size: ${printerType === 'thermal' ? '12px' : '14px'}; }
            hr { border: none; border-top: 1px dashed #000; }
            th, td { padding: 2px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo">` : ''}
              <h2>${restaurantDetails.restaurantName}</h2>
              <p>${restaurantDetails.address || ''}, ${restaurantDetails.municipality || ''}, ${restaurantDetails.state || ''}</p>
              <p>${t('Phone')}: ${restaurantDetails.phone || ''}</p>
            </div>
            <p class="text-center" style="margin: 0;">${t('Table')}: ${tableName}</p>
            <p class="text-center" style="margin: 0 0 10px 0;">${t('Date')}: ${new Date().toLocaleString()}</p>
            <hr />
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">${t('Qty')}</th>
                  <th style="text-align: left;">${t('Description')}</th>
                  <th class="text-right">${t('Amount')}</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td style="vertical-align: top;">${item.quantity}x</td>
                    <td style="word-break: break-all;">${item.name}</td>
                    <td class="text-right" style="vertical-align: top;">$${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <hr />
            <table>
              <tr><td>${t('Subtotal')}:</td><td class="text-right">$${order.subtotal.toFixed(2)}</td></tr>
              <tr><td>${t('IVA')} (${ivaRate}%):</td><td class="text-right">$${ivaAmount.toFixed(2)}</td></tr>
            </table>
            <hr />
            <table style="font-size: ${printerType === 'thermal' ? '16px' : '20px'};" class="font-bold">
              <tr><td>TOTAL:</td><td class="text-right">$${totalAmount.toFixed(2)}</td></tr>
            </table>
            <p class="text-center" style="margin-top: 15px;">${t('Thank you for your visit!')}</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            // printWindow.close(); // You might want to close it after printing
        };
    } else {
        toast({
            variant: 'destructive',
            title: t('Error'),
            description: t('Could not open print window. Please disable your pop-up blocker.'),
        });
    }
  };


  const handleSendWhatsApp = async () => {
    if (!whatsappNumber) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Please enter a phone number.') });
      return;
    }
    if (!order) {
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not generate the bill content.') });
        return;
    }
    const ivaAmount = order.subtotal * (ivaRate / 100);
    const totalAmount = order.subtotal + ivaAmount;

    const billContentEl = document.createElement('div');
    billContentEl.innerHTML = `
        <div id="bill-to-pdf" style="padding: 20px; font-family: sans-serif; color: #000; background: #fff;">
            <h2>${t('Bill for')} ${t('Table')} ${tableName}</h2>
            <hr />
            ${order.items.map(item => `<p>${item.quantity}x ${item.name} - <b>$${(item.price * item.quantity).toFixed(2)}</b></p>`).join('')}
            <hr />
            <p>${t('Subtotal')}: $${order.subtotal.toFixed(2)}</p>
            <p>${t('IVA')} (${ivaRate}%): $${ivaAmount.toFixed(2)}</p>
            <h3>${t('Total')}: $${totalAmount.toFixed(2)}</h3>
            <hr />
            <p>${t('Thank you for your visit!')}</p>
        </div>
    `;
    document.body.appendChild(billContentEl);
    
    const canvas = await html2canvas(billContentEl.querySelector('#bill-to-pdf') as HTMLElement);
    document.body.removeChild(billContentEl);

    const pdf = new jsPDF();
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const billText = order.items.map(item => `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`).join('\\n');
    const total = totalAmount.toFixed(2);
    const fullMessage = `${t('Hello! Here is your bill for')} ${t('Table')} ${tableName}:\\n\\n${billText}\\n\\n${t('Subtotal')}: $${order.subtotal.toFixed(2)}\\n${t('IVA')} (${ivaRate}%): $${ivaAmount.toFixed(2)}\\n*Total: $${total}*\\n\\n${t('Thank you for your visit!')}`;
    
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(fullMessage)}&type=phone_number&app_absent=0`;
    window.open(whatsappUrl, '_blank');
    
    pdf.save(`bill-${tableName}-${order.id.substring(0,5)}.pdf`);

    setIsBillModalOpen(false);
    setWhatsappNumber('');
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
  const ivaAmount = order.subtotal * (ivaRate / 100);
  const totalAmount = order.subtotal + ivaAmount;

  return (
    <>
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
            </div>
            <Separator />
            <div className="space-y-4">
                <h3 className="font-semibold">{t('Print Ticket')}</h3>
                 <div className="space-y-2">
                    <Label htmlFor="printer-type">{t('Printer Type')}</Label>
                     <Select value={printerType} onValueChange={(value: 'thermal' | 'conventional') => setPrinterType(value)}>
                        <SelectTrigger id="printer-type">
                            <SelectValue placeholder={t('Select printer type')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="thermal">{t('Thermal Printer (80mm)')}</SelectItem>
                            <SelectItem value="conventional">{t('Conventional (A4)')}</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                <Button variant="outline" className="w-full" onClick={handlePrintTicket}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t('Print Physical Ticket')}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{t('Register Payment')}</DialogTitle>
                <DialogDescription>{t('Confirm the payment details to close the order.')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                    <Label htmlFor="paidAmount">{t('Paid Amount')}</Label>
                    <Input id="paidAmount" type="number" value={(paymentData.paidAmount || 0).toFixed(2)} readOnly />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tip">{t('Tip')}</Label>
                    <Input id="tip" type="number" value={paymentData.tip} onChange={(e) => setPaymentData({...paymentData, tip: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paymentMethod">{t('Payment Method')}</Label>
                    <Select value={paymentData.paymentMethod} onValueChange={(value) => setPaymentData({...paymentData, paymentMethod: value})}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select a method')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash">{t('Cash')}</SelectItem>
                            <SelectItem value="credit_card">{t('Credit Card')}</SelectItem>
                            <SelectItem value="debit_card">{t('Debit Card')}</SelectItem>
                            <SelectItem value="transfer">{t('Bank Transfer')}</SelectItem>
                            <SelectItem value="other">{t('Other')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="items-top flex space-x-2">
                    <Checkbox id="requiresInvoice" checked={paymentData.requiresInvoice} onCheckedChange={(checked) => setPaymentData({...paymentData, requiresInvoice: !!checked})} />
                    <div className="grid gap-1.5 leading-none">
                        <label htmlFor="requiresInvoice" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('Requires Invoice')}</label>
                    </div>
                </div>
                {paymentData.requiresInvoice && (
                    <div className="space-y-4 p-4 border rounded-md">
                        <div className="space-y-2">
                            <Label htmlFor="invoiceName">{t('Name or Business Name')}</Label>
                            <Input id="invoiceName" value={paymentData.invoiceName} onChange={(e) => setPaymentData({...paymentData, invoiceName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceRfc">{t('RFC')}</Label>
                            <Input id="invoiceRfc" value={paymentData.invoiceRfc} onChange={(e) => setPaymentData({...paymentData, invoiceRfc: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceAddress">{t('Fiscal Address')}</Label>
                            <Input id="invoiceAddress" value={paymentData.invoiceAddress} onChange={(e) => setPaymentData({...paymentData, invoiceAddress: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceEmail">{t('Email')}</Label>
                            <Input id="invoiceEmail" type="email" value={paymentData.invoiceEmail} onChange={(e) => setPaymentData({...paymentData, invoiceEmail: e.target.value})} />
                        </div>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>{t('Cancel')}</Button>
                <Button onClick={handleCloseOrder}>{t('Confirm Payment & Close Order')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="p-4 flex flex-col h-full">
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
                      const canBeRemoved = order.status === 'open' || (item.status !== 'ready' && !!item.recipeId) || !item.recipeId;
                      
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
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveItem(item, index)} disabled={!canBeRemoved}>
                                    <MinusCircle className="h-4 w-4" />
                                  </Button>
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
              <span className="text-muted-foreground">{t('IVA')} (${ivaRate}%)</span>
              <span className="font-bold font-mono">${ivaAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl">
              <span>{t('Total')}</span>
              <span className="font-mono">${totalAmount.toFixed(2)}</span>
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
               <Button size="lg" variant="outline" className="w-full" onClick={() => setIsPaymentModalOpen(true)}>
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  {t('Go to Payment')}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                           <Button size="lg" variant="destructive" className="w-full" disabled={order.status === 'served'}>
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
                          <AlertDialogAction onClick={() => setIsPaymentModalOpen(true)}>{t('Yes, close order')}</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
        </div>

      </div>
    </>
  );
};
