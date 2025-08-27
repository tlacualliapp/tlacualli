
"use client"

import { useState, useEffect } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const chartConfig = {
  logins: {
    label: "Accesos",
    color: "hsl(var(--primary))",
  },
};

const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthNamesEs = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function DailyAccessChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, i18n } = useTranslation();
  
  const monthNames = i18n.language === 'es' ? monthNamesEs : monthNamesEn;

  useEffect(() => {
    const q = query(
      collection(db, 'monitor'),
      where('accion', '==', 'Inicio de sesion')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const monthlyLogins: { [key: string]: number } = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.fecha && data.fecha instanceof Timestamp) {
          const date = data.fecha.toDate();
          const month = date.getMonth();
          const year = date.getFullYear();
          const key = `${year}-${String(month).padStart(2, '0')}`; // e.g., "2024-06"
          
          if (!monthlyLogins[key]) {
            monthlyLogins[key] = 0;
          }
          monthlyLogins[key]++;
        }
      });
      
      const formattedData = Object.entries(monthlyLogins)
        .map(([key, value]) => {
            const [year, month] = key.split('-').map(Number);
            return {
                name: `${monthNames[month]} ${year}`,
                logins: value,
                key
            }
        })
        .sort((a,b) => a.key.localeCompare(b.key)); // Sort by YYYY-MM key

      setChartData(formattedData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching daily access data:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [monthNames]);

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
       <div className="h-[300px] w-full flex justify-center items-center">
        <p className="text-gray-500">{t('No access data to display.')}</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={{...chartConfig, logins: { ...chartConfig.logins, label: t('Accesses')}}}>
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.5} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            stroke="hsl(var(--foreground))"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            stroke="hsl(var(--foreground))"
           />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <defs>
            <linearGradient id="fillLogins" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-logins)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-logins)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <Area
            dataKey="logins"
            type="natural"
            fill="url(#fillLogins)"
            fillOpacity={0.4}
            stroke="var(--color-logins)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
