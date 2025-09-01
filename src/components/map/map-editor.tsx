
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useDrop } from 'react-dnd';
import { Loader2 } from 'lucide-react';
import { Toolbar } from './toolbar';
import { TableItem, Table } from './table-item';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableForm } from './table-form';
import { useTranslation } from 'react-i18next';
import { Order } from '@/components/orders/order-details';


export interface Room {
  id: string;
  name: string;
}

interface MapEditorProps {
  restaurantId: string;
  userPlan: string;
  view?: 'admin' | 'operational';
}

export const ItemTypes = {
  TABLE: 'table',
};

export const MapEditor = ({ restaurantId, userPlan, view = 'admin' }: MapEditorProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<{ [roomId: string]: Table[] }>({});
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation();

  const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';

  useEffect(() => {
    const roomsRef = collection(db, `${collectionName}/${restaurantId}/rooms`);
    const unsubscribeRooms = onSnapshot(roomsRef, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
      if (roomsData.length > 0 && !activeRoom) {
        setActiveRoom(roomsData[0].id);
      }
      setIsLoading(false);
    });

    const ordersQuery = query(
      collection(db, `${collectionName}/${restaurantId}/orders`),
      where("status", "in", ["open", "preparing", "ready_for_pickup", "served"])
    );
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setActiveOrders(ordersData);
    });


    return () => {
        unsubscribeRooms();
        unsubscribeOrders();
    }
  }, [restaurantId, collectionName, activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;

    const tablesRef = collection(db, `${collectionName}/${restaurantId}/rooms/${activeRoom}/tables`);
    const unsubscribeTables = onSnapshot(tablesRef, (snapshot) => {
      const tablesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
      setTables(prev => ({ ...prev, [activeRoom]: tablesData }));
    });

    return () => unsubscribeTables();
  }, [restaurantId, collectionName, activeRoom]);
  
  const getTableWithStatus = (table: Table): Table => {
    const activeOrder = activeOrders.find(o => o.tableId === table.id && o.type !== 'takeout');
    const dbStatus = table.status;

    if (activeOrder) {
      return { ...table, status: activeOrder.status as 'open' | 'preparing' | 'ready_for_pickup' | 'served' };
    }
    
    if (dbStatus && ['dirty', 'reserved'].includes(dbStatus)) {
        return { ...table, status: dbStatus };
    }

    return { ...table, status: 'available' };
  };

  const moveTable = async (id: string, left: number, top: number) => {
    if (view !== 'admin' || !activeRoom) return;
    const tableRef = doc(db, `${collectionName}/${restaurantId}/rooms/${activeRoom}/tables`, id);
    await updateDoc(tableRef, { left, top });
  };
  
  const deleteTable = async (id: string) => {
    if (!activeRoom) return;
    const tableRef = doc(db, `${collectionName}/${restaurantId}/rooms/${activeRoom}/tables`, id);
    await deleteDoc(tableRef);
    toast({ title: t('Table deleted'), description: t('The table has been removed from the map.') });
  };

  const handleEditTable = (table: Table) => {
    setTableToEdit(table);
    setIsFormOpen(true);
  }

  const handleSaveTable = async (formData: {name: string, seats: number}) => {
    if (!tableToEdit || !activeRoom) return;
    const tableRef = doc(db, `${collectionName}/${restaurantId}/rooms/${activeRoom}/tables`, tableToEdit.id);
    await updateDoc(tableRef, { name: formData.name, seats: formData.seats });
    toast({ title: t('Table updated') });
    setIsFormOpen(false);
    setTableToEdit(null);
  };
  
  const handleTableClick = (table: Table) => {
    if (view === 'operational') {
        console.log(`Table ${table.name} clicked for ordering.`);
        // Here you would typically set the selected table in a global state
        // to show its details in the right-hand column.
        toast({ title: t('Table Selected'), description: `${t('Table')} ${table.name} ${t('selected for new order.')}`})
    }
  }


  const [, drop] = useDrop(() => ({
    accept: ItemTypes.TABLE,
    drop(item: Table, monitor) {
      if (view !== 'admin') return;
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;
      const left = Math.round(item.left + delta.x);
      const top = Math.round(item.top + delta.y);
      moveTable(item.id, left, top);
      return undefined;
    },
  }), [moveTable, activeRoom, view]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }
  
  return (
    <div className="flex flex-col h-full">
        {view === 'admin' && <Toolbar restaurantId={restaurantId} userPlan={userPlan} rooms={rooms} activeRoom={activeRoom} setActiveRoom={setActiveRoom} />}
        <div className="flex-grow relative" ref={drop}>
            {rooms.map(room => (
                <div key={room.id} style={{ display: activeRoom === room.id ? 'block' : 'none' }} className="w-full h-full">
                     {(tables[room.id] || []).map(table => (
                        <TableItem 
                            key={table.id} 
                            {...getTableWithStatus(table)}
                            onDelete={deleteTable} 
                            onEdit={handleEditTable}
                            onClick={() => handleTableClick(table)}
                            view={view}
                        />
                    ))}
                </div>
            ))}
            {rooms.length === 0 && view === 'admin' && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>{t('Create a room to start adding tables.')}</p>
                </div>
            )}
             {rooms.length === 0 && view === 'operational' && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>{t('No tables have been configured. Please go to the Digital Map in the admin dashboard.')}</p>
                </div>
            )}
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Edit Table')}</DialogTitle>
                    <DialogDescription>{t('Modify the name and number of seats for the table.')}</DialogDescription>
                </DialogHeader>
                {tableToEdit && <TableForm table={tableToEdit} onSave={handleSaveTable} onCancel={() => setIsFormOpen(false)} />}
            </DialogContent>
        </Dialog>
    </div>
  );
};

    