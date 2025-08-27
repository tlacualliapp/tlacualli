
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, ArrowLeft, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getCurrentUserData } from '@/lib/users';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const plans = [
  { id: 'esencial', name: 'Plan Esencial', price: 195, description: 'Ideal para restaurantes pequeños.' },
  { id: 'pro', name: 'Plan Pro', price: 295, description: 'Perfecto para negocios en crecimiento.' },
  { id: 'ilimitado', name: 'Plan Ilimitado', price: 595, description: 'Para restaurantes de gran volumen.' },
];

export default function UpgradePage() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      const fetchUserData = async () => {
        setIsLoading(true);
        const userData = await getCurrentUserData();
        if (userData && userData.restauranteId) {
          setRestaurantId(userData.restauranteId);
          const collectionName = userData.plan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
          const restaurantRef = doc(db, collectionName, userData.restauranteId);
          const restaurantSnap = await getDoc(restaurantRef);
          if (restaurantSnap.exists()) {
            const restaurantData = restaurantSnap.data();
            setCurrentPlanId(restaurantData.plan);
            setSelectedPlanId(restaurantData.plan);
          }
        }
        setIsLoading(false);
      };
      fetchUserData();
    }
  }, [user, loading, router]);
  
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const subtotal = selectedPlan?.price || 0;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !restaurantId || !user) return;
    
    setIsProcessing(true);
    try {
        const isDemoUpgrade = currentPlanId === 'demo';
        const fromCollection = isDemoUpgrade ? 'restaurantes_demo' : 'restaurantes';
        const toCollection = 'restaurantes'; // All upgrades go to production collection

        // In a real scenario, you'd integrate with a payment gateway here.
        // We'll simulate a successful payment.

        // If upgrading from demo, we need to move the document.
        // This is complex and best handled by a backend function.
        // For this prototype, we'll just update the plan.
        const restaurantRef = doc(db, fromCollection, restaurantId);
        await updateDoc(restaurantRef, { plan: selectedPlanId });
        
        // Also update the user's plan in their profile
        const userQuery = query(collection(db, 'usuarios'), where('uid', '==', user.uid));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
            const userDocRef = userSnapshot.docs[0].ref;
            await updateDoc(userDocRef, { plan: selectedPlanId });
        }
        
        // Add a payment record
        const paymentData = {
            paymentDate: serverTimestamp(),
            totalPaid: total,
            status: 'Paid',
            plan: selectedPlanId,
            userId: user.uid
        };
        await addDoc(collection(db, `${toCollection}/${restaurantId}/payments`), paymentData);
        
        toast({
            title: t('Upgrade Successful!'),
            description: t('Your plan has been upgraded to {{planName}}.', { planName: selectedPlan?.name }),
        });
        
        router.push('/dashboard-admin/billing');

    } catch (error) {
        console.error("Upgrade failed:", error);
        toast({
            variant: 'destructive',
            title: t('Error'),
            description: t('There was a problem upgrading your plan.'),
        });
    } finally {
        setIsProcessing(false);
    }
  };


  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
       <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <ShieldCheck className="h-8 w-8" /> {t('Upgrade Your Plan')}
            </CardTitle>
            <CardDescription>{t("Choose the plan that best fits your restaurant's needs.")}</CardDescription>
          </div>
           <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('Go Back')}
            </Button>
        </CardHeader>
      </Card>

      <form onSubmit={handleUpgrade}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('Select a Plan')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plans.map((plan) => (
                                <Label key={plan.id} htmlFor={`plan-${plan.id}`} className={cn(
                                    "block p-4 border rounded-lg cursor-pointer transition-all",
                                    selectedPlanId === plan.id ? "border-primary ring-2 ring-primary bg-primary/5" : "border-border hover:border-primary/50"
                                )}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold">{t(plan.name)}</h3>
                                        <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{t(plan.description)}</p>
                                    <p className="text-2xl font-bold mt-4">${plan.price.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/{t('month')}</span></p>
                                </Label>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>
                 <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CreditCard />{t('Payment Information')}</CardTitle>
                        <CardDescription>{t('This is a simulated payment form for demonstration purposes.')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="card-number">{t('Card Number')}</Label>
                            <Input id="card-number" placeholder="0000 0000 0000 0000" required />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2 col-span-2">
                                <Label htmlFor="expiry-date">{t('Expiry Date')}</Label>
                                <Input id="expiry-date" placeholder="MM/YY" required/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="cvc">{t('CVC')}</Label>
                                <Input id="cvc" placeholder="123" required/>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card className="sticky top-20">
                    <CardHeader>
                        <CardTitle>{t('Order Summary')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">{t('Selected Plan')}</span>
                            <span className="font-bold">{selectedPlan ? t(selectedPlan.name) : 'N/A'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">{t('Subtotal')}</span>
                            <span className="font-mono">${subtotal.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">{t('IVA')} (16%)</span>
                            <span className="font-mono">${iva.toFixed(2)}</span>
                        </div>
                        <hr/>
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span>{t('Total')}</span>
                            <span className="font-mono">${total.toFixed(2)}</span>
                        </div>
                        <Button type="submit" size="lg" className="w-full mt-4" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {t('Confirm and Pay')}
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </AdminLayout>
  );
}
