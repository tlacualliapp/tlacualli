
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Loader2, MoreHorizontal, FilePenLine, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MenuItemForm } from './menu-item-form';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  recipeId: string;
  recipeName?: string; 
  categoryId: string;
  categoryName?: string;
}

interface MenuTableProps {
  restaurantId: string;
}

export function MenuTable({ restaurantId }: MenuTableProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [menuItemToEdit, setMenuItemToEdit] = useState<MenuItem | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!restaurantId) return;
    setIsLoading(true);
    const q = query(collection(db, `restaurantes/${restaurantId}/menuItems`));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const itemsDataPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        let recipeName = t('None');
        if (data.recipeId && data.recipeId !== 'none') {
          try {
            const recipeRef = doc(db, `restaurantes/${restaurantId}/recipes`, data.recipeId);
            const recipeSnap = await getDoc(recipeRef);
            if (recipeSnap.exists()) {
              recipeName = recipeSnap.data().name;
            }
          } catch (e) { console.error("Error fetching recipe", e)}
        }
        
        let categoryName = t('Uncategorized');
        if (data.categoryId) {
           try {
            const categoryRef = doc(db, `restaurantes/${restaurantId}/menuCategories`, data.categoryId);
            const categorySnap = await getDoc(categoryRef);
            if (categorySnap.exists()) {
              categoryName = categorySnap.data().name;
            }
          } catch (e) { console.error("Error fetching category", e)}
        }

        return { id: docSnapshot.id, ...data, recipeName, categoryName } as MenuItem;
      });

      const itemsData = await Promise.all(itemsDataPromises);
      setItems(itemsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching menu items:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, t]);

  const handleEdit = (item: MenuItem) => {
    setMenuItemToEdit(item);
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

  return (
    <>
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Edit Menu Item')}</DialogTitle>
            <DialogDescription>{t('Modify the dish details.')}</DialogDescription>
          </DialogHeader>
          <MenuItemForm 
            restaurantId={restaurantId} 
            onSuccess={() => setIsFormModalOpen(false)} 
            menuItemToEdit={menuItemToEdit}
          />
        </DialogContent>
      </Dialog>
    
      <div className="rounded-md border h-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('DISH')}</TableHead>
              <TableHead>{t('DESCRIPTION')}</TableHead>
              <TableHead>{t('CATEGORY')}</TableHead>
              <TableHead className="text-right">{t('PRICE')}</TableHead>
              <TableHead className="w-[50px]">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length > 0 ? (
                items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</TableCell>
                    <TableCell><Badge variant="outline">{item.categoryName}</Badge></TableCell>
                    <TableCell className="text-right font-mono">${item.price.toFixed(2)}</TableCell>
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
                <TableRow><TableCell colSpan={5} className="text-center h-24">{t('No menu items found.')}</TableCell></TableRow>
              )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
