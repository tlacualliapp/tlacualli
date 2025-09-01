
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, ArrowUpCircle, ArrowDownCircle, Replace } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Movement {
  id: string;
  itemName: string;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  userEmail: string;
  createdAt: Timestamp;
}

interface MovementsTableProps {
  restaurantId: string;
  userPlan: string;
}

const MovementIcon = ({ type }: { type: Movement['type'] }) => {
  const { t } = useTranslation();
  
  const movementDetails = {
    entry: {
      icon: <ArrowUpCircle className="h-5 w-5 text-green-500" />,
      label: t('Entry'),
      className: 'bg-green-100 text-green-800'
    },
    exit: {
      icon: <ArrowDownCircle className="h-5 w-5 text-red-500" />,
      label: t('Exit'),
       className: 'bg-red-100 text-red-800'
    },
    adjustment: {
      icon: <Replace className="h-5 w-5 text-blue-500" />,
      label: t('Adjustment'),
      className: 'bg-blue-100 text-blue-800'
    }
  };

  const { icon, label, className } = movementDetails[type] || {};

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
            <Badge variant="outline" className={`flex items-center gap-1.5 ${className}`}>
                {icon}
                <span className="hidden md:inline">{label}</span>
            </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function MovementsTable({ restaurantId, userPlan }: MovementsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (!restaurantId || !userPlan) return;
    setIsLoading(true);
    const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
    const q = query(
      collection(db, `${collectionName}/${restaurantId}/inventoryMovements`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const movementsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
      setMovements(movementsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching movements:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, userPlan]);

  const filteredData = useMemo(() => movements.filter(movement =>
    movement.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  ), [movements, searchTerm]);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("Search by item name...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Date')}</TableHead>
              <TableHead>{t('Item')}</TableHead>
              <TableHead className='text-center'>{t('Type')}</TableHead>
              <TableHead className="text-right">{t('Quantity')}</TableHead>
              <TableHead className="text-right">{t('Previous Stock')}</TableHead>
              <TableHead className="text-right">{t('New Stock')}</TableHead>
              <TableHead>{t('User')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map(movement => (
                <TableRow key={movement.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {movement.createdAt?.toDate().toLocaleString() ?? 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">{movement.itemName}</TableCell>
                  <TableCell className='text-center'><MovementIcon type={movement.type} /></TableCell>
                  <TableCell className="text-right font-mono">{movement.type === 'exit' ? '-' : '+'}{movement.quantity}</TableCell>
                  <TableCell className="text-right font-mono">{movement.previousStock}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{movement.newStock}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{movement.userEmail}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center h-24">{t('No movements found.')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
