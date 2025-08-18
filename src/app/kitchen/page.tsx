import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat } from 'lucide-react';

export default function KitchenPage() {
  return (
    <AdminLayout>
       <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="p-4 bg-primary/10 rounded-full mb-6">
          <ChefHat className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">Kitchen Display System</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          A real-time view of orders for your kitchen staff.
        </p>
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Coming Soon!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Our Kitchen Display System (KDS) is in the works. Prepare for a more efficient kitchen workflow!</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
