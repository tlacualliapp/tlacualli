
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface Restaurant {
  id: string;
  restaurantName: string;
  socialReason: string;
  style: string;
  address: string;
  municipality: string;
  state: string;
  phone: string;
  email: string;
  rfc: string;
  plan?: string;
}

interface AdminRestaurantFormProps {
  restaurant: Restaurant;
  onSuccess?: () => void;
}

const mexicanStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit", "Nuevo León",
  "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas", "CDMX"
];

const restaurantStyles = ["Italiano", "Mar y tierra", "Carnes", "Mariscos", "Mexicano", "Japonés", "Otro"];

export function AdminRestaurantForm({ restaurant, onSuccess }: AdminRestaurantFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    restaurantName: '',
    socialReason: '',
    style: '',
    address: '',
    municipality: '',
    state: '',
    phone: '',
    rfc: '',
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        restaurantName: restaurant.restaurantName || '',
        socialReason: restaurant.socialReason || '',
        style: restaurant.style || '',
        address: restaurant.address || '',
        municipality: restaurant.municipality || '',
        state: restaurant.state || '',
        phone: restaurant.phone || '',
        rfc: restaurant.rfc || '',
      });
    }
  }, [restaurant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const collectionName = restaurant.plan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
      const restaurantRef = doc(db, collectionName, restaurant.id);
      await updateDoc(restaurantRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: t("Update Successful"),
        description: t("The restaurant information has been updated."),
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error updating restaurant:", error);
      toast({
        variant: "destructive",
        title: t("Update Error"),
        description: t("Could not save the restaurant information."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="restaurantName" className="text-gray-700">{t('Restaurant Name')}</Label>
                <Input id="restaurantName" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} placeholder={t('e.g., Tacos El Sol')} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="socialReason" className="text-gray-700">{t('Social Reason')}</Label>
                <Input id="socialReason" name="socialReason" value={formData.socialReason} onChange={handleInputChange} placeholder={t('e.g., Tacos El Sol S.A. de C.V.')} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
        </div>
         <div className="space-y-2">
            <Label htmlFor="style" className="text-gray-700">{t('Style')}</Label>
            <Select name="style" value={formData.style} onValueChange={(value) => handleSelectChange('style', value)} required>
                <SelectTrigger className="bg-white/50 border-gray-300 placeholder:text-gray-500">
                    <SelectValue placeholder={t('Select a style')} />
                </SelectTrigger>
                <SelectContent>
                    {restaurantStyles.map(style => <SelectItem key={style} value={t(style)}>{t(style)}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-gray-700">{t('Address')}</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder={t('e.g., Main St 123, Downtown')} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="municipality" className="text-gray-700">{t('Municipality or City')}</Label>
                <Input id="municipality" name="municipality" value={formData.municipality} onChange={handleInputChange} placeholder={t('e.g., Cuauhtémoc')} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="state" className="text-gray-700">{t('State')}</Label>
                <Select name="state" value={formData.state} onValueChange={(value) => handleSelectChange('state', value)} required>
                    <SelectTrigger className="bg-white/50 border-gray-300 placeholder:text-gray-500">
                        <SelectValue placeholder={t('Select a state')} />
                    </SelectTrigger>
                    <SelectContent>
                        {mexicanStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Separator className="my-4 bg-gray-300" />

        <h3 className="text-lg font-semibold text-gray-800">{t('Contact Information')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">{t('Phone')}</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder={t('Contact phone')} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">{t('Email (not editable)')}</Label>
                <Input id="email" name="email" type="email" value={restaurant.email} className="bg-gray-100 border-gray-300 placeholder:text-gray-500" disabled />
            </div>
        </div>

         <div className="space-y-2">
            <Label htmlFor="rfc" className="text-gray-700">{t('RFC')}</Label>
            <Input id="rfc" name="rfc" value={formData.rfc} onChange={handleInputChange} placeholder={t('e.g., SOLT850101XXX')} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
        </div>
        
        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4" disabled={isLoading}>
             {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('Saving...')}
                </>
                ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('Save Changes')}
                </>
            )}
          </Button>
        </div>
    </form>
  );
}
