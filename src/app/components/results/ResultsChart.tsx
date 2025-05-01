import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, TooltipProps 
} from 'recharts';
import { TestResult } from '../../types/stress-test';

interface ResultsChartProps {
  results: TestResult[];
}

const formatTime = (time: number) => {
  return time < 1000 ? `${time.toFixed(0)}ms` : `${(time / 1000).toFixed(1)}s`;
};

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(0)}%`;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const modelData = payload[0].payload;
    
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-md">
        <p className="text-sm font-medium text-slate-800">{modelData.modelName}</p>
        <div className="mt-2 space-y-1 text-xs">
          <p className="text-blue-600">
            <span className="font-medium">Avg Response Time:</span> {formatTime(modelData.averageTimeMs)}
          </p>
          <p className="text-emerald-600">
            <span className="font-medium">Success Rate:</span> {formatPercentage(modelData.successRate)}
          </p>
          <p className="text-slate-600">
            <span className="font-medium">Total Calls:</span> {modelData.totalCalls}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

const ResultsChart: React.FC<ResultsChartProps> = ({ results }) => {
  const chartData = results.map(result => ({
    modelName: result.modelName.split('/').pop() || result.modelName,
    averageTimeMs: result.averageTimeMs,
    successRate: result.successRate,
    totalCalls: result.calls.length
  }));

  // Sort by averageTimeMs
  chartData.sort((a, b) => a.averageTimeMs - b.averageTimeMs);

  // Color logic based on success rate
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.9) return '#10B981'; // emerald-500
    if (rate >= 0.7) return '#FBBF24'; // amber-400
    return '#EF4444'; // red-500
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="modelName" 
            angle={-45} 
            textAnchor="end" 
            height={70} 
            tick={{ fontSize: 12, fill: '#64748B' }}
          />
          <YAxis 
            yAxisId="left"
            orientation="left"
            stroke="#3B82F6"
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickFormatter={(value) => formatTime(value)}
            label={{ 
              value: 'Avg Response Time (ms)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#3B82F6', fontSize: 12 }
            }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, 1]}
            stroke="#10B981"
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickFormatter={(value) => formatPercentage(value)}
            label={{ 
              value: 'Success Rate', 
              angle: 90, 
              position: 'insideRight',
              style: { textAnchor: 'middle', fill: '#10B981', fontSize: 12 }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar 
            name="Avg Response Time" 
            dataKey="averageTimeMs" 
            fill="#3B82F6" 
            yAxisId="left"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            name="Success Rate" 
            dataKey="successRate" 
            fill="#10B981" 
            yAxisId="right"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getSuccessRateColor(entry.successRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;