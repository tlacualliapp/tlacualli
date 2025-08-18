
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { auth, db } from '@/lib/firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function MasterUsersPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const nombre = formData.get('nombre') as string;
        const apellidos = formData.get('apellidos') as string;
        const telefono = formData.get('telefono') as string;
        const email = formData.get('email') as string;
        const fullName = `${nombre} ${apellidos}`;

        try {
            // 1. Crear usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, telefono);
            const user = userCredential.user;

            // 2. Guardar datos en Firestore
            await addDoc(collection(db, "usuarios"), {
                uid: user.uid,
                nombre,
                apellidos,
                telefono,
                email,
                status: 2,
                perfil: 'AM',
                fecharegistro: serverTimestamp()
            });

            toast({
              title: "Usuario Master Registrado",
              description: `El Usuario Master "${fullName}" ha sido registrado exitosamente.`,
            });
            (e.target as HTMLFormElement).reset();

        } catch (error) {
            console.error("Error en el registro:", error);
            const errorCode = (error as any).code;
            let errorMessage = "Ocurrió un error al registrar al usuario master.";

            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = "Este correo electrónico ya está en uso.";
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = "La contraseña (teléfono) debe tener al menos 6 caracteres.";
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = "El formato del correo electrónico no es válido.";
            }

            toast({
              variant: "destructive",
              title: "Error en el Registro",
              description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-800 flex items-center gap-2">
            <UserPlus className="h-8 w-8" /> Registrar Usuario Master
          </h1>
          <p className="text-gray-600">Añada un nuevo usuario master al sistema.</p>
        </div>
      </div>
      <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
        <CardHeader>
          <CardTitle>Información del Usuario Master</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-gray-700">Nombre(s)</Label>
                  <Input id="nombre" name="nombre" placeholder="Ej: Juan" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos" className="text-gray-700">Apellidos</Label>
                  <Input id="apellidos" name="apellidos" placeholder="Ej: Pérez García" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-gray-700">Teléfono (será la contraseña)</Label>
                  <Input id="telefono" name="telefono" type="tel" placeholder="Mínimo 6 dígitos" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" placeholder="Ej: usuario@correo.com" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Registrar Usuario Master'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
