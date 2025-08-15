
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

// TODO: Importar e inicializar Firebase cuando las credenciales estén disponibles
// import { auth, db } from '@/lib/firebase'; 
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
            // ---- SECCIÓN DE INTEGRACIÓN CON FIREBASE (actualmente comentada) ----
            
            // 1. Crear usuario en Firebase Auth
            // const userCredential = await createUserWithEmailAndPassword(auth, email, telefono);
            // const user = userCredential.user;

            // 2. Guardar datos en Firestore
            // await addDoc(collection(db, "usuarios"), {
            //     uid: user.uid,
            //     nombre,
            //     apellidos,
            //     telefono,
            //     email,
            //     status: 2,
            //     fecharegistro: serverTimestamp()
            // });

            // 3. Enviar correo de confirmación (requiere configuración de nodemailer en un backend)
            // console.log("Correo de confirmación enviado a:", email);


            // ---- SIMULACIÓN MIENTRAS FIREBASE NO ESTÁ CONECTADO ----
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simula la llamada a la red
            console.log('Usuario registrado (simulación):', { nombre, apellidos, telefono, email });

            toast({
              title: "Cliente Registrado (Simulación)",
              description: `El cliente "${fullName}" ha sido registrado exitosamente.`,
            });
            (e.target as HTMLFormElement).reset();

        } catch (error) {
            console.error("Error en el registro:", error);
            const errorMessage = (error as any).code === 'auth/email-already-in-use'
                ? "Este correo electrónico ya está en uso."
                : "Ocurrió un error al registrar al cliente.";

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
            <UserPlus className="h-8 w-8" /> Registrar Cliente
          </h1>
          <p className="text-gray-600">Añada un nuevo cliente al sistema.</p>
        </div>
      </div>
      <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
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
                  <Label htmlFor="telefono" className="text-gray-700">Teléfono</Label>
                  <Input id="telefono" name="telefono" type="tel" placeholder="Ej: 55 1234 5678" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" placeholder="Ej: cliente@correo.com" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-lg" disabled={isLoading}>
                    {isLoading ? 'Registrando...' : 'Registrar Cliente'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
