
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendWelcomeEmail } from '@/lib/email';

interface Employee {
  id?: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  perfil?: string;
}

interface EmployeeFormProps {
  restaurantId: string;
  onSuccess?: () => void;
  employeeToEdit?: Employee | null;
}

const profiles = [
    { id: '1', name: 'Administrator' },
    { id: '2', name: 'Employee' },
];

export function EmployeeForm({ restaurantId, onSuccess, employeeToEdit }: EmployeeFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!employeeToEdit;
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        telefono: '',
        email: '',
        perfil: '',
    });

     useEffect(() => {
        if (employeeToEdit) {
            setFormData({
                nombre: employeeToEdit.nombre || '',
                apellidos: employeeToEdit.apellidos || '',
                telefono: employeeToEdit.telefono || '',
                email: employeeToEdit.email || '',
                perfil: employeeToEdit.perfil || '',
            });
        } else {
            // Reset form when adding a new employee
            setFormData({
                nombre: '',
                apellidos: '',
                telefono: '',
                email: '',
                perfil: '',
            });
        }
    }, [employeeToEdit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, perfil: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const { nombre, apellidos, telefono, email, perfil } = formData;
        const fullName = `${nombre} ${apellidos}`;

        try {
            if (isEditMode && employeeToEdit?.id) {
                // Edit Mode
                const userRef = doc(db, "usuarios", employeeToEdit.id);
                await updateDoc(userRef, {
                    nombre,
                    apellidos,
                    telefono,
                    perfil,
                    // Email cannot be easily changed in Firebase Auth, so we only update it in Firestore.
                });

                toast({
                  title: t("User Updated"),
                  description: t("The employee '{{fullName}}' has been updated.", { fullName }),
                });

            } else {
                // Creation Mode
                // 1. Create user in Firebase Auth (password is the phone number)
                const userCredential = await createUserWithEmailAndPassword(auth, email, telefono);
                const user = userCredential.user;

                // 2. Save user data in Firestore
                await addDoc(collection(db, "usuarios"), {
                    uid: user.uid,
                    restauranteId: restaurantId,
                    nombre,
                    apellidos,
                    telefono,
                    email,
                    status: "1", // status as string
                    perfil,
                    fecharegistro: serverTimestamp()
                });
                
                // 3. Send welcome email
                await sendWelcomeEmail({
                    to: email,
                    name: fullName,
                    username: email,
                    password: telefono
                });


                toast({
                  title: t("Employee Registered"),
                  description: t("The employee '{{fullName}}' has been successfully registered.", { fullName }),
                });
            }
            
            (e.target as HTMLFormElement).reset();
            onSuccess?.();

        } catch (error) {
            console.error("Error during operation:", error);
            const errorCode = (error as any).code;
            let errorMessage = t('An error occurred while {{action}} the employee.', { action: isEditMode ? t('updating') : t('registering') });

            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = t("This email is already in use by another user.");
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
              <Label htmlFor="nombre">{t('First Name(s)')}</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder={t("e.g., Ana")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">{t('Last Names')}</Label>
              <Input id="apellidos" name="apellidos" value={formData.apellidos} onChange={handleInputChange} placeholder={t("e.g., Silva")} required />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">{isEditMode ? t('Phone') : t('Phone (will be the password)')}</Label>
              <Input id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleInputChange} placeholder={t('Minimum 6 digits')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('Email')}</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t("e.g., user@email.com")} required disabled={isEditMode} />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="perfil">{t('Profile')}</Label>
            <Select name="perfil" value={formData.perfil} onValueChange={handleSelectChange} required>
                <SelectTrigger>
                    <SelectValue placeholder={t('Select a profile')} />
                </SelectTrigger>
                <SelectContent>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{t(p.name)}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                {isEditMode ? t('Save Changes') : t('Register Employee')}
            </Button>
        </div>
    </form>
  );
}
