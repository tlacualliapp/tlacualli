
'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Loader2, Beer, CircleDollarSign, ConciergeBell, ShoppingBag, Send } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
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

interface Order {
    id: string;
    tableId: string;
    status: 'open' | 'preparing' | 'paid';
}

interface UserAssignments {
    tables: string[];
}

export default function OrdersPage() {
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userAssignments, setUserAssignments] = useState<UserAssignments | null>(null);
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tablesByRoom, setTablesByRoom] = useState<{ [roomId: string]: Table[] }>({});
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [view, setView] = useState<'table_map' | 'menu' | 'order_summary'>('table_map');

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
      collection(db, "orders"),
      where("restaurantId", "==", restaurantId),
      where("status", "in", ["open", "preparing"])
    );
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setActiveOrders(ordersData);
    });
    return () => unsubscribeOrders();
  }, [restaurantId]);

  // Effect to fetch rooms and tables
  useEffect(() => {
    if (!restaurantId) return;
    setIsLoading(true);

    const roomsRef = collection(db, `restaurantes/${restaurantId}/rooms`);
    const unsubscribeRooms = onSnapshot(roomsRef, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)).sort((a,b) => a.name.localeCompare(b.name));
      setRooms(roomsData);

      if (roomsData.length === 0) {
        setIsLoading(false);
        return;
      }

      let activeSubscriptions = 0;
      const newTablesByRoom: { [roomId: string]: Table[] } = {};

      roomsData.forEach(room => {
        const tablesRef = collection(db, `restaurantes/${restaurantId}/rooms/${room.id}/tables`);
        onSnapshot(tablesRef, (tableSnapshot) => {
          const tablesData = tableSnapshot.docs.map(doc => ({
              id: doc.id,
              roomId: room.id,
              ...doc.data()
          } as Table)).sort((a, b) => a.name.localeCompare(b.name));
          
          newTablesByRoom[room.id] = tablesData;
          activeSubscriptions++;

          if (activeSubscriptions === roomsData.length) {
              setTablesByRoom(newTablesByRoom);
              setIsLoading(false);
          }
        });
      });
    });

    return () => unsubscribeRooms();
  }, [restaurantId]);


 const getTableWithStatus = (table: Table): Table => {
    const activeOrder = activeOrders.find(o => o.tableId === table.id);
    if (activeOrder) {
      return { ...table, status: activeOrder.status as 'open' | 'preparing' };
    }
    // TODO: This doesn't account for reserved or dirty, as that logic is not implemented yet.
    return { ...table, status: 'available' };
  };

  const handleTableClick = (table: Table) => {
    const tableWithStatus = getTableWithStatus(table);
    setSelectedTable(tableWithStatus);
    if (tableWithStatus.status === 'open' || tableWithStatus.status === 'preparing') {
      setView('order_summary');
    } else {
      setView('table_map'); 
    }
  };
  
  const handleStartNewOrder = async () => {
    if (!selectedTable || !restaurantId) return;
    
    // Double check if an order already exists for this table
    const existingOrder = activeOrders.find(o => o.tableId === selectedTable.id);
    if (existingOrder) {
        toast({
            variant: 'destructive',
            title: t('Error'),
            description: t('An active order already exists for this table.'),
        });
        return;
    }

    try {
        await addDoc(collection(db, 'orders'), {
            tableId: selectedTable.id,
            tableName: selectedTable.name,
            restaurantId: restaurantId,
            status: 'open',
            items: [],
            subtotal: 0,
            createdAt: serverTimestamp(),
            createdBy: user?.uid,
        });

        setView('menu');
        toast({
            title: t('Order Started'),
            description: `${t('Table')} ${selectedTable.name} ${t('is now occupied.')}`
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
      setView('table_map');
  }

  const handleTakeoutOrder = () => {
    toast({
        title: t('Takeout Order'),
        description: t('Functionality to register takeout orders coming soon.')
    })
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
    
    if (view === 'menu' && restaurantId) {
        return <MenuSelection restaurantId={restaurantId} table={selectedTable} onBack={() => setView('order_summary')} />;
    }

    if (view === 'order_summary' && restaurantId) {
        return <OrderDetails restaurantId={restaurantId} table={selectedTable} onAddItems={() => setView('menu')} onOrderClosed={handleOrderClosed} />;
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
                        }
                    )}></span>
                    <span className={cn(
                        "relative inline-flex rounded-full h-3 w-3",
                         {
                            'bg-green-500': status === 'available',
                            'bg-red-500': status === 'open',
                            'bg-purple-500': status === 'preparing',
                         }
                    )}></span>
                </span>
                <span className="capitalize text-muted-foreground">
                    {status === 'open' ? t('Occupied') : t(status)}
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
                        </div>
                    )}
                    {(status === 'open' || status === 'preparing') && 
                        <Button size="lg" variant="outline" onClick={() => setView('order_summary')}>{t('View Order')}</Button>
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
                 <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                          <ClipboardList className="h-8 w-8" /> {t('Order Management')}
                      </CardTitle>
                      <CardDescription>
                          {t('Select a table to start an order or manage an existing one.')}
                      </CardDescription>
                    </div>
                     <Button variant="outline" onClick={handleTakeoutOrder}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        {t('Register Takeout Order')}
                    </Button>
                  </CardHeader>
                <CardContent className="h-[calc(100vh-220px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : rooms.length > 0 ? (
                        <Tabs defaultValue={rooms.find(r => (tablesByRoom[r.id] || []).length > 0)?.id || rooms[0].id} className="h-full flex flex-col">
                            <TabsList>
                                {rooms.map(room => {
                                   const filteredTables = (tablesByRoom[room.id] || []).filter(table =>
                                        userAssignments?.tables.length ? userAssignments.tables.includes(table.id) : true
                                    );
                                    return filteredTables.length > 0 ? (
                                        <TabsTrigger key={room.id} value={room.id}>{room.name}</TabsTrigger>
                                    ) : null;
                                })}
                            </TabsList>
                            {rooms.map(room => {
                                const filteredTables = (tablesByRoom[room.id] || []).filter(table =>
                                    userAssignments?.tables.length ? userAssignments.tables.includes(table.id) : true
                                );

                                if (filteredTables.length === 0) return <TabsContent key={room.id} value={room.id}></TabsContent>;

                                return (
                                <TabsContent key={room.id} value={room.id} className="flex-grow bg-muted/50 rounded-b-lg overflow-auto p-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                    ) : (
                         <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>{t('No areas have been configured. Please go to the Digital Map in the admin dashboard.')}</p>
                        </div>
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
