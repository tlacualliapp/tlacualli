
'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Loader2, Beer, CircleDollarSign, ConciergeBell } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import '@/app/i18n';
import { TableItem, Table } from '@/components/map/table-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { OrderDetails } from '@/components/orders/order-details';
import { MenuSelection } from '@/components/orders/menu-selection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


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
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [view, setView] = useState<'table_map' | 'menu' | 'order_summary'>('table_map');

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
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)).sort((a,b) => a.name.localeCompare(b.name));
      setRooms(roomsData);

      if (roomsData.length === 0) {
        setIsLoading(false);
      }
    });

    return () => unsubscribeRooms();
  }, [restaurantId]);
  
  useEffect(() => {
    if (!restaurantId || rooms.length === 0) return;

    const unsubscribers = rooms.map(room => {
        const tablesRef = collection(db, `restaurantes/${restaurantId}/rooms/${room.id}/tables`);
        return onSnapshot(tablesRef, (tableSnapshot) => {
            const tablesData = tableSnapshot.docs.map(doc => ({ id: doc.id, roomId: room.id, ...doc.data() } as Table)).sort((a,b) => a.name.localeCompare(b.name));
            setTables(prev => ({ ...prev, [room.id]: tablesData }));
            
            if(selectedTable && selectedTable.roomId === room.id){
                const updatedSelectedTable = tablesData.find(t => t.id === selectedTable.id);
                if(updatedSelectedTable) {
                    setSelectedTable(updatedSelectedTable);
                }
            }
        });
    });

    setIsLoading(false);

    return () => unsubscribers.forEach(unsub => unsub());
  }, [restaurantId, rooms, selectedTable]);


  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    if (table.status === 'occupied' || table.status === 'billing') {
        setView('order_summary');
    } else {
        setView('table_map'); // Stay on map, but show details on the right
    }
  };
  
  const handleStartNewOrder = async () => {
    if (!selectedTable || !restaurantId) return;
    
    // Set table status to occupied
    try {
        const tableRef = doc(db, `restaurantes/${restaurantId}/rooms/${selectedTable.roomId}/tables`, selectedTable.id);
        await updateDoc(tableRef, { status: 'occupied' });
        setView('menu');
        toast({
            title: t('Order Started'),
            description: `${t('Table')} ${selectedTable.name} ${t('is now occupied.')}`
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: t('Error'),
            description: t('Could not update table status.'),
        });
    }
  };

  const renderRightPanel = () => {
    if (!selectedTable) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <ConciergeBell className="h-16 w-16 mb-4" />
                <p className="text-lg font-semibold">{t('Select a table to begin.')}</p>
                <p className="text-sm">{t('Click on a table on the left to see its details or start a new order.')}</p>
            </div>
        );
    }
    
    if (view === 'menu' && restaurantId) {
        return <MenuSelection restaurantId={restaurantId} table={selectedTable} onBack={() => setView('order_summary')} />;
    }

    if (view === 'order_summary' && restaurantId) {
        return <OrderDetails restaurantId={restaurantId} table={selectedTable} onAddItems={() => setView('menu')} />;
    }

    // Default view when a table is selected but no order is active
    return (
        <div className="p-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold font-headline mb-2">{t('Table')} {selectedTable.name}</h2>
            <div className="flex items-center gap-2 mb-6">
                <span className="relative flex h-3 w-3">
                    <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        {
                            'bg-green-400': selectedTable.status === 'available',
                            'bg-red-400': selectedTable.status === 'occupied',
                            'bg-yellow-400': selectedTable.status === 'reserved',
                            'bg-blue-400': selectedTable.status === 'billing',
                            'bg-orange-400': selectedTable.status === 'dirty',
                        }
                    )}></span>
                    <span className={cn(
                        "relative inline-flex rounded-full h-3 w-3",
                         {
                            'bg-green-500': selectedTable.status === 'available',
                            'bg-red-500': selectedTable.status === 'occupied',
                            'bg-yellow-500': selectedTable.status === 'reserved',
                            'bg-blue-500': selectedTable.status === 'billing',
                            'bg-orange-500': selectedTable.status === 'dirty',
                        }
                    )}></span>
                </span>
                <span className="capitalize text-muted-foreground">{t(selectedTable.status)}</span>
            </div>

            <div className="flex-grow flex items-center justify-center">
                 <div className="text-center">
                    { (selectedTable.status === 'available' || selectedTable.status === 'reserved' || selectedTable.status === 'dirty') && (
                       <div className="flex flex-col items-center gap-4">
                            <Beer className="h-20 w-20 text-primary/50" />
                            <p className="text-muted-foreground">{t('This table is ready for a new order.')}</p>
                            <Button size="lg" className="bg-accent hover:bg-accent/90" onClick={handleStartNewOrder}>
                                {t('Start New Order')}
                            </Button>
                        </div>
                    )}
                    { selectedTable.status === 'occupied' && <p>{t('Order in progress. View summary.')}</p> }
                    { selectedTable.status === 'billing' && (
                        <div className="flex flex-col items-center gap-4">
                            <CircleDollarSign className="h-20 w-20 text-primary/50" />
                            <p className="text-muted-foreground">{t('This table is pending payment.')}</p>
                            <Button size="lg" variant="outline" onClick={() => setView('order_summary')}>
                                {t('View Account')}
                            </Button>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
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
                                                isSelected={selectedTable?.id === table.id}
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
            <Card className="h-full">
                {renderRightPanel()}
            </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
