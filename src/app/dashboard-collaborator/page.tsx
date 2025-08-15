import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CollaboratorDashboard() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Collaborator Dashboard</h1>
          <p className="text-muted-foreground">Access your daily tasks and information.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Collaborator!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>View your assigned orders, tables, and other tasks for the day.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
