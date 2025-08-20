
'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import '@/app/i18n';
import { TableItem, Table } from '@/components/map/table-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Room {
  id: string;
  name: string;
}

export default function OrdersPage() {
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<{ [roomId: string]: Table[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setRestaurantId(userData.restauranteId);
        } else {
            const legacyQ = query(collection(db, "usuarios"), where("email", "==", user.email));
            const legacySnapshot = await getDocs(legacyQ);
            if(!legacySnapshot.empty) {
                setRestaurantId(legacySnapshot.docs[0].data().restauranteId);
            }
        }
      }
    };
    fetchRestaurantId();
  }, [user]);

  useEffect(() => {
    if (!restaurantId) return;

    setIsLoading(true);
    const roomsRef = collection(db, `restaurantes/${restaurantId}/rooms`);
    const unsubscribeRooms = onSnapshot(roomsRef, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);

      if (roomsData.length === 0) {
        setIsLoading(false);
      } else if (roomsData.length > 0 && !rooms.find(r => r.id === roomsData[0].id)) { // Prevent unnecessary re-renders
         // Set initial tables data
        roomsData.forEach(room => {
            const tablesRef = collection(db, `restaurantes/${restaurantId}/rooms/${room.id}/tables`);
            onSnapshot(tablesRef, (tableSnapshot) => {
                const tablesData = tableSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
                setTables(prev => ({...prev, [room.id]: tablesData}));
            });
        });
      }
      setIsLoading(false);
    });

    return () => unsubscribeRooms();
  }, [restaurantId]);
  
  useEffect(() => {
    if (!restaurantId || rooms.length === 0) return;

    const unsubscribers = rooms.map(room => {
        const tablesRef = collection(db, `restaurantes/${restaurantId}/rooms/${room.id}/tables`);
        return onSnapshot(tablesRef, (tableSnapshot) => {
            const tablesData = tableSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
            setTables(prev => ({ ...prev, [room.id]: tablesData }));
        });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [restaurantId, rooms]);


  const handleTableClick = (table: Table) => {
    toast({
        title: t('Table Selected'),
        description: `${t('Table')} ${table.name} ${t('selected for new order.')}`
    });
    // Future logic to show order details will go here
  };


  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-3 h-full">
        {/* Columna Izquierda - Mapa de Mesas */}
        <div className="lg:col-span-2">
            <Card className="h-full">
                 <CardHeader>
                      <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                          <ClipboardList className="h-8 w-8" /> {t('Order Management')}
                      </CardTitle>
                      <CardDescription>
                          {t('Select a table to start an order or manage an existing one.')}
                      </CardDescription>
                  </CardHeader>
                <CardContent className="h-[calc(100vh-220px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : rooms.length > 0 ? (
                        <Tabs defaultValue={rooms[0].id} className="h-full flex flex-col">
                            <TabsList>
                                {rooms.map(room => (
                                    <TabsTrigger key={room.id} value={room.id}>{room.name}</TabsTrigger>
                                ))}
                            </TabsList>
                            {rooms.map(room => (
                                <TabsContent key={room.id} value={room.id} className="flex-grow bg-muted/50 rounded-b-lg overflow-auto p-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {(tables[room.id] || []).map(table => (
                                            <TableItem 
                                                key={table.id}
                                                {...table}
                                                onClick={() => handleTableClick(table)}
                                                view="operational"
                                                // onDelete and onEdit are not needed in operational view
                                                onDelete={() => {}} 
                                                onEdit={() => {}}
                                            />
                                        ))}
                                    </div>
                                    {(!tables[room.id] || tables[room.id].length === 0) && (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <p>{t('No tables in this area.')}</p>
                                        </div>
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                         <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>{t('No areas have been configured. Please go to the Digital Map in the admin dashboard.')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        {/* Columna Derecha - Detalles de la Orden */}
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {t('Order Details')}
                    </CardTitle>
                    <CardDescription>{t('Items and totals for the selected table will appear here.')}</CardDescription>
                </CardHeader>
                <CardContent className="h-[calc(100vh-220px)] flex items-center justify-center text-muted-foreground">
                    <p>{t('Select a table to begin.')}</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
