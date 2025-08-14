import { AppLayout } from '@/components/layout/app-layout';
import { ReportForm } from './report-form';
import { Lightbulb } from 'lucide-react';

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-full">
            <Lightbulb className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold font-headline">Menu Optimization Insights</h1>
            <p className="text-muted-foreground">
            Generate AI-powered reports to optimize your menu based on sales data.
            </p>
        </div>
      </div>
      <ReportForm />
    </AppLayout>
  );
}
