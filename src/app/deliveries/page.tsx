import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';

export default function DeliveriesPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="p-4 bg-primary/10 rounded-full mb-6">
          <Truck className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">Delivery Management</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Track and manage your outgoing deliveries with ease.
        </p>
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Coming Soon!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Our delivery tracking module is on its way. You'll soon be able to manage your deliveries seamlessly!</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
