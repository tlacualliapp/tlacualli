"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

const chartData = [
  { month: "January", logins: 186 },
  { month: "February", logins: 305 },
  { month: "March", logins: 237 },
  { month: "April", logins: 273 },
  { month: "May", logins: 209 },
  { month: "June", logins: 214 },
]

const chartConfig = {
  logins: {
    label: "Accesos",
    color: "hsl(var(--primary))",
  },
}

export function DailyAccessChart() {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={chartConfig}>
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
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
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
