
'use client';

import React, { useState } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, MoreHorizontal, FilePenLine, Trash2, Building, Mail, Phone, Hash } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Restaurant = {
  id: string;
  name: string;
  style: string;
  state: string;
  municipality: string;
  address: string;
  phone: string;
  email: string;
  rfc: string;
};

const restaurantsData: Restaurant[] = [
  { id: '1', name: 'Tacos El Sol', style: 'Mexicano', state: 'Jalisco', municipality: 'Guadalajara', address: 'Av. del Sol 123', phone: '33 1234 5678', email: 'contacto@tacoselsol.com', rfc: 'SOLT850101XXX' },
  { id: '2', name: 'La Trattoria', style: 'Italiano', state: 'Ciudad de México', municipality: 'Cuauhtémoc', address: 'Calle Roma 45', phone: '55 9876 5432', email: 'info@trattoria.mx', rfc: 'TRAT780202YYY' },
  { id: '3', name: 'El Asador Argentino', style: 'Carnes', state: 'Nuevo León', municipality: 'Monterrey', address: 'Calzada del Valle 400', phone: '81 1122 3344', email: 'reservas@asador.com', rfc: 'ASAD900303ZZZ' },
  { id: '4', name: 'Mariscos La Playa', style: 'Mariscos', state: 'Quintana Roo', municipality: 'Cancún', address: 'Blvd. Kukulcan Km 9.5', phone: '998 888 7766', email: 'contacto@laplaya.com', rfc: 'PLAY850404AAA' },
  { id: '5', name: 'Sushi-Zen', style: 'Japonés', state: 'Jalisco', municipality: 'Zapopan', address: 'Av. Patria 500', phone: '33 5566 7788', email: 'sushizen@mail.com', rfc: 'SUZE950505BBB' },
];

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
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

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

  const filteredData = restaurantsData.filter(item => {
    const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
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
            {filteredData.map(item => (
              <TableRow key={item.id} className="border-b-gray-200 hover:bg-gray-50">
                <TableCell className="font-medium">
                  <Button variant="link" className="p-0 h-auto text-gray-800 font-medium" onClick={() => setSelectedRestaurant(item)}>
                    {item.name}
                  </Button>
                </TableCell>
                <TableCell><Badge variant="secondary" className="bg-red-100 text-red-700">{item.style}</Badge></TableCell>
                <TableCell>{item.municipality}</TableCell>
                <TableCell>{item.state}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedRestaurant !== null} onOpenChange={(isOpen) => !isOpen && setSelectedRestaurant(null)}>
        <DialogContent className="sm:max-w-lg bg-white text-gray-800">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline text-gray-900">{selectedRestaurant.name}</DialogTitle>
                <DialogDescription>
                  <Badge variant="secondary" className="bg-red-100 text-red-700">{selectedRestaurant.style}</Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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

