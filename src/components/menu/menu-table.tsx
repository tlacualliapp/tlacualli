
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, PlusCircle, MoreHorizontal, FilePenLine, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MenuItemForm } from './menu-item-form';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  availability: string;
}

interface MenuTableProps {
  restaurantId: string;
}

export function MenuTable({ restaurantId }: MenuTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!restaurantId) return;
    setIsLoading(true);
    const q = query(collection(db, `restaurantes/${restaurantId}/menuItems`));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setItems(itemsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching menu items:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const handleEdit = (item: MenuItem) => {
    setItemToEdit(item);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setItemToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, `restaurantes/${restaurantId}/menuItems`, itemId));
      toast({ title: t("Item Deleted"), description: t("The menu item has been removed.") });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast({ variant: "destructive", title: t("Error"), description: t("Could not delete the menu item.") });
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return <Badge variant="default" className="bg-green-500">{t('Available')}</Badge>;
      case 'sold_out':
        return <Badge variant="destructive">{t('Sold Out')}</Badge>;
      case 'special':
        return <Badge variant="secondary" className="bg-blue-500 text-white">{t('Special')}</Badge>;
      default:
        return <Badge variant="outline">{t(availability)}</Badge>;
    }
  }

  const filteredData = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <PlusCircle className="mr-2 h-4 w-4" /> {t('Add New Item')}
        </Button>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{itemToEdit ? t('Edit Menu Item') : t('Add New Menu Item')}</DialogTitle>
            <DialogDescription>{itemToEdit ? t('Modify the item details.') : t('Add a new item to your menu.')}</DialogDescription>
          </DialogHeader>
          <MenuItemForm restaurantId={restaurantId} onSuccess={() => setIsFormModalOpen(false)} menuItemToEdit={itemToEdit} />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name')}</TableHead>
              <TableHead className="text-right">{t('Price')}</TableHead>
              <TableHead>{t('Availability')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right font-mono">${item.price.toFixed(2)}</TableCell>
                  <TableCell>{getAvailabilityBadge(item.availability)}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEdit(item)}><FilePenLine className="mr-2 h-4 w-4" />{t('Edit')}</DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" />{t('Delete')}</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle><AlertDialogDescription>{t('This will permanently delete the menu item.')}</AlertDialogDescription></AlertDialogHeader>
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
              <TableRow><TableCell colSpan={4} className="text-center">{t('No menu items found.')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
