
'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, User, Dot } from 'lucide-react';
import { ItemTypes } from './delivery-column';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  status: 'new' | 'preparing' | 'delivering' | 'delivered';
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  createdAt: Timestamp;
}

interface DeliveryCardProps {
  order: Order;
}

export const DeliveryCard = ({ order }: DeliveryCardProps) => {
  const { t } = useTranslation();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ORDER_CARD,
    item: { id: order.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [order.id]);

  const time = order.createdAt?.toDate().toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) || t('N/A');

  return (
    <Card
      ref={drag}
      className="cursor-move shadow-md hover:shadow-lg transition-shadow"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-base font-bold flex justify-between items-center">
            <span>{`#${order.id.substring(0, 5).toUpperCase()}`}</span>
            <span className="text-sm font-normal text-muted-foreground">{time}</span>
        </CardTitle>
        <CardDescription className="text-xs flex items-center gap-1.5 pt-1">
            <User className="h-3 w-3"/> {order.customerName}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 text-sm space-y-2">
        <div className="flex items-start gap-1.5">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{order.deliveryAddress}</span>
        </div>
        <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" />
             <span className="text-muted-foreground">{order.customerPhone}</span>
        </div>
        <div className="text-xs text-muted-foreground pt-1">
           {order.items.map((item, index) => (
             <span key={index}>
               {item.quantity}x {item.name}{index < order.items.length - 1 ? ' · ' : ''}
             </span>
           ))}
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-muted/50 text-right">
        <p className="w-full text-base font-bold">${order.subtotal.toFixed(2)}</p>
      </CardFooter>
    </Card>
  );
};
