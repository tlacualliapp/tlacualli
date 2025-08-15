
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';


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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const restaurantData = {
        restaurantName: formData.get('restaurantName') as string,
        socialReason: formData.get('socialReason') as string,
        style: formData.get('style') as string,
        address: formData.get('address') as string,
        municipality: formData.get('municipality') as string,
        state: formData.get('state') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        rfc: formData.get('rfc') as string,
        status: 1,
        fecharegistro: serverTimestamp()
    };
    
    const { restaurantName, phone, email } = restaurantData;

    try {
        // 1. Register restaurant in Firestore
        const restaurantRef = await addDoc(collection(db, "restaurantes"), restaurantData);
        const restaurantId = restaurantRef.id;

        // 2. Register user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, phone);
        const user = userCredential.user;

        // 3. Register user in Firestore "usuarios" collection
        await addDoc(collection(db, "usuarios"), {
            uid: user.uid,
            nombre: "Admin",
            apellidos: restaurantName,
            restauranteId: restaurantId,
            perfil: 1,
            status: 1,
            fecharegistro: serverTimestamp(),
            email,
            telefono: phone
        });
        
        toast({
          title: "Registro Exitoso",
          description: `El restaurante "${restaurantName}" y su usuario administrador han sido registrados.`,
        });
        (e.target as HTMLFormElement).reset();

    } catch (error) {
        console.error("Error en el registro:", error);
        const errorCode = (error as any).code;
        let errorMessage = "Ocurrió un error durante el registro.";

        if (errorCode === 'auth/email-already-in-use') {
            errorMessage = "El correo electrónico ya está en uso por otro administrador.";
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
            <UtensilsCrossed className="h-8 w-8" /> Registrar Restaurante
          </h1>
          <p className="text-gray-600">Añada un nuevo restaurante y su administrador al sistema.</p>
        </div>
      </div>
      <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
        <CardHeader>
          <CardTitle>Información del Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="restaurantName" className="text-gray-700">Nombre del Restaurante</Label>
                    <Input id="restaurantName" name="restaurantName" placeholder="Ej: Tacos El Sol" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="socialReason" className="text-gray-700">Razón Social</Label>
                    <Input id="socialReason" name="socialReason" placeholder="Ej: Tacos El Sol S.A. de C.V." className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="style" className="text-gray-700">Estilo</Label>
                <Select name="style">
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
              <Input id="address" name="address" placeholder="Ej: Av. Principal 123, Colonia Centro" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="municipality" className="text-gray-700">Municipio o Alcaldía</Label>
                    <Input id="municipality" name="municipality" placeholder="Ej: Cuauhtémoc" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-700">Estado</Label>
                    <Select name="state">
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

            <h3 className="text-lg font-semibold text-gray-800">Información de Contacto (Administrador)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">Teléfono (será la contraseña)</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="Mínimo 6 dígitos" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Correo Electrónico (será el usuario)</Label>
                    <Input id="email" name="email" type="email" placeholder="Ej: admin@tacoselsol.com" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="rfc" className="text-gray-700">RFC</Label>
                <Input id="rfc" name="rfc" placeholder="Ej: SOLT850101XXX" className="bg-white/50 border-gray-300 placeholder:text-gray-500" required />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-lg" disabled={isLoading}>
                 {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                    </>
                    ) : (
                    'Registrar Restaurante'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

    