
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, DollarSign, Package, ClipboardList, TrendingUp, TrendingDown, Calendar as CalendarIcon, Loader2, ArrowUpDown, ListChecks } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { addDays, format, startOfMonth, endOfMonth, startOfYear, subMonths, endOfYear } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  subAccountId: string;
  categoryId?: string;
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  items: OrderItem[];
  createdAt: Timestamp;
  tableName?: string;
  takeoutId?: string;
}

interface Recipe {
  id: string;
  cost: number;
  ingredients: {
      itemId: string;
      itemName: string;
      quantity: number;
  }[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  recipeId?: string;
}

interface ProfitabilityData {
  id: string;
  name: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  averageCost: number;
  totalValue: number;
}

interface ConsumptionData {
    id: string;
    name: string;
    category: string;
    quantityConsumed: number;
    totalCost: number;
}

type SortKeyProfitability = keyof ProfitabilityData;
type SortKeyInventory = keyof InventoryItem;
type SortKeyConsumption = keyof ConsumptionData;


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

const statusColors: { [key: string]: string } = {
  paid: 'bg-green-100 text-green-800',
  served: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  open: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-purple-100 text-purple-800',
};


export function ReportsDashboard({ restaurantId }: ReportsDashboardProps) {
  const { t } = useTranslation();
  const [dailySales, setDailySales] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [salesByCategory, setSalesByCategory] = useState<{ name: string, value: number }[]>([]);
  const [salesReportData, setSalesReportData] = useState<Order[]>([]);
  const [profitabilityReportData, setProfitabilityReportData] = useState<ProfitabilityData[]>([]);
  const [valuedInventoryData, setValuedInventoryData] = useState<InventoryItem[]>([]);
  const [consumptionReportData, setConsumptionReportData] = useState<ConsumptionData[]>([]);

  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [isProfitabilityLoading, setIsProfitabilityLoading] = useState(false);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [isConsumptionLoading, setIsConsumptionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableNameFilter, setTableNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [profitabilitySearchTerm, setProfitabilitySearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [consumptionSearchTerm, setConsumptionSearchTerm] = useState('');

  const [profitabilitySortConfig, setProfitabilitySortConfig] = useState<{ key: SortKeyProfitability; direction: 'ascending' | 'descending' } | null>({ key: 'netProfit', direction: 'descending' });
  const [inventorySortConfig, setInventorySortConfig] = useState<{ key: SortKeyInventory; direction: 'ascending' | 'descending' } | null>({ key: 'totalValue', direction: 'descending' });
  const [consumptionSortConfig, setConsumptionSortConfig] = useState<{ key: SortKeyConsumption; direction: 'ascending' | 'descending' } | null>({ key: 'totalCost', direction: 'descending' });


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
      
      const categoriesCache = new Map<string, string>();
      setTotalOrders(snapshot.docs.length);

      const getCategoryName = async (categoryId: string) => {
        if (categoriesCache.has(categoryId)) {
          return categoriesCache.get(categoryId);
        }
        try {
          const categoryRef = doc(db, `restaurantes/${restaurantId}/menuCategories`, categoryId);
          const categorySnap = await getDoc(categoryRef);
          if (categorySnap.exists()) {
            const name = categorySnap.data().name;
            categoriesCache.set(categoryId, name);
            return name;
          }
        } catch (e) { console.error("Error fetching category", e) }
        return t('Uncategorized');
      };


      for (const docSnap of snapshot.docs) {
        const order = docSnap.data() as Order;
        if (order.status === 'paid' || order.status === 'served') { // Count only completed sales
             totalSales += order.subtotal || 0;
        }
        if (order.status !== 'paid' && order.status !== 'cancelled') {
          activeCount++;
        }
        
        if ((order.status === 'paid' || order.status === 'served') && order.items) {
            for (const item of order.items) {
                const categoryId = item.categoryId || 'uncategorized';
                const categoryName = await getCategoryName(categoryId);
                const itemTotal = item.price * item.quantity;

                if (categorySales[categoryName]) {
                    categorySales[categoryName] += itemTotal;
                } else {
                    categorySales[categoryName] = itemTotal;
                }
            }
        }
      }

      setDailySales(totalSales);
      setActiveOrders(activeCount);
      setSalesByCategory(Object.entries(categorySales).map(([name, value]) => ({ name, value })));
    });

    return () => unsubscribe();
  }, [restaurantId, t]);

  // Sales report effect
  useEffect(() => {
    if (!restaurantId || !date?.from || activeTab !== 'sales') return;

    setIsSalesLoading(true);
    const startDate = new Date(date.from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = date.to ? new Date(date.to) : new Date(date.from);
    endDate.setHours(23, 59, 59, 999);

    const salesQuery = query(
      collection(db, `restaurantes/${restaurantId}/orders`),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setSalesReportData(salesData);
      setIsSalesLoading(false);
    }, (error) => {
        console.error("Error fetching sales reports:", error)
        setIsSalesLoading(false);
    });

    return () => unsubscribe();

  }, [restaurantId, date, activeTab]);
  
   // Profitability report effect
  useEffect(() => {
    if (!restaurantId || !date?.from || activeTab !== 'profitability') return;

    const calculateProfitability = async () => {
      setIsProfitabilityLoading(true);

      const startDate = new Date(date.from!);
      startDate.setHours(0, 0, 0, 0);
      const endDate = date.to ? new Date(date.to) : new Date(date.from!);
      endDate.setHours(23, 59, 59, 999);

      // 1. Fetch all menu items and recipes
      const menuItemsQuery = getDocs(collection(db, `restaurantes/${restaurantId}/menuItems`));
      const recipesQuery = getDocs(collection(db, `restaurantes/${restaurantId}/recipes`));
      const [menuItemsSnap, recipesSnap] = await Promise.all([menuItemsQuery, recipesQuery]);

      const menuItemsMap = new Map<string, MenuItem>(menuItemsSnap.docs.map(d => [d.id, {id: d.id, ...d.data()} as MenuItem]));
      const recipesMap = new Map<string, Recipe>(recipesSnap.docs.map(d => [d.id, {id: d.id, ...d.data()} as Recipe]));
      
      // 2. Fetch all orders in range
      const ordersQuery = query(
        collection(db, `restaurantes/${restaurantId}/orders`),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      const ordersSnap = await getDocs(ordersQuery);

      // 3. Process data
      const profitabilityMap = new Map<string, { name: string; quantitySold: number; totalRevenue: number; totalCost: number }>();

      ordersSnap.docs.forEach(orderDoc => {
        const order = orderDoc.data() as Order;
        // Client-side filtering for status
        if (order.status !== 'paid' && order.status !== 'served') {
            return;
        }

        order.items.forEach(item => {
          const existing = profitabilityMap.get(item.id) || { name: item.name, quantitySold: 0, totalRevenue: 0, totalCost: 0 };
          const menuItem = menuItemsMap.get(item.id);
          const recipe = menuItem?.recipeId ? recipesMap.get(menuItem.recipeId) : undefined;
          
          existing.quantitySold += item.quantity;
          existing.totalRevenue += item.price * item.quantity;
          existing.totalCost += (recipe?.cost || 0) * item.quantity;

          profitabilityMap.set(item.id, existing);
        });
      });
      
      const report: ProfitabilityData[] = Array.from(profitabilityMap.entries()).map(([id, data]) => {
          const netProfit = data.totalRevenue - data.totalCost;
          const profitMargin = data.totalRevenue > 0 ? (netProfit / data.totalRevenue) * 100 : 0;
          return {
              id,
              name: data.name,
              quantitySold: data.quantitySold,
              totalRevenue: data.totalRevenue,
              totalCost: data.totalCost,
              netProfit,
              profitMargin
          }
      });
      
      setProfitabilityReportData(report);
      setIsProfitabilityLoading(false);
    };

    calculateProfitability();
  }, [restaurantId, date, activeTab]);

  // Valued inventory effect
  useEffect(() => {
    if (!restaurantId || activeTab !== 'inventory-value') return;

    setIsInventoryLoading(true);
    const itemsQuery = query(collection(db, `restaurantes/${restaurantId}/inventoryItems`));

    const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
          currentStock: data.currentStock,
          averageCost: data.averageCost,
          totalValue: data.currentStock * data.averageCost
        } as InventoryItem;
      });
      setValuedInventoryData(inventoryData);
      setIsInventoryLoading(false);
    }, (error) => {
      console.error("Error fetching inventory items:", error);
      setIsInventoryLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, activeTab]);

  // Consumption report effect
  useEffect(() => {
    if (!restaurantId || !date?.from || activeTab !== 'consumption') return;

    const calculateConsumption = async () => {
      setIsConsumptionLoading(true);
      
      const startDate = new Date(date.from!);
      startDate.setHours(0, 0, 0, 0);
      const endDate = date.to ? new Date(date.to) : new Date(date.from!);
      endDate.setHours(23, 59, 59, 999);

      // 1. Fetch all needed data
      const menuItemsQuery = getDocs(collection(db, `restaurantes/${restaurantId}/menuItems`));
      const recipesQuery = getDocs(collection(db, `restaurantes/${restaurantId}/recipes`));
      const inventoryQuery = getDocs(collection(db, `restaurantes/${restaurantId}/inventoryItems`));
      const [menuItemsSnap, recipesSnap, inventorySnap] = await Promise.all([menuItemsQuery, recipesQuery, inventoryQuery]);

      const menuItemsMap = new Map<string, MenuItem>(menuItemsSnap.docs.map(d => [d.id, {id: d.id, ...d.data()} as MenuItem]));
      const recipesMap = new Map<string, Recipe>(recipesSnap.docs.map(d => [d.id, {id: d.id, ...d.data()} as Recipe]));
      const inventoryItemsMap = new Map<string, InventoryItem>(inventorySnap.docs.map(d => [d.id, {id: d.id, ...d.data()} as InventoryItem]));

      // 2. Fetch orders in range
      const ordersQuery = query(
        collection(db, `restaurantes/${restaurantId}/orders`),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      const ordersSnap = await getDocs(ordersQuery);

      // 3. Process data
      const consumptionMap = new Map<string, { quantityConsumed: number; totalCost: number }>();
      
      ordersSnap.docs.forEach(orderDoc => {
        const order = orderDoc.data() as Order;
        if (order.status !== 'paid' && order.status !== 'served') return;

        order.items.forEach(item => {
          const menuItem = menuItemsMap.get(item.id);
          const recipe = menuItem?.recipeId ? recipesMap.get(menuItem.recipeId) : undefined;
          
          if (recipe?.ingredients) {
            recipe.ingredients.forEach(ingredient => {
              const consumedQuantity = ingredient.quantity * item.quantity;
              const inventoryItem = inventoryItemsMap.get(ingredient.itemId);
              
              if(inventoryItem) {
                const consumedCost = consumedQuantity * inventoryItem.averageCost;
                const existing = consumptionMap.get(ingredient.itemId) || { quantityConsumed: 0, totalCost: 0 };
                
                existing.quantityConsumed += consumedQuantity;
                existing.totalCost += consumedCost;

                consumptionMap.set(ingredient.itemId, existing);
              }
            });
          }
        });
      });

      const report: ConsumptionData[] = Array.from(consumptionMap.entries()).map(([id, data]) => {
          const inventoryItem = inventoryItemsMap.get(id);
          return {
              id,
              name: inventoryItem?.name || t('Unknown Item'),
              category: inventoryItem?.category || t('Unknown Category'),
              quantityConsumed: data.quantityConsumed,
              totalCost: data.totalCost
          }
      });
      
      setConsumptionReportData(report);
      setIsConsumptionLoading(false);
    };

    calculateConsumption();

  }, [restaurantId, date, activeTab, t]);


 const requestSortProfitability = (key: SortKeyProfitability) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (profitabilitySortConfig && profitabilitySortConfig.key === key && profitabilitySortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setProfitabilitySortConfig({ key, direction });
  };
  
  const sortedAndFilteredProfitability = useMemo(() => {
    let sortableItems = [...profitabilityReportData];

    if (profitabilitySearchTerm) {
        sortableItems = sortableItems.filter(item => 
            item.name.toLowerCase().includes(profitabilitySearchTerm.toLowerCase())
        );
    }

    if (profitabilitySortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[profitabilitySortConfig.key] < b[profitabilitySortConfig.key]) {
          return profitabilitySortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[profitabilitySortConfig.key] > b[profitabilitySortConfig.key]) {
          return profitabilitySortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [profitabilityReportData, profitabilitySortConfig, profitabilitySearchTerm]);

  const requestSortInventory = (key: SortKeyInventory) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (inventorySortConfig && inventorySortConfig.key === key && inventorySortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setInventorySortConfig({ key, direction });
  };
  
  const sortedAndFilteredInventory = useMemo(() => {
    let sortableItems = [...valuedInventoryData];
    if (inventorySearchTerm) {
        sortableItems = sortableItems.filter(item => 
            item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(inventorySearchTerm.toLowerCase())
        );
    }

    if (inventorySortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[inventorySortConfig.key] < b[inventorySortConfig.key]) {
          return inventorySortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[inventorySortConfig.key] > b[inventorySortConfig.key]) {
          return inventorySortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [valuedInventoryData, inventorySortConfig, inventorySearchTerm]);
  
  const totalInventoryValue = useMemo(() => {
    return valuedInventoryData.reduce((acc, item) => acc + item.totalValue, 0);
  }, [valuedInventoryData]);

  const requestSortConsumption = (key: SortKeyConsumption) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (consumptionSortConfig && consumptionSortConfig.key === key && consumptionSortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setConsumptionSortConfig({ key, direction });
  };

  const sortedAndFilteredConsumption = useMemo(() => {
    let sortableItems = [...consumptionReportData];
    if (consumptionSearchTerm) {
        sortableItems = sortableItems.filter(item => 
            item.name.toLowerCase().includes(consumptionSearchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(consumptionSearchTerm.toLowerCase())
        );
    }
    if (consumptionSortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[consumptionSortConfig.key] < b[consumptionSortConfig.key]) {
          return consumptionSortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[consumptionSortConfig.key] > b[consumptionSortConfig.key]) {
          return consumptionSortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [consumptionReportData, consumptionSortConfig, consumptionSearchTerm]);


  const filteredSalesReport = salesReportData.filter(order => {
    const orderName = (order.tableName || order.takeoutId || '').toLowerCase();
    const statusMatch = statusFilter === 'all' ? true : order.status === statusFilter;
    const nameMatch = orderName.includes(tableNameFilter.toLowerCase());
    return statusMatch && nameMatch;
  });

  const totalSubtotalInRange = filteredSalesReport.reduce((acc, order) => acc + order.subtotal, 0);
  const totalIvaInRange = totalSubtotalInRange * 0.16;
  const totalSalesInRange = totalSubtotalInRange + totalIvaInRange;

  const totalProfitability = useMemo(() => {
    return sortedAndFilteredProfitability.reduce(
        (acc, item) => {
            acc.totalRevenue += item.totalRevenue;
            acc.totalCost += item.totalCost;
            acc.netProfit += item.netProfit;
            return acc;
        },
        { totalRevenue: 0, totalCost: 0, netProfit: 0 }
    );
  }, [sortedAndFilteredProfitability]);

  const totalConsumptionCost = useMemo(() => {
      return sortedAndFilteredConsumption.reduce((acc, item) => acc + item.totalCost, 0);
  }, [sortedAndFilteredConsumption]);

  const setDatePreset = (preset: 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const now = new Date();
    if (preset === 'thisMonth') {
      setDate({ from: startOfMonth(now), to: endOfMonth(now) });
    } else if (preset === 'lastMonth') {
      const lastMonth = subMonths(now, 1);
      setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    } else if (preset === 'thisYear') {
      setDate({ from: startOfYear(now), to: endOfYear(now) });
    }
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }

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
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Total Orders Today')}</CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-1">
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
            <Tabs defaultValue="sales" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="sales"><TrendingUp className="mr-2"/>{t('Sales Report')}</TabsTrigger>
                    <TabsTrigger value="profitability"><DollarSign className="mr-2"/>{t('Profitability Report')}</TabsTrigger>
                    <TabsTrigger value="inventory-value"><Package className="mr-2"/>{t('Valued Inventory')}</TabsTrigger>
                    <TabsTrigger value="consumption"><TrendingDown className="mr-2"/>{t('Consumption Report')}</TabsTrigger>
                </TabsList>
                 <div className="flex flex-wrap items-center justify-end gap-2 py-4">
                     <Button variant="outline" size="sm" onClick={() => setDatePreset('thisMonth')}>{t('This Month')}</Button>
                     <Button variant="outline" size="sm" onClick={() => setDatePreset('lastMonth')}>{t('Last Month')}</Button>
                     <Button variant="outline" size="sm" onClick={() => setDatePreset('thisYear')}>{t('This Year')}</Button>
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
                        <PopoverContent className="w-auto p-0" align="end">
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
                <TabsContent value="sales" className="pt-4 space-y-4">
                     <div className="flex gap-4">
                        <Input 
                            placeholder={t('Filter by Table/Takeout...')}
                            value={tableNameFilter}
                            onChange={(e) => setTableNameFilter(e.target.value)}
                        />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Filter by status...')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Statuses')}</SelectItem>
                                <SelectItem value="paid">{t('Paid')}</SelectItem>
                                <SelectItem value="served">{t('Served')}</SelectItem>
                                <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                                <SelectItem value="open">{t('Open')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Sales Summary')}</CardTitle>
                             <CardDescription>
                                <div className="flex flex-wrap gap-x-6 gap-y-1">
                                    <span>{t('Subtotal')}: <span className="font-bold text-primary ml-1">${totalSubtotalInRange.toFixed(2)}</span></span>
                                    <span>{t('IVA (16%)')}: <span className="font-bold text-primary ml-1">${totalIvaInRange.toFixed(2)}</span></span>
                                    <span>{t('Total')}: <span className="font-bold text-primary ml-1">${totalSalesInRange.toFixed(2)}</span></span>
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Date')}</TableHead>
                                        <TableHead>{t('Table/Takeout')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                        <TableHead className="text-right">{t('Subtotal')}</TableHead>
                                        <TableHead className="text-right">{t('IVA (16%)')}</TableHead>
                                        <TableHead className="text-right">{t('Total')}</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {isSalesLoading ? (
                                        <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
                                    ) : filteredSalesReport.length > 0 ? (
                                        filteredSalesReport.map(order => (
                                        <TableRow key={order.id} onClick={() => handleRowClick(order)} className="cursor-pointer">
                                            <TableCell>{order.createdAt.toDate().toLocaleString()}</TableCell>
                                            <TableCell>{order.tableName || order.takeoutId || 'N/A'}</TableCell>
                                            <TableCell><Badge className={statusColors[order.status]}>{t(order.status)}</Badge></TableCell>
                                            <TableCell className="text-right font-mono">${order.subtotal.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">${(order.subtotal * 0.16).toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">${(order.subtotal * 1.16).toFixed(2)}</TableCell>
                                        </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={6} className="text-center h-24">{t('No sales in the selected period.')}</TableCell></TableRow>
                                    )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="profitability" className="pt-4 space-y-4">
                     <Input 
                        placeholder={t('Filter by dish name...')} 
                        value={profitabilitySearchTerm} 
                        onChange={(e) => setProfitabilitySearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                     <Card>
                        <CardHeader>
                            <CardTitle>{t('Profitability Summary')}</CardTitle>
                            <CardDescription>
                                <div className="flex flex-wrap gap-x-6 gap-y-1">
                                    <span>{t('Total Revenue')}: <span className="font-bold text-green-600 ml-1">${totalProfitability.totalRevenue.toFixed(2)}</span></span>
                                    <span>{t('Total Cost')}: <span className="font-bold text-red-600 ml-1">${totalProfitability.totalCost.toFixed(2)}</span></span>
                                    <span>{t('Net Profit')}: <span className="font-bold text-primary ml-1">${totalProfitability.netProfit.toFixed(2)}</span></span>
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border h-[500px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('Dish')}</TableHead>
                                            <TableHead className="text-right cursor-pointer" onClick={() => requestSortProfitability('quantitySold')}>
                                            <div className="flex items-center justify-end gap-1">
                                                {t('Quantity Sold')} <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                            </TableHead>
                                            <TableHead className="text-right cursor-pointer" onClick={() => requestSortProfitability('totalRevenue')}>
                                            <div className="flex items-center justify-end gap-1">
                                                {t('Total Revenue')} <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                            </TableHead>
                                            <TableHead className="text-right cursor-pointer" onClick={() => requestSortProfitability('totalCost')}>
                                            <div className="flex items-center justify-end gap-1">
                                                {t('Total Cost')} <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                            </TableHead>
                                            <TableHead className="text-right cursor-pointer" onClick={() => requestSortProfitability('netProfit')}>
                                            <div className="flex items-center justify-end gap-1">
                                                {t('Net Profit')} <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                            </TableHead>
                                            <TableHead className="text-right cursor-pointer" onClick={() => requestSortProfitability('profitMargin')}>
                                            <div className="flex items-center justify-end gap-1">
                                                {t('Profit Margin')} <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isProfitabilityLoading ? (
                                            <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
                                        ) : sortedAndFilteredProfitability.length > 0 ? (
                                            sortedAndFilteredProfitability.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell className="text-right font-mono">{item.quantitySold}</TableCell>
                                                    <TableCell className="text-right font-mono text-green-600">${item.totalRevenue.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-mono text-red-600">${item.totalCost.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-mono font-bold">${item.netProfit.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-mono font-bold">{item.profitMargin.toFixed(1)}%</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={6} className="text-center h-24">{t('No profitability data for the selected period.')}</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="inventory-value" className="pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <Input 
                            placeholder={t('Filter by item or category...')} 
                            value={inventorySearchTerm} 
                            onChange={(e) => setInventorySearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <Card className="p-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Total Inventory Value')}</CardTitle>
                            <p className="text-2xl font-bold text-primary">${totalInventoryValue.toFixed(2)}</p>
                        </Card>
                    </div>
                    <div className="rounded-md border h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Item')}</TableHead>
                                    <TableHead>{t('Category')}</TableHead>
                                    <TableHead className="text-right cursor-pointer" onClick={() => requestSortInventory('currentStock')}>
                                        <div className="flex items-center justify-end gap-1">{t('Stock')} <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead className="text-right cursor-pointer" onClick={() => requestSortInventory('averageCost')}>
                                        <div className="flex items-center justify-end gap-1">{t('Unit Cost')} <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead className="text-right cursor-pointer" onClick={() => requestSortInventory('totalValue')}>
                                        <div className="flex items-center justify-end gap-1">{t('Total Value')} <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isInventoryLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : sortedAndFilteredInventory.length > 0 ? (
                                    sortedAndFilteredInventory.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell className="text-right font-mono">{item.currentStock}</TableCell>
                                            <TableCell className="text-right font-mono">${item.averageCost.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">${item.totalValue.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">{t('No inventory items found.')}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                 <TabsContent value="consumption" className="pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <Input 
                            placeholder={t('Filter by ingredient or category...')} 
                            value={consumptionSearchTerm} 
                            onChange={(e) => setConsumptionSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <Card className="p-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Total Consumption Cost')}</CardTitle>
                            <p className="text-2xl font-bold text-primary">${totalConsumptionCost.toFixed(2)}</p>
                        </Card>
                    </div>
                    <div className="rounded-md border h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Ingredient')}</TableHead>
                                    <TableHead>{t('Category')}</TableHead>
                                    <TableHead className="text-right cursor-pointer" onClick={() => requestSortConsumption('quantityConsumed')}>
                                        <div className="flex items-center justify-end gap-1">{t('Quantity Consumed')} <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead className="text-right cursor-pointer" onClick={() => requestSortConsumption('totalCost')}>
                                        <div className="flex items-center justify-end gap-1">{t('Cost of Consumption')} <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {isConsumptionLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : sortedAndFilteredConsumption.length > 0 ? (
                                    sortedAndFilteredConsumption.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{t(item.category)}</TableCell>
                                            <TableCell className="text-right font-mono">{item.quantityConsumed.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">${item.totalCost.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">{t('No consumption data for the selected period.')}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
           {selectedOrder && (
             <>
                <DialogHeader>
                    <DialogTitle>{t('Order Detail')}: {selectedOrder.id.substring(0, 8)}...</DialogTitle>
                    <DialogDescription>
                         {t('Table')}: {selectedOrder.tableName || selectedOrder.takeoutId} - {selectedOrder.createdAt.toDate().toLocaleString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto pr-4 -mr-4">
                    <div className="space-y-2">
                        {selectedOrder.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <hr className="my-4"/>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('Subtotal')}</span>
                            <span className="font-mono">${selectedOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('Taxes (16%)')}</span>
                            <span className="font-mono">${(selectedOrder.subtotal * 0.16).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>{t('Total')}</span>
                            <span className="font-mono">${(selectedOrder.subtotal * 1.16).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
             </>
           )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

    