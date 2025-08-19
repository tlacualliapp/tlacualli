
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Table } from './table-item';

interface TableFormProps {
  table: Table;
  onSave: (data: { name: string; seats: number }) => void;
  onCancel: () => void;
}

export const TableForm = ({ table, onSave, onCancel }: TableFormProps) => {
  const [name, setName] = useState('');
  const [seats, setSeats] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (table) {
      setName(table.name);
      setSeats(table.seats || 4);
    }
  }, [table]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onSave({ name, seats });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la Mesa</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seats">Número de Asientos</Label>
        <Input
          id="seats"
          type="number"
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          required
          min="1"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
};
