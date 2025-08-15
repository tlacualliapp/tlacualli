
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UtensilsCrossed } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const mexicanStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit", "Nuevo León",
  "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const restaurantStyles = ["Italiano", "Mar y tierra", "Carnes", "Mariscos", "Mexicano", "Japonés", "Otro"];

export default function RestaurantsPage() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const restaurantName = formData.get('restaurantName');
    
    toast({
      title: "Restaurante Registrado",
      description: `El restaurante "${restaurantName}" ha sido registrado exitosamente.`,
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-800 flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8" /> Registrar Restaurante
          </h1>
          <p className="text-gray-600">Añada un nuevo restaurante al sistema.</p>
        </div>
      </div>
      <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
        <CardHeader>
          <CardTitle>Información del Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="restaurantName" className="text-gray-700">Nombre del Restaurante</Label>
                    <Input id="restaurantName" name="restaurantName" placeholder="Ej: Tacos El Sol" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="style" className="text-gray-700">Estilo</Label>
                    <Select name="style">
                        <SelectTrigger className="bg-white/50 border-gray-300 placeholder:text-gray-500">
                            <SelectValue placeholder="Seleccione un estilo" />
                        </SelectTrigger>
                        <SelectContent>
                            {restaurantStyles.map(style => <SelectItem key={style} value={style}>{style}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700">Dirección</Label>
              <Input id="address" name="address" placeholder="Ej: Av. Principal 123, Colonia Centro" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="municipality" className="text-gray-700">Municipio o Alcaldía</Label>
                    <Input id="municipality" name="municipality" placeholder="Ej: Cuauhtémoc" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-700">Estado</Label>
                    <Select name="state">
                        <SelectTrigger className="bg-white/50 border-gray-300 placeholder:text-gray-500">
                            <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {mexicanStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className="my-6 bg-gray-300" />

            <h3 className="text-lg font-semibold text-gray-800">Información de Contacto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">Teléfono</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="Ej: 55 1234 5678" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
                    <Input id="email" name="email" type="email" placeholder="Ej: contacto@tacoselsol.com" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="rfc" className="text-gray-700">RFC</Label>
                <Input id="rfc" name="rfc" placeholder="Ej: SOLT850101XXX" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-lg">
                Registrar Restaurante
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
