
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, DollarSign, Package, ClipboardList, TrendingUp, TrendingDown, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, getDocs, orderBy } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Order {
  id: string;
  status: string;
  subtotal: number;
  items: { categoryId: string, price: number, quantity: number, name: string }[];
  createdAt: Timestamp;
}

interface ReportsDashboardProps {
  restaurantId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ReportsDashboard({ restaurantId }: ReportsDashboardProps) {
  const { t } = useTranslation();
  const [dailySales, setDailySales] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [salesByCategory, setSalesByCategory] = useState<{ name: string, value: number }[]>([]);
  const [salesReportData, setSalesReportData] = useState<Order[]>([]);
  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  // Real-time stats effect
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

      const categoriesSnapshot = await getDocs(collection(db, `restaurantes/${restaurantId}/menuCategories`));
      categoriesSnapshot.forEach(doc => {
        categoryNames[doc.id] = doc.data().name;
      });

      snapshot.docs.forEach(doc => {
        const order = doc.data() as Order;
        if (order.status === 'paid' || order.status === 'served') { // Count only completed sales
             totalSales += order.subtotal || 0;
        }
        if (order.status === 'open' || order.status === 'preparing' || order.status === 'ready_for_pickup') {
          activeCount++;
        }
        
        if (order.status === 'paid' || order.status === 'served') {
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
        }
      });

      setDailySales(totalSales);
      setActiveOrders(activeCount);
      setSalesByCategory(Object.entries(categorySales).map(([name, value]) => ({ name, value })));
    });

    return () => unsubscribe();
  }, [restaurantId, t]);

  // Sales report effect
  useEffect(() => {
    if (!restaurantId || !date?.from) return;

    setIsSalesLoading(true);
    const startDate = date.from;
    startDate.setHours(0, 0, 0, 0);
    const endDate = date.to ? new Date(date.to) : new Date(date.from);
    endDate.setHours(23, 59, 59, 999);

    const salesQuery = query(
      collection(db, `restaurantes/${restaurantId}/orders`),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      where('status', 'in', ['paid', 'served']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setSalesReportData(salesData);
      setIsSalesLoading(false);
    });

    return () => unsubscribe();

  }, [restaurantId, date]);

  const totalSalesInRange = salesReportData.reduce((acc, order) => acc + order.subtotal, 0);

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
                <CardTitle className="text-sm font-medium">{t('Today\'s Sales')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dailySales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{t('Total completed sales for today')}</p>
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
                 <CardTitle className="text-sm font-medium">{t('Today\'s Sales by Category')}</CardTitle>
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
                      <Legend iconSize={10} />
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
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="sales"><TrendingUp className="mr-2"/>{t('Sales Report')}</TabsTrigger>
                    <TabsTrigger value="profitability" disabled><DollarSign className="mr-2"/>{t('Profitability Report')}</TabsTrigger>
                    <TabsTrigger value="inventory-value" disabled><Package className="mr-2"/>{t('Valued Inventory')}</TabsTrigger>
                    <TabsTrigger value="consumption" disabled><TrendingDown className="mr-2"/>{t('Consumption Report')}</TabsTrigger>
                </TabsList>
                <TabsContent value="sales" className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-medium">{t('Filter Sales by Date')}</h3>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={"w-[300px] justify-start text-left font-normal"}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                date.to ? (
                                    <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                                ) : (
                                <span>{t('Pick a date')}</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Sales Summary')}</CardTitle>
                             <CardDescription>
                                {t('Total sales for the selected period')}: 
                                <span className="font-bold text-primary ml-2">${totalSalesInRange.toFixed(2)}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Order ID')}</TableHead>
                                        <TableHead>{t('Date')}</TableHead>
                                        <TableHead className="text-right">{t('Total')}</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {isSalesLoading ? (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
                                    ) : salesReportData.length > 0 ? (
                                        salesReportData.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                            <TableCell>{order.createdAt.toDate().toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono">${order.subtotal.toFixed(2)}</TableCell>
                                        </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">{t('No sales in the selected period.')}</TableCell></TableRow>
                                    )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
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
