
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Loader2, Calendar, Building, Mail, Phone, Hash, CreditCard, Download, ArrowRight, ShieldCheck, Settings, ExternalLink, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, onSnapshot, Timestamp, getDocs } from 'firebase/firestore';
import { getCurrentUserData } from '@/lib/users';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Restaurant {
  id: string;
  restaurantName: string;
  socialReason: string;
  address: string;
  municipality: string;
  state: string;
  phone: string;
  email: string;
  rfc: string;
  plan: 'demo' | 'esencial' | 'pro' | 'extenso' | 'vip';
  status: '1' | '0' | 'deleted';
  fecharegistro: any;
  subscriptionStatus?: 'active' | 'inactive';
}

interface Payment {
    id: string;
    paymentDate: Timestamp;
    totalPaid: number;
    status: string;
    invoiceUrl?: string;
}

interface PlanDetails {
    [key: string]: {
        name: string;
        price: number;
    }
}

export default function BillingPage() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [planDetails, setPlanDetails] = useState<PlanDetails>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const { toast } = useToast();
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchPlanDetails = async () => {
        setIsPlansLoading(true);
        try {
            const plansCollectionRef = collection(db, 'planes');
            const querySnapshot = await getDocs(plansCollectionRef);
            const plans: PlanDetails = {
                demo: { name: 'Demo Gratuita', price: 0 }
            };
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.name && typeof data.price === 'number') {
                    plans[data.name.toLowerCase()] = {
                        name: data.name,
                        price: data.price,
                    };
                }
            });
            setPlanDetails(plans);
        } catch (error) {
            console.error("Error fetching plan details:", error);
            toast({
                variant: 'destructive',
                title: t('Error'),
                description: t('Could not load plan details.'),
            });
        } finally {
            setIsPlansLoading(false);
        }
    };

    fetchPlanDetails();
  }, [t, toast]);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (user) {
        setIsLoading(true);
        const userData = await getCurrentUserData();
        if (userData && userData.restauranteId) {
          setUserPlan(userData.plan);
          const collectionName = userData.plan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
          const restaurantRef = doc(db, collectionName, userData.restauranteId);
          const restaurantSnap = await getDoc(restaurantRef);
          if (restaurantSnap.exists()) {
            setRestaurant({ id: restaurantSnap.id, ...restaurantSnap.data() } as Restaurant);
          }
        }
        setIsLoading(false);
      }
    };
    fetchRestaurantData();
  }, [user]);

  useEffect(() => {
    if (!restaurant || !userPlan) return;

    setIsPaymentsLoading(true);
    const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
    const paymentsQuery = query(collection(db, `${collectionName}/${restaurant.id}/billing`));
    
    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
        const history: Payment[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            history.push({
                id: doc.id,
                paymentDate: data.paymentDate,
                totalPaid: data.amount,
                status: data.status || 'Paid',
                invoiceUrl: data.hosted_invoice_url
            });
        });
        setPaymentHistory(history.sort((a,b) => b.paymentDate.toMillis() - a.paymentDate.toMillis()));
        setIsPaymentsLoading(false);
    }, (error) => {
        console.error("Error fetching payment history:", error);
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not load payment history.') });
        setIsPaymentsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant, t, toast, userPlan]);
  
  const handleManageSubscription = async () => {
    if (!restaurant) return;
    setIsPortalLoading(true);

    try {
        const functions = getFunctions();
        const createCustomerPortalSession = httpsCallable(functions, 'createCustomerPortalSession');
        const response = await createCustomerPortalSession({ restaurantId: restaurant.id });
        const { url } = response.data as { url: string };
        window.location.href = url;
    } catch (error) {
        console.error("Error creating customer portal session:", error);
        toast({
            variant: "destructive",
            title: t("Error"),
            description: t("Could not open the subscription management portal. Please try again later."),
        });
    } finally {
        setIsPortalLoading(false);
    }
  };


  if (loading || isLoading || isPlansLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!restaurant) {
    return (
      <AdminLayout>
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>{t('Restaurant data could not be loaded.')}</p>
            </CardContent>
        </Card>
      </AdminLayout>
    );
  }
  
  const currentPlan = planDetails[restaurant.plan] || { name: t('Unknown Plan'), price: 0 };
  const registrationDate = restaurant.fecharegistro?.toDate();
  const nextPaymentDate = registrationDate ? new Date(registrationDate.setMonth(registrationDate.getMonth() + 1)) : new Date();
  const isSubscriptionActive = restaurant.subscriptionStatus === 'active' || restaurant.plan === 'demo';

  return (
    <AdminLayout>
      {!isSubscriptionActive && (
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('Account Suspended')}</AlertTitle>
          <AlertDescription>
            {t('Your account is inactive due to a payment issue. Please update your payment information or choose a plan to continue using our services.')}
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <FileText className="h-8 w-8" /> {t('Billing & Subscription')}
          </CardTitle>
          <CardDescription>{t("Manage your plan, view payment history, and see your account details.")}</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{t('Subscription Details')}</span>
                        <Badge variant={isSubscriptionActive ? 'default' : 'destructive'} className="text-sm">
                            {isSubscriptionActive ? <ShieldCheck className="mr-2 h-4 w-4" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                            {isSubscriptionActive ? t('Active') : t('Inactive')}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">{t('Current Plan')}</p>
                            <p className="text-xl font-bold font-headline text-primary">{t(currentPlan.name)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t('Monthly Cost')}</p>
                            <p className="text-lg font-semibold">${currentPlan.price.toFixed(2)} MXN <span className="text-xs text-muted-foreground">{t('+IVA')}</span></p>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">{t('Registration Date')}</p>
                            <p className="text-lg font-semibold">{restaurant.fecharegistro ? format(restaurant.fecharegistro.toDate(), 'PPP') : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t('Next Payment Date')}</p>
                            <p className="text-lg font-semibold">{format(nextPaymentDate, 'PPP')}</p>
                        </div>
                    </div>
                </CardContent>
                <CardHeader className="flex flex-col md:flex-row gap-4">
                     
                    {restaurant.plan !== 'demo' && (
                         <Button variant="outline" className="w-full md:w-auto" onClick={handleManageSubscription} disabled={isPortalLoading}>
                           {isPortalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Settings className="mr-2 h-4 w-4" />}
                           {t('Manage my Subscription and Payments')}
                        </Button>
                    )}
                    <Button className="w-full md:w-auto" onClick={() => router.push('/dashboard-admin/upgrade')}>
                        {t('Upgrade or Change Plan')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardHeader>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{t('Payment History')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Date')}</TableHead>
                                <TableHead>{t('Amount')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                                <TableHead className="text-right">{t('Receipt')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isPaymentsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : paymentHistory.length > 0 ? (
                                paymentHistory.map(payment => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{payment.paymentDate ? format(payment.paymentDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                                        <TableCell>${payment.totalPaid.toFixed(2)}</TableCell>
                                        <TableCell><Badge variant="secondary" className="bg-green-100 text-green-700">{t(payment.status)}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {payment.invoiceUrl ? (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => window.open(payment.invoiceUrl, '_blank')}
                                                >
                                                    <ExternalLink className="mr-2 h-3 w-3" />
                                                    {t('View Receipt')}
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">{t('Not available')}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        {t('No payment history found.')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5"/>{t('Restaurant Details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="font-bold text-lg">{restaurant.restaurantName}</h3>
                    <div className="text-sm text-muted-foreground space-y-3">
                         <p className="flex items-start gap-2"><Building className="h-4 w-4 mt-0.5 shrink-0"/><span>{restaurant.socialReason}</span></p>
                        <p className="flex items-start gap-2"><Hash className="h-4 w-4 mt-0.5 shrink-0"/><span>{restaurant.rfc}</span></p>
                        <p className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 shrink-0"/><span>{restaurant.email}</span></p>
                        <p className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 shrink-0"/><span>{restaurant.phone}</span></p>
                        <p className="flex items-start gap-2"><Calendar className="h-4 w-4 mt-0.5 shrink-0"/><span>{restaurant.address}, {restaurant.municipality}, {restaurant.state}</span></p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

    </AdminLayout>
  );
}
