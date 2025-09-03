
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getCurrentUserData } from '@/lib/users';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface Restaurant {
  plan: string;
  isVip: boolean; // Corregido: 'isVip' en lugar de 'isVIP'
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function UpgradePage() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [displayPlans, setDisplayPlans] = useState<Plan[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'planes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
      setAllPlans(plansData);
    }, (error) => {
      console.error("Error fetching plans: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los planes.' });
    });
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      const fetchUserData = async () => {
        setIsLoading(true);
        try {
          const userData = await getCurrentUserData();
          if (userData && userData.restauranteId) {
            setRestaurantId(userData.restauranteId);
            const collectionName = userData.plan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
            const restaurantRef = doc(db, collectionName, userData.restauranteId);
            const restaurantSnap = await getDoc(restaurantRef);
            if (restaurantSnap.exists()) {
              const restaurantData = restaurantSnap.data() as Restaurant;
              setRestaurant(restaurantData);
              setSelectedPlanId(restaurantData.plan);
            }
          }
        } catch (error) {
            console.error("Error fetching restaurant data: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos del restaurante.' });
        } finally {
            setIsLoading(false);
        }
      };
      fetchUserData();
    }
  }, [user, loading, router, toast]);

  useEffect(() => {
    if (restaurant && allPlans.length > 0) {
        let filteredPlans = [];
        // Corregido: Usar 'isVip' para la validación
        if (restaurant.isVip) {
            filteredPlans = allPlans.filter(p => p.name.toLowerCase() === 'vip');
        } else {
            filteredPlans = allPlans.filter(p => p.name.toLowerCase() !== 'vip');
        }
        setDisplayPlans(filteredPlans);
    }
  }, [restaurant, allPlans]);
  
  const selectedPlan = displayPlans.find(p => p.id === selectedPlanId);
  const subtotal = selectedPlan?.price || 0;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !restaurantId || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un plan.' });
        return;
    }
    
    setIsProcessing(true);
    try {
        const functions = getFunctions();
        const createStripeCheckout = httpsCallable(functions, 'createStripeCheckout');
        const response = await createStripeCheckout({ 
            planId: selectedPlanId, 
            restaurantId: restaurantId 
        });

        const { sessionId } = response.data as { sessionId: string };

        if (!sessionId) {
            throw new Error('No se pudo crear la sesión de pago.');
        }

        const stripe = await stripePromise;
        if (!stripe) {
            throw new Error('Stripe.js no se ha cargado.');
        }

        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) {
            console.error("Stripe redirection error:", error);
            toast({ variant: 'destructive', title: 'Error de Redirección', description: error.message });
        }

    } catch (error) {
        console.error("Error al crear la sesión de Stripe:", error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un problema al procesar tu pago.';
        toast({
            variant: 'destructive',
            title: 'Error de Pago',
            description: errorMessage,
        });
    } finally {
        setIsProcessing(false);
    }
  };

  if (isLoading && displayPlans.length === 0) {
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
                            {displayPlans.map((plan) => (
                                <Label key={plan.id} htmlFor={`plan-${plan.id}`} className={cn(
                                    "block p-4 border rounded-lg cursor-pointer transition-all",
                                    selectedPlanId === plan.id ? "border-primary ring-2 ring-primary bg-primary/5" : "border-border hover:border-primary/50"
                                )}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold">{plan.name}</h3>
                                        <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                                    <p className="text-2xl font-bold mt-4">${plan.price.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/{t('month')}</span></p>
                                </Label>
                            ))}
                        </RadioGroup>
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
                            <span className="font-bold">{selectedPlan ? selectedPlan.name : 'N/A'}</span>
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
                        {/* Corregido: Asegurar que el valor de disabled sea siempre booleano */}
                        <Button type="submit" size="lg" className="w-full mt-4" disabled={isProcessing || !selectedPlanId || !!(restaurant && restaurant.plan === selectedPlanId)}>
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
