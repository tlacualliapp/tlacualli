
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '../ui/badge';

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

  return (
    <div className="rounded-md border h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('DISH')}</TableHead>
            <TableHead>{t('DESCRIPTION')}</TableHead>
            <TableHead>{t('CATEGORY')}</TableHead>
            <TableHead>{t('RECIPE')}</TableHead>
            <TableHead className="text-right">{t('PRICE')}</TableHead>
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
                  <TableCell className="text-xs">{item.recipeName}</TableCell>
                  <TableCell className="text-right font-mono">${item.price.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center h-24">{t('No menu items found.')}</TableCell></TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}
