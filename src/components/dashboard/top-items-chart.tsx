"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { item: "Margarita", sales: 250 },
  { item: "Volcano Tacos", sales: 210 },
  { item: "Aztec Burger", sales: 180 },
  { item: "Quinoa Salad", sales: 150 },
  { item: "Churros", sales: 120 },
]

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
}

export function TopItemsChart() {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.5} />
          <YAxis
            dataKey="item"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            width={80}
            stroke="hsl(var(--primary-foreground))"
          />
          <XAxis dataKey="sales" type="number" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
