
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from 'react-i18next';


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
  const { t } = useTranslation();

  const addTable = async (shape: 'square' | 'circle') => {
    if (!activeRoom) {
        toast({ variant: 'destructive', title: t('Select a room'), description: t('You must select a room to add a table.') });
        return;
    }
    const tablesRef = collection(db, `restaurantes/${restaurantId}/rooms/${activeRoom}/tables`);
    await addDoc(tablesRef, {
      name: `M${Math.floor(Math.random() * 100)}`,
      shape: shape,
      top: 50,
      left: 50,
      seats: 4,
    });
  };

  const addRoom = async () => {
    if (!newRoomName.trim()) return;
    const roomsRef = collection(db, `restaurantes/${restaurantId}/rooms`);
    const newRoom = await addDoc(roomsRef, { name: newRoomName, createdAt: serverTimestamp() });
    setNewRoomName('');
    setIsRoomModalOpen(false);
    setActiveRoom(newRoom.id);
    toast({ title: t('Room added'), description: t('The room "{{name}}" has been created.', { name: newRoomName }) });
  };
  
  const deleteRoom = async (roomId: string, roomName: string) => {
    if (rooms.length <= 1) {
        toast({ variant: 'destructive', title: t('Action not allowed'), description: t('You cannot delete the only existing room.') });
        return;
    }
    await deleteDoc(doc(db, `restaurantes/${restaurantId}/rooms`, roomId));
    const newActiveRoom = rooms.find(r => r.id !== roomId)?.id || '';
    setActiveRoom(newActiveRoom);
    toast({ title: t('Room deleted'), description: t('The room "{{name}}" has been deleted.', { name: roomName }) });
  };


  return (
    <div className="p-2 border-b flex flex-wrap items-center justify-between gap-4 bg-card">
       <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => addTable('square')} disabled={!activeRoom}>
                <Square className="mr-2 h-4 w-4" /> {t('Square Table')}
           </Button>
            <Button variant="outline" size="sm" onClick={() => addTable('circle')} disabled={!activeRoom}>
                <Circle className="mr-2 h-4 w-4" /> {t('Circle Table')}
           </Button>
       </div>
       
       <div className="flex-grow flex justify-center">
            <Tabs value={activeRoom} onValueChange={setActiveRoom} className="w-full max-w-md">
                <TabsList>
                    {rooms.map(room => (
                         <div key={room.id} className="relative group">
                            <TabsTrigger value={room.id}>{room.name}</TabsTrigger>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute -right-1 -top-1 h-4 w-4 opacity-50 group-hover:opacity-100">
                                        <Edit className="h-3 w-3"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem className="text-destructive" onSelect={() => deleteRoom(room.id, room.name)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> {t('Delete Room')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                    ))}
                </TabsList>
            </Tabs>
       </div>

        <Button size="sm" onClick={() => setIsRoomModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> {t('Add Room')}
        </Button>

        <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Add New Room')}</DialogTitle>
                <DialogDescription>
                    {t('Create a new area or room to organize your tables.')}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Input 
                placeholder={t('Room name (e.g., Terrace)')}
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRoomModalOpen(false)}>{t('Cancel')}</Button>
                <Button onClick={addRoom}>{t('Save')}</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};
