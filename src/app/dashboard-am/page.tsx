import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ClipboardList, DollarSign, LineChart, TrendingUp, Users } from 'lucide-react';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { TopItemsChart } from '@/components/dashboard/top-items-chart';

export default function AdminMasterDashboard() {
  return (
    <div className="relative z-10">
        <AppLayout>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-6 w-6 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">$45,231.89</div>
                <p className="text-xs text-white/80">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ClipboardList className="h-6 w-6 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">+2350</div>
                <p className="text-xs text-white/80">+180.1% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                <TrendingUp className="h-6 w-6 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">$19.45</div>
                <p className="text-xs text-white/80">+12% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <Users className="h-6 w-6 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">5</div>
                <p className="text-xs text-white/80">2 on duty</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4 bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <LineChart className="h-6 w-6" /> Sales Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalesChart />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3 bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <BarChart className="h-6 w-6" /> Top Selling Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopItemsChart />
              </CardContent>
            </Card>
          </div>
        </AppLayout>
      </div>
  );
}
