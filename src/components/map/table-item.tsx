
'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './map-editor';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Trash2, Edit, Armchair } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export interface Table {
  id: string;
  name: string;
  shape: 'square' | 'circle';
  status: 'available' | 'occupied' | 'reserved';
  top: number;
  left: number;
  seats: number;
}

interface TableItemProps extends Table {
    onDelete: (id: string) => void;
    onEdit: (table: Table) => void;
}

const statusClasses = {
  available: 'bg-green-500/80 border-green-700 hover:bg-green-500',
  occupied: 'bg-red-500/80 border-red-700 hover:bg-red-500',
  reserved: 'bg-yellow-500/80 border-yellow-700 hover:bg-yellow-500',
};

export const TableItem: React.FC<TableItemProps> = (props) => {
  const { id, name, shape, status, top, left, seats, onDelete, onEdit } = props;
  
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
  };

  const shapeClasses = {
    square: 'rounded-lg',
    circle: 'rounded-full'
  }

  return (
    <div ref={drag} style={style} className="group relative flex flex-col items-center" >
        <div className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 p-1 rounded-full bg-background/80 shadow-md">
            <AlertDialog>
                 <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
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
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => onEdit(props)}>
                <Edit className="h-3 w-3" />
            </Button>
        </div>
        <div className={cn(
            "w-20 h-20 flex flex-col items-center justify-center text-white font-bold text-lg shadow-md border-2 cursor-move transition-colors",
            statusClasses[status],
            shapeClasses[shape]
            )}>
            <span className="text-xl">{name}</span>
            <div className="flex items-center gap-1 text-xs font-normal">
                <Armchair className="h-3 w-3" />
                <span>{seats}</span>
            </div>
        </div>
    </div>
  );
};
