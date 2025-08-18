
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface MasterUser {
  id?: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
}

interface MasterUserFormProps {
  onSuccess?: () => void;
  userToEdit?: MasterUser | null;
}

export function MasterUserForm({ onSuccess, userToEdit }: MasterUserFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!userToEdit;

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
            if (isEditMode && userToEdit?.id) {
                // Modo Edición
                const userRef = doc(db, "usuarios", userToEdit.id);
                await updateDoc(userRef, {
                    nombre,
                    apellidos,
                    telefono,
                    // El email no se puede cambiar fácilmente en Firebase Auth, así que solo actualizamos en Firestore.
                });

                toast({
                  title: "Usuario Actualizado",
                  description: `El Usuario Master "${fullName}" ha sido actualizado.`,
                });

            } else {
                // Modo Creación
                // 1. Crear usuario en Firebase Auth (la contraseña es el teléfono)
                const userCredential = await createUserWithEmailAndPassword(auth, email, telefono);
                const user = userCredential.user;

                // 2. Guardar datos en Firestore
                await addDoc(collection(db, "usuarios"), {
                    uid: user.uid,
                    nombre,
                    apellidos,
                    telefono,
                    email,
                    status: "1", // status como string
                    perfil: 'AM',
                    fecharegistro: serverTimestamp()
                });

                toast({
                  title: "Usuario Master Registrado",
                  description: `El Usuario Master "${fullName}" ha sido registrado exitosamente.`,
                });
            }
            
            (e.target as HTMLFormElement).reset();
            onSuccess?.();

        } catch (error) {
            console.error("Error en la operación:", error);
            const errorCode = (error as any).code;
            let errorMessage = `Ocurrió un error al ${isEditMode ? 'actualizar' : 'registrar'} al usuario.`;

            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = "Este correo electrónico ya está en uso.";
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = "La contraseña (teléfono) debe tener al menos 6 caracteres.";
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = "El formato del correo electrónico no es válido.";
            }

            toast({
              variant: "destructive",
              title: "Error",
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
              <Input id="nombre" name="nombre" defaultValue={userToEdit?.nombre} placeholder="Ej: Juan" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos" className="text-gray-700">Apellidos</Label>
              <Input id="apellidos" name="apellidos" defaultValue={userToEdit?.apellidos} placeholder="Ej: Pérez García" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-gray-700">Teléfono {isEditMode ? '' : '(será la contraseña)'}</Label>
              <Input id="telefono" name="telefono" type="tel" defaultValue={userToEdit?.telefono} placeholder="Mínimo 6 dígitos" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
              <Input id="email" name="email" type="email" defaultValue={userToEdit?.email} placeholder="Ej: usuario@correo.com" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required disabled={isEditMode} />
            </div>
        </div>
        <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : isEditMode ? 'Guardar Cambios' : 'Registrar Usuario Master'}
            </Button>
        </div>
    </form>
  );
}
