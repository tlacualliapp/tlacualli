
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { MenuSelection } from '../orders/menu-selection';
import { Textarea } from '../ui/textarea';


interface DeliveryOrderFormProps {
  restaurantId: string;
  onSuccess?: () => void;
}

export function DeliveryOrderForm({ restaurantId, onSuccess }: DeliveryOrderFormProps) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'details' | 'menu'>('details');
    const [orderId, setOrderId] = useState<string | null>(null);

    const [customerDetails, setCustomerDetails] = useState({
        customerName: '',
        customerPhone: '',
        deliveryAddress: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCustomerDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleStartOrder = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const newOrderRef = await addDoc(collection(db, `restaurantes/${restaurantId}/orders`), {
                ...customerDetails,
                restaurantId: restaurantId,
                status: 'new', // Initial status for delivery orders
                type: 'delivery',
                items: [],
                subtotal: 0,
                createdAt: serverTimestamp(),
            });

            setOrderId(newOrderRef.id);
            setView('menu');
            toast({
                title: t('Order Started'),
                description: t('Now add items to the delivery order.')
            });
        } catch (error) {
            console.error("Error starting delivery order:", error);
            toast({ variant: 'destructive', title: t('Error'), description: t('Could not start a new order.') });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOrderFinished = () => {
        onSuccess?.();
    };

    if (view === 'menu' && orderId) {
        return (
            <div className="h-[70vh]">
                <MenuSelection 
                    restaurantId={restaurantId}
                    orderId={orderId}
                    tableName={customerDetails.customerName}
                    onBack={handleOrderFinished}
                    subAccountId="main"
                />
            </div>
        );
    }

    return (
        <form onSubmit={handleStartOrder} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customerName">{t('Customer Name')}</Label>
                    <Input id="customerName" name="customerName" value={customerDetails.customerName} onChange={handleInputChange} placeholder={t("e.g., Jane Doe")} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="customerPhone">{t('Customer Phone')}</Label>
                    <Input id="customerPhone" name="customerPhone" type="tel" value={customerDetails.customerPhone} onChange={handleInputChange} placeholder={t("Customer's contact number")} required />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="deliveryAddress">{t('Delivery Address')}</Label>
                <Textarea id="deliveryAddress" name="deliveryAddress" value={customerDetails.deliveryAddress} onChange={handleInputChange} placeholder={t("Full address including city, state, and zip code")} required />
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    {t('Continue to Menu')}
                </Button>
            </div>
        </form>
    );
}
