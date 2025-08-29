
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface Supplier {
  id?: string;
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
}

interface SupplierFormProps {
  restaurantId: string;
  userPlan: string;
  onSuccess?: () => void;
  supplierToEdit?: Supplier | null;
}

export function SupplierForm({ restaurantId, userPlan, onSuccess, supplierToEdit }: SupplierFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!supplierToEdit;
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: '',
  });

  useEffect(() => {
      if (supplierToEdit) {
          setFormData({
              name: supplierToEdit.name || '',
              contactName: supplierToEdit.contactName || '',
              phone: supplierToEdit.phone || '',
              email: supplierToEdit.email || '',
              address: supplierToEdit.address || '',
              paymentTerms: supplierToEdit.paymentTerms || '',
          });
      } else {
           setFormData({
              name: '',
              contactName: '',
              phone: '',
              email: '',
              address: '',
              paymentTerms: '',
          });
      }
  }, [supplierToEdit]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supplierData = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';

      if (isEditMode && supplierToEdit?.id) {
        const supplierRef = doc(db, `${collectionName}/${restaurantId}/suppliers`, supplierToEdit.id);
        await updateDoc(supplierRef, supplierData);
        toast({ title: t("Update Successful"), description: t("The supplier has been updated.") });
      } else {
        const collectionRef = collection(db, `${collectionName}/${restaurantId}/suppliers`);
        await addDoc(collectionRef, { ...supplierData, createdAt: serverTimestamp() });
        toast({ title: t("Supplier Added"), description: t("The new supplier has been added.") });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast({ variant: "destructive", title: t("Save Error"), description: t("Could not save the supplier information.") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('Supplier Name')}</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder={t('e.g., Central de Abastos')} required />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">{t('Contact Name')}</Label>
          <Input id="contactName" name="contactName" value={formData.contactName} onChange={handleInputChange} placeholder={t('e.g., Juan Robles')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t('Phone')}</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('Email')}</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">{t('Address')}</Label>
        <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} />
      </div>

       <div className="space-y-2">
        <Label htmlFor="paymentTerms">{t('Payment Terms')}</Label>
        <Input id="paymentTerms" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} placeholder={t('e.g., Net 30')} />
      </div>
      
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('Save Supplier')}
        </Button>
      </div>
    </form>
  );
}
