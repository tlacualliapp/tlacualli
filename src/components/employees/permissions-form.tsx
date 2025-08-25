
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface Employee {
  id: string;
  perfil: string;
  permissions?: { [key: string]: boolean };
}

interface PermissionsFormProps {
  employee: Employee;
  onSuccess?: () => void;
}

const allModules = [
  { key: 'dashboard', label: 'Dashboard', adminOnly: false },
  { key: 'orders', label: 'Orders', adminOnly: false },
  { key: 'menu', label: 'Menu & Recipes', adminOnly: false },
  { key: 'staff', label: 'Staff', adminOnly: true },
  { key: 'inventory', label: 'Inventory', adminOnly: false },
  { key: 'kitchen', label: 'Kitchen', adminOnly: false },
  { key: 'reports', label: 'Reports', adminOnly: true },
  { key: 'map', label: 'Digital Map', adminOnly: false },
  { key: 'settings', label: 'Settings', adminOnly: true },
];

export function PermissionsForm({ employee, onSuccess }: PermissionsFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({});
  const { t } = useTranslation();

  const isAdministrator = useMemo(() => employee.perfil === '1', [employee.perfil]);
  
  const availableModules = useMemo(() => {
    if (isAdministrator) {
        return allModules;
    }
    return allModules.filter(module => !module.adminOnly);
  }, [isAdministrator]);


  useEffect(() => {
    // Initialize permissions from employee data or with all as false
    const initialPermissions = allModules.reduce((acc, module) => {
      acc[module.key] = employee.permissions?.[module.key] || false;
      return acc;
    }, {} as { [key: string]: boolean });
    setPermissions(initialPermissions);
  }, [employee]);

  const handlePermissionChange = (moduleKey: string, checked: boolean) => {
    setPermissions(prev => ({ ...prev, [moduleKey]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const employeeRef = doc(db, "usuarios", employee.id);
      await updateDoc(employeeRef, {
        permissions,
        permissionsUpdatedAt: serverTimestamp(),
      });
      toast({
        title: t("Permissions Updated"),
        description: t("The employee's module access has been updated."),
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        variant: "destructive",
        title: t("Update Error"),
        description: t("Could not save the permissions."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4 max-h-64 overflow-y-auto px-1">
        {availableModules.map(module => (
          <div key={module.key} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
            <Checkbox
              id={`perm-${module.key}`}
              checked={permissions[module.key]}
              onCheckedChange={(checked) => handlePermissionChange(module.key, checked as boolean)}
            />
            <Label htmlFor={`perm-${module.key}`} className="font-normal cursor-pointer flex-1">
              {t(module.label)}
            </Label>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('Save Permissions')}
        </Button>
      </div>
    </form>
  );
}
