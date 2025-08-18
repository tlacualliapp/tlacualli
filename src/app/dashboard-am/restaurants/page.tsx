
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UtensilsCrossed, Loader2, Save, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';


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
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantId = searchParams.get('id');
  const isEditMode = !!restaurantId;

  // Use a ref for the form to reset it
  const formRef = React.useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    restaurantName: '',
    socialReason: '',
    style: '',
    address: '',
    municipality: '',
    state: '',
    phone: '',
    email: '',
    rfc: '',
  });

  const fetchRestaurantData = useCallback(async () => {
    if (!restaurantId) {
      setIsFetchingData(false);
      return;
    }
    setIsFetchingData(true);
    try {
      const restaurantRef = doc(db, "restaurantes", restaurantId);
      const docSnap = await getDoc(restaurantRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
            restaurantName: data.restaurantName || '',
            socialReason: data.socialReason || '',
            style: data.style || '',
            address: data.address || '',
            municipality: data.municipality || '',
            state: data.state || '',
            phone: data.phone || '',
            email: data.email || '',
            rfc: data.rfc || '',
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el restaurante para editar.",
        });
        router.push('/dashboard-am');
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, [restaurantId, router, toast]);

  useEffect(() => {
    fetchRestaurantData();
  }, [fetchRestaurantData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({...prev, [name]: value}))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { restaurantName, phone, email } = formData;

    try {
      if (isEditMode) {
        // Update existing restaurant
        const restaurantRef = doc(db, "restaurantes", restaurantId!);
        await updateDoc(restaurantRef, formData);
        toast({
          title: "Actualización Exitosa",
          description: `El restaurante "${restaurantName}" ha sido actualizado.`,
        });
        router.push('/dashboard-am');
      } else {
        // Create new restaurant
        const restaurantData = {
          ...formData,
          status: "1",
          fecharegistro: serverTimestamp()
        };

        const restaurantRef = await addDoc(collection(db, "restaurantes"), restaurantData);
        
        // This part is problematic if editing, as an admin user might already exist.
        // We only create a user when creating a restaurant.
        const userCredential = await createUserWithEmailAndPassword(auth, email, phone);
        const user = userCredential.user;

        await addDoc(collection(db, "usuarios"), {
            uid: user.uid,
            nombre: "Admin",
            apellidos: restaurantName,
            restauranteId: restaurantRef.id,
            perfil: "1",
            status: "1",
            fecharegistro: serverTimestamp(),
            email,
            telefono: phone
        });
        
        toast({
          title: "Registro Exitoso",
          description: `El restaurante "${restaurantName}" y su usuario administrador han sido registrados.`,
        });
        formRef.current?.reset();
        setFormData({
            restaurantName: '', socialReason: '', style: '', address: '',
            municipality: '', state: '', phone: '', email: '', rfc: '',
        });
      }
    } catch (error) {
        console.error("Error en el registro:", error);
        const errorCode = (error as any).code;
        let errorMessage = "Ocurrió un error durante la operación.";

        if (errorCode === 'auth/email-already-in-use') {
            errorMessage = "El correo electrónico ya está en uso por otro administrador.";
        } else if (errorCode === 'auth/weak-password') {
            errorMessage = "La contraseña (teléfono) debe tener al menos 6 caracteres.";
        } else if (errorCode === 'auth/invalid-email') {
            errorMessage = "El formato del correo electrónico no es válido.";
        }
        
        toast({
          variant: "destructive",
          title: "Error en la Operación",
          description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (isFetchingData) {
      return (
          <AppLayout>
              <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
          </AppLayout>
      )
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-800 flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8" /> {isEditMode ? 'Editar Restaurante' : 'Registrar Restaurante'}
          </h1>
          <p className="text-gray-600">{isEditMode ? 'Modifique la información del restaurante.' : 'Añada un nuevo restaurante y su administrador al sistema.'}</p>
        </div>
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
        </Button>
      </div>
      <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
        <CardHeader>
          <CardTitle>Información del Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="restaurantName" className="text-gray-700">Nombre del Restaurante</Label>
                    <Input id="restaurantName" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} placeholder="Ej: Tacos El Sol" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="socialReason" className="text-gray-700">Razón Social</Label>
                    <Input id="socialReason" name="socialReason" value={formData.socialReason} onChange={handleInputChange} placeholder="Ej: Tacos El Sol S.A. de C.V." className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="style" className="text-gray-700">Estilo</Label>
                <Select name="style" value={formData.style} onValueChange={(value) => handleSelectChange('style', value)}>
                    <SelectTrigger className="bg-white/50 border-gray-300 placeholder:text-gray-500">
                        <SelectValue placeholder="Seleccione un estilo" />
                    </SelectTrigger>
                    <SelectContent>
                        {restaurantStyles.map(style => <SelectItem key={style} value={style}>{style}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700">Dirección</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Ej: Av. Principal 123, Colonia Centro" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="municipality" className="text-gray-700">Municipio o Alcaldía</Label>
                    <Input id="municipality" name="municipality" value={formData.municipality} onChange={handleInputChange} placeholder="Ej: Cuauhtémoc" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-700">Estado</Label>
                    <Select name="state" value={formData.state} onValueChange={(value) => handleSelectChange('state', value)}>
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

            <h3 className="text-lg font-semibold text-gray-800">Información de Contacto {isEditMode ? '' : '(Administrador)'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">Teléfono {isEditMode ? '' : '(será la contraseña)'}</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="Mínimo 6 dígitos" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Correo Electrónico {isEditMode ? '' : '(será el usuario)'}</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Ej: admin@tacoselsol.com" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required disabled={isEditMode} />
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="rfc" className="text-gray-700">RFC</Label>
                <Input id="rfc" name="rfc" value={formData.rfc} onChange={handleInputChange} placeholder="Ej: SOLT850101XXX" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-lg" disabled={isLoading}>
                 {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditMode ? 'Guardando...' : 'Registrando...'}
                    </>
                    ) : (
                    <>
                      {isEditMode && <Save className="mr-2 h-4 w-4" />}
                      {isEditMode ? 'Guardar Cambios' : 'Registrar Restaurante'}
                    </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
