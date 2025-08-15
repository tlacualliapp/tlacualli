
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MoreHorizontal, FilePenLine, Trash2 } from 'lucide-react';

const usersData = [
  { id: '1', name: 'Admin Master 1', email: 'admin1@example.com', registered: '2023-01-15' },
  { id: '2', name: 'Laura Martinez', email: 'laura.m@example.com', registered: '2023-02-20' },
  { id: '3', name: 'Carlos Sanchez', email: 'carlos.s@example.com', registered: '2023-03-10' },
  { id: '4', name: 'Ana Garcia', email: 'ana.g@example.com', registered: '2023-04-05' },
  { id: '5', name: 'Pedro Rodriguez', email: 'pedro.r@example.com', registered: '2023-05-25' },
];

export function MasterUsersTable() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = usersData.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/20 border-white/30 placeholder:text-white/70 rounded-full"
          />
        </div>
      </div>
      <div className="rounded-md border border-white/20">
        <Table>
          <TableHeader>
            <TableRow className="border-b-white/20 hover:bg-white/10">
              <TableHead className="text-white/90">Nombre de Usuario</TableHead>
              <TableHead className="text-white/90">Correo Electrónico</TableHead>
              <TableHead className="text-white/90">Fecha de Registro</TableHead>
              <TableHead className="text-right text-white/90">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map(user => (
              <TableRow key={user.id} className="border-b-white/20 hover:bg-white/10">
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.registered).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/20">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 text-white border-gray-700">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                           <DropdownMenuItem className="cursor-pointer">
                            <FilePenLine className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-900/50">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
