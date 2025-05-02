"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Mon",
    spa: 1200,
    restaurant: 900,
  },
  {
    name: "Tue",
    spa: 800,
    restaurant: 1100,
  },
  {
    name: "Wed",
    spa: 1500,
    restaurant: 1300,
  },
  {
    name: "Thu",
    spa: 1800,
    restaurant: 1400,
  },
  {
    name: "Fri",
    spa: 2200,
    restaurant: 1800,
  },
  {
    name: "Sat",
    spa: 2500,
    restaurant: 2100,
  },
  {
    name: "Sun",
    spa: 1900,
    restaurant: 1600,
  },
]

export function DailyRevenue() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Revenue</CardTitle>
        <CardDescription>Revenue breakdown by service type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="spa" fill="#8884d8" name="Spa" />
              <Bar dataKey="restaurant" fill="#82ca9d" name="Restaurant" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
