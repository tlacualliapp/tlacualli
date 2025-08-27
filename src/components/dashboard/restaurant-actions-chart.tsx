
"use client"
import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const chartConfig = {
  actions: {
    label: "Actions",
    color: "hsl(var(--primary))",
  },
};

export function RestaurantActionsChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Get all restaurants to map IDs to names
            const prodRestaurantsRef = collection(db, 'restaurantes');
            const demoRestaurantsRef = collection(db, 'restaurantes_demo');
            const [prodSnap, demoSnap] = await Promise.all([getDocs(prodRestaurantsRef), getDocs(demoRestaurantsRef)]);
            
            const restaurantNames: { [id: string]: string } = {};
            prodSnap.forEach(doc => {
                restaurantNames[doc.id] = doc.data().restaurantName || t('Unknown');
            });
            demoSnap.forEach(doc => {
                restaurantNames[doc.id] = doc.data().restaurantName || t('Unknown');
            });

            // 2. Get all monitor actions
            const monitorQuery = query(collection(db, 'monitor'));
            const unsubscribe = onSnapshot(monitorQuery, (snapshot) => {
                const actionsByRestaurant: { [key: string]: number } = {};

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const restaurantId = data.restauranteId;
                    if (restaurantId) {
                      if (!actionsByRestaurant[restaurantId]) {
                          actionsByRestaurant[restaurantId] = 0;
                      }
                      actionsByRestaurant[restaurantId]++;
                    }
                });

                const formattedData = Object.entries(actionsByRestaurant)
                    .map(([id, count]) => ({
                        restaurant: restaurantNames[id] || `${t('ID')}: ${id.substring(0, 5)}...`,
                        actions: count,
                    }))
                    .sort((a,b) => b.actions - a.actions)
                    .slice(0, 5); // Top 5

                setChartData(formattedData);
                setIsLoading(false);
            });
            
            return () => unsubscribe();
        } catch (error) {
            console.error("Error fetching restaurant actions data: ", error);
            setIsLoading(false);
        }
    }

    fetchData();
  }, [t]);

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
       <div className="h-[300px] w-full flex justify-center items-center">
        <p className="text-muted-foreground">{t('No action data to display.')}</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={{...chartConfig, actions: { ...chartConfig.actions, label: t('Actions')}}}>
        <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.5} />
          <YAxis
            dataKey="restaurant"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            width={100}
            stroke="hsl(var(--foreground))"
          />
          <XAxis dataKey="actions" type="number" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="actions" fill="var(--color-actions)" radius={8} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
