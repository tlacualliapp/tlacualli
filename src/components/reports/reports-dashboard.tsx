
'use client';

import { useState, useEffect }d from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, DollarSign, Package, ClipboardList, TrendingUp, Utensils, GlassWater, IceCream, TrendingDown, BookOpen } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface Order {
  id: string;
  status: string;
  subtotal: number;
  items: { categoryId: string, price: number, quantity: number }[];
  createdAt: Timestamp;
}

interface ReportsDashboardProps {
  restaurantId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ReportsDashboard({ restaurantId }: ReportsDashboardProps) {
  const { t } = useTranslation();
  const [dailySales, setDailySales] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [salesByCategory, setSalesByCategory] = useState<{ name: string, value: number }[]>([]);

  useEffect(() => {
    if (!restaurantId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    const ordersQuery = query(
      collection(db, `restaurantes/${restaurantId}/orders`),
      where('createdAt', '>=', todayTimestamp)
    );

    const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
      let totalSales = 0;
      let activeCount = 0;
      const categorySales: { [key: string]: number } = {};
      const categoryNames: { [key: string]: string } = {};

      // Fetch category names
      const categoriesSnapshot = await getDocs(collection(db, `restaurantes/${restaurantId}/menuCategories`));
      categoriesSnapshot.forEach(doc => {
        categoryNames[doc.id] = doc.data().name;
      });

      snapshot.docs.forEach(doc => {
        const order = doc.data() as Order;
        totalSales += order.subtotal || 0;
        if (order.status === 'open' || order.status === 'preparing' || order.status === 'ready_for_pickup') {
          activeCount++;
        }

        order.items.forEach(item => {
          const categoryId = item.categoryId || 'uncategorized';
          const categoryName = categoryNames[categoryId] || t('Uncategorized');
          const itemTotal = item.price * item.quantity;
          if (categorySales[categoryName]) {
            categorySales[categoryName] += itemTotal;
          } else {
            categorySales[categoryName] = itemTotal;
          }
        });
      });

      setDailySales(totalSales);
      setActiveOrders(activeCount);
      setSalesByCategory(Object.entries(categorySales).map(([name, value]) => ({ name, value })));
    });

    return () => unsubscribe();
  }, [restaurantId, t]);

  return (
    <div className="space-y-6">
      <Card className="bg-card/65 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <BarChart className="h-8 w-8" /> {t('Reports & Analytics')}
          </CardTitle>
          <CardDescription>{t('Vital information for decision-making and business performance understanding.')}</CardDescription>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>{t('Financial Dashboard (Real-Time)')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Day\'s Sales')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dailySales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{t('Total accumulated sales for today')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Active Orders')}</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeOrders}</div>
                <p className="text-xs text-muted-foreground">{t('Number of orders currently in progress')}</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
               <CardHeader>
                 <CardTitle className="text-sm font-medium">{t('Sales by Category')}</CardTitle>
              </CardHeader>
               <CardContent>
                {salesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={salesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[150px] text-muted-foreground">{t('No sales data for today yet.')}</div>
                )}
               </CardContent>
            </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>{t('Detailed Reports')}</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="sales">
                <TabsList>
                    <TabsTrigger value="sales"><TrendingUp className="mr-2"/>{t('Sales Report')}</TabsTrigger>
                    <TabsTrigger value="profitability" disabled><DollarSign className="mr-2"/>{t('Profitability Report')}</TabsTrigger>
                    <TabsTrigger value="inventory-value" disabled><Package className="mr-2"/>{t('Valued Inventory')}</TabsTrigger>
                    <TabsTrigger value="consumption" disabled><TrendingDown className="mr-2"/>{t('Consumption Report')}</TabsTrigger>
                </TabsList>
                <TabsContent value="sales" className="pt-4">
                    <p className="text-muted-foreground">{t('Sales reports by day, week, month, or custom date range. Coming soon!')}</p>
                </TabsContent>
                <TabsContent value="profitability" className="pt-4">
                     <p className="text-muted-foreground">{t('Profitability analysis per dish. Coming soon!')}</p>
                </TabsContent>
                <TabsContent value="inventory-value" className="pt-4">
                     <p className="text-muted-foreground">{t('Total value of current inventory. Coming soon!')}</p>
                </TabsContent>
                 <TabsContent value="consumption" className="pt-4">
                     <p className="text-muted-foreground">{t('Most used supplies in a period. Coming soon!')}</p>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
