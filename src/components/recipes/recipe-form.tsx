
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, Trash2 } from 'lucide-react';
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
  onSuccess?: () => void;
  recipeToEdit?: Recipe | null;
}

export function RecipeForm({ restaurantId, onSuccess, recipeToEdit }: RecipeFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const isEditMode = !!recipeToEdit;
  
  const [name, setName] = useState(recipeToEdit?.name || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(recipeToEdit?.ingredients || []);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (recipeToEdit) {
      setName(recipeToEdit.name || '');
      setIngredients(recipeToEdit.ingredients || []);
    }
  }, [recipeToEdit]);

  useEffect(() => {
    const fetchInventoryItems = async () => {
      if (!restaurantId) return;
      const itemsQuery = collection(db, `restaurantes/${restaurantId}/inventoryItems`);
      const querySnapshot = await getDocs(itemsQuery);
      const itemsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventoryItems(itemsList);
    };
    fetchInventoryItems();
  }, [restaurantId]);

  useEffect(() => {
    const cost = ingredients.reduce((acc, ing) => {
        const item = inventoryItems.find(i => i.id === ing.itemId);
        const itemCost = item ? item.averageCost : 0;
        return acc + (itemCost * ing.quantity);
    }, 0);
    setTotalCost(cost);
  }, [ingredients, inventoryItems]);


  const handleAddIngredient = () => {
    setIngredients([...ingredients, { itemId: '', itemName: '', quantity: 0, unit: '', cost: 0 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...ingredients];
    if (field === 'itemId') {
        const selectedItem = inventoryItems.find(item => item.id === value);
        if (selectedItem) {
            newIngredients[index].itemId = selectedItem.id;
            newIngredients[index].itemName = selectedItem.name;
            newIngredients[index].unit = selectedItem.unitOfMeasure;
            newIngredients[index].cost = selectedItem.averageCost;
        }
    } else {
        (newIngredients[index] as any)[field] = value;
    }
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Filter out ingredients without an itemId
      const validIngredients = ingredients.filter(ing => ing.itemId);

      const recipeData = {
        name,
        ingredients: validIngredients,
        cost: totalCost,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode && recipeToEdit?.id) {
        const recipeRef = doc(db, `restaurantes/${restaurantId}/recipes`, recipeToEdit.id);
        await updateDoc(recipeRef, recipeData);
        toast({ title: t("Update Successful"), description: t("The recipe has been updated.") });
      } else {
        const collectionRef = collection(db, `restaurantes/${restaurantId}/recipes`);
        await addDoc(collectionRef, { ...recipeData, createdAt: serverTimestamp() });
        toast({ title: t("Recipe Added"), description: t("The new recipe has been added.") });
      }
      onSuccess?.();
      // Reset form state after successful submission
      setName('');
      setIngredients([]);

    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({ variant: "destructive", title: t("Save Error"), description: t("Could not save the recipe information.") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('Recipe Name')}</Label>
        <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('e.g., Tacos al Pastor')} required />
      </div>

      <div>
        <Label>{t('Ingredients')}</Label>
        <div className="rounded-md border mt-2">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('Ingredient')}</TableHead>
                        <TableHead className="w-[100px]">{t('Quantity')}</TableHead>
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
                                <Input type="number" value={ing.quantity} onChange={(e) => handleIngredientChange(index, 'quantity', Number(e.target.value))} />
                            </TableCell>
                            <TableCell>
                                <Input value={ing.unit} readOnly disabled className="bg-muted"/>
                            </TableCell>
                            <TableCell>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredient(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
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
