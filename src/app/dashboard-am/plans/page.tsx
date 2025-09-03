
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, Loader2, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { PlanForm } from '@/components/dashboard/plan-form';

export interface Plan {
  id: string;
  name: string;
  price: number;
  maxTables: number;
  maxOrders: number;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "planes"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
      setPlans(plansData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching plans:", error);
      setIsLoading(false);
      // Evitar llamar a `t` en el servidor para las notificaciones
      toast({ variant: "destructive", title: 'Error', description: 'Could not load plans.' });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleEdit = (plan: Plan) => {
    setPlanToEdit(plan);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setPlanToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (planId: string) => {
    try {
      await deleteDoc(doc(db, "planes", planId));
      toast({ title: t("Plan Deleted"), description: t("The plan has been successfully deleted.") });
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({ variant: "destructive", title: t("Error"), description: t("Could not delete the plan.") });
    }
  };

  return (
    <AppLayout>
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isClient ? (planToEdit ? t('Edit Plan') : t('Register New Plan')) : 'Register New Plan'}</DialogTitle>
            <DialogDescription>
              {isClient ? (planToEdit ? t('Modify the plan details.') : t('Create a new subscription plan for the platform.')) : 'Create a new subscription plan for the platform.'}
            </DialogDescription>
          </DialogHeader>
          <PlanForm onSuccess={() => setIsFormModalOpen(false)} planToEdit={planToEdit} />
        </DialogContent>
      </Dialog>

      <Card className="mb-6">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
              <CreditCard className="h-8 w-8" /> {isClient ? t('Plan Management') : 'Plan Management'}
            </CardTitle>
            <CardDescription>{isClient ? t('Manage the subscription plans for the platform.') : 'Manage the subscription plans for the platform.'}</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> {isClient ? t('Register New Plan') : 'Register New Plan'}
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isClient ? t('Plan Name') : 'Plan Name'}</TableHead>
                  <TableHead className="text-right">{isClient ? t('Price (MXN)') : 'Price (MXN)'}</TableHead>
                  <TableHead className="text-right">{isClient ? t('Max Tables') : 'Max Tables'}</TableHead>
                  <TableHead className="text-right">{isClient ? t('Max Orders/Month') : 'Max Orders/Month'}</TableHead>
                  <TableHead className="text-right">{isClient ? t('Actions') : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : plans.length > 0 ? (
                  plans.map(plan => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell className="text-right font-mono">${plan.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{plan.maxTables}</TableCell>
                      <TableCell className="text-right font-mono">{plan.maxOrders}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{isClient ? t('Actions') : 'Actions'}</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => handleEdit(plan)}><FilePenLine className="mr-2 h-4 w-4" />{isClient ? t('Edit') : 'Edit'}</DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" />{isClient ? t('Delete') : 'Delete'}</DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{isClient ? t('Are you sure?') : 'Are you sure?'}</AlertDialogTitle>
                              <AlertDialogDescription>{isClient ? t('This action cannot be undone. This will permanently delete the plan.') : 'This action cannot be undone. This will permanently delete the plan.'}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{isClient ? t('Cancel') : 'Cancel'}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(plan.id)} className="bg-destructive hover:bg-destructive/90">{isClient ? t('Yes, delete') : 'Yes, delete'}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">{isClient ? t('No plans found.') : 'No plans found.'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
