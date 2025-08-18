
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
      const restaurantRef = doc(db, "restaurantes", restaurant.id);
      await updateDoc(restaurantRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Actualización Exitosa",
        description: `La información del restaurante ha sido actualizada.`,
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error updating restaurant:", error);
      toast({
        variant: "destructive",
        title: "Error en la Actualización",
        description: "No se pudo guardar la información del restaurante.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="restaurantName" className="text-gray-700">Nombre del Restaurante</Label>
                <Input id="restaurantName" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} placeholder="Ej: Tacos El Sol" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="socialReason" className="text-gray-700">Razón Social</Label>
                <Input id="socialReason" name="socialReason" value={formData.socialReason} onChange={handleInputChange} placeholder="Ej: Tacos El Sol S.A. de C.V." className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
        </div>
         <div className="space-y-2">
            <Label htmlFor="style" className="text-gray-700">Estilo</Label>
            <Select name="style" value={formData.style} onValueChange={(value) => handleSelectChange('style', value)} required>
                <SelectTrigger className="bg-white/50 border-gray-300 placeholder:text-gray-500">
                    <SelectValue placeholder="Seleccione un estilo" />
                </SelectTrigger>
                <SelectContent>
                    {restaurantStyles.map(style => <SelectItem key={style} value={style}>{style}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-gray-700">Dirección</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Ej: Av. Principal 123, Colonia Centro" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="municipality" className="text-gray-700">Municipio o Alcaldía</Label>
                <Input id="municipality" name="municipality" value={formData.municipality} onChange={handleInputChange} placeholder="Ej: Cuauhtémoc" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="state" className="text-gray-700">Estado</Label>
                <Select name="state" value={formData.state} onValueChange={(value) => handleSelectChange('state', value)} required>
                    <SelectTrigger className="bg-white/50 border-gray-300 placeholder:text-gray-500">
                        <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                        {mexicanStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Separator className="my-4 bg-gray-300" />

        <h3 className="text-lg font-semibold text-gray-800">Información de Contacto</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Teléfono</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="Teléfono de contacto" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Correo Electrónico (no editable)</Label>
                <Input id="email" name="email" type="email" value={restaurant.email} className="bg-gray-100 border-gray-300 placeholder:text-gray-500" disabled />
            </div>
        </div>

         <div className="space-y-2">
            <Label htmlFor="rfc" className="text-gray-700">RFC</Label>
            <Input id="rfc" name="rfc" value={formData.rfc} onChange={handleInputChange} placeholder="Ej: SOLT850101XXX" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
        </div>
        
        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4" disabled={isLoading}>
             {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
                ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
            )}
          </Button>
        </div>
    </form>
  );
}
