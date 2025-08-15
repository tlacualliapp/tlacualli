import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ClientDashboard() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Client Dashboard</h1>
          <p className="text-muted-foreground">Your personal space.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>View your order history, manage your payment methods, and update your profile.</p>
          <Button>View My Orders</Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
