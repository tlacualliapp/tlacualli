
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Utensils, ImageOff } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  status?: 'active' | 'inactive';
}

interface Category {
  id: string;
  name: string;
}

async function getRestaurantDoc(restaurantId: string): Promise<any> {
    const prodRef = doc(db, 'restaurantes', restaurantId);
    const prodSnap = await getDoc(prodRef);

    if (prodSnap.exists()) {
        return prodSnap;
    }

    const demoRef = doc(db, 'restaurantes_demo', restaurantId);
    const demoSnap = await getDoc(demoRef);

    if (demoSnap.exists()) {
        return demoSnap;
    }

    return null;
}


function MenuDisplay() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [iconUrl, setIconUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setError("No se ha proporcionado un ID de restaurante.");
      setIsLoading(false);
      return;
    }

    const fetchRestaurantData = async () => {
        const restaurantDoc = await getRestaurantDoc(restaurantId);

        if (restaurantDoc && restaurantDoc.exists()) {
            const data = restaurantDoc.data();
            setRestaurantName(data.restaurantName || 'Menú');
            setLogoUrl(data.logoUrl || '');
            setIconUrl(data.iconUrl || '');
            
            const collectionName = restaurantDoc.ref.parent.id; // 'restaurantes' or 'restaurantes_demo'

            // Listen for categories
            const categoriesQuery = query(collection(db, `${collectionName}/${restaurantId}/menuCategories`));
            const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
              setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
            }, () => setError("Error al cargar las categorías."));

            // Listen for active menu items
            const itemsQuery = query(
                collection(db, `${collectionName}/${restaurantId}/menuItems`),
                where('status', '==', 'active')
            );
            const unsubItems = onSnapshot(itemsQuery, (snapshot) => {
              setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
              setIsLoading(false);
            }, () => {
                setError("Error al cargar los platillos.");
                setIsLoading(false);
            });
            
            return () => {
                unsubCategories();
                unsubItems();
            };

        } else {
            setError("Restaurante no encontrado.");
            setIsLoading(false);
        }
    }
    
    fetchRestaurantData();

  }, [restaurantId]);

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mb-4" /><p>Cargando menú...</p></div>;
  }
  
  if (error) {
    return <div className="flex flex-col items-center justify-center h-full text-destructive"><p>{error}</p></div>;
  }

  return (
    <div className="bg-card/80 backdrop-blur-lg rounded-3xl shadow-lg h-full overflow-hidden flex flex-col text-card-foreground">
        <div className="p-4 border-b border-white/10 text-center">
            {(logoUrl || iconUrl) && (
              <div className="mb-4 flex justify-center">
                <Image 
                  src={logoUrl || iconUrl} 
                  alt={`${restaurantName} logo`} 
                  width={120} 
                  height={120} 
                  className="max-h-24 w-auto object-contain"
                  data-ai-hint="logo restaurant"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold font-headline">{restaurantName}</h1>
        </div>
      {categories.length > 0 ? (
        <Tabs defaultValue={categories[0].id} className="flex-grow flex flex-col font-body">
          <div className="p-4">
             <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex">
                {categories.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <div className="flex-grow overflow-y-auto px-4 pb-4">
            {categories.map(cat => (
              <TabsContent key={cat.id} value={cat.id} className="mt-0">
                 <h2 className="text-2xl font-bold mb-4 font-headline">{cat.name}</h2>
                 <div className="space-y-4">
                    {menuItems.filter(item => item.categoryId === cat.id).map(item => (
                        <Card key={item.id} className="bg-transparent border-0 shadow-none">
                            <CardContent className="p-0 flex gap-4">
                                <div className="flex-grow">
                                    <h3 className="font-bold text-base">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                    <p className="font-semibold mt-2">${item.price.toFixed(2)} MXN</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground p-8">
            <Utensils className="h-12 w-12 mb-4" />
            <p className="text-lg">Este restaurante aún no tiene un menú configurado.</p>
        </div>
      )}
    </div>
  );
}

export default function MenuReadOnlyPage() {
    return (
        <div 
            className="relative flex items-center justify-center min-h-screen p-4 bg-cover bg-center"
            style={{ backgroundImage: "url('/assets/background.png')" }}
        >
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative z-10 w-full max-w-sm h-[85vh] max-h-[900px]">
                <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                    <MenuDisplay />
                </Suspense>
            </div>
        </div>
    )
}
