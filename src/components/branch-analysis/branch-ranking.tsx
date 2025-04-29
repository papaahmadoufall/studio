"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface BranchRankingProps {
  data: {
    branch: string;
    satisfaction: number;
    responseCount: number;
    advocateScore: number;
    comment?: string;
  }[];
}

export default function BranchRankingChart({ data }: BranchRankingProps) {
  // Sort data by satisfaction score (descending)
  const sortedData = [...data].sort((a, b) => b.satisfaction - a.satisfaction);

  // Format data for the chart
  const chartData = sortedData.map(item => ({
    name: item.branch,
    satisfaction: parseFloat(item.satisfaction.toFixed(2)),
    advocateScore: parseFloat(item.advocateScore.toFixed(2)),
    responseCount: item.responseCount,
    comment: item.comment || ''
  }));

  // Generate colors based on satisfaction score
  const getBarColor = (satisfaction: number) => {
    if (satisfaction >= 4.5) return '#4ade80'; // Green for high satisfaction
    if (satisfaction >= 4.0) return '#facc15'; // Yellow for medium satisfaction
    if (satisfaction >= 3.5) return '#fb923c'; // Orange for lower satisfaction
    return '#f87171'; // Red for low satisfaction
  };

  // Custom tooltip to show all metrics
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      // Find the data item for this branch
      const dataItem = chartData.find(item => item.name === label);

      return (
        <div className="bg-white p-3 border rounded shadow-sm max-w-xs">
          <p className="font-bold">{label}</p>
          <p className="text-sm">Satisfaction: {dataItem?.satisfaction || 'N/A'}</p>
          <p className="text-sm">Advocate Score: {dataItem?.advocateScore || 'N/A'}</p>
          <p className="text-sm">Responses: {dataItem?.responseCount || 0}</p>
          {dataItem?.comment && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-sm font-medium">Comment:</p>
              <p className="text-xs italic">{dataItem.comment}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            domain={[0, 5]}
            label={{ value: 'Satisfaction (0-5)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 10]}
            label={{ value: 'Advocate Score (0-10)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="satisfaction"
            name="Satisfaction"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.satisfaction)} />
            ))}
          </Bar>
          <Bar
            yAxisId="right"
            dataKey="advocateScore"
            name="Advocate Score"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
