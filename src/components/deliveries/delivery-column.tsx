
'use client';

import React from 'react';
import { useDrop } from 'react-dnd';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { Order } from './delivery-card';

export const ItemTypes = {
  ORDER_CARD: 'order_card',
};

interface DeliveryColumnProps {
  status: Order['status'];
  children: React.ReactNode;
  onDrop: (orderId: string, newStatus: Order['status']) => void;
}

const statusConfig = {
  new: { title: 'New Orders', color: 'bg-blue-500' },
  preparing: { title: 'Preparing', color: 'bg-purple-500' },
  delivering: { title: 'Out for Delivery', color: 'bg-yellow-500' },
  delivered: { title: 'Delivered', color: 'bg-green-500' },
};


export const DeliveryColumn = ({ status, children, onDrop }: DeliveryColumnProps) => {
  const { t } = useTranslation();

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.ORDER_CARD,
    drop: (item: { id: string }) => onDrop(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [status, onDrop]);

  const config = statusConfig[status];

  return (
    <Card
      ref={drop}
      className={cn('transition-colors', isOver && canDrop ? 'bg-accent/20' : 'bg-card/65')}
    >
      <CardHeader className={cn("p-4 rounded-t-lg text-white", config.color)}>
        <CardTitle className="text-lg font-bold font-headline">{t(config.title)}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 min-h-[200px]">
        {children}
      </CardContent>
    </Card>
  );
};
