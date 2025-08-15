import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Administrator Dashboard</h1>
          <p className="text-muted-foreground">Manage your restaurant's operations.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Administrator!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Here you can manage your menu, employees, and view reports for your restaurant.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
