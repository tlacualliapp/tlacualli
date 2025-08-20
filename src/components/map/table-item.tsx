
'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './map-editor';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Trash2, Edit, Armchair, ChefHat, ShoppingBag } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useTranslation } from 'react-i18next';

export interface Table {
  id: string;
  name: string;
  shape: 'square' | 'circle';
  status?: 'available' | 'open' | 'preparing' | 'billing' | 'dirty' | 'reserved';
  top: number;
  left: number;
  seats: number;
  roomId?: string;
  isTakeout?: boolean;
}

interface TableItemProps extends Table {
    onDelete: (id: string) => void;
    onEdit: (table: Table) => void;
    onClick: (table: Table) => void;
    view: 'admin' | 'operational';
    isSelected?: boolean;
}

const statusClasses: { [key in NonNullable<Table['status']>]: string } = {
  available: 'bg-green-500/80 border-green-700 hover:bg-green-500',
  open: 'bg-red-500/80 border-red-700 hover:bg-red-500',
  preparing: 'bg-purple-500/80 border-purple-700 hover:bg-purple-500',
  billing: 'bg-blue-500/80 border-blue-700 hover:bg-blue-500',
  dirty: 'bg-orange-500/80 border-orange-700 hover:bg-orange-500',
  reserved: 'bg-yellow-500/80 border-yellow-700 hover:bg-yellow-500',
};


const TableView: React.FC<Omit<TableItemProps, 'left' | 'top'>> = (props) => {
    const { id, name, shape, status, seats, onDelete, onEdit, onClick, view, isSelected, isTakeout } = props;
    const { t } = useTranslation();

    const shapeClasses = {
        square: 'rounded-lg',
        circle: 'rounded-full'
    };
    
    const renderIcon = () => {
        if (isTakeout) {
            return <ShoppingBag className="h-6 w-6" />;
        }
        if (status === 'preparing') {
            return <ChefHat className="h-4 w-4" />;
        }
        return (
            <div className="flex items-center gap-1 text-xs font-normal">
                <Armchair className="h-3 w-3" />
                <span>{seats}</span>
            </div>
        )
    }
    
    const tableStatus = status || 'available';

    return (
        <div className={cn("group relative flex flex-col items-center", view === 'operational' && 'cursor-pointer')} onClick={() => onClick(props)}>
            {view === 'admin' && !isTakeout && (
                <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 p-1 rounded-full bg-background/80 shadow-md">
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
            <div className={cn(
                "w-24 h-24 aspect-square flex flex-col items-center justify-center text-white font-bold text-lg shadow-md border-2 transition-all",
                statusClasses[tableStatus],
                shapeClasses[shape],
                isSelected && 'ring-4 ring-offset-2 ring-primary scale-105',
                !isSelected && 'hover:scale-105'
            )}>
                <span className={cn("text-xl", isTakeout && "text-sm")}>{name}</span>
                {renderIcon()}
            </div>
        </div>
    );
}

const DraggableTableItem: React.FC<TableItemProps> = (props) => {
    const { left, top } = props;
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TABLE,
        item: { id: props.id, left: props.left, top: props.top },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: !props.isTakeout
    }), [props.id, left, top, props.isTakeout]);

    const style: React.CSSProperties = {
        position: 'absolute',
        left,
        top,
        opacity: isDragging ? 0.5 : 1,
        cursor: props.isTakeout ? 'default' : 'move',
    };

    return (
        <div ref={drag} style={style}>
            <TableView {...props} />
        </div>
    );
};

const NonDraggableTableItem: React.FC<TableItemProps> = (props) => {
  return (
    <div>
        <TableView {...props} />
    </div>
  )
}


export const TableItem: React.FC<TableItemProps> = (props) => {
  if (props.view === 'admin') {
    return <DraggableTableItem {...props} />;
  }

  return <NonDraggableTableItem {...props} />
};
