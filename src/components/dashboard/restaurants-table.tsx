
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, collectionGroup, orderBy, limit, Timestamp, writeBatch, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, MoreHorizontal, FilePenLine, Trash2, Building, Mail, Phone, Hash, Loader2, PlusCircle, Power, PowerOff, Star, ShieldCheck, Calendar, CreditCard, Clock, Send } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { RestaurantForm } from './restaurant-form';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { recursiveDelete } from '@/lib/firestore-utils';
import { sendCustomEmail } from '@/lib/email';
import { Textarea } from '../ui/textarea';

type Restaurant = {
  id: string;
  restaurantName: string;
  style: string;
  state: string;
  municipality: string;
  address: string;
  phone: string;
  email: string;
  rfc: string;
  socialReason: string;
  status: string;
  plan?: 'demo' | 'esencial' | 'pro' | 'ilimitado';
  fecharegistro?: Timestamp;
};

type AccountDetails = {
    lastPayment: string;
    nextPayment: string;
    registrationDate: string;
}

const mexicanStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit", "Nuevo León",
  "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas", "CDMX"
];

const plans = [
    { id: 'demo', name: 'Demo Gratuita' },
    { id: 'esencial', name: 'Plan Esencial' },
    { id: 'pro', name: 'Plan Pro' },
    { id: 'ilimitado', name: 'Plan Ilimitado' }
];
const statuses = [
    { id: '1', name: 'Active' },
    { id: '0', name: 'Inactive' }
];

const planNames = {
    demo: 'Demo Gratuita',
    esencial: 'Plan Esencial',
    pro: 'Plan Pro',
    ilimitado: 'Plan Ilimitado'
};

