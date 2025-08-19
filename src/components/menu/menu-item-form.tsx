
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Textarea } from '../ui/textarea';

interface MenuItem {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  recipeId?: string;
  availability?: string;
}

interface Recipe {
  id: string;
  name: string;
}

interface MenuItemFormProps {
  restaurantId: string;
  onSuccess?: () => void;
  menuItemToEdit?: MenuItem | null;
}

const availabilityOptions = ["available", "sold_out", "special"];

export function MenuItemForm({ restaurantId, onSuccess, menuItemToEdit }: MenuItemFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const isEditMode = !!menuItemToEdit;
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: menuItemToEdit?.name || '',
    price: menuItemToEdit?.price || 0,
    recipeId: menuItemToEdit?.recipeId || '',
  });

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!restaurantId) return;
      const recipesQuery = collection(db, `restaurantes/${restaurantId}/recipes`);
      const querySnapshot = await getDocs(recipesQuery);
      const recipesList = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      setRecipes(recipesList);
    };
    fetchRecipes();
  }, [restaurantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumber = ['price'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const menuItemData = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode && menuItemToEdit?.id) {
        const menuItemRef = doc(db, `restaurantes/${restaurantId}/menuItems`, menuItemToEdit.id);
        await updateDoc(menuItemRef, menuItemData);
        toast({ title: t("Update Successful"), description: t("The menu item has been updated.") });
      } else {
        const collectionRef = collection(db, `restaurantes/${restaurantId}/menuItems`);
        await addDoc(collectionRef, { ...menuItemData, createdAt: serverTimestamp(), availability: 'available' });
        toast({ title: t("Menu Item Added"), description: t("The new item has been added to the menu.") });
      }
      onSuccess?.();
      // Reset form state
      setFormData({
        name: '',
        price: 0,
        recipeId: '',
      })
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({ variant: "destructive", title: t("Save Error"), description: t("Could not save the menu item information.") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('Dish Name')}</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder={t('e.g., Aztec Burger')} required />
      </div>

      <div className="space-y-2">
          <Label htmlFor="recipeId">{t('Select Recipe')}</Label>
          <Select name="recipeId" value={formData.recipeId} onValueChange={(value) => handleSelectChange('recipeId', value)}>
            <SelectTrigger><SelectValue placeholder={t('Select a recipe')} /></SelectTrigger>
            <SelectContent>
              {recipes.map(rec => <SelectItem key={rec.id} value={rec.id}>{rec.name}</SelectItem>)}
            </SelectContent>
          </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="price">{t('Sale Price ($)')}</Label>
        <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
      </div>
      
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditMode ? t('Update Item') : t('Add to Menu')}
        </Button>
      </div>
    </form>
  );
}
