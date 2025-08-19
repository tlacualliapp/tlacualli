
'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './map-editor';
import { cn } from '@/lib/utils';
import { SquareTableIcon, CircleTableIcon } from '../icons/tables';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export interface Table {
  id: string;
  name: string;
  shape: 'square' | 'circle';
  status: 'available' | 'occupied' | 'reserved';
  top: number;
  left: number;
}

interface TableItemProps extends Table {
    onDelete: (id: string) => void;
}

const statusClasses = {
  available: 'bg-green-500/80 border-green-700',
  occupied: 'bg-red-500/80 border-red-700',
  reserved: 'bg-yellow-500/80 border-yellow-700',
};

export const TableItem: React.FC<TableItemProps> = (props) => {
  const { id, name, shape, status, top, left, onDelete } = props;
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TABLE,
    item: { id, left, top },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id, left, top]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
  };

  const Icon = shape === 'square' ? SquareTableIcon : CircleTableIcon;

  return (
    <div ref={drag} style={style} className="group relative flex flex-col items-center">
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 z-10 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la mesa del plano de la sala.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md border-2", statusClasses[status])}>
            {name}
        </div>
    </div>
  );
};
