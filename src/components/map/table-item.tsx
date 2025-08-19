
'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './map-editor';
import { cn } from '@/lib/utils';
import { SquareTableIcon, CircleTableIcon } from '../icons/tables';

export interface Table {
  id: string;
  name: string;
  shape: 'square' | 'circle';
  status: 'available' | 'occupied' | 'reserved';
  top: number;
  left: number;
}

const statusClasses = {
  available: 'bg-green-500/80 border-green-700',
  occupied: 'bg-red-500/80 border-red-700',
  reserved: 'bg-yellow-500/80 border-yellow-700',
};

export const TableItem: React.FC<Table> = (table) => {
  const { id, name, shape, status, top, left } = table;
  
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
    <div ref={drag} style={style} className="flex flex-col items-center">
      <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md border-2", statusClasses[status])}>
        {name}
      </div>
    </div>
  );
};
