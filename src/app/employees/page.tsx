import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';

const employees = [
  { name: 'Ana Silva', role: 'Manager', status: 'Active', avatar: 'https://placehold.co/100x100.png', hint: 'woman portrait' },
  { name: 'Carlos Gomez', role: 'Chef', status: 'Active', avatar: 'https://placehold.co/100x100.png', hint: 'man portrait' },
  { name: 'Sofia Rossi', role: 'Waiter', status: 'Active', avatar: 'https://placehold.co/100x100.png', hint: 'woman smiling' },
  { name: 'Marco Ricci', role: 'Waiter', status: 'Inactive', avatar: 'https://placehold.co/100x100.png', hint: 'man serious' },
];

export default function EmployeesPage() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Employee Management</h1>
          <p className="text-muted-foreground">Manage roles, permissions, and PINs for your staff.</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {employees.map(employee => (
              <div key={employee.name} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={employee.avatar} alt={employee.name} data-ai-hint={employee.hint} />
                    <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                    {employee.status}
                  </Badge>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
