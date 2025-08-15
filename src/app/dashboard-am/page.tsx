import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminMasterDashboard() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Admin Master Dashboard</h1>
          <p className="text-muted-foreground">Full control and overview of all restaurants.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Admin Master!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is your main control panel where you can manage all aspects of the application.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
