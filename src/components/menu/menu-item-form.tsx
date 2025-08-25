
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, ChevronsUpDown, Check } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface MenuItem {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  recipeId?: string;
  inventoryItemId?: string;
  categoryId?: string;
  availability?: string;
  imageUrl?: string;
  preparationResponsible?: string;
  preparationTime?: number;
  status?: 'active' | 'inactive';
}

interface Recipe {
  id: string;
  name: string;
}

interface InventoryItem {
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
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddResponsibleOpen, setIsAddResponsibleOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newResponsibleName, setNewResponsibleName] = useState('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const isEditMode = !!menuItemToEdit;

  const [formData, setFormData] = useState({
    name: menuItemToEdit?.name || '',
    description: menuItemToEdit?.description || '',
    price: menuItemToEdit?.price || 0,
    recipeId: menuItemToEdit?.recipeId || '',
    inventoryItemId: menuItemToEdit?.inventoryItemId || '',
    categoryId: menuItemToEdit?.categoryId || '',
    imageUrl: menuItemToEdit?.imageUrl || '',
    preparationResponsible: menuItemToEdit?.preparationResponsible || '',
    preparationTime: menuItemToEdit?.preparationTime || 0,
    status: menuItemToEdit?.status || 'active',
  });

  useEffect(() => {
    if (!restaurantId) return;

    const unsubRecipes = onSnapshot(collection(db, `restaurantes/${restaurantId}/recipes`), (snapshot) => {
      setRecipes(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string })));
    });

    const unsubInventory = onSnapshot(collection(db, `restaurantes/${restaurantId}/inventoryItems`), (snapshot) => {
      setInventoryItems(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string })));
    });
    
    const unsubCategories = onSnapshot(collection(db, `restaurantes/${restaurantId}/menuCategories`), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string })));
    });
    
    const unsubResponsibles = onSnapshot(collection(db, `restaurantes/${restaurantId}/preparationResponsibles`), (snapshot) => {
      const responsiblesList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      if (responsiblesList.length === 0) {
        const initialResponsibles = [{ name: 'Cocina' }, { name: 'Mesero' }];
        initialResponsibles.forEach(async (resp) => {
            await addDoc(collection(db, `restaurantes/${restaurantId}/preparationResponsibles`), resp);
        });
      }
      setResponsibles(responsiblesList);
    });

    return () => {
      unsubRecipes();
      unsubInventory();
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
        inventoryItemId: menuItemToEdit.inventoryItemId || '',
        categoryId: menuItemToEdit.categoryId || '',
        imageUrl: menuItemToEdit.imageUrl || '',
        preparationResponsible: menuItemToEdit.preparationResponsible || '',
        preparationTime: menuItemToEdit.preparationTime || 0,
        status: menuItemToEdit.status || 'active',
      });
    }
  }, [menuItemToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumber = ['price', 'preparationTime'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'categoryId' && value === 'add_new') {
        setIsAddCategoryOpen(true);
    } else if (name === 'preparationResponsible' && value === 'add_new') {
        setIsAddResponsibleOpen(true);
    } else if (name === 'recipeId') {
        const selectedRecipe = recipes.find(r => r.id === value);
        setFormData(prev => ({
            ...prev,
            recipeId: value,
            inventoryItemId: '', // Reset inventory item if recipe is chosen
            name: selectedRecipe && value !== 'none' ? selectedRecipe.name : prev.name,
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: t('Invalid File Type'), description: t('Please select an image file.') });
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB
            toast({ variant: 'destructive', title: t('File too large'), description: t('Please select an image smaller than 1MB.') });
            return;
        }
        setImageFile(file);
    }
  };


  const handleInventoryItemSelect = (value: string) => {
    const selectedItem = inventoryItems.find(item => item.id === value);
    setFormData(prev => ({
      ...prev,
      inventoryItemId: value,
      recipeId: '', // Reset recipe if inventory item is chosen
      name: selectedItem ? selectedItem.name : prev.name
    }));
    setIsComboboxOpen(false);
  }

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
      let imageUrl = formData.imageUrl || '';
      
      if (imageFile) {
        const imageRef = ref(storage, `restaurantes/${restaurantId}/menuItems/${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      
      const menuItemData = {
        ...formData,
        price: Number(formData.price) || 0,
        preparationTime: Number(formData.preparationTime) || 0,
        imageUrl,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode && menuItemToEdit?.id) {
        const menuItemRef = doc(db, `restaurantes/${restaurantId}/menuItems`, menuItemToEdit.id);
        await updateDoc(menuItemRef, menuItemData);
        toast({ title: t("Update Successful"), description: t("The menu item has been updated.") });
      } else {
        const collectionRef = collection(db, `restaurantes/${restaurantId}/menuItems`);
        await addDoc(collectionRef, { ...menuItemData, createdAt: serverTimestamp(), status: 'active' });
        toast({ title: t("Menu Item Added"), description: t("The new item has been added to the menu.") });
      }
      onSuccess?.();
      // Reset form state
      setFormData({
        name: '',
        description: '',
        price: 0,
        recipeId: '',
        inventoryItemId: '',
        categoryId: '',
        imageUrl: '',
        preparationResponsible: '',
        preparationTime: 0,
        status: 'active',
      })
      setImageFile(null);
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
            <Label htmlFor="recipeId">{t('Select Recipe')}</Label>
            <Select name="recipeId" value={formData.recipeId} onValueChange={(value) => handleSelectChange('recipeId', value)}>
              <SelectTrigger><SelectValue placeholder={t('Select a recipe (optional)')} /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="none">{t('None (direct from inventory)')}</SelectItem>
                {recipes.map(rec => <SelectItem key={rec.id} value={rec.id}>{rec.name}</SelectItem>)}
              </SelectContent>
            </Select>
        </div>

        {formData.recipeId === 'none' && (
          <div className="space-y-2">
            <Label>{t('Select Inventory Item')}</Label>
            <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isComboboxOpen}
                  className="w-full justify-between"
                >
                  {formData.inventoryItemId
                    ? inventoryItems.find((item) => item.id === formData.inventoryItemId)?.name
                    : t('Select an item...')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder={t('Search item...')} />
                  <CommandEmpty>{t('No item found.')}</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {inventoryItems.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.name}
                          onSelect={() => handleInventoryItemSelect(item.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.inventoryItemId === item.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {item.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}
      
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
              <Label htmlFor="preparationResponsible">{t('Preparation Responsible')}</Label>
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
            <div className="space-y-2">
                <Label htmlFor="preparationTime">{t('Estimated preparation time (mins)')}</Label>
                <Input id="preparationTime" name="preparationTime" type="number" value={formData.preparationTime} onChange={handleInputChange} required />
            </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="imageFile">{t('Image (Optional)')}</Label>
          <Input id="imageFile" name="imageFile" type="file" onChange={handleFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
          {imageFile && <p className="text-sm text-muted-foreground">{t('Selected')}: {imageFile.name}</p>}
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

    