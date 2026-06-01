import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

import Button from '../../../components/ui/Button';

const RevenueChart = () => {
  const [viewType, setViewType] = useState('monthly');
  const [chartType, setChartType] = useState('bar');

  const monthlyData = [
    { period: 'Jan', actual: 125000, forecast: 120000, target: 130000 },
    { period: 'Feb', actual: 142000, forecast: 135000, target: 140000 },
    { period: 'Mar', actual: 138000, forecast: 140000, target: 145000 },
    { period: 'Apr', actual: 165000, forecast: 155000, target: 160000 },
    { period: 'May', actual: 158000, forecast: 160000, target: 165000 },
    { period: 'Jun', actual: 189000, forecast: 175000, target: 180000 },
    { period: 'Jul', actual: 175000, forecast: 180000, target: 185000 },
    { period: 'Aug', actual: 198000, forecast: 190000, target: 195000 },
    { period: 'Sep', actual: 185000, forecast: 185000, target: 190000 },
    { period: 'Oct', actual: 215000, forecast: 200000, target: 210000 },
    { period: 'Nov', actual: 205000, forecast: 210000, target: 215000 },
    { period: 'Dec', actual: 0, forecast: 225000, target: 230000 }
  ];

  const quarterlyData = [
    { period: 'Q1 2024', actual: 405000, forecast: 395000, target: 415000 },
    { period: 'Q2 2024', actual: 512000, forecast: 495000, target: 505000 },
    { period: 'Q3 2024', actual: 558000, forecast: 555000, target: 570000 },
    { period: 'Q4 2024', actual: 205000, forecast: 635000, target: 655000 }
  ];

  const currentData = viewType === 'monthly' ? monthlyData : quarterlyData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-4 shadow-elevation-2">
          <p className="font-medium text-popover-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between space-x-4 mb-1">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry?.color }}
                />
                <span className="text-sm text-muted-foreground capitalize">{entry?.dataKey}</span>
              </div>
              <span className="text-sm font-medium text-popover-foreground">
                ${entry?.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value) => {
    return `$${(value / 1000)?.toFixed(0)}K`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Forecasting</h3>
          <p className="text-sm text-muted-foreground">Actual vs forecast vs target revenue</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewType === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={viewType === 'quarterly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('quarterly')}
            >
              Quarterly
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              iconName="BarChart3"
              iconPosition="left"
            >
              Bar
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              iconName="TrendingUp"
              iconPosition="left"
            >
              Line
            </Button>
          </div>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={currentData} barGap={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="period" 
                stroke="#64748B"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748B"
                fontSize={12}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="actual" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
              />
              <Bar 
                dataKey="forecast" 
                fill="#8B5CF6" 
                radius={[4, 4, 0, 0]}
                animationDuration={1200}
              />
              <Bar 
                dataKey="target" 
                fill="#FCD34D" 
                radius={[4, 4, 0, 0]}
                animationDuration={1400}
              />
            </BarChart>
          ) : (
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="period" 
                stroke="#64748B"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748B"
                fontSize={12}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#8B5CF6"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                animationDuration={1200}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#FCD34D"
                strokeWidth={3}
                dot={{ fill: '#FCD34D', strokeWidth: 2, r: 6 }}
                animationDuration={1400}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
          <div className="w-4 h-4 bg-success rounded-full" />
          <div>
            <p className="text-sm font-medium text-foreground">Actual Revenue</p>
            <p className="text-lg font-semibold text-foreground">$1,680,000</p>
            <p className="text-xs text-muted-foreground">YTD performance</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
          <div className="w-4 h-4 bg-primary rounded-full" />
          <div>
            <p className="text-sm font-medium text-foreground">Forecast</p>
            <p className="text-lg font-semibold text-foreground">$2,305,000</p>
            <p className="text-xs text-muted-foreground">Full year projection</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
          <div className="w-4 h-4 bg-accent rounded-full" />
          <div>
            <p className="text-sm font-medium text-foreground">Target</p>
            <p className="text-lg font-semibold text-foreground">$2,370,000</p>
            <p className="text-xs text-muted-foreground">Annual goal</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RevenueChart;