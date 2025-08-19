
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Square, Circle, Trash2, Edit } from 'lucide-react';
import { Room } from './map-editor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface ToolbarProps {
    restaurantId: string;
    rooms: Room[];
    activeRoom: string;
    setActiveRoom: (id: string) => void;
}

export const Toolbar = ({ restaurantId, rooms, activeRoom, setActiveRoom }: ToolbarProps) => {
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const { toast } = useToast();

  const addTable = async (shape: 'square' | 'circle') => {
    if (!activeRoom) {
        toast({ variant: 'destructive', title: "Selecciona una sala", description: "Debes seleccionar una sala para añadir una mesa." });
        return;
    }
    const tablesRef = collection(db, `restaurantes/${restaurantId}/rooms/${activeRoom}/tables`);
    await addDoc(tablesRef, {
      name: `M${Math.floor(Math.random() * 100)}`,
      shape: shape,
      status: 'available',
      top: 50,
      left: 50,
    });
  };

  const addRoom = async () => {
    if (!newRoomName.trim()) return;
    const roomsRef = collection(db, `restaurantes/${restaurantId}/rooms`);
    const newRoom = await addDoc(roomsRef, { name: newRoomName, createdAt: serverTimestamp() });
    setNewRoomName('');
    setIsRoomModalOpen(false);
    setActiveRoom(newRoom.id);
    toast({ title: "Sala añadida", description: `La sala "${newRoomName}" ha sido creada.` });
  };
  
  const deleteRoom = async (roomId: string, roomName: string) => {
    if (rooms.length <= 1) {
        toast({ variant: 'destructive', title: "Acción no permitida", description: "No puedes eliminar la única sala existente." });
        return;
    }
    await deleteDoc(doc(db, `restaurantes/${restaurantId}/rooms`, roomId));
    const newActiveRoom = rooms.find(r => r.id !== roomId)?.id || '';
    setActiveRoom(newActiveRoom);
    toast({ title: "Sala eliminada", description: `La sala "${roomName}" ha sido eliminada.` });
  };


  return (
    <div className="p-2 border-b flex items-center justify-between gap-4 bg-card">
       <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => addTable('square')} disabled={!activeRoom}>
                <Square className="mr-2 h-4 w-4" /> Mesa Cuadrada
           </Button>
            <Button variant="outline" size="sm" onClick={() => addTable('circle')} disabled={!activeRoom}>
                <Circle className="mr-2 h-4 w-4" /> Mesa Redonda
           </Button>
       </div>
       
       <div className="flex-grow flex justify-center">
            <Tabs value={activeRoom} onValueChange={setActiveRoom} className="w-full max-w-md">
                <TabsList>
                    {rooms.map(room => (
                         <TabsTrigger key={room.id} value={room.id} className="relative group">
                            {room.name}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute -right-1 -top-1 h-4 w-4 opacity-50 group-hover:opacity-100">
                                        <Edit className="h-3 w-3"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem className="text-destructive" onSelect={() => deleteRoom(room.id, room.name)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Sala
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
       </div>

        <Button size="sm" onClick={() => setIsRoomModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Sala
        </Button>

        <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir Nueva Sala</DialogTitle>
                <DialogDescription>
                    Crea una nueva área o sala para organizar tus mesas.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Input 
                placeholder="Nombre de la sala (e.g., Terraza)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRoomModalOpen(false)}>Cancelar</Button>
                <Button onClick={addRoom}>Guardar</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};
