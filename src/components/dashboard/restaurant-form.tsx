
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import { sendWelcomeEmail } from '@/lib/email';

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

interface RestaurantFormProps {
  onSuccess?: () => void;
  restaurantToEdit?: Restaurant | null;
  source?: 'register' | 'admin';
}

const mexicanStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit", "Nuevo León",
  "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas", "CDMX"
];

const restaurantStyles = ["Italiano", "Mar y tierra", "Carnes", "Mariscos", "Mexicano", "Japonés", "Otro"];

export function RestaurantForm({ onSuccess, restaurantToEdit, source = 'admin' }: RestaurantFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const isEditMode = !!restaurantToEdit;
    const { t } = useTranslation();
    const [termsAccepted, setTermsAccepted] = useState(false);
    
    const [formData, setFormData] = useState({
        restaurantName: '', socialReason: '', style: '', address: '',
        municipality: '', state: '', phone: '', email: '', rfc: '',
    });

    useEffect(() => {
        if (isEditMode && restaurantToEdit) {
            setFormData({
                restaurantName: restaurantToEdit.restaurantName || '',
                socialReason: restaurantToEdit.socialReason || '',
                style: restaurantToEdit.style || '',
                address: restaurantToEdit.address || '',
                municipality: restaurantToEdit.municipality || '',
                state: restaurantToEdit.state || '',
                phone: restaurantToEdit.phone || '',
                email: restaurantToEdit.email || '',
                rfc: restaurantToEdit.rfc || '',
            });
            setTermsAccepted(true); // For edit mode, assume they already accepted.
        }
    }, [restaurantToEdit, isEditMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
      setFormData(prev => ({...prev, [name]: value}))
    }

    const resetForm = () => {
        formRef.current?.reset();
        setFormData({
            restaurantName: '', socialReason: '', style: '', address: '',
            municipality: '', state: '', phone: '', email: '', rfc: '',
        });
        setTermsAccepted(false);
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        
        const { restaurantName, email, phone } = formData;

        try {
          if (isEditMode && restaurantToEdit) {
             // Modo Edición
            const restaurantRef = doc(db, "restaurantes", restaurantToEdit.id);
            await updateDoc(restaurantRef, {
                ...formData,
                updatedAt: serverTimestamp(),
            });
            toast({
                title: t("Update Successful"),
                description: t("The information for restaurant '{{name}}' has been updated.", {name: restaurantName}),
            });
          } else {
             // Modo Creación
            const isDemo = source === 'register';
            const restaurantCollectionName = isDemo ? 'restaurantes_demo' : 'restaurantes';

            const restaurantData: any = {
              ...formData,
              status: "1",
              fecharegistro: serverTimestamp()
            };

            if (isDemo) {
                restaurantData.plan = 'demo';
            }

            const restaurantRef = await addDoc(collection(db, restaurantCollectionName), restaurantData);
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, phone);
            const user = userCredential.user;
            const adminName = `Admin ${restaurantName}`;
            
            const userData: any = {
                uid: user.uid,
                nombre: "Admin",
                apellidos: restaurantName,
                restauranteId: restaurantRef.id,
                perfil: "1",
                status: "1",
                fecharegistro: serverTimestamp(),
                email,
                telefono: phone
            };

            if (isDemo) {
                userData.plan = 'demo';
            }

            await addDoc(collection(db, "usuarios"), userData);

            await sendWelcomeEmail({
                to: email,
                name: adminName,
                username: email,
                password: phone
            });
            
            toast({
              title: t("Registration Successful"),
              description: t("The restaurant '{{name}}' and its administrator user have been registered.", {name: restaurantName}),
            });
            resetForm();
          }

          onSuccess?.();

        } catch (error) {
            console.error("Error en el registro:", error);
            const errorCode = (error as any).code;
            let errorMessage = t("An error occurred during the operation.");

            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = t("The email is already in use by another administrator.");
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = t("The password (phone) must be at least 6 characters long.");
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = t("The email format is invalid.");
            }
            
            toast({
              variant: "destructive",
              title: t("Operation Error"),
              description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="restaurantName" className="text-gray-700">{t('Restaurant Name')}</Label>
                    <Input id="restaurantName" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} placeholder={t("e.g., Tacos El Sol")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="socialReason" className="text-gray-700">{t('Social Reason')}</Label>
                    <Input id="socialReason" name="socialReason" value={formData.socialReason} onChange={handleInputChange} placeholder={t("e.g., Tacos El Sol S.A. de C.V.")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="style" className="text-gray-700">{t('Style')}</Label>
                <Select name="style" value={formData.style} onValueChange={(value) => handleSelectChange('style', value)} required>
                    <SelectTrigger className="bg-white/50 border-gray-300 placeholder:text-gray-500">
                        <SelectValue placeholder={t("Select a style")} />
                    </SelectTrigger>
                    <SelectContent>
                        {restaurantStyles.map(style => <SelectItem key={style} value={t(style)}>{t(style)}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700">{t('Address')}</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder={t("e.g., Main St 123, Downtown")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="municipality" className="text-gray-700">{t('Municipality or City')}</Label>
                    <Input id="municipality" name="municipality" value={formData.municipality} onChange={handleInputChange} placeholder={t("e.g., Cuauhtémoc")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-700">{t('State')}</Label>
                    <Select name="state" value={formData.state} onValueChange={(value) => handleSelectChange('state', value)} required>
                        <SelectTrigger className="bg-white/50 border-gray-300 placeholder:text-gray-500">
                            <SelectValue placeholder={t("Select a state")} />
                        </SelectTrigger>
                        <SelectContent>
                            {mexicanStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className="my-4 bg-gray-300" />

            <h3 className="text-lg font-semibold text-gray-800">{t('Contact Information (Administrator)')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">{isEditMode ? t('Phone') : t('Phone (will be the password)')}</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder={t("Minimum 6 digits")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">{isEditMode ? t('Email') : t('Email (will be the username)')}</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t("e.g., admin@tacoselsol.com")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required disabled={isEditMode} />
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="rfc" className="text-gray-700">{t('RFC')}</Label>
                <Input id="rfc" name="rfc" value={formData.rfc} onChange={handleInputChange} placeholder={t("e.g., SOLT850101XXX")} className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>

            {!isEditMode && (
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(!!checked)} required />
                    <Label htmlFor="terms" className="text-sm font-normal">
                        Acepto los <Link href="/terminos-condiciones" target="_blank" className="underline hover:text-primary">Términos y Condiciones</Link> y el <Link href="/aviso-privacidad" target="_blank" className="underline hover:text-primary">Aviso de Privacidad</Link>.
                    </Label>
                </div>
            )}
            
            <div className="flex justify-end pt-2">
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4" disabled={isLoading || !termsAccepted}>
                 {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditMode ? t('Saving...') : t('Registering...')}
                    </>
                    ) : (
                    isEditMode ? t('Save Changes') : t('Register Restaurant')
                )}
              </Button>
            </div>
        </form>
    );
}
