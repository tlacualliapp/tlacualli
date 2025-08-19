
'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, CheckCircle, MapPin, Users, Move, Zap } from 'lucide-react';
import { MapEditor } from '@/components/map/map-editor';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';

const features = [
    { text: "Configuración de mapa de salas y mesas", icon: MapPin },
    { text: "Asignación de camareros sobre ventas", icon: Users },
    { text: "Traslado de consumos entre mesas", icon: Move },
    { text: "Mapa de calor de mesas por ventas", icon: Zap }
];

export default function MapPage() {
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setRestaurantId(userData.restauranteId);
        }
      }
    };
    fetchRestaurantId();
  }, [user]);

  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold font-headline">Gestión de Mesas</CardTitle>
                    <CardDescription>
                        Visualiza el layout de tu restaurante, gestiona mesas y asignaciones en tiempo real.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="aspect-video bg-muted/50 border-t relative">
                        {restaurantId ? <MapEditor restaurantId={restaurantId} /> : <p className="p-4">Cargando...</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Funcionalidades</CardTitle>
                    <CardDescription>Características clave del módulo de gestión de mesas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                                <div className="p-1.5 bg-primary/10 rounded-full mr-4">
                                    <CheckCircle className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{feature.text}</h4>
                                    <p className="text-sm text-muted-foreground">Disponible próximamente</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
