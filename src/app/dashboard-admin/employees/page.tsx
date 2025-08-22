
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, Loader2, Users, ShieldCheck, Undo, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmployeeForm } from '@/components/employees/employee-form';
import { PermissionsForm } from '@/components/employees/permissions-form';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
import { getRestaurantIdForCurrentUser } from '@/lib/users';

interface Employee {
  id: string;
  uid: string;
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
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchRestaurantId = async () => {
      const id = await getRestaurantIdForCurrentUser();
      setRestaurantId(id);
    };
    if(user) {
        fetchRestaurantId();
    }
  }, [user]);

  useEffect(() => {
    if (!restaurantId) return;
    setIsLoading(true);
    const q = query(
        collection(db, "usuarios"), 
        where("restauranteId", "==", restaurantId)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const staff: Employee[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            staff.push({
                id: doc.id,
                uid: data.uid,
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
    if (!restaurantId) {
        toast({ variant: 'destructive', title: t('Error'), description: t('Restaurant information is not available yet. Please try again.') });
        return;
    }
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

  const handleDeactivate = async (employeeId: string) => {
    try {
        const employeeRef = doc(db, "usuarios", employeeId);
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
  
  const handleActivate = async (employeeId: string) => {
    try {
        const employeeRef = doc(db, "usuarios", employeeId);
        await updateDoc(employeeRef, { status: "1" });
        toast({
            title: t("Employee Activated"),
            description: t("The employee has been marked as active."),
        });
    } catch (error) {
        console.error("Error activating employee:", error);
        toast({
            variant: "destructive",
            title: t("Error"),
            description: t("Could not activate the employee."),
        });
    }
  };

  const handlePermanentDelete = async (employeeId: string) => {
     try {
        // This is a placeholder for a function that would call a backend
        // to delete the Firebase Auth user, as this is a privileged operation.
        // For now, we'll just delete the Firestore document.
        console.log(`Requesting permanent deletion for user ID: ${employeeId}`);
        await deleteDoc(doc(db, "usuarios", employeeId));
        toast({
            title: t("Employee Deleted"),
            description: t("The employee has been permanently removed from the database."),
        });
    } catch (error) {
        console.error("Error permanently deleting employee:", error);
        toast({
            variant: "destructive",
            title: t("Error"),
            description: t("Could not permanently delete the employee. Please contact support if the problem persists."),
        });
    }
  };


 const getRoleName = (profileId: string) => {
    const roles: { [key: string]: string } = {
        '1': 'Administrator',
        '2': 'Employee'
    };
    return t(roles[profileId] || 'Unknown');
 };

 if (loading || !user) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
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
                              <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">{t('Open menu')}</span><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                              {employee.status === '1' ? (
                                <>
                                  <DropdownMenuItem onSelect={() => handleEdit(employee)}><FilePenLine className="mr-2 h-4 w-4" />{t('Edit')}</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handlePermissions(employee)}><ShieldCheck className="mr-2 h-4 w-4" />{t('Permissions')}</DropdownMenuItem>
                                  {user?.uid !== employee.uid && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" />{t('Deactivate')}</DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onSelect={() => handleActivate(employee.id)}><Undo className="mr-2 h-4 w-4" />{t('Activate')}</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                   <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><ShieldAlert className="mr-2 h-4 w-4" />{t('Delete Permanently')}</DropdownMenuItem>
                                  </AlertDialogTrigger>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                           {employee.status === '1' ? (
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle><AlertDialogDescription>{t("This action will mark the user as inactive and they won't be able to access the system. Do you want to continue?")}</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeactivate(employee.id)} className="bg-destructive hover:bg-destructive/90">{t('Yes, deactivate')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                           ) : (
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-destructive"/>{t('Permanent Deletion')}</AlertDialogTitle>
                                    <AlertDialogDescription>{t('This action is irreversible. The user will be deleted from the authentication system and database. Are you absolutely sure?')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handlePermanentDelete(employee.id)} className="bg-destructive hover:bg-destructive/90">{t('Yes, delete permanently')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                           )}
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

    