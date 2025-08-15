
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

export default function MasterUsersPage() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const userName = formData.get('userName');

        toast({
          title: "Usuario Master Registrado",
          description: `El usuario "${userName}" ha sido registrado exitosamente.`,
        });
        (e.target as HTMLFormElement).reset();
    };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-800 flex items-center gap-2">
            <UserPlus className="h-8 w-8" /> Registrar Usuario Master
          </h1>
          <p className="text-gray-600">Añada un nuevo usuario administrador maestro al sistema.</p>
        </div>
      </div>
      <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-gray-700">Nombre de Usuario</Label>
              <Input id="userName" name="userName" placeholder="Ej: admin_master" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
              <Input id="email" name="email" type="email" placeholder="Ej: admin@correo.com" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••••" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="flex justify-end">
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-lg">
                    Registrar Usuario
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
