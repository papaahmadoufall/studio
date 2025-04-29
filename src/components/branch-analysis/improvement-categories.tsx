"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ImprovementCategoriesProps {
  data: {
    category: string;
    count: number;
    percentage: number;
  }[];
}

export default function ImprovementCategoriesChart({ data }: ImprovementCategoriesProps) {
  // Sort data by count (descending)
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  // Format data for the chart
  const chartData = sortedData.map(item => ({
    name: item.category,
    count: item.count,
    percentage: parseFloat(item.percentage.toFixed(1))
  }));

  // Generate colors for the bars
  const COLORS = [
    '#4ade80', // Green
    '#facc15', // Yellow
    '#fb923c', // Orange
    '#f87171', // Red
    '#a78bfa', // Purple
    '#60a5fa', // Blue
    '#34d399', // Teal
    '#f472b6', // Pink
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      // Find the item in the original data to get the percentage
      const dataItem = chartData.find(item => item.name === label);
      const percentage = dataItem ? dataItem.percentage : 0;

      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-bold">{label}</p>
          <p className="text-sm">Count: {payload[0].value}</p>
          <p className="text-sm">Percentage: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis
            dataKey="name"
            type="category"
            width={150}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="count"
            name="Number of Mentions"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
          <Bar
            dataKey="percentage"
            name="Percentage (%)"
            fill="#8884d8"
            radius={[0, 4, 4, 0]}
            hide
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
