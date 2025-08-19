
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RecipeForm } from './recipe-form';

interface Recipe {
  id: string;
  name: string;
  cost: number;
}

interface RecipesTableProps {
  restaurantId: string;
}

export function RecipesTable({ restaurantId }: RecipesTableProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (!restaurantId) return;
    setIsLoading(true);
    const q = query(collection(db, `restaurantes/${restaurantId}/recipes`));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recipesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setRecipes(recipesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching recipes:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);


  return (
      <div className="rounded-md border h-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('RECIPE')}</TableHead>
              <TableHead className="text-right">{t('TOTAL COST')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
            ) : recipes.length > 0 ? (
              recipes.map(recipe => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell className="text-right font-mono">${(recipe.cost || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={3} className="text-center h-24">{t('No recipes found.')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  );
}
