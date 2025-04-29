import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface BranchRecommendationMatrixChartProps {
  data: {
    branch: string;
    [category: string]: number | string;
  }[];
  categories: string[];
}

export default function BranchRecommendationMatrixChart({ data, categories }: BranchRecommendationMatrixChartProps) {
  console.log("BranchRecommendationMatrixChart - Input data:", data);
  console.log("BranchRecommendationMatrixChart - Categories:", categories);

  // Ensure we have valid data
  if (!data || data.length === 0) {
    console.warn("BranchRecommendationMatrixChart - No data available");
    return <div>No data available</div>;
  }

  // Prepare chart data: each branch is a bar, each category is a stack
  const chartData = data.map(row => {
    const entry: { [key: string]: string | number } = { branch: row.branch };
    categories.forEach(cat => {
      // Ensure the value is a number
      const value = row[cat];
      entry[cat] = typeof value === 'number' ? value : 0;

      // Debug log for each category value
      if (typeof value !== 'number') {
        console.warn(`BranchRecommendationMatrixChart - Non-numeric value for category "${cat}" in branch "${row.branch}":`, value);
      }
    });
    return entry;
  });

  console.log("BranchRecommendationMatrixChart - Processed chart data:", chartData);

  // Colors for each category
  const COLORS = [
    '#4ade80', // Green
    '#facc15', // Yellow
    '#fb923c', // Orange
    '#f87171', // Red
    '#a78bfa', // Purple
    '#60a5fa', // Blue
    '#34d399', // Teal
    '#f472b6', // Pink
    '#8884d8', // Indigo
    '#fbbf24', // Amber
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-bold">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="text-sm" style={{ color: item.color }}>
              {item.name}: {item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate maximum value for YAxis domain
  const maxValue = Math.max(
    ...chartData.map(entry =>
      categories.reduce((sum, cat) => sum + (Number(entry[cat]) || 0), 0)
    )
  );

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="branch"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, maxValue + Math.ceil(maxValue * 0.1)]} // Add 10% padding
            label={{
              value: 'Number of Responses',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span style={{ color: '#666', fontSize: '12px' }}>{value}</span>}
          />
          {categories.map((cat, idx) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="a"
              name={cat}
              fill={COLORS[idx % COLORS.length]}
              radius={idx === categories.length - 1 ? [4, 4, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}