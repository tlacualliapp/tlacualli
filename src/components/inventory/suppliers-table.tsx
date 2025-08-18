
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, PlusCircle, MoreHorizontal, FilePenLine, Trash2, Loader2, Phone, Mail } from 'lucide-react';
import { SupplierForm } from './supplier-form';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
}

interface SuppliersTableProps {
  restaurantId: string;
}

export function SuppliersTable({ restaurantId }: SuppliersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, `restaurantes/${restaurantId}/suppliers`));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const suppliersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      setSuppliers(suppliersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching suppliers:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const handleEdit = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setSupplierToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (supplierId: string) => {
    try {
      await deleteDoc(doc(db, `restaurantes/${restaurantId}/suppliers`, supplierId));
      toast({ title: t("Supplier Deleted"), description: t("The supplier has been removed.") });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({ variant: "destructive", title: t("Error"), description: t("Could not delete the supplier.") });
    }
  };

  const filteredData = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contactName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("Search by name...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('Add New Supplier')}
        </Button>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{supplierToEdit ? t('Edit Supplier') : t('Add New Supplier')}</DialogTitle>
            <DialogDescription>{supplierToEdit ? t('Modify the supplier details.') : t('Add a new supplier.')}</DialogDescription>
          </DialogHeader>
          <SupplierForm restaurantId={restaurantId} onSuccess={() => setIsFormModalOpen(false)} supplierToEdit={supplierToEdit} />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('Contact')}</TableHead>
              <TableHead>{t('Phone')}</TableHead>
              <TableHead>{t('Email')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="h-8 w-8 animate-spin" /></TableCell></TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactName}</TableCell>
                  <TableCell><div className='flex items-center gap-2'><Phone className="h-3 w-3"/>{supplier.phone}</div></TableCell>
                  <TableCell><div className='flex items-center gap-2'><Mail className="h-3 w-3"/>{supplier.email}</div></TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEdit(supplier)}><FilePenLine className="mr-2 h-4 w-4" />{t('Edit')}</DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" />{t('Delete')}</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle><AlertDialogDescription>{t('This will permanently delete the supplier. Associated items will not be deleted but will lose their main supplier link.')}</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(supplier.id)} className="bg-destructive hover:bg-destructive/90">{t('Yes, delete')}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center">{t('No suppliers found.')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
