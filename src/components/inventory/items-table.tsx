
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, PlusCircle, MoreHorizontal, FilePenLine, Trash2, Loader2, PackagePlus, PackageMinus, History } from 'lucide-react';
import { ItemForm } from './item-form';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MovementForm } from './movement-form';

interface Item {
  id: string;
  name: string;
  unitOfMeasure: string;
  currentStock: number;
  minimumStock: number;
  averageCost: number;
  supplierId: string;
  category: string;
}

interface ItemsTableProps {
  restaurantId: string;
}

export function InventoryItemsTable({ restaurantId }: ItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [itemForMovement, setItemForMovement] = useState<Item | null>(null);
  const [movementType, setMovementType] = useState<'entry' | 'exit' | 'adjustment'>('entry');
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, `restaurantes/${restaurantId}/inventoryItems`));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      setItems(itemsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching inventory items:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const handleEdit = (item: Item) => {
    setItemToEdit(item);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setItemToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, `restaurantes/${restaurantId}/inventoryItems`, itemId));
      toast({ title: t("Item Deleted"), description: t("The item has been removed from inventory.") });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ variant: "destructive", title: t("Error"), description: t("Could not delete the item.") });
    }
  };

  const handleOpenMovementModal = (item: Item, type: 'entry' | 'exit' | 'adjustment') => {
    setItemForMovement(item);
    setMovementType(type);
    setIsMovementModalOpen(true);
  };

  const filteredData = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("Search by name or category...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('Add New Item')}
        </Button>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{itemToEdit ? t('Edit Item') : t('Add New Item')}</DialogTitle>
            <DialogDescription>{itemToEdit ? t('Modify the item details.') : t('Add a new item to your inventory.')}</DialogDescription>
          </DialogHeader>
          <ItemForm restaurantId={restaurantId} onSuccess={() => setIsFormModalOpen(false)} itemToEdit={itemToEdit} />
        </DialogContent>
      </Dialog>

      <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Register Movement')}: {itemForMovement?.name}</DialogTitle>
          </DialogHeader>
          {itemForMovement && (
            <MovementForm
              restaurantId={restaurantId}
              item={itemForMovement}
              type={movementType}
              onSuccess={() => setIsMovementModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('Category')}</TableHead>
              <TableHead className="text-right">{t('Current Stock')}</TableHead>
              <TableHead className="text-right">{t('Min. Stock')}</TableHead>
              <TableHead>{t('Unit')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="h-8 w-8 animate-spin" /></TableCell></TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map(item => (
                <TableRow key={item.id} className={item.currentStock < item.minimumStock ? 'bg-destructive/10' : ''}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="outline">{t(item.category)}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{item.currentStock}</TableCell>
                  <TableCell className="text-right font-mono">{item.minimumStock}</TableCell>
                  <TableCell>{item.unitOfMeasure}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                           <DropdownMenuItem onSelect={() => handleOpenMovementModal(item, 'entry')}><PackagePlus className="mr-2 h-4 w-4" />{t('Register Entry')}</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleOpenMovementModal(item, 'exit')}><PackageMinus className="mr-2 h-4 w-4" />{t('Register Exit')}</DropdownMenuItem>
                           <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleEdit(item)}><FilePenLine className="mr-2 h-4 w-4" />{t('Edit')}</DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" />{t('Delete')}</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle><AlertDialogDescription>{t('This action cannot be undone. This will permanently delete the item.')}</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">{t('Yes, delete')}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center">{t('No inventory items found.')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
