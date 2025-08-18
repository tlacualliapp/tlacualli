
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
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

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
                  title: t("User Updated"),
                  description: t("The Master User '{{fullName}}' has been updated.", { fullName }),
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
                  title: t("Master User Registered"),
                  description: t("The Master User '{{fullName}}' has been successfully registered.", { fullName }),
                });
            }
            
            (e.target as HTMLFormElement).reset();
            onSuccess?.();

        } catch (error) {
            console.error("Error en la operación:", error);
            const errorCode = (error as any).code;
            let errorMessage = t('An error occurred while {{action}} the user.', { action: isEditMode ? t('updating') : t('registering') });

            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = t("This email is already in use.");
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = t("The password (phone) must be at least 6 characters long.");
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = t("The email format is invalid.");
            }

            toast({
              variant: "destructive",
              title: t("Error"),
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
              <Label htmlFor="nombre" className="text-gray-700">{t('First Name(s)')}</Label>
              <Input id="nombre" name="nombre" defaultValue={userToEdit?.nombre} placeholder={t("e.g., Juan")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos" className="text-gray-700">{t('Last Names')}</Label>
              <Input id="apellidos" name="apellidos" defaultValue={userToEdit?.apellidos} placeholder={t("e.g., Pérez García")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-gray-700">{isEditMode ? t('Phone') : t('Phone (will be the password)')}</Label>
              <Input id="telefono" name="telefono" type="tel" defaultValue={userToEdit?.telefono} placeholder={t('Minimum 6 digits')} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">{t('Email')}</Label>
              <Input id="email" name="email" type="email" defaultValue={userToEdit?.email} placeholder={t("e.g., user@email.com")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required disabled={isEditMode} />
            </div>
        </div>
        <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : isEditMode ? t('Save Changes') : t('Register Master User')}
            </Button>
        </div>
    </form>
  );
}
