
'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './map-editor';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Trash2, Edit, Armchair } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useTranslation } from 'react-i18next';

export interface Table {
  id: string;
  name: string;
  shape: 'square' | 'circle';
  status: 'available' | 'occupied' | 'reserved' | 'billing' | 'dirty';
  top: number;
  left: number;
  seats: number;
}

interface TableItemProps extends Table {
    onDelete: (id: string) => void;
    onEdit: (table: Table) => void;
    onClick: (table: Table) => void;
    view: 'admin' | 'operational';
}

const statusClasses = {
  available: 'bg-green-500/80 border-green-700 hover:bg-green-500',
  occupied: 'bg-red-500/80 border-red-700 hover:bg-red-500',
  reserved: 'bg-yellow-500/80 border-yellow-700 hover:bg-yellow-500',
  billing: 'bg-blue-500/80 border-blue-700 hover:bg-blue-500',
  dirty: 'bg-orange-500/80 border-orange-700 hover:bg-orange-500',
};

export const TableItem: React.FC<TableItemProps> = (props) => {
  const { id, name, shape, status, top, left, seats, onDelete, onEdit, onClick, view } = props;
  const { t } = useTranslation();
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TABLE,
    item: { id, left, top },
    canDrag: view === 'admin',
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id, left, top, view]);

  const style: React.CSSProperties = view === 'admin' ? {
    position: 'absolute',
    left,
    top,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
  } : {
    cursor: 'pointer'
  };

  const shapeClasses = {
    square: 'rounded-lg',
    circle: 'rounded-full'
  }

  const tableContent = (
    <div className={cn(
        "w-24 h-24 aspect-square flex flex-col items-center justify-center text-white font-bold text-lg shadow-md border-2 transition-transform hover:scale-105",
        statusClasses[status || 'available'],
        shapeClasses[shape]
        )}>
        <span className="text-xl">{name}</span>
        <div className="flex items-center gap-1 text-xs font-normal">
            <Armchair className="h-3 w-3" />
            <span>{seats}</span>
        </div>
    </div>
  );
  
  const ref = view === 'admin' ? drag : null;

  return (
    <div ref={ref} style={style} className="group relative flex flex-col items-center" onClick={() => onClick(props)}>
        {view === 'admin' && (
            <div className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 p-1 rounded-full bg-background/80 shadow-md">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('This action cannot be undone. This will permanently delete the table from the room plan.')}
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(id)} className="bg-destructive hover:bg-destructive/90">{t('Delete')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); onEdit(props); }}>
                    <Edit className="h-3 w-3" />
                </Button>
            </div>
        )}
        {tableContent}
    </div>
  );
};
