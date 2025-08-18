
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Search, Filter, MoreHorizontal, FilePenLine, Trash2, Building, Mail, Phone, Hash, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type Restaurant = {
  id: string;
  restaurantName: string;
  style: string;
  state: string;
  municipality: string;
  address: string;
  phone: string;
  email: string;
  rfc: string;
  socialReason: string;
};

const mexicanStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit", "Nuevo León",
  "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const restaurantStyles = ["Italiano", "Mar y tierra", "Carnes", "Mariscos", "Mexicano", "Japonés", "Otro"];

export function RestaurantsTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ state: new Set<string>(), style: new Set<string>() });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, "restaurantes"),
      where("status", "==", "1")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const restaurantsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Restaurant));
      setRestaurants(restaurantsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching restaurants:", error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los restaurantes."
      })
    });

    return () => unsubscribe();
  }, [toast]);

  const handleFilterChange = (type: 'state' | 'style', value: string) => {
    setFilters(prev => {
      const newSet = new Set(prev[type]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [type]: newSet };
    });
  };

  const handleDelete = async (restaurantId: string) => {
    try {
        const restaurantRef = doc(db, "restaurantes", restaurantId);
        await updateDoc(restaurantRef, {
            status: "0" // Eliminación lógica
        });
        toast({
            title: "Restaurante Eliminado",
            description: "El restaurante ha sido marcado como inactivo.",
        });
    } catch (error) {
        console.error("Error al eliminar restaurante:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo eliminar el restaurante.",
        });
    }
  };

  const handleEdit = (restaurantId: string) => {
    router.push(`/dashboard-am/restaurants?id=${restaurantId}`);
  };


  const filteredData = restaurants.filter(item => {
    const searchMatch = (item.restaurantName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const stateMatch = filters.state.size === 0 || filters.state.has(item.state);
    const styleMatch = filters.style.size === 0 || filters.style.has(item.style);
    return searchMatch && stateMatch && styleMatch;
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/50 border-gray-300 placeholder:text-gray-500 rounded-full"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto bg-white/50 border-gray-300 hover:bg-gray-100">
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white text-gray-800 border-gray-200">
            <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200"/>
            <div className="max-h-60 overflow-y-auto">
              {mexicanStates.map(state => (
                <DropdownMenuCheckboxItem
                  key={state}
                  checked={filters.state.has(state)}
                  onCheckedChange={() => handleFilterChange('state', state)}
                >
                  {state}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
             <DropdownMenuSeparator className="bg-gray-200"/>
            <DropdownMenuLabel>Filtrar por Estilo</DropdownMenuLabel>
             <DropdownMenuSeparator className="bg-gray-200"/>
             {restaurantStyles.map(style => (
              <DropdownMenuCheckboxItem
                key={style}
                checked={filters.style.has(style)}
                onCheckedChange={() => handleFilterChange('style', style)}
              >
                {style}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="border-b-gray-200 hover:bg-gray-50">
              <TableHead className="text-gray-700">Nombre</TableHead>
              <TableHead className="text-gray-700">Estilo</TableHead>
              <TableHead className="text-gray-700">Municipio/Alcaldía</TableHead>
              <TableHead className="text-gray-700">Estado</TableHead>
              <TableHead className="text-right text-gray-700">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                            <span className="ml-4">Cargando restaurantes...</span>
                        </div>
                    </TableCell>
                </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map(item => (
                <TableRow key={item.id} className="border-b-gray-200 hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Button variant="link" className="p-0 h-auto text-gray-800 font-medium" onClick={() => setSelectedRestaurant(item)}>
                      {item.restaurantName}
                    </Button>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="bg-red-100 text-red-700">{item.style}</Badge></TableCell>
                  <TableCell>{item.municipality}</TableCell>
                  <TableCell>{item.state}</TableCell>
                  <TableCell className="text-right">
                     <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white text-gray-800 border-gray-200">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem className="cursor-pointer" onSelect={() => handleEdit(item.id)}>
                                <FilePenLine className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                               <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-100" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción marcará al restaurante como inactivo. ¿Desea continuar?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700">
                                    Sí, eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No se encontraron restaurantes.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedRestaurant !== null} onOpenChange={(isOpen) => !isOpen && setSelectedRestaurant(null)}>
        <DialogContent className="sm:max-w-lg bg-white text-gray-800">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline text-gray-900">{selectedRestaurant.restaurantName}</DialogTitle>
                <DialogDescription>
                  <div><Badge variant="secondary" className="bg-red-100 text-red-700">{selectedRestaurant.style}</Badge></div>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-start gap-4">
                  <Building className="h-5 w-5 text-gray-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-700">Razón Social</p>
                    <p className="text-gray-600">{selectedRestaurant.socialReason}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Building className="h-5 w-5 text-gray-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-700">Dirección</p>
                    <p className="text-gray-600">{selectedRestaurant.address}, {selectedRestaurant.municipality}, {selectedRestaurant.state}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-700">Teléfono</p>
                    <p className="text-gray-600">{selectedRestaurant.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-700">Correo Electrónico</p>
                    <p className="text-gray-600">{selectedRestaurant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Hash className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-700">RFC</p>
                    <p className="text-gray-600">{selectedRestaurant.rfc}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
