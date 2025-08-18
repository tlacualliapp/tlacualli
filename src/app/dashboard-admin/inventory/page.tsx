
'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Truck, History, DollarSign, AlertTriangle } from 'lucide-react';
import { InventoryItemsTable } from '@/components/inventory/items-table';
import { SuppliersTable } from '@/components/inventory/suppliers-table';
import { MovementsTable } from '@/components/inventory/movements-table';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function InventoryPage() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    lowStockItems: 0,
    inventoryValue: 0,
  });

   useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setRestaurantId(userData.restauranteId);
        }
      }
    };
    fetchRestaurantId();
  }, [user]);

  useEffect(() => {
    if (!restaurantId) return;

    const itemsQuery = query(collection(db, `restaurantes/${restaurantId}/inventoryItems`));
    
    const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
      let lowStockCount = 0;
      let totalValue = 0;
      snapshot.forEach(doc => {
        const item = doc.data();
        const currentStock = Number(item.currentStock) || 0;
        const minimumStock = Number(item.minimumStock) || 0;
        const averageCost = Number(item.averageCost) || 0;
        
        if (currentStock < minimumStock) {
          lowStockCount++;
        }
        totalValue += currentStock * averageCost;
      });
      setStats({
        lowStockItems: lowStockCount,
        inventoryValue: totalValue,
      });
    });

    return () => unsubscribe();
  }, [restaurantId]);


  return (
    <AdminLayout>
      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <Package className="h-8 w-8" /> {t('Inventory Management')}
            </CardTitle>
            <CardDescription>{t('Manage your stock, suppliers, and movements.')}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-card/65 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Inventory Value')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.inventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('Estimated value of current stock')}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/65 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Low Stock Items')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.lowStockItems > 0 ? 'text-destructive' : ''}`}>{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">{t('Items below minimum stock level')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/65 backdrop-blur-lg">
        <CardContent className="p-4 md:p-6">
          <Tabs defaultValue="items">
            <TabsList>
              <TabsTrigger value="items"><Package className="mr-2 h-4 w-4"/>{t('Items')}</TabsTrigger>
              <TabsTrigger value="suppliers"><Truck className="mr-2 h-4 w-4"/>{t('Suppliers')}</TabsTrigger>
              <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/>{t('Movements')}</TabsTrigger>
            </TabsList>
            <TabsContent value="items">
              {restaurantId ? <InventoryItemsTable restaurantId={restaurantId} /> : <p>{t('Loading...')}</p>}
            </TabsContent>
            <TabsContent value="suppliers">
              {restaurantId ? <SuppliersTable restaurantId={restaurantId} /> : <p>{t('Loading...')}</p>}
            </TabsContent>
            <TabsContent value="history">
              {restaurantId ? <MovementsTable restaurantId={restaurantId} /> : <p>{t('Loading...')}</p>}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
