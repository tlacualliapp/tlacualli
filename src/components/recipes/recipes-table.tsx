
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, FilePenLine, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RecipeForm } from './recipe-form';
import { Card, CardContent, CardHeader } from '../ui/card';
import { useTranslation } from 'react-i18next';

interface Ingredient {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface Recipe {
  id: string;
  name: string;
  cost: number;
  ingredients: Ingredient[];
}

interface RecipesTableProps {
  restaurantId: string;
  userPlan: string;
  recipes: Recipe[];
}

export function RecipesTable({ restaurantId, userPlan, recipes }: RecipesTableProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoading(recipes.length === 0);
  }, [recipes]);

  const handleEdit = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsFormModalOpen(true);
  };
  
  const handleDelete = async (recipeId: string) => {
    const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
    const menuItemsRef = collection(db, `${collectionName}/${restaurantId}/menuItems`);
    const q = query(menuItemsRef, where("recipeId", "==", recipeId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        toast({
            variant: "destructive",
            title: t("Recipe in Use"),
            description: t("This recipe is used by {{count}} menu item(s). Please remove them before deleting the recipe.", { count: querySnapshot.size }),
        });
        return;
    }

    try {
      await deleteDoc(doc(db, `${collectionName}/${restaurantId}/recipes`, recipeId));
      toast({ title: t("Recipe Deleted"), description: t("The recipe has been removed.") });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast({ variant: "destructive", title: t("Error"), description: t("Could not delete the recipe.") });
    }
  };

  return (
      <>
        <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{t('Edit Recipe')}</DialogTitle>
                    <DialogDescription>{t('Modify the recipe details.')}</DialogDescription>
                </DialogHeader>
                <RecipeForm 
                    restaurantId={restaurantId} 
                    userPlan={userPlan}
                    onSuccess={() => setIsFormModalOpen(false)} 
                    recipeToEdit={recipeToEdit}
                    existingRecipes={recipes}
                />
            </DialogContent>
        </Dialog>

        <Dialog open={selectedRecipe !== null} onOpenChange={(isOpen) => !isOpen && setSelectedRecipe(null)}>
            <DialogContent className="sm:max-w-lg">
                 {selectedRecipe && (
                    <>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-headline">{selectedRecipe.name}</DialogTitle>
                        <DialogDescription>{t('Recipe Details')}</DialogDescription>
                    </DialogHeader>
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">{t('Ingredients')}</h3>
                                <div className="text-lg font-bold font-mono bg-primary/10 text-primary px-3 py-1 rounded-md">
                                    {t('Cost')}: ${(selectedRecipe.cost || 0).toFixed(2)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Ingredient')}</TableHead>
                                        <TableHead className="text-right">{t('Quantity')}</TableHead>
                                        <TableHead>{t('Unit')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedRecipe.ingredients?.map((ing, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{ing.itemName}</TableCell>
                                            <TableCell className="text-right font-mono">{ing.quantity}</TableCell>
                                            <TableCell>{ing.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    </>
                 )}
            </DialogContent>
        </Dialog>

        <div className="rounded-md border h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('RECIPE')}</TableHead>
                <TableHead className="text-right">{t('TOTAL COST')}</TableHead>
                <TableHead className="w-[50px]">{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
              ) : recipes.length > 0 ? (
                recipes.map(recipe => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">
                        <Button variant="link" className="p-0 h-auto" onClick={() => setSelectedRecipe(recipe)}>
                            {recipe.name}
                        </Button>
                    </TableCell>
                    <TableCell className="text-right font-mono">${(recipe.cost || 0).toFixed(2)}</TableCell>
                     <TableCell className="text-right">
                      <AlertDialog>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">{t('Open menu')}</span><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleEdit(recipe)}><FilePenLine className="mr-2 h-4 w-4" />{t('Edit')}</DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" />{t('Delete')}</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle><AlertDialogDescription>{t('This will permanently delete the recipe.')}</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(recipe.id)} className="bg-destructive hover:bg-destructive/90">{t('Yes, delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center h-24">{t('No recipes found.')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </>
  );
}
