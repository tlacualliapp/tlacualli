
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, onSnapshot } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface MenuItem {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  recipeId?: string;
  categoryId?: string;
  availability?: string;
  imageUrl?: string;
  preparationResponsible?: string;
}

interface Recipe {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Responsible {
  id: string;
  name: string;
}

interface MenuItemFormProps {
  restaurantId: string;
  onSuccess?: () => void;
  menuItemToEdit?: MenuItem | null;
}

export function MenuItemForm({ restaurantId, onSuccess, menuItemToEdit }: MenuItemFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddResponsibleOpen, setIsAddResponsibleOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newResponsibleName, setNewResponsibleName] = useState('');
  const isEditMode = !!menuItemToEdit;

  const [formData, setFormData] = useState({
    name: menuItemToEdit?.name || '',
    description: menuItemToEdit?.description || '',
    price: menuItemToEdit?.price || 0,
    recipeId: menuItemToEdit?.recipeId || '',
    categoryId: menuItemToEdit?.categoryId || '',
    imageUrl: menuItemToEdit?.imageUrl || '',
    preparationResponsible: menuItemToEdit?.preparationResponsible || '',
  });

  useEffect(() => {
    if (!restaurantId) return;

    const recipesQuery = collection(db, `restaurantes/${restaurantId}/recipes`);
    const categoriesQuery = collection(db, `restaurantes/${restaurantId}/menuCategories`);
    const responsiblesQuery = collection(db, `restaurantes/${restaurantId}/preparationResponsibles`);

    const unsubRecipes = onSnapshot(recipesQuery, (snapshot) => {
      const recipesList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      setRecipes(recipesList);
    });

    const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      setCategories(categoriesList);
    });
    
    const unsubResponsibles = onSnapshot(responsiblesQuery, (snapshot) => {
      const responsiblesList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      if (responsiblesList.length === 0) {
        // Seed initial data if empty
        const initialResponsibles = [{ name: 'Cocina' }, { name: 'Mesero' }];
        initialResponsibles.forEach(async (resp) => {
            await addDoc(collection(db, `restaurantes/${restaurantId}/preparationResponsibles`), resp);
        });
      }
      setResponsibles(responsiblesList);
    });

    return () => {
      unsubRecipes();
      unsubCategories();
      unsubResponsibles();
    };
  }, [restaurantId]);
  
  useEffect(() => {
    if (menuItemToEdit) {
      setFormData({
        name: menuItemToEdit.name || '',
        description: menuItemToEdit.description || '',
        price: menuItemToEdit.price || 0,
        recipeId: menuItemToEdit.recipeId || '',
        categoryId: menuItemToEdit.categoryId || '',
        imageUrl: menuItemToEdit.imageUrl || '',
        preparationResponsible: menuItemToEdit.preparationResponsible || '',
      });
    }
  }, [menuItemToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumber = ['price'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
     if (name === 'categoryId' && value === 'add_new') {
      setIsAddCategoryOpen(true);
    } else if (name === 'preparationResponsible' && value === 'add_new') {
        setIsAddResponsibleOpen(true);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Category name cannot be empty.') });
      return;
    }
    try {
      const collectionRef = collection(db, `restaurantes/${restaurantId}/menuCategories`);
      await addDoc(collectionRef, { name: newCategoryName });
      toast({ title: t('Category Added'), description: t('The new category has been added.') });
      setNewCategoryName('');
      setIsAddCategoryOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not add the category.') });
    }
  };
  
   const handleAddResponsible = async () => {
    if (!newResponsibleName.trim()) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Responsible name cannot be empty.') });
      return;
    }
    try {
      const collectionRef = collection(db, `restaurantes/${restaurantId}/preparationResponsibles`);
      await addDoc(collectionRef, { name: newResponsibleName });
      toast({ title: t('Responsible Added'), description: t('The new responsible has been added.') });
      setNewResponsibleName('');
      setIsAddResponsibleOpen(false);
    } catch (error) {
      console.error("Error adding responsible:", error);
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not add the responsible.') });
    }
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
        description: '',
        price: 0,
        recipeId: '',
        categoryId: '',
        imageUrl: '',
        preparationResponsible: '',
      })
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({ variant: "destructive", title: t("Save Error"), description: t("Could not save the menu item information.") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('Dish Name')}</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder={t('e.g., Aztec Burger')} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('Description')}</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder={t('e.g., Juicy beef patty with avocado and chipotle sauce.')} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="categoryId">{t('Category')}</Label>
                <Select name="categoryId" value={formData.categoryId} onValueChange={(value) => handleSelectChange('categoryId', value)}>
                  <SelectTrigger><SelectValue placeholder={t('Select a category')} /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    <SelectItem value="add_new" className="text-primary focus:text-primary-foreground">
                      <div className="flex items-center">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('Add new category')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="price">{t('Sale Price ($)')}</Label>
                <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
              <Label htmlFor="recipeId">{t('Select Recipe')}</Label>
              <Select name="recipeId" value={formData.recipeId} onValueChange={(value) => handleSelectChange('recipeId', value)}>
                <SelectTrigger><SelectValue placeholder={t('Select a recipe (optional)')} /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="none">{t('None')}</SelectItem>
                  {recipes.map(rec => <SelectItem key={rec.id} value={rec.id}>{rec.name}</SelectItem>)}
                </SelectContent>
              </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preparationResponsible">{t('Responsable de preparación')}</Label>
            <Select name="preparationResponsible" value={formData.preparationResponsible} onValueChange={(value) => handleSelectChange('preparationResponsible', value)}>
                <SelectTrigger><SelectValue placeholder={t('Select a responsible')} /></SelectTrigger>
                <SelectContent>
                    {responsibles.map(resp => <SelectItem key={resp.id} value={resp.id}>{resp.name}</SelectItem>)}
                    <SelectItem value="add_new" className="text-primary focus:text-primary-foreground">
                      <div className="flex items-center">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('Add new')}
                      </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="imageUrl">{t('Image (Optional)')}</Label>
          <Input id="imageUrl" name="imageUrl" type="file" className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
        </div>
        
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditMode ? t('Update Item') : t('Add to Menu')}
          </Button>
        </div>
      </form>

      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Add New Category')}</DialogTitle>
            <DialogDescription>{t('Create a new category for your menu items.')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-category-name">{t('Category Name')}</Label>
            <Input 
              id="new-category-name" 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
              placeholder={t('e.g., Appetizers')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={handleAddCategory}>{t('Save Category')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={isAddResponsibleOpen} onOpenChange={setIsAddResponsibleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Add New Responsible')}</DialogTitle>
            <DialogDescription>{t('Create a new responsible for preparation.')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-responsible-name">{t('Responsible Name')}</Label>
            <Input 
              id="new-responsible-name" 
              value={newResponsibleName} 
              onChange={(e) => setNewResponsibleName(e.target.value)} 
              placeholder={t('e.g., Barista')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddResponsibleOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={handleAddResponsible}>{t('Save Responsible')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
