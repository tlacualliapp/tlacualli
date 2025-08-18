
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface MasterUserFormProps {
  onSuccess?: () => void;
}

export function MasterUserForm({ onSuccess }: MasterUserFormProps) {
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
                status: "1", // status as string
                perfil: 'AM',
                fecharegistro: serverTimestamp()
            });

            toast({
              title: "Usuario Master Registrado",
              description: `El Usuario Master "${fullName}" ha sido registrado exitosamente.`,
            });
            (e.target as HTMLFormElement).reset();
            onSuccess?.();

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
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-gray-700">Nombre(s)</Label>
              <Input id="nombre" name="nombre" placeholder="Ej: Juan" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos" className="text-gray-700">Apellidos</Label>
              <Input id="apellidos" name="apellidos" placeholder="Ej: Pérez García" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-gray-700">Teléfono (será la contraseña)</Label>
              <Input id="telefono" name="telefono" type="tel" placeholder="Mínimo 6 dígitos" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
              <Input id="email" name="email" type="email" placeholder="Ej: usuario@correo.com" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
        </div>
        <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Registrar Usuario Master'}
            </Button>
        </div>
    </form>
  );
}
