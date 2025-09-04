
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, Trash2, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';

interface Recipe {
  id?: string;
  name?: string;
  ingredients?: Ingredient[];
  cost?: number;
}

interface Ingredient {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface InventoryItem {
    id: string;
    name: string;
    unitOfMeasure: string;
    averageCost: number;
}

interface RecipeFormProps {
  restaurantId: string;
  userPlan: string;
  onSuccess?: () => void;
  recipeToEdit?: Recipe | null;
  existingRecipes?: Recipe[];
}

export function RecipeForm({ restaurantId, userPlan, onSuccess, recipeToEdit, existingRecipes = [] }: RecipeFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  const isEditMode = !!(recipeToEdit && recipeToEdit.id);

  const resetForm = () => {
      setName('');
      setIngredients([]);
      setSelectedTemplateId('');
  }

  useEffect(() => {
    if (recipeToEdit) {
        setName(recipeToEdit.name || '');
        setIngredients(recipeToEdit.ingredients || []);
        setSelectedTemplateId(''); 
    } else {
        resetForm();
    }
  }, [recipeToEdit]);

  useEffect(() => {
    const fetchInventoryItems = async () => {
      if (!restaurantId || !userPlan) return;
      const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
      const itemsQuery = collection(db, `${collectionName}/${restaurantId}/inventoryItems`);
      const querySnapshot = await getDocs(itemsQuery);
      const itemsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventoryItems(itemsList);
    };
    fetchInventoryItems();
  }, [restaurantId, userPlan]);

  useEffect(() => {
    const cost = ingredients.reduce((acc, ing) => {
        const item = inventoryItems.find(i => i.id === ing.itemId);
        const itemCost = item ? item.averageCost : 0;
        return acc + (itemCost * ing.quantity);
    }, 0);
    setTotalCost(cost);
  }, [ingredients, inventoryItems]);

  const handleTemplateSelect = (recipeId: string) => {
    if (!recipeId) {
        resetForm();
        return;
    }
    const template = existingRecipes.find(r => r.id === recipeId);
    if (template) {
        setName(`${template.name} (Copy)`);
        setIngredients(template.ingredients || []);
        setSelectedTemplateId(recipeId);
    }
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { itemId: '', itemName: '', quantity: 0, unit: '', cost: 0 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...ingredients];
    const ingredient = newIngredients[index];

    if (field === 'itemId') {
        const selectedItem = inventoryItems.find(item => item.id === value);
        if (selectedItem) {
            ingredient.itemId = selectedItem.id;
            ingredient.itemName = selectedItem.name;
            ingredient.unit = selectedItem.unitOfMeasure;
            ingredient.cost = selectedItem.averageCost;
        }
    } else if (field === 'quantity') {
        ingredient.quantity = Number(value) < 0 ? 0 : Number(value);
    } else {
        (ingredient as any)[field] = value;
    }
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validIngredients = ingredients.filter(ing => ing.itemId && ing.quantity > 0);
      const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';

      const recipeData = {
        name,
        ingredients: validIngredients,
        cost: totalCost,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        const recipeRef = doc(db, `${collectionName}/${restaurantId}/recipes`, recipeToEdit!.id!);
        await updateDoc(recipeRef, recipeData);
        toast({ title: t("Update Successful"), description: t("The recipe has been updated.") });
      } else {
        const collectionRef = collection(db, `${collectionName}/${restaurantId}/recipes`);
        await addDoc(collectionRef, { ...recipeData, createdAt: serverTimestamp() });
        toast({ title: t("Recipe Added"), description: t("The new recipe has been added.") });
      }
      onSuccess?.();
      resetForm();

    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({ variant: "destructive", title: t("Save Error"), description: t("Could not save the recipe information.") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        {!isEditMode && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-sm">{t('Use as a template')}</AccordionTrigger>
                <AccordionContent>
                    <div className="flex items-center gap-2 pt-4">
                        <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                            <SelectTrigger><SelectValue placeholder={t('Select a recipe to duplicate...')} /></SelectTrigger>
                            <SelectContent>
                                {existingRecipes.filter(recipe => recipe.id && recipe.name).map(recipe => <SelectItem key={recipe.id} value={recipe.id!}>{recipe.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {selectedTemplateId && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleTemplateSelect('')}><X className="h-4 w-4" /></Button>
                        )}
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        )}

      <div className="space-y-2">
        <Label htmlFor="name">{t('Recipe Name')}</Label>
        <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('e.g., Classic Burger (Copy)')} required />
      </div>

      <div>
        <Label>{t('Ingredients')}</Label>
        <div className="rounded-md border mt-2">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('Ingredient')}</TableHead>
                        <TableHead className="w-[120px]">{t('Quantity')}</TableHead>
                        <TableHead className="w-[100px]">{t('Unit')}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ingredients.map((ing, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Select value={ing.itemId} onValueChange={(value) => handleIngredientChange(index, 'itemId', value)}>
                                    <SelectTrigger><SelectValue placeholder={t('Select an item')} /></SelectTrigger>
                                    <SelectContent>
                                        {inventoryItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={ing.quantity} onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)} min="0" step="any"/>
                            </TableCell>
                            <TableCell>
                                <Input value={ing.unit} readOnly disabled className="bg-muted/80"/>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredient(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                     {ingredients.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                {t('Start by adding an ingredient.')}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
        <Button type="button" variant="link" size="sm" className="mt-2 px-0" onClick={handleAddIngredient}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('Add Ingredient')}
        </Button>
      </div>

      <div className="text-right font-bold text-lg">
          {t('Total Cost')}: ${totalCost.toFixed(2)}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditMode ? t('Update Recipe') : t('Save Recipe')}
        </Button>
      </div>
    </form>
  );
}