export function RestaurantsTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ state: new Set<string>(), plan: new Set<string>(), status: new Set<string>() });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [restaurantToEdit, setRestaurantToEdit] = useState<Restaurant | null>(null);
  const [restaurantToMigrate, setRestaurantToMigrate] = useState<Restaurant | null>(null);
  const [restaurantToEmail, setRestaurantToEmail] = useState<Restaurant | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [newPlan, setNewPlan] = useState<'esencial' | 'pro' | 'ilimitado'>('esencial');
  const [isMigrating, setIsMigrating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
    
    const fetchRestaurants = async () => {
        const prodQuery = query(collection(db, "restaurantes"));
        const demoQuery = query(collection(db, "restaurantes_demo"));

        const [prodSnap, demoSnap] = await Promise.all([getDocs(prodQuery), getDocs(demoQuery)]);

        const prodRestaurants = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
        const demoRestaurants = demoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));

        setRestaurants([...prodRestaurants, ...demoRestaurants]);
        setIsLoading(false);
    };

    fetchRestaurants();
    
  }, [toast, t]);
  
  useEffect(() => {
    if (!selectedRestaurant) return;

    const fetchAccountDetails = async () => {
        const collectionName = selectedRestaurant.plan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
        const paymentsQuery = query(
            collection(db, `${collectionName}/${selectedRestaurant.id}/payments`),
            orderBy('paymentDate', 'desc'),
            limit(1)
        );

        const paymentsSnap = await getDocs(paymentsQuery);
        let lastPayment = t('N/A');
        let nextPayment = t('N/A');
        const registrationDate = selectedRestaurant.fecharegistro ? format(selectedRestaurant.fecharegistro.toDate(), 'PPP') : t('N/A');
        
        const registrationDateObj = selectedRestaurant.fecharegistro?.toDate();

        if (!paymentsSnap.empty) {
            const lastPaymentDate = paymentsSnap.docs[0].data().paymentDate.toDate();
            lastPayment = format(lastPaymentDate, 'PPP');
            const nextPaymentDate = new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 1));
            nextPayment = format(nextPaymentDate, 'PPP');
        } else if (registrationDateObj) {
            const nextPaymentDate = new Date(registrationDateObj.setMonth(registrationDateObj.getMonth() + 1));
            nextPayment = format(nextPaymentDate, 'PPP');
        }

        setAccountDetails({ lastPayment, nextPayment, registrationDate });
    };

    fetchAccountDetails();
  }, [selectedRestaurant, t]);


  const handleFilterChange = (type: 'state' | 'plan' | 'status', value: string) => {
    setFilters(prev => {
      const newSet = new Set(prev[type]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [type]: newSet };
    });
  };
  
  const handleEdit = (restaurant: Restaurant) => {
    setRestaurantToEdit(restaurant);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (restaurant: Restaurant) => {
    try {
        const collectionName = restaurant.plan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
        const restaurantRef = doc(db, collectionName, restaurant.id);
        await updateDoc(restaurantRef, { status: "deleted" });
        toast({
            title: t("Restaurant Deleted"),
            description: t("The restaurant has been marked as deleted."),
        });
         setRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
    } catch (error) {
        console.error("Error al eliminar restaurante:", error);
        toast({
            variant: "destructive",
            title: t("Error"),
            description: t("Could not delete the restaurant."),
        });
    }
  };

  const handleToggleStatus = async (restaurant: Restaurant) => {
    const newStatus = restaurant.status === "1" ? "0" : "1";
    try {
        const collectionName = restaurant.plan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
        const restaurantRef = doc(db, collectionName, restaurant.id);
        await updateDoc(restaurantRef, { status: newStatus });
        toast({
            title: t("Status Updated"),
            description: t("The restaurant has been {{status}}.", { status: newStatus === "1" ? t('activated') : t('deactivated')}),
        });
        setRestaurants(prev => prev.map(r => r.id === restaurant.id ? {...r, status: newStatus} : r));
    } catch (error) {
         console.error("Error al actualizar estado:", error);
        toast({
            variant: "destructive",
            title: t("Error"),
            description: t("Could not update restaurant status."),
        });
    }
  }

  const handleOpenEmailModal = (restaurant: Restaurant) => {
    setRestaurantToEmail(restaurant);
    setEmailSubject('');
    setEmailBody('');
  };

  const handleSendEmail = async () => {
    if (!restaurantToEmail || !emailSubject || !emailBody) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Please fill in all fields.') });
      return;
    }
    setIsSendingEmail(true);
    try {
      await sendCustomEmail({
        to: restaurantToEmail.email,
        subject: emailSubject,
        html: `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
      });
      toast({ title: t('Email Sent'), description: t('The email has been sent successfully.') });
      setRestaurantToEmail(null);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({ variant: 'destructive', title: t('Error'), description: t('Failed to send email.') });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleMigratePlan = async () => {
    if (!restaurantToMigrate) return;
    setIsMigrating(true);

    const fromCollection = 'restaurantes_demo';
    const toCollection = 'restaurantes';
    const restaurantId = restaurantToMigrate.id;

    try {
        const batch = writeBatch(db);

        // 1. Get restaurant data and copy it
        const fromDocRef = doc(db, fromCollection, restaurantId);
        const fromDocSnap = await getDoc(fromDocRef);
        if (!fromDocSnap.exists()) throw new Error("Demo restaurant not found");
        
        const restaurantData = fromDocSnap.data();
        const toDocRef = doc(db, toCollection, restaurantId);
        batch.set(toDocRef, { ...restaurantData, plan: newPlan });

        // 2. Function to copy subcollections
        const copySubcollections = async (sourceRef: any, destinationRef: any) => {
            const subcollections = ['menuCategories', 'menuItems', 'inventoryItems', 'inventoryMovements', 'suppliers', 'recipes', 'orders', 'payments', 'rooms'];
            for (const sub of subcollections) {
                const sourceSubRef = collection(sourceRef, sub);
                const sourceSubSnap = await getDocs(sourceSubRef);
                sourceSubSnap.forEach(docSnap => {
                    const destDocRef = doc(destinationRef, sub, docSnap.id);
                    batch.set(destDocRef, docSnap.data());
                });

                // Handle nested subcollections (e.g., tables in rooms)
                if (sub === 'rooms') {
                    for(const roomDoc of sourceSubSnap.docs) {
                        const tablesSourceRef = collection(sourceRef, 'rooms', roomDoc.id, 'tables');
                        const tablesDestRef = doc(destinationRef, 'rooms', roomDoc.id);
                        const tablesSnap = await getDocs(tablesSourceRef);
                        tablesSnap.forEach(tableDoc => {
                            const tableDestRef = doc(tablesDestRef, 'tables', tableDoc.id);
                            batch.set(tableDestRef, tableDoc.data());
                        });
                    }
                }
            }
        };

        await copySubcollections(fromDocRef, toDocRef);

        // 3. Update user plans
        const usersQuery = query(collection(db, 'usuarios'), where('restauranteId', '==', restaurantId));
        const usersSnap = await getDocs(usersQuery);
        usersSnap.forEach(userDoc => {
            batch.update(userDoc.ref, { plan: newPlan });
        });

        // 4. Commit all writes
        await batch.commit();

        // 5. Delete the old document and its subcollections
        await recursiveDelete(doc(db, fromCollection, restaurantId));

        toast({
            title: t('Migration Successful'),
            description: t('{{restaurantName}} has been migrated to {{planName}}.', { restaurantName: restaurantToMigrate.restaurantName, planName: t(planNames[newPlan]) }),
        });

        // Refresh table data
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, plan: newPlan } : r));

    } catch (error) {
        console.error("Migration failed:", error);
        toast({
            variant: 'destructive',
            title: t('Migration Failed'),
            description: t('An error occurred during migration. Check logs for details.'),
        });
    } finally {
        setIsMigrating(false);
        setRestaurantToMigrate(null);
    }
  };


  const filteredData = restaurants.filter(item => {
    if (item.status === 'deleted') return false;
    const searchMatch = (item.restaurantName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const stateMatch = filters.state.size === 0 || filters.state.has(item.state);
    const planMatch = filters.plan.size === 0 || filters.plan.has(item.plan || 'demo');
    const statusMatch = filters.status.size === 0 || filters.status.has(item.status);
    return searchMatch && stateMatch && planMatch && statusMatch;
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("Search by name...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Filter className="mr-2 h-4 w-4" /> {t('Filters')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('Filter by State')}</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <div className="max-h-60 overflow-y-auto">
                  {mexicanStates.map(state => (
                    <DropdownMenuCheckboxItem
                      key={state}
                      checked={filters.state.has(state)}
                      onCheckedChange={() => handleFilterChange('state', state)}
                    >
                      {state}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
                 <DropdownMenuSeparator/>
                <DropdownMenuLabel>{t('Filter by Plan')}</DropdownMenuLabel>
                 <DropdownMenuSeparator/>
                 {plans.map(plan => (
                  <DropdownMenuCheckboxItem
                    key={plan.id}
                    checked={filters.plan.has(plan.id)}
                    onCheckedChange={() => handleFilterChange('plan', plan.id)}
                  >
                    {t(plan.name)}
                  </DropdownMenuCheckboxItem>
                ))}
                 <DropdownMenuSeparator/>
                <DropdownMenuLabel>{t('Filter by Status')}</DropdownMenuLabel>
                 <DropdownMenuSeparator/>
                 {statuses.map(status => (
                  <DropdownMenuCheckboxItem
                    key={status.id}
                    checked={filters.status.has(status.id)}
                    onCheckedChange={() => handleFilterChange('status', status.id)}
                  >
                    {t(status.name)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
             <Button onClick={() => router.push('/dashboard-am/restaurants')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('Register Restaurant')}
            </Button>
        </div>
      </div>

       <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{t('Edit Restaurant')}</DialogTitle>
                    <DialogDescription>
                        {t('Modify the restaurant information.')}
                    </DialogDescription>
                </DialogHeader>
                <RestaurantForm 
                    onSuccess={() => setIsFormModalOpen(false)} 
                    restaurantToEdit={restaurantToEdit} 
                />
            </DialogContent>
        </Dialog>
        
        <Dialog open={restaurantToMigrate !== null} onOpenChange={(isOpen) => !isOpen && setRestaurantToMigrate(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Migrate Plan for')} {restaurantToMigrate?.restaurantName}</DialogTitle>
                    <DialogDescription>{t('Select the new plan for this restaurant. This action will move all its data to the production environment.')}</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label htmlFor="new-plan">{t('New Plan')}</Label>
                    <Select value={newPlan} onValueChange={(value: any) => setNewPlan(value)}>
                        <SelectTrigger id="new-plan">
                            <SelectValue placeholder={t('Select a plan')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="esencial">{t('Plan Esencial')}</SelectItem>
                            <SelectItem value="pro">{t('Plan Pro')}</SelectItem>
                            <SelectItem value="ilimitado">{t('Plan Ilimitado')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setRestaurantToMigrate(null)}>{t('Cancel')}</Button>
                    <Button onClick={handleMigratePlan} disabled={isMigrating}>
                        {isMigrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('Migrate Now')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <Dialog open={restaurantToEmail !== null} onOpenChange={(isOpen) => !isOpen && setRestaurantToEmail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Send Email to')} {restaurantToEmail?.restaurantName}</DialogTitle>
            <DialogDescription>{t('To')}: {restaurantToEmail?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">{t('Subject')}</Label>
              <Input id="subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">{t('Message')}</Label>
              <Textarea id="body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestaurantToEmail(null)}>{t('Cancel')}</Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail}>
              {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('Send Email')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('State')}</TableHead>
              <TableHead>{t('Plan')}</TableHead>
              <TableHead>{t('Demo Status')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="ml-4">{t('Loading restaurants...')}</span>
                        </div>
                    </TableCell>
                </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map(item => {
                const daysSinceRegistration = item.fecharegistro ? differenceInDays(new Date(), item.fecharegistro.toDate()) : -1;
                const isDemoExpired = item.plan === 'demo' && daysSinceRegistration > 15;
                return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setSelectedRestaurant(item)}>
                          {item.restaurantName}
                        </Button>
                      </TableCell>
                      <TableCell>{item.state}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(item.plan === 'demo' ? 'border-yellow-400 text-yellow-600' : 'border-border')}>
                            {item.plan ? t(planNames[item.plan]) : 'N/A'}
                        </Badge>
                      </TableCell>
                       <TableCell>
                        {item.plan === 'demo' && daysSinceRegistration >= 0 ? (
                            <Badge className={isDemoExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                                {isDemoExpired ? t('Expired') : t('Current')} ({daysSinceRegistration} {t('days')})
                            </Badge>
                        ) : 'N/A'}
                      </TableCell>
                       <TableCell>
                        <Badge variant={item.status === '1' ? 'default' : 'secondary'} className={cn(item.status === '1' && 'bg-green-600 hover:bg-green-700')}>
                          {item.status === '1' ? t('Active') : t('Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">{t('Open menu')}</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                                   <DropdownMenuItem className="cursor-pointer" onSelect={() => handleOpenEmailModal(item)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {t('Send Email')}
                                  </DropdownMenuItem>
                                   <DropdownMenuItem className="cursor-pointer" onSelect={() => handleEdit(item)}>
                                    <FilePenLine className="mr-2 h-4 w-4" />
                                    {t('Edit')}
                                  </DropdownMenuItem>
                                   <DropdownMenuItem onSelect={() => handleToggleStatus(item)}>
                                      {item.status === '1' ? (
                                        <><PowerOff className="mr-2 h-4 w-4 text-destructive" />{t('Deactivate')}</>
                                      ) : (
                                        <><Power className="mr-2 h-4 w-4 text-green-500" />{t('Activate')}</>
                                      )}
                                    </DropdownMenuItem>
                                    {item.plan === 'demo' && (
                                        <DropdownMenuItem onSelect={() => setRestaurantToMigrate(item)}>
                                            <Star className="mr-2 h-4 w-4 text-yellow-500" />
                                            {t('Migrate Plan')}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                   <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t('Delete')}
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('This action will mark the restaurant as deleted and it will no longer appear. Do you want to continue?')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(item)} className="bg-destructive hover:bg-destructive/90">
                                        {t('Yes, delete')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                )
              })
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t('No restaurants found.')}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedRestaurant !== null} onOpenChange={(isOpen) => !isOpen && setSelectedRestaurant(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">{selectedRestaurant.restaurantName}</DialogTitle>
                <DialogDescription>
                    <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="border-primary text-primary">{selectedRestaurant.style}</Badge>
                        <Badge variant={selectedRestaurant.status === '1' ? 'default' : 'destructive'} className={cn(selectedRestaurant.status === '1' && 'bg-green-600 hover:bg-green-700')}>
                            {selectedRestaurant.status === '1' ? t('Active') : t('Inactive')}
                        </Badge>
                    </div>
                </DialogDescription>
              </DialogHeader>
              <Separator/>
              <CardContent className="p-0">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">{t('Contact Information')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Building className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">{selectedRestaurant.socialReason}</p>
                        <p className="text-xs text-muted-foreground">{t('Social Reason')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                       <div>
                        <p className="font-semibold text-sm">{selectedRestaurant.rfc}</p>
                        <p className="text-xs text-muted-foreground">{t('RFC')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                       <div>
                        <p className="font-semibold text-sm">{selectedRestaurant.email}</p>
                        <p className="text-xs text-muted-foreground">{t('Email')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                       <div>
                        <p className="font-semibold text-sm">{selectedRestaurant.phone}</p>
                        <p className="text-xs text-muted-foreground">{t('Phone')}</p>
                      </div>
                    </div>
                  </div>
              </CardContent>
              <Separator />
               <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-base font-semibold">{t('Plan & Billing')}</AccordionTrigger>
                        <AccordionContent>
                           {accountDetails ? (
                                <div className="space-y-3 pt-2">
                                     <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm">{t(planNames[selectedRestaurant.plan || 'demo'])}</p>
                                            <p className="text-xs text-muted-foreground">{t('Current Plan')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm">{accountDetails.registrationDate}</p>
                                            <p className="text-xs text-muted-foreground">{t('Registration Date')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm">{accountDetails.lastPayment}</p>
                                            <p className="text-xs text-muted-foreground">{t('Last Payment')}</p>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-3">
                                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm">{accountDetails.nextPayment}</p>
                                            <p className="text-xs text-muted-foreground">{t('Next Payment')}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
