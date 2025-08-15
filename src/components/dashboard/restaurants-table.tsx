
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
import { Search, Filter, MoreHorizontal, FilePenLine, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';

const restaurantsData = [
  { id: '1', name: 'Tacos El Sol', style: 'Mexicano', state: 'Jalisco', municipality: 'Guadalajara' },
  { id: '2', name: 'La Trattoria', style: 'Italiano', state: 'Ciudad de México', municipality: 'Cuauhtémoc' },
  { id: '3', name: 'El Asador Argentino', style: 'Carnes', state: 'Nuevo León', municipality: 'Monterrey' },
  { id: '4', name: 'Mariscos La Playa', style: 'Mariscos', state: 'Quintana Roo', municipality: 'Cancún' },
  { id: '5', name: 'Sushi-Zen', style: 'Japonés', state: 'Jalisco', municipality: 'Zapopan' },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/20 border-white/30 placeholder:text-white/70 rounded-full"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto bg-white/20 border-white/30 hover:bg-white/30">
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-gray-800 text-white border-gray-700">
            <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-600"/>
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
             <DropdownMenuSeparator className="bg-gray-600"/>
            <DropdownMenuLabel>Filtrar por Estilo</DropdownMenuLabel>
             <DropdownMenuSeparator className="bg-gray-600"/>
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
      <div className="rounded-md border border-white/20">
        <Table>
          <TableHeader>
            <TableRow className="border-b-white/20 hover:bg-white/10">
              <TableHead className="text-white/90">Nombre</TableHead>
              <TableHead className="text-white/90">Estilo</TableHead>
              <TableHead className="text-white/90">Municipio/Alcaldía</TableHead>
              <TableHead className="text-white/90">Estado</TableHead>
              <TableHead className="text-right text-white/90">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map(item => (
              <TableRow key={item.id} className="border-b-white/20 hover:bg-white/10">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell><Badge variant="secondary" className="bg-red-500/80 text-white">{item.style}</Badge></TableCell>
                <TableCell>{item.municipality}</TableCell>
                <TableCell>{item.state}</TableCell>
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
