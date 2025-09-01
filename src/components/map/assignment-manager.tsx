
'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
  assignments?: {
    tables?: string[];
  };
}

interface Room {
  id: string;
  name: string;
}

interface Table {
  id: string;
  name: string;
}

interface AssignmentManagerProps {
  restaurantId: string;
  userPlan: string;
}

export const AssignmentManager = ({ restaurantId, userPlan }: AssignmentManagerProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tablesByRoom, setTablesByRoom] = useState<{ [roomId: string]: Table[] }>({});
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';

  useEffect(() => {
    if (!restaurantId) return;

    const employeesQuery = query(collection(db, "usuarios"), where("restauranteId", "==", restaurantId), where("status", "==", "1"));
    const unsubscribeEmployees = onSnapshot(employeesQuery, snapshot => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
      setIsLoading(false);
    });

    const roomsQuery = query(collection(db, `${collectionName}/${restaurantId}/rooms`));
    const unsubscribeRooms = onSnapshot(roomsQuery, snapshot => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);

      roomsData.forEach(room => {
        const tablesQuery = query(collection(db, `${collectionName}/${restaurantId}/rooms/${room.id}/tables`));
        onSnapshot(tablesQuery, tablesSnapshot => {
          const tablesData = tablesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
          setTablesByRoom(prev => ({ ...prev, [room.id]: tablesData }));
        });
      });
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeRooms();
    };
  }, [restaurantId, collectionName]);

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setSelectedEmployee(employee || null);
  };

  const handleAssignmentChange = async (id: string, checked: boolean) => {
    if (!selectedEmployee) return;

    const currentAssignments = selectedEmployee.assignments || { tables: [] };
    let newAssignments: string[];

    if (checked) {
      newAssignments = [...(currentAssignments.tables || []), id];
    } else {
      newAssignments = (currentAssignments.tables || []).filter(itemId => itemId !== id);
    }
    
    const updatedEmployee = {
      ...selectedEmployee,
      assignments: {
        ...currentAssignments,
        tables: newAssignments,
      }
    };
    setSelectedEmployee(updatedEmployee);

    const employeeRef = doc(db, 'usuarios', selectedEmployee.id);
    try {
      await updateDoc(employeeRef, { assignments: updatedEmployee.assignments });
      toast({ title: t('Assignment Updated'), description: t('The assignment has been saved successfully.') });
    } catch (error) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not save the assignment.') });
      setSelectedEmployee(selectedEmployee);
    }
  };
  
  const handleSelectAll = (selectAll: boolean) => {
     if (!selectedEmployee) return;

    const allTableIds = Object.values(tablesByRoom).flat().map(t => t.id);

    const updatedAssignments = {
        ...selectedEmployee.assignments,
        tables: selectAll ? allTableIds : []
    };

    const updatedEmployee = { ...selectedEmployee, assignments: updatedAssignments };
    setSelectedEmployee(updatedEmployee);

    const employeeRef = doc(db, 'usuarios', selectedEmployee.id);
    updateDoc(employeeRef, { assignments: updatedAssignments })
        .then(() => toast({ title: t('Assignments Updated') }))
        .catch(() => toast({ variant: 'destructive', title: t('Error') }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center"><Loader2 className="animate-spin h-6 w-6" /></div>;
  }

  return (
    <div className="space-y-4">
      <Select onValueChange={handleEmployeeSelect} value={selectedEmployee?.id || ""}>
        <SelectTrigger>
          <SelectValue placeholder={t('Select an employee')} />
        </SelectTrigger>
        <SelectContent>
          {employees.map(emp => (
            <SelectItem key={emp.id} value={emp.id}>{emp.nombre} {emp.apellidos}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedEmployee && (
        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
            <div className="flex justify-between items-center pt-4">
                <Label>{t('Tables')}</Label>
                <div>
                <Button variant="link" size="sm" onClick={() => handleSelectAll(true)}>{t('Assign all')}</Button>
                <Button variant="link" size="sm" onClick={() => handleSelectAll(false)}>{t('Remove all')}</Button>
                </div>
            </div>
            <Accordion type="multiple" className="w-full">
                {rooms.map(room => (
                <AccordionItem key={`acc-${room.id}`} value={`item-${room.id}`}>
                    <AccordionTrigger>{room.name}</AccordionTrigger>
                    <AccordionContent>
                    <div className="space-y-2 pl-4">
                        {(tablesByRoom[room.id] || []).map(table => (
                        <div key={table.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`table-${table.id}`}
                                checked={selectedEmployee.assignments?.tables?.includes(table.id) || false}
                                onCheckedChange={(checked) => handleAssignmentChange(table.id, !!checked)}
                            />
                            <Label htmlFor={`table-${table.id}`} className="font-normal cursor-pointer">{t('Table')} {table.name}</Label>
                        </div>
                        ))}
                        {(!tablesByRoom[room.id] || tablesByRoom[room.id].length === 0) && (
                            <p className="text-xs text-muted-foreground">{t('No tables in this area.')}</p>
                        )}
                    </div>
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        </div>
      )}
    </div>
  );
};

    