
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MoreHorizontal, FilePenLine, Trash2, Loader2, UserPlus } from 'lucide-react';
import { MasterUserForm } from './master-user-form';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

type MasterUser = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  registered: string;
};

export function MasterUsersTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<MasterUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<MasterUser | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

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
        
        let registeredDate = 'N/A';
        if (data.fecharegistro && data.fecharegistro instanceof Timestamp) {
          registeredDate = data.fecharegistro.toDate().toLocaleDateString();
        }

        return {
          id: doc.id,
          nombre: data.nombre || '',
          apellidos: data.apellidos || '',
          email: data.email || t('Not specified'),
          telefono: data.telefono || '',
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
  }, [t]);

  const handleEdit = (user: MasterUser) => {
    setUserToEdit(user);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setUserToEdit(null);
    setIsFormModalOpen(true);
  }

  const handleDelete = async (userId: string) => {
    try {
        const userRef = doc(db, "usuarios", userId);
        await updateDoc(userRef, {
            status: "0" // Eliminación lógica
        });
        toast({
            title: t("User Deleted"),
            description: t("The user has been marked as inactive."),
        });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        toast({
            variant: "destructive",
            title: t("Error"),
            description: t("Could not delete the user."),
        });
    }
  };


  const filteredData = users.filter(user =>
    `${user.nombre} ${user.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            placeholder={t("Search by name or email...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/50 border-gray-300 placeholder:text-gray-500 rounded-full"
          />
        </div>
        <Button onClick={handleAddNew}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('Register New Master User')}
        </Button>
      </div>

       <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{userToEdit ? t('Edit') : t('Register')} {t('Master User')}</DialogTitle>
                    <DialogDescription>
                        {userToEdit ? t('Modify the user information.') : t('Add a new master user to the system.')}
                    </DialogDescription>
                </DialogHeader>
                <MasterUserForm onSuccess={() => setIsFormModalOpen(false)} userToEdit={userToEdit} />
            </DialogContent>
        </Dialog>

      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="border-b-gray-200 hover:bg-gray-50">
              <TableHead className="text-gray-700">{t('Username')}</TableHead>
              <TableHead className="text-gray-700">{t('Email')}</TableHead>
              <TableHead className="text-gray-700">{t('Registration Date')}</TableHead>
              <TableHead className="text-right text-gray-700">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                            <span className="ml-4">{t('Loading users...')}</span>
                        </div>
                    </TableCell>
                </TableRow>
            ) : filteredData.length > 0 ? (
                filteredData.map(user => (
                  <TableRow key={user.id} className="border-b-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium">{user.nombre} {user.apellidos}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.registered}</TableCell>
                    <TableCell className="text-right">
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                    <span className="sr-only">{t('Open menu')}</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white text-gray-800 border-gray-200">
                                  <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                                   <DropdownMenuItem className="cursor-pointer" onSelect={() => handleEdit(user)}>
                                    <FilePenLine className="mr-2 h-4 w-4" />
                                    {t('Edit')}
                                  </DropdownMenuItem>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-100" onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {t('Delete')}
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('This action will mark the user as inactive and they will not be able to access the system. Do you want to continue?')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-red-600 hover:bg-red-700">
                                        {t('Yes, delete')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        {t('No master users found.')}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
