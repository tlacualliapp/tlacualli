
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

interface Item {
  id?: string;
  name?: string;
  unitOfMeasure?: string;
  currentStock?: number;
  minimumStock?: number;
  averageCost?: number;
  supplierId?: string;
  category?: string;
}

interface ItemFormProps {
  restaurantId: string;
  onSuccess?: () => void;
  itemToEdit?: Item | null;
}

const unitsOfMeasure = ["kg", "g", "L", "ml", "pz", "box", "can"];
const categories = ["Meats", "Vegetables", "Fruits", "Dairy", "Pantry", "Beverages", "Cleaning", "Other"];

export function ItemForm({ restaurantId, onSuccess, itemToEdit }: ItemFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([]);
  const isEditMode = !!itemToEdit;
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: itemToEdit?.name || '',
    unitOfMeasure: itemToEdit?.unitOfMeasure || '',
    currentStock: itemToEdit?.currentStock || 0,
    minimumStock: itemToEdit?.minimumStock || 0,
    averageCost: itemToEdit?.averageCost || 0,
    supplierId: itemToEdit?.supplierId || '',
    category: itemToEdit?.category || '',
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!restaurantId) return;
      const suppliersQuery = collection(db, `restaurantes/${restaurantId}/suppliers`);
      const querySnapshot = await getDocs(suppliersQuery);
      const suppliersList = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      setSuppliers(suppliersList);
    };
    fetchSuppliers();
  }, [restaurantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const itemData = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode && itemToEdit?.id) {
        const itemRef = doc(db, `restaurantes/${restaurantId}/inventoryItems`, itemToEdit.id);
        await updateDoc(itemRef, itemData);
        toast({ title: t("Update Successful"), description: t("The item has been updated.") });
      } else {
        const collectionRef = collection(db, `restaurantes/${restaurantId}/inventoryItems`);
        await addDoc(collectionRef, { ...itemData, createdAt: serverTimestamp() });
        toast({ title: t("Item Added"), description: t("The new item has been added to inventory.") });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({ variant: "destructive", title: t("Save Error"), description: t("Could not save the item information.") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('Item Name')}</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder={t('e.g., Tomato')} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">{t('Category')}</Label>
          <Select name="category" value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
            <SelectTrigger><SelectValue placeholder={t('Select a category')} /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{t(cat)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitOfMeasure">{t('Unit of Measure')}</Label>
          <Select name="unitOfMeasure" value={formData.unitOfMeasure} onValueChange={(value) => handleSelectChange('unitOfMeasure', value)}>
            <SelectTrigger><SelectValue placeholder={t('Select a unit')} /></SelectTrigger>
            <SelectContent>
              {unitsOfMeasure.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currentStock">{t('Current Stock')}</Label>
          <Input id="currentStock" name="currentStock" type="number" value={formData.currentStock} onChange={handleInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimumStock">{t('Minimum Stock')}</Label>
          <Input id="minimumStock" name="minimumStock" type="number" value={formData.minimumStock} onChange={handleInputChange} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="averageCost">{t('Average Cost (Unit)')}</Label>
          <Input id="averageCost" name="averageCost" type="number" step="0.01" value={formData.averageCost} onChange={handleInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplierId">{t('Main Supplier')}</Label>
          <Select name="supplierId" value={formData.supplierId} onValueChange={(value) => handleSelectChange('supplierId', value)}>
            <SelectTrigger><SelectValue placeholder={t('Select a supplier')} /></SelectTrigger>
            <SelectContent>
              {suppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('Save Item')}
        </Button>
      </div>
    </form>
  );
}
