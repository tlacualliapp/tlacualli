import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function OrdersPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="p-4 bg-primary/10 rounded-full mb-6">
          <ClipboardList className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">Order Management</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          This is where you'll manage mobile orders, apply advanced modifiers, and use a rapid-sale counter mode.
        </p>
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Coming Soon!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Our advanced order management system is under construction. Stay tuned for a seamless ordering experience!</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
