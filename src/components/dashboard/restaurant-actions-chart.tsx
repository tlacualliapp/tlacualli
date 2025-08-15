"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { restaurant: "Taco Loco", actions: 250 },
  { restaurant: "El Buen Sabor", actions: 210 },
  { restaurant: "La Cabaña", actions: 180 },
  { restaurant: "Sazón del Mar", actions: 150 },
  { restaurant: "Rincón Azteca", actions: 120 },
]

const chartConfig = {
  actions: {
    label: "Acciones",
    color: "hsl(var(--primary))",
  },
}

export function RestaurantActionsChart() {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={chartConfig}>
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
