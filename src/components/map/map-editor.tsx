
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { Toolbar } from './toolbar';
import { TableItem, Table } from './table-item';

export interface Room {
  id: string;
  name: string;
}

interface MapEditorProps {
  restaurantId: string;
}

export const ItemTypes = {
  TABLE: 'table',
};

export const MapEditor = ({ restaurantId }: MapEditorProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<{ [roomId: string]: Table[] }>({});
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const roomsRef = collection(db, `restaurantes/${restaurantId}/rooms`);
    const unsubscribeRooms = onSnapshot(roomsRef, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
      if (roomsData.length > 0 && !activeRoom) {
        setActiveRoom(roomsData[0].id);
      }
      setIsLoading(false);
    });

    return () => unsubscribeRooms();
  }, [restaurantId, activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;

    const tablesRef = collection(db, `restaurantes/${restaurantId}/rooms/${activeRoom}/tables`);
    const unsubscribeTables = onSnapshot(tablesRef, (snapshot) => {
      const tablesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
      setTables(prev => ({ ...prev, [activeRoom]: tablesData }));
    });

    return () => unsubscribeTables();
  }, [restaurantId, activeRoom]);

  const moveTable = async (id: string, left: number, top: number) => {
    const tableRef = doc(db, `restaurantes/${restaurantId}/rooms/${activeRoom}/tables`, id);
    await updateDoc(tableRef, { left, top });
  };

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.TABLE,
    drop(item: Table, monitor) {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;
      const left = Math.round(item.left + delta.x);
      const top = Math.round(item.top + delta.y);
      moveTable(item.id, left, top);
      return undefined;
    },
  }), [moveTable]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }
  
  return (
    <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col h-full">
            <Toolbar restaurantId={restaurantId} rooms={rooms} activeRoom={activeRoom} setActiveRoom={setActiveRoom} />
            <div className="flex-grow relative" ref={drop}>
                {rooms.map(room => (
                    <div key={room.id} style={{ display: activeRoom === room.id ? 'block' : 'none' }} className="w-full h-full">
                         {(tables[room.id] || []).map(table => (
                            <TableItem key={table.id} {...table} />
                        ))}
                    </div>
                ))}
                {rooms.length === 0 && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Crea una sala para empezar a añadir mesas.</p>
                    </div>
                )}
            </div>
        </div>
    </DndProvider>
  );
};
