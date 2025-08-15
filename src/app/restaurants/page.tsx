
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UtensilsCrossed } from 'lucide-react';

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
          <h1 className="text-3xl font-bold font-headline text-white flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8" /> Registrar Restaurante
          </h1>
          <p className="text-white/80">Añada un nuevo restaurante al sistema.</p>
        </div>
      </div>
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
        <CardHeader>
          <CardTitle>Información del Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="restaurantName" className="text-white/90">Nombre del Restaurante</Label>
              <Input id="restaurantName" name="restaurantName" placeholder="Ej: Tacos El Sol" className="bg-white/20 border-white/30 placeholder:text-white/70" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-white/90">Dirección</Label>
              <Input id="address" name="address" placeholder="Ej: Av. Principal 123" className="bg-white/20 border-white/30 placeholder:text-white/70" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/90">Teléfono</Label>
              <Input id="phone" name="phone" type="tel" placeholder="Ej: 55 1234 5678" className="bg-white/20 border-white/30 placeholder:text-white/70" required />
            </div>
            <div className="flex justify-end">
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
