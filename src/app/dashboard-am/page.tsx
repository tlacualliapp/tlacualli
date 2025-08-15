import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, Users, UtensilsCrossed, Search, Filter } from 'lucide-react';
import { DailyAccessChart } from '@/components/dashboard/daily-access-chart';
import { RestaurantActionsChart } from '@/components/dashboard/restaurant-actions-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RestaurantsTable } from '@/components/dashboard/restaurants-table';
import { MasterUsersTable } from '@/components/dashboard/master-users-table';

export default function AdminMasterDashboard() {
  return (
    <div className="relative z-10">
        <AppLayout>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Restaurantes registrados</CardTitle>
                <UtensilsCrossed className="h-6 w-6 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">15</div>
                <p className="text-xs text-gray-500">+2 desde el último mes</p>
              </CardContent>
            </Card>
            <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Admin Master</CardTitle>
                <Users className="h-6 w-6 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">5</div>
                <p className="text-xs text-gray-500">+1 desde el último mes</p>
              </CardContent>
            </Card>
            <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios administradores</CardTitle>
                <Users className="h-6 w-6 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">25</div>
                <p className="text-xs text-gray-500">+5 desde el último mes</p>
              </CardContent>
            </Card>
            <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios colaboradores</CardTitle>
                <Users className="h-6 w-6 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">150</div>
                <p className="text-xs text-gray-500">+20 desde el último mes</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4 bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <LineChart className="h-6 w-6" /> Accesos diarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DailyAccessChart />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3 bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <BarChart className="h-6 w-6" /> Acciones por restaurante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RestaurantActionsChart />
              </CardContent>
            </Card>
          </div>
          <Card className="mt-6 bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
            <CardContent className="p-4 md:p-6">
                 <Tabs defaultValue="restaurantes">
                    <TabsList className="bg-gray-200 text-gray-700">
                        <TabsTrigger value="restaurantes">Restaurantes</TabsTrigger>
                        <TabsTrigger value="usuarios">Usuarios Master</TabsTrigger>
                    </TabsList>
                    <TabsContent value="restaurantes">
                        <RestaurantsTable />
                    </TabsContent>
                    <TabsContent value="usuarios">
                        <MasterUsersTable />
                    </TabsContent>
                </Tabs>
            </CardContent>
          </Card>
        </AppLayout>
      </div>
  );
}
