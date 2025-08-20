
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, Loader2, Users, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmployeeForm } from '@/components/employees/employee-form';
import { PermissionsForm } from '@/components/employees/permissions-form';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  perfil: string;
  status: string;
  avatar?: string;
  hint?: string;
  permissions?: { [key: string]: boolean };
}

export default function EmployeesPage() {
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setRestaurantId(userData.restauranteId);
        } else {
            setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchRestaurantId();
  }, [user]);

  useEffect(() => {
    if (!restaurantId) return;
    setIsLoading(true);
    const q = query(
        collection(db, "usuarios"), 
        where("restauranteId", "==", restaurantId),
        where("status", "==", "1")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const staff: Employee[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            staff.push({
                id: doc.id,
                nombre: data.nombre,
                apellidos: data.apellidos,
                perfil: data.perfil,
                status: data.status,
                email: data.email,
                telefono: data.telefono,
                permissions: data.permissions,
                avatar: 'https://placehold.co/100x100.png', // Placeholder
                hint: 'portrait person'
            });
        });
        setEmployees(staff);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching employees:", error);
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not load employees.') });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, t, toast]);

  const handleAddNew = () => {
    setEmployeeToEdit(null);
    setIsFormModalOpen(true);
  };
  
  const handleEdit = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsFormModalOpen(true);
  }

  const handlePermissions = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsPermissionsModalOpen(true);
  };

  const handleDelete = async (employeeId: string) => {
    try {
        const employeeRef = doc(db, "usuarios", employeeId);
        // Logical delete by changing status
        await updateDoc(employeeRef, { status: "0" });
        toast({
            title: t("Employee Deactivated"),
            description: t("The employee has been marked as inactive."),
        });
    } catch (error) {
        console.error("Error deactivating employee:", error);
        toast({
            variant: "destructive",
            title: t("Error"),
            description: t("Could not deactivate the employee."),
        });
    }
  };

  const getRoleName = (profileId: string) => {
    switch (profileId) {
        case '1': return t('Administrator');
        case '2': return t('Employee');
        default: return t('Unknown');
    }
  }

  return (
    <AdminLayout>
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
                <DialogTitle>{employeeToEdit ? t('Edit Employee') : t('Add New Employee')}</DialogTitle>
                <DialogDescription>
                    {employeeToEdit ? t('Modify the employee information.') : t('Add a new employee to your team.')}
                </DialogDescription>
            </DialogHeader>
            {restaurantId && <EmployeeForm restaurantId={restaurantId} onSuccess={() => setIsFormModalOpen(false)} employeeToEdit={employeeToEdit} />}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{t('Module Permissions')}</DialogTitle>
                 <DialogDescription>
                    {t('Select the modules this employee can access.')}
                </DialogDescription>
            </DialogHeader>
            {employeeToEdit && <PermissionsForm employee={employeeToEdit} onSuccess={() => setIsPermissionsModalOpen(false)} />}
        </DialogContent>
      </Dialog>

      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <Users className="h-8 w-8" /> {t('Employee Management')}
            </CardTitle>
            <CardDescription>{t('Manage roles, permissions, and PINs for your staff.')}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-end">
                <Button className="bg-accent hover:bg-accent/90" onClick={handleAddNew} disabled={!restaurantId}>
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('Add Employee')}
                </Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : employees.length > 0 ? (
                employees.map(employee => (
                  <div key={employee.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={employee.avatar} alt={`${employee.nombre} ${employee.apellidos}`} data-ai-hint={employee.hint} />
                        <AvatarFallback>{`${employee.nombre?.[0] || ''}${employee.apellidos?.[0] || ''}`}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{employee.nombre} {employee.apellidos}</p>
                        <p className="text-sm text-muted-foreground">{getRoleName(employee.perfil)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={employee.status === '1' ? 'default' : 'secondary'}>
                        {employee.status === '1' ? t('Active') : t('Inactive')}
                      </Badge>
                       <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => handleEdit(employee)}><FilePenLine className="mr-2 h-4 w-4" />{t('Edit')}</DropdownMenuItem>
                               <DropdownMenuItem onSelect={() => handlePermissions(employee)}><ShieldCheck className="mr-2 h-4 w-4" />{t('Permissions')}</DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" />{t('Deactivate')}</DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle><AlertDialogDescription>{t("This action will mark the user as inactive and they won't be able to access the system. Do you want to continue?")}</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(employee.id)} className="bg-destructive hover:bg-destructive/90">{t('Yes, deactivate')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                ))
            ) : (
                <div className="text-center p-8 text-muted-foreground">
                    {t('No employees found. Add your first employee to get started.')}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
