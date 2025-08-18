
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MoreHorizontal, FilePenLine, Trash2, Loader2, UserPlus } from 'lucide-react';
import { MasterUserForm } from './master-user-form';

type MasterUser = {
  id: string;
  name: string;
  email: string;
  registered: string;
};

export function MasterUsersTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<MasterUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, "usuarios"),
      where("perfil", "==", "AM"),
      where("status", "==", "1")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const fullName = `${data.nombre || ''} ${data.apellidos || ''}`.trim();
        
        let registeredDate = 'N/A';
        if (data.fecharegistro && data.fecharegistro instanceof Timestamp) {
          registeredDate = data.fecharegistro.toDate().toLocaleDateString();
        }

        return {
          id: doc.id,
          name: fullName,
          email: data.email || 'No especificado',
          registered: registeredDate,
        };
      });
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching master users:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const filteredData = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/50 border-gray-300 placeholder:text-gray-500 rounded-full"
          />
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                 <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrar Nuevo Usuario Master
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Registrar Usuario Master</DialogTitle>
                    <DialogDescription>Añada un nuevo usuario master al sistema.</DialogDescription>
                </DialogHeader>
                <MasterUserForm onSuccess={() => setIsModalOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="border-b-gray-200 hover:bg-gray-50">
              <TableHead className="text-gray-700">Nombre de Usuario</TableHead>
              <TableHead className="text-gray-700">Correo Electrónico</TableHead>
              <TableHead className="text-gray-700">Fecha de Registro</TableHead>
              <TableHead className="text-right text-gray-700">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                            <span className="ml-4">Cargando usuarios...</span>
                        </div>
                    </TableCell>
                </TableRow>
            ) : filteredData.length > 0 ? (
                filteredData.map(user => (
                  <TableRow key={user.id} className="border-b-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.registered}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white text-gray-800 border-gray-200">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                               <DropdownMenuItem className="cursor-pointer">
                                <FilePenLine className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-100">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No se encontraron usuarios master.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
