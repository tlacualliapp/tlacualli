
'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Loader2, Beer, CircleDollarSign, ConciergeBell, ShoppingBag, Send } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { TableItem, Table } from '@/components/map/table-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { OrderDetails } from '@/components/orders/order-details';
import { MenuSelection } from '@/components/orders/menu-selection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getNextTakeoutId } from '@/lib/counters';


interface Room {
  id: string;
  name: string;
}

interface SubAccount {
  id: string;
  name: string;
}

interface Order {
    id: string;
    tableId?: string;
    status: 'open' | 'preparing' | 'paid' | 'ready_for_pickup' | 'served';
    type?: 'dine-in' | 'takeout';
    takeoutId?: string;
    sentToKitchenAt?: Timestamp;
    subaccounts: SubAccount[];
}

interface UserAssignments {
    tables: string[];
}

export default function OrdersPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userAssignments, setUserAssignments] = useState<UserAssignments | null>(null);
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tablesByRoom, setTablesByRoom] = useState<{ [roomId: string]: Table[] }>({});
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [takeoutOrders, setTakeoutOrders] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [view, setView] = useState<'table_map' | 'menu' | 'order_summary'>('table_map');
  const [elapsedTimes, setElapsedTimes] = useState<{ [orderId: string]: string }>({});
  const [activeSubAccountId, setActiveSubAccountId] = useState<string>('main');

  useEffect(() => {
    // This is a temporary fix to ensure the page loads in spanish by default
    const lang = i18n.language;
    if (lang !== 'es' && !localStorage.getItem('i18nextLng')) {
        i18n.changeLanguage('es');
    }
  }, [i18n]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setRestaurantId(userData.restauranteId);
          setUserAssignments(userData.assignments || { tables: [] });
        } else {
            const legacyQ = query(collection(db, "usuarios"), where("email", "==", user.email));
            const legacySnapshot = await getDocs(legacyQ);
            if(!legacySnapshot.empty) {
                const legacyUserData = legacySnapshot.docs[0].data();
                setRestaurantId(legacyUserData.restauranteId);
                setUserAssignments(legacyUserData.assignments || { tables: [] });
            }
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Effect to fetch active orders
  useEffect(() => {
    if (!restaurantId) return;
    const ordersQuery = query(
      collection(db, `restaurantes/${restaurantId}/orders`),
      where("status", "in", ["open", "preparing", "ready_for_pickup", "served"])
    );
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setActiveOrders(ordersData);
        
        const currentTakeoutOrders = ordersData
          .filter(o => o.type === 'takeout' && o.takeoutId)
          .map(o => ({
            id: o.id, // The order ID is used as the table ID for takeouts
            name: o.takeoutId!,
            shape: 'square', // Represent takeout as a square
            status: o.status as 'open' | 'preparing' | 'ready_for_pickup' | 'served',
            top: 0, left: 0, seats: 0,
            isTakeout: true,
          } as Table));
        setTakeoutOrders(currentTakeoutOrders);
    });
    return () => unsubscribeOrders();
  }, [restaurantId]);

  // Effect to fetch rooms and tables
    useEffect(() => {
        if (!restaurantId) return;
        setIsLoading(true);

        const roomsRef = collection(db, `restaurantes/${restaurantId}/rooms`);
        const unsubscribeRooms = onSnapshot(roomsRef, (snapshot) => {
            const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)).sort((a, b) => a.name.localeCompare(b.name));
            setRooms(roomsData);

            const tableUnsubscribes = roomsData.map(room => {
                const tablesRef = collection(db, `restaurantes/${restaurantId}/rooms/${room.id}/tables`);
                return onSnapshot(tablesRef, (tableSnapshot) => {
                    const tablesData = tableSnapshot.docs.map(tableDoc => ({
                        id: tableDoc.id,
                        roomId: room.id,
                        ...tableDoc.data()
                    } as Table));
                    setTablesByRoom(prev => ({ ...prev, [room.id]: tablesData }));
                });
            });

            if (roomsData.length > 0) {
                 setIsLoading(false);
            }

            return () => tableUnsubscribes.forEach(unsub => unsub());
        });

        return () => unsubscribeRooms();
    }, [restaurantId]);

   useEffect(() => {
    const timerInterval = setInterval(() => {
      const newElapsedTimes: { [orderId: string]: string } = {};
      activeOrders.forEach(order => {
        if (order.status === 'preparing' && order.sentToKitchenAt) {
          const sentTime = order.sentToKitchenAt.toDate().getTime();
          const now = new Date().getTime();
          const difference = now - sentTime;
          const minutes = String(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
          const seconds = String(Math.floor((difference % (1000 * 60)) / 1000)).padStart(2, '0');
          newElapsedTimes[order.id] = `${minutes}:${seconds}`;
        }
      });
      setElapsedTimes(newElapsedTimes);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [activeOrders]);


 const getTableWithStatus = (table: Table): Table => {
    if (table.isTakeout) {
        const activeOrder = activeOrders.find(o => o.id === table.id);
        const elapsedTime = activeOrder ? elapsedTimes[activeOrder.id] : undefined;
        return { ...table, status: activeOrder?.status, elapsedTime };
    }
    const activeOrder = activeOrders.find(o => o.tableId === table.id && o.type !== 'takeout');
    const dbStatus = table.status;
    const elapsedTime = activeOrder ? elapsedTimes[activeOrder.id] : undefined;

    if (activeOrder) {
      return { ...table, status: activeOrder.status as 'open' | 'preparing' | 'ready_for_pickup' | 'served', elapsedTime };
    }
    
    if (dbStatus && ['dirty', 'reserved'].includes(dbStatus)) {
        return { ...table, status: dbStatus };
    }

    return { ...table, status: 'available' };
  };
  
   const handleSetTableStatus = async (table: Table, status: 'available' | 'dirty' | 'reserved') => {
      if (!restaurantId || !table.roomId) return;
      const tableRef = doc(db, `restaurantes/${restaurantId}/rooms/${table.roomId}/tables`, table.id);
      try {
        await updateDoc(tableRef, { status });
        toast({ title: t('Status Updated'), description: t('Table {{tableName}} is now {{status}}.', { tableName: table.name, status: t(status) })});
        if (selectedTable && selectedTable.id === table.id) {
          setSelectedTable(prev => prev ? ({ ...prev, status }) : null);
        }
      } catch (error) {
         toast({ variant: 'destructive', title: t('Error'), description: t('Could not update table status.') });
      }
    }


  const handleTableClick = (table: Table) => {
    const tableWithStatus = getTableWithStatus(table);
    setSelectedTable(tableWithStatus);
    const activeOrder = activeOrders.find(o => (o.tableId === table.id && !table.isTakeout) || (o.id === table.id && table.isTakeout));

    if (activeOrder) {
      setActiveOrderId(activeOrder.id);
      setView('order_summary');
    } else {
      setActiveOrderId(null);
      setView('table_map'); 
    }
  };
  
  const handleStartNewOrder = async () => {
    if (!selectedTable || !restaurantId || selectedTable.isTakeout) return;
    
    const existingOrder = activeOrders.find(o => o.tableId === selectedTable.id);
    if (existingOrder) {
        toast({
            variant: 'destructive',
            title: t('Error'),
            description: t('An active order already exists for this table.'),
        });
        setActiveOrderId(existingOrder.id);
        setView('menu');
        return;
    }

    try {
        const newOrderRef = await addDoc(collection(db, `restaurantes/${restaurantId}/orders`), {
            tableId: selectedTable.id,
            tableName: selectedTable.name,
            restaurantId: restaurantId,
            status: 'open',
            type: 'dine-in',
            items: [],
            subtotal: 0,
            subaccounts: [{ id: 'main', name: t('General') }],
            createdAt: serverTimestamp(),
            createdBy: user?.uid,
        });

        setActiveOrderId(newOrderRef.id);
        setActiveSubAccountId('main');
        setView('menu');
        toast({
            title: t('Order Started'),
            description: t('Table {{tableName}} is now occupied.', { tableName: selectedTable.name})
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: t('Error'),
            description: t('Could not start a new order.'),
        });
    }
  };
  
  const handleOrderClosed = () => {
      setSelectedTable(null);
      setActiveOrderId(null);
      setView('table_map');
  }

  const handleTakeoutOrder = async () => {
    if (!restaurantId) return;

    try {
        const newTakeoutId = await getNextTakeoutId(restaurantId);
        
        const newOrder = {
            restaurantId: restaurantId,
            status: 'open',
            type: 'takeout',
            takeoutId: newTakeoutId,
            items: [],
            subtotal: 0,
            subaccounts: [{ id: 'main', name: t('General') }],
            createdAt: serverTimestamp(),
            createdBy: user?.uid,
        };

        const docRef = await addDoc(collection(db, `restaurantes/${restaurantId}/orders`), newOrder);

        const newTakeoutAsTable: Table = {
            id: docRef.id,
            name: newTakeoutId,
            shape: 'square',
            status: 'open',
            top: 0, left: 0, seats: 0,
            isTakeout: true,
        };
        
        setSelectedTable(newTakeoutAsTable);
        setActiveOrderId(docRef.id);
        setActiveSubAccountId('main');
        setView('menu');

        toast({
            title: t('Takeout Order Created'),
            description: t('Order #{{takeoutId}} has been created.', { takeoutId: newTakeoutId})
        });

    } catch (error) {
        console.error("Error creating takeout order: ", error);
        toast({
            variant: 'destructive',
            title: t('Error'),
            description: t('Could not create takeout order.'),
        });
    }
  }

  const handleGoToMenu = (subAccountId: string) => {
    setActiveSubAccountId(subAccountId);
    setView('menu');
  }
  
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }
  
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
    
    if (view === 'menu' && restaurantId && activeOrderId) {
        return <MenuSelection restaurantId={restaurantId} orderId={activeOrderId} tableName={selectedTable.name} onBack={() => setView('order_summary')} subAccountId={activeSubAccountId} />;
    }

    if (view === 'order_summary' && restaurantId && activeOrderId) {
        return <OrderDetails restaurantId={restaurantId} orderId={activeOrderId} tableName={selectedTable.name} onAddItems={handleGoToMenu} onOrderClosed={handleOrderClosed} />;
    }

    // Default view for a selected table
    const tableWithStatus = getTableWithStatus(selectedTable);
    const status = tableWithStatus.status;

    return (
        <div className="p-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold font-headline mb-2">{t('Table')} {selectedTable.name}</h2>
            <div className="flex items-center gap-2 mb-6">
                <span className="relative flex h-3 w-3">
                    <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        {
                            'bg-green-400': status === 'available',
                            'bg-red-400': status === 'open',
                            'bg-purple-400': status === 'preparing',
                            'bg-blue-400': status === 'served',
                            'bg-cyan-400': status === 'ready_for_pickup',
                            'bg-orange-400': status === 'dirty',
                            'bg-yellow-400': status === 'reserved',
                        }
                    )}></span>
                    <span className={cn(
                        "relative inline-flex rounded-full h-3 w-3",
                         {
                            'bg-green-500': status === 'available',
                            'bg-red-500': status === 'open',
                            'bg-purple-500': status === 'preparing',
                             'bg-blue-500': status === 'served',
                            'bg-cyan-500': status === 'ready_for_pickup',
                            'bg-orange-500': status === 'dirty',
                            'bg-yellow-500': status === 'reserved',
                         }
                    )}></span>
                </span>
                <span className="capitalize text-muted-foreground">
                    {status === 'open' ? t('Occupied') : t(status || 'available')}
                </span>
            </div>

            <div className="flex-grow flex items-center justify-center">
                 <div className="text-center">
                    {status === 'available' && (
                       <div className="flex flex-col items-center gap-4">
                            <Beer className="h-20 w-20 text-primary/50" />
                            <p className="text-muted-foreground">{t('This table is ready for a new order.')}</p>
                            <Button size="lg" className="bg-accent hover:bg-accent/90" onClick={handleStartNewOrder}>
                                {t('Start New Order')}
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleSetTableStatus(selectedTable, 'reserved')}>{t('Mark as Reserved')}</Button>
                                <Button variant="outline" onClick={() => handleSetTableStatus(selectedTable, 'dirty')}>{t('Mark as Dirty')}</Button>
                            </div>
                        </div>
                    )}
                    {(status === 'open' || status === 'preparing' || status === 'ready_for_pickup' || status === 'served') && 
                        <Button size="lg" variant="outline" onClick={() => setView('order_summary')}>{t('View Order')}</Button>
                    }
                    {(status === 'dirty' || status === 'reserved') &&
                        <div className="flex flex-col items-center gap-4">
                            <p>{t('This table is currently')} <span className="font-bold">{t(status)}</span>.</p>
                            <Button size="lg" onClick={() => handleSetTableStatus(selectedTable, 'available')}>{t('Mark as Available')}</Button>
                        </div>
                    }
                 </div>
            </div>
        </div>
    );
};


  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-3 h-full">
        <div className="lg:col-span-2">
            <Card className="h-full">
                 <CardHeader className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                    <div>
                      <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                          <ClipboardList className="h-8 w-8" /> {t('Order Management')}
                      </CardTitle>
                      <CardDescription>
                          {t('Select a table to start an order or manage an existing one.')}
                      </CardDescription>
                    </div>
                     <Button variant="outline" onClick={handleTakeoutOrder} className="w-full md:w-auto">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        {t('Register Takeout Order')}
                    </Button>
                  </CardHeader>
                <CardContent className="h-[calc(100vh-220px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Tabs defaultValue={(rooms.find(r => (tablesByRoom[r.id] || []).length > 0) || rooms[0])?.id || 'takeout'} className="h-full flex flex-col">
                            <TabsList>
                                 <TabsTrigger value="takeout">{t('Takeout')}</TabsTrigger>
                                {rooms.map(room => {
                                   const filteredTables = (tablesByRoom[room.id] || []).filter(table =>
                                        userAssignments?.tables.length ? userAssignments.tables.includes(table.id) : true
                                    );
                                    return filteredTables.length > 0 ? (
                                        <TabsTrigger key={room.id} value={room.id}>{room.name}</TabsTrigger>
                                    ) : null;
                                })}
                            </TabsList>

                            <TabsContent value="takeout" className="flex-grow bg-muted/50 rounded-b-lg overflow-auto p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {takeoutOrders.map(order => (
                                         <TableItem 
                                            key={order.id}
                                            {...getTableWithStatus(order)}
                                            onClick={() => handleTableClick(order)}
                                            isSelected={selectedTable?.id === order.id}
                                            view="operational"
                                            onDelete={() => {}} 
                                            onEdit={() => {}}
                                        />
                                    ))}
                                </div>
                                {takeoutOrders.length === 0 && (
                                     <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <p>{t('No active takeout orders.')}</p>
                                    </div>
                                )}
                            </TabsContent>

                            {rooms.map(room => {
                                const filteredTables = (tablesByRoom[room.id] || []).filter(table =>
                                    userAssignments?.tables.length ? userAssignments.tables.includes(table.id) : true
                                );

                                if (filteredTables.length === 0 && room.id !== 'takeout') return <TabsContent key={room.id} value={room.id}></TabsContent>;

                                return (
                                <TabsContent key={room.id} value={room.id} className="flex-grow bg-muted/50 rounded-b-lg overflow-auto relative">
                                    <div className="w-full h-full">
                                        {filteredTables.map(table => (
                                            <TableItem 
                                                key={table.id}
                                                {...getTableWithStatus(table)}
                                                onClick={() => handleTableClick(table)}
                                                isSelected={selectedTable?.id === table.id}
                                                view="operational"
                                                onDelete={() => {}} 
                                                onEdit={() => {}}
                                            />
                                        ))}
                                    </div>
                                    {filteredTables.length === 0 && (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <p>{t('No tables assigned to you in this area.')}</p>
                                        </div>
                                    )}
                                </TabsContent>
                                )
                            })}
                        </Tabs>
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card className="h-full">
                {renderRightPanel()}
            </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

    